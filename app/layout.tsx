import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {createTheme, MantineProvider} from "@mantine/core";
import {Notifications} from "@mantine/notifications";

const inter = Inter({subsets: ["latin"]});

const theme = createTheme({
	/** Your theme override here */
});


export const metadata: Metadata = {
	title: "AutoBook",
	description: "Download any book you want to Kindle, Google Play Books, Apple Books, etc., for free!",
};

export default function RootLayout({
																		 children,
																	 }: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
		<body className={inter.className}>
		<MantineProvider theme={theme} defaultColorScheme='auto'>
			<Notifications/>
			{children}
		</MantineProvider>
		</body>
		</html>
	);
}
