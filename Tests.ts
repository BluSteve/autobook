import {Downloader, extractCover} from "./Downloader";

async function main() {
	const downloader: Downloader = await Downloader.fromQuery('the maze runner');
	await downloader.downloadFile();
	// console.log((await downloader.getEPub()).metadata.title);
	await downloader.renameFile();
	console.log(await extractCover(await downloader.getEPub()));
	await downloader.sendToKindle('steve.scyr@gmail.com');
}

main().then();
