import express from "express";

const app = express();
app.use(express.json());

class AutobookRequest {
	query: string;
	searchParams: any;
	link: string;
	customName: string;
	recipientEmail: string;
}

app.post("/api", (req, res) => {
	const request: AutobookRequest = req.body;
	console.log(request);
	res.send("Hello World");
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
