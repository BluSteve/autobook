// if you pass this class a query, it will try to find the link
// if you pass this class a link, it will download the link to an epub
// the final so-called output is an epub object
import {MD5} from "md5-js-tools";
import * as fs from "fs";
import {Readable} from "stream";
import {ReadableStream} from 'stream/web';
import {finished} from "stream/promises";
import EPub from "epub2";

function getRandomString() {
	return Math.random().toString();
}

export class Downloader {
	private static readonly ANNAS_API_URL = "http://192.168.31.12:5500";
	public link: URL;
	public filename: string; // of book

	constructor(link: URL) {
		this.link = link;
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

		this.filename = MD5.generate(this.link.toString() + getRandomString()) + '.epub';
		const fileStream = fs.createWriteStream(this.filename);

		await finished(Readable.fromWeb(resp.body as ReadableStream).pipe(fileStream));
	}
}

export async function getEPub(filename: string): Promise<EPub> {
	return await EPub.createAsync(filename);
}

export async function getEPubCover(epub: EPub) {
	const tocElement = epub.listImage().find((image) => JSON.stringify(image).includes('cover'));

	const coverId = tocElement.id;
	const coverExt = tocElement.href.split('.').slice(-1)[0];

	const image: [Buffer, string] = await epub.getImageAsync(coverId);
	const coverFilename = MD5.generate(JSON.stringify(epub.metadata) + getRandomString()) + '.' + coverExt;
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
