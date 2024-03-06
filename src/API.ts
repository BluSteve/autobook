import express from "express";
import {Downloader} from "./Downloader";

const app = express();
app.use(express.json());

class AutobookRequest {
	query?: string;
	searchParams?: any;
	link?: string;
	customName?: string;
	recipientEmail: string;
}

app.post("/api", async (req, res) => {
	try {
		const request: AutobookRequest = req.body;
		if (!request.recipientEmail) {
			res.status(400).send('Recipient email is required');
			return;
		}

		const downloader: Downloader = request.query ?
				await Downloader.fromQuery(request.query, request.searchParams) :
				new Downloader(request.link);
		await downloader.downloadFile();
		await downloader.renameFile(request.customName);
		await downloader.sendToKindle(request.recipientEmail);
		let epub = await downloader.getEPub();
		res.send({
			link: downloader.link.href,
			title: epub.metadata.title,
			author: epub.metadata.creator
		});
	} catch (e) {
		console.error(e);
		res.status(500).send('Something went wrong');
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
