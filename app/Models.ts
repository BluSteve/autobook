import {notifications} from "@mantine/notifications";
import {ReactNode} from "react";

export const apiUrl: string = "https://autobookapi123.blusteve.com";

export interface BookResponse {
	link: string;
	filename: string;
	title: string;
	author: string;
	cover: string;
}

export interface BookViewData {
	bookResponse: BookResponse;
}

export function showNotification(message: ReactNode, options?: object): string {
	return notifications.show({
		ml: "auto",
		w: 300,
		withBorder: true,
		autoClose: 10000,
		message,
		...options
	});
}

export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}
