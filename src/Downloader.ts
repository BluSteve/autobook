// if you pass this class a query, it will try to find the link
// if you pass this class a link, it will download the link to an epub
// the final so-called output is an epub object
import {MD5} from "md5-js-tools";
import * as fs from "fs";
import {Readable} from "stream";
import {ReadableStream} from 'stream/web';
import {finished} from "stream/promises";
import EPub from "epub2";
import {kindleEmail, kindlePassword} from "./Token";
import nodemailer, {SentMessageInfo} from "nodemailer";
import Mail from "nodemailer/lib/mailer";

function getRandomString(): string {
	return String(Math.random() + Date.now());
}

export class Downloader {
	private static readonly BOOKS_ROOT = "books/";
	private static readonly ANNAS_API_URL = "http://192.168.31.12:5500";
	public link: URL;
	public filename: string; // of book
	private epub: EPub;

	public constructor(link: string | URL) {
		if (link instanceof URL) {
			this.link = link;
		} else {
			this.link = new URL(link);
		}
	}

	public static async fromQuery(query: string, searchParams?: any): Promise<Downloader> {
		const resp = checkStatus(await fetch(`${Downloader.ANNAS_API_URL}/books_specs?` + new URLSearchParams(
			Object.assign({}, {q: query, ext: "epub"}, searchParams) // searchParams overrides q and ext
		)));

		// gets the md5 of the most downloaded book
		const json = await resp.json();
		const array = Object.keys(json).map(k => json[k]);
		const maxDownloads = array.reduce((a, b) => a["downloads_total"] > b["downloads_total"] ? a : b);
		const md5 = maxDownloads.href.split("/").slice(-1)[0];

		// gets the download link from the md5
		const dlLinkResp = checkStatus(await fetch(`${Downloader.ANNAS_API_URL}/dl_link?md5=${md5}`));
		const dlLinkJson = await dlLinkResp.json();

		return new Downloader(new URL(dlLinkJson["dl_link"]));
	}

	public async downloadFile(): Promise<void> {
		const resp = checkStatus(await fetch(this.link));

		this.filename = Downloader.BOOKS_ROOT + MD5.generate(this.link.toString() + getRandomString()) + '.epub';
		const fileStream = fs.createWriteStream(this.filename);

		await finished(Readable.fromWeb(resp.body as ReadableStream).pipe(fileStream));
	}

	public async renameFile(customName?: string): Promise<void> {
		let newName = customName ?? (await this.getEPub()).metadata.title + '.epub';
		newName = Downloader.BOOKS_ROOT + newName;
		fs.renameSync(this.filename, newName);
		this.filename = newName;
	}

	public async getEPub(): Promise<EPub> {
		if (this.epub) return this.epub;
		return this.epub = await EPub.createAsync(this.filename);
	}

	public async sendToKindle(recipientEmail: string): Promise<SentMessageInfo> {
		return await sendFilesToKindle(recipientEmail, [this.filename]);
	}
}

export function sendFilesToKindle(recipientEmail: string, filenames: string[]): Promise<SentMessageInfo> {
	const user = kindleEmail;
	const pass = kindlePassword;
	const transporter = nodemailer.createTransport({
		service: 'zoho',
		auth: {user, pass}
	});
	const mailOptions: Mail.Options = {
		from: user,
		to: recipientEmail,
		subject: "Hello from Autobook", // Subject line
		text: "Here's your book!", // plain text body
		attachments: filenames.map((filename) => {
			return {path: filename};
		})
	}
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				return reject(error);
			} else {
				console.log('Email sent: ' + info.response);
				return resolve(info);
			}
		});
	});
}

export async function extractCover(epub: EPub) {
	const tocElement = epub.listImage().find((image) => image.id === epub.metadata.cover);

	const coverId = tocElement.id;
	const coverExt = tocElement.href.split('.').slice(-1)[0];

	const image: [Buffer, string] = await epub.getImageAsync(coverId);
	const coverFilename = "covers/" + MD5.generate(JSON.stringify(epub.metadata) + getRandomString()) + '.' + coverExt;
	fs.writeFileSync(coverFilename, image[0]);
	return coverFilename;
}

class HTTPResponseError extends Error {
	public response: any;

	constructor(response: Response) {
		super(`HTTP Error Response: ${response.status} ${response.statusText}`);
		this.response = response;
	}
}

const checkStatus = (response: Response) => {
	if (response.ok) {
		// response.status >= 200 && response.status < 300
		return response;
	} else {
		throw new HTTPResponseError(response);
	}
}
