import express, {RequestHandler} from "express";
import {Downloader, extractCover} from "./Downloader";
import sanitize from "sanitize-filename";

const app = express();
const myLogger: RequestHandler = function (req, res, next) {
	console.log(new Date(), req.method, req.url);
	next();
}

app.use(myLogger);
app.use(express.json());
app.use('/books', express.static('books'));
app.use('/covers', express.static('covers'));

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

		if (request.query) console.log(`Finding book for ${request.query}`);
		const downloader: Downloader = request.query ?
			await Downloader.fromQuery(request.query, request.searchParams) :
			new Downloader(request.link);

		console.log(`Downloading ${downloader.link}`);
		await downloader.downloadFile();

		await downloader.renameFile(sanitize(request.customName));
		console.log(`Sending ${downloader.filename} to ${request.recipientEmail}`);
		await downloader.sendToKindle(request.recipientEmail);

		const epub = await downloader.getEPub();
		const cover = await extractCover(epub);
		res.send({
			link: downloader.link.href,
			filename: downloader.filename,
			title: epub.metadata.title,
			author: epub.metadata.creator,
			cover: cover
		});
	} catch (e) {
		console.error(e);
		res.status(500).send('Something went wrong');
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
