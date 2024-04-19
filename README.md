# 📚 AutoBook
### _AutoBook sends any book to Kindle instantly!_
#### Live at https://autobook.live!
It's an Anna's Archive/ libgen wrapper that streamlines the **"book title ➡️ libgen ➡️ Kindle"** workflow.

![demo2.gif](demo2.gif)

## How does it work?
Upon receiving a query, AutoBook does the following:
1. Searches for the book on Anna's Archive.
2. Download the version with the most downloads.
3. Rename the file to its _epub_ title, as Kindle recognizes filenames, not metadata.
4. Send the file to a Kindle email address.

## How do I run it?
This is a simple next.js frontend. Run the following to get started:

``` shell
npm install -- installs dependencies

npm run dev -- starts development server

npm run build && npm run start -- starts production server
```
Currently, only the frontend is open-source.
