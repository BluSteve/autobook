import {getEPub, getEPubCover} from "./Downloader";

async function main() {
	// const downloader: Downloader = await Downloader.fromQuery("pale fire");
	// console.log(downloader.link);
	// await downloader.downloadFile();
	let ePub = await getEPub('ed43d07f6b493ef16bb175980e271cac0850.epub');
	console.log(ePub.metadata.title);
	console.log(await getEPubCover(ePub));
}

main().then();
