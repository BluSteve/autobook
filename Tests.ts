import {Downloader} from "./Downloader";

async function main() {
	const downloader: Downloader = new Downloader("pale fire");
	console.log(await downloader.findLink());
}

main().then();
