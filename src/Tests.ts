import {extractCover} from "./Downloader";
import EPub from "epub2";

async function main() {
	await extractCover(await EPub.createAsync('books/On the Road.epub'))

	// const downloader: Downloader = await Downloader.fromQuery('the maze runner');
	// await downloader.downloadFile();
	// // console.log((await downloader.getEPub()).metadata.title);
	// await downloader.renameFile();
	// console.log(await extractCover(await downloader.getEPub()));
	// await downloader.sendToKindle('steve.scyr@gmail.com');
}

main().then();
