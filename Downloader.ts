// if you pass this class a query, it will try to find the link
// if you pass this class a link, it will download the link to an epub
// the final so-called output is an epub object
export class Downloader {
	private static readonly ANNAS_API_URL = "http://192.168.31.12:5500";
	public query: string;
	public link: URL;
	public searchParams: any;

	constructor(queryOrLink: string | URL, searchParams?: any) {
		if (queryOrLink instanceof URL) {
			this.link = queryOrLink;
		} else {
			this.query = queryOrLink;
			this.searchParams = searchParams;
		}
	}

	public async findLink(): Promise<URL> {
		const resp = checkStatus(await fetch(`${Downloader.ANNAS_API_URL}/books_specs?` + new URLSearchParams(
			Object.assign({}, {q: this.query, ext: "epub"}, this.searchParams) // searchParams overrides q and ext
		)));

		// gets the md5 of the most downloaded book
		const json = await resp.json();
		const array = Object.keys(json).map(k => json[k]);
		const maxDownloads = array.reduce((a, b) => a.downloads_total > b.downloads_total ? a : b);
		const md5 = maxDownloads.href.split("/").slice(-1)[0];

		// gets the download link from the md5
		const dlLinkResp = checkStatus(await fetch(`${Downloader.ANNAS_API_URL}/dl_link?md5=${md5}`));
		const dlLinkJson = await dlLinkResp.json();

		return new URL(dlLinkJson.dl_link);
	}
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
