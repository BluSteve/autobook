import {kindleEmail, kindlePassword, kindleReceiver} from "./Token";

import nodemailer from "nodemailer";
import https from "https";
import * as fs from "fs";
import {writeFileSync} from "fs";
import EPub from "epub2";
import * as http from "http";
import {MD5} from "md5-js-tools";

export async function downloadFile(urlstring: string, mfilename: string = null): Promise<string> {
	let filename = mfilename !== null ? mfilename + '.epub' : MD5.generate(urlstring) + '.epub';
	return new Promise<string>((resolve, reject) => {
		https.get(urlstring, function (res) {
			if (res.statusCode !== 200) {
				return reject(new Error("Anna's Archive failed with code " + res.statusCode));
			}

			try {
				console.log('Downloading ' + filename);
				const fileStream = fs.createWriteStream(filename);
				res.pipe(fileStream);
				fileStream.on('finish', async () => {
					try {
						fileStream.close();
						if (mfilename === null) {
							let epubTitle = await getEpubTitle(filename);
							fs.renameSync(filename, epubTitle + '.epub');
							console.log('Renamed ' + filename + ' to ' + epubTitle + '.epub');
							filename = epubTitle + '.epub';
						}
						console.log('Downloaded ' + filename);
						return resolve(filename);
					} catch (e) {
						return reject(e);
					}
				});
			} catch (e) {
				return reject(e);
			}
		});
	});
}

export function getDownloadLink(name: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		http.get(`http://192.168.31.12:5500/books_specs?q=${name}&ext=epub&lang=en`,
			function (res) {
				try {
					let data = '';
					res.on('data', (chunk) => {
						data += chunk;
					});
					res.on('end', async () => {
						try {
							const json = JSON.parse(data);
							const array = Object.keys(json).map(function (k) {
								return json[k];
							});
							const max_dl = array.reduce((a, b) => { // reduce is cool
								return a.downloads_total > b.downloads_total ? a : b;
							});

							const md5 = max_dl.href.split('/').slice(-1)[0];

							http.get('http://192.168.31.12:5500/dl_link?md5=' + md5, function (res) {
								try {
									let data = '';
									res.on('data', (chunk) => {
										data += chunk;
									});
									res.on('end', async () => {
										const json = JSON.parse(data);
										const dl_link = json.dl_link;
										return resolve(dl_link);
									});
								} catch (e) {
									return reject(e);
								}
							});
						} catch (e) {
							return reject(e);
						}
					});
				} catch (e) {
					return reject(e);
				}
			});
	});
}

export function sendFilesToKindle(filenames: string[]): Promise<any> {
	const user = kindleEmail;
	const pass = kindlePassword;
	let kindle = kindleReceiver;
	const transporter = nodemailer.createTransport({
		service: 'zoho',
		auth: {user, pass}
	});
	const mailOptions = {
		from: user,
		to: kindle,
		subject: "Hello ✔", // Subject line
		text: "Hello world?", // plain text body
		attachments: filenames.map((filename) => {
			return {path: filename};
		})
	}
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.log(error);
				return reject(error);
			} else {
				console.log('Email sent: ' + info.response);
				return resolve(info);
			}
		});
	});
}

export function getEpubTitle(filename: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		try {
			const epub = new EPub(filename);
			epub.on("end", function () {
				return resolve(epub.metadata.title);
			});
			epub.parse();
		} catch (e) {
			return reject(e);
		}
	});
}

export function getEpubCover(filename: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		try {
			const epub = new EPub(filename);
			epub.on("end", async function () {
				try {
					let coverId = epub.listImage().find((image) => JSON.stringify(image).includes('cover')).id;
					console.log(coverId);
					const image = await epub.getImageAsync(coverId);
					let coverFn = epub.metadata.title + '.jpg';
					writeFileSync(coverFn, image[0]);
					return resolve(coverFn);
				} catch (e) {
					return reject(e);
				}
			});
			epub.parse();
		} catch (e) {
			return reject(e);
		}
	});
}

// const urlstring = 'https://cdn3.booksdl.org/get.php?md5=f0f9e2d2cf2c4160064c798781d8a1a7&key=LJ2Y0M82FQBJZBWE';
// downloadFile(urlstring).then();
