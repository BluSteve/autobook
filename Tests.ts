import {Downloader, extractCover} from "./Downloader";

async function main() {
	const downloader: Downloader = new Downloader('https://cdn3.booksdl.org/get.php?md5=e84f9503faeb13d99362aef2d6bafd6d&key=Q2Z6OUOKZD30FXYN')
	await downloader.downloadFile();
	// console.log((await downloader.getEPub()).metadata.title);
	await downloader.renameFile();
	console.log(await extractCover(await downloader.getEPub()));

}

main().then();
