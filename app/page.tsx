'use client'

import {
	Accordion,
	ActionIcon,
	AppShell,
	Button,
	Divider,
	Group,
	Image,
	Modal,
	Popover,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Title,
	useMantineColorScheme
} from "@mantine/core";
import {useEffect, useState} from "react";
import {useForm} from "@mantine/form";
import {IconBook2, IconDownload, IconMoon, IconSend, IconSun} from "@tabler/icons-react";
import {apiUrl, BookViewData, showNotification, sleep} from "@/app/Models";
import BookView from "@/app/BookView";
import cx from 'clsx';
import classes from './page.module.css';
import {notifications} from "@mantine/notifications";
import {useDisclosure} from "@mantine/hooks";

// const example: BookViewData = {
// 	bookResponse: {
// 		link: "https://libgen.li/get.php?md5=09075eecdbd18ae08338f25658e6823d&key=AQDNSMJJ6P5F037Z",
// 		filename: "books/Nineteen Eighty-Four (1984).epub",
// 		title: "Nineteen Eighty-Three (1984)",
// 		author: "George Orwell",
// 		cover: "covers/598980cdbbdf96af9a42a93015db738e.jpg"
// 	}
// };
//
// const example2: BookViewData = {
// 	bookResponse:
// 		{
// 			link: "http://libgen.li/get.php?md5=372708877736cb8461c4419b72138a9d&key=GIWWJ7B9AKQF1U7X",
// 			filename: "books/Orlando.epub",
// 			title: "Orlando",
// 			author: "Virginia Woolf",
// 			cover: "covers/ad97967dac0f052285d9df4a242f3ae5.jpeg"
// 		}
// }

export default function Main() {
	const [canSend, setCanSend] = useState(false);
	const [history, setHistory]: [BookViewData[], any] = useState([]);
	const [d1, setd1] = useState(false);
	const [c1, setc1] = useState(false);
	const {toggleColorScheme} = useMantineColorScheme();
	const [opened, {open, close}] = useDisclosure(false);

	const form = useForm({
		initialValues: {
			query: "",
			email: "",
			customName: "",
			searchParams: ""
		},
		validate: {
			query: (value: string) => !/^\s*$/.test(value) ? null : "Query or link cannot be empty"
		}
	});

	useEffect(() => {
		if (!localStorage.getItem("firstTime")) {
			localStorage.setItem("firstTime", "true");
			open();
		}

		const storedHistory = JSON.parse(localStorage.getItem("history") as string);
		if (storedHistory) {
			setHistory(storedHistory);
		}

		const email = localStorage.getItem("email");
		if (email) {
			form.setFieldValue("email", email);
			onEmailInput(email);
		}

		const downloadings = localStorage.getItem("downloadings");
		if (downloadings) {
			JSON.parse(downloadings).forEach(async (i: { reqJson: any; id: string; }) => {
				const notifId = showDownloadNotification(i.reqJson);
				downloadPoll(i.reqJson, i.id, true, notifId);
			});
		}
	}, []);

	function errorNotification(message: string) {
		showNotification(message === "Something went wrong" ?
			"Please try again" : message, {color: "red", title: "Error"});
	}

	function showDownloadNotification(reqJson: any): string {
		return showNotification("", {
			title: (reqJson.email !== undefined ? "Sending " : "Downloading ") +
				(reqJson.link ? "link" : `"${reqJson.query}"`),
			color: "blue",
			loading: true,
			autoClose: false,
			withCloseButton: false
		});
	}

	async function downloadPoll(reqJson: any, id: string, continuing: boolean, notifId: string) {
		const isSend = reqJson.email !== undefined;

		if (!continuing) {
			// add info to downloadings
			localStorage.setItem("downloadings",
				JSON.stringify([...JSON.parse(localStorage.getItem("downloadings") || "[]"), {reqJson, id}]));
		}

		let linkNotifId: string | undefined = undefined;

		function removeFromDownloadings() {
			localStorage.setItem("downloadings", JSON.stringify(JSON.parse(localStorage.getItem("downloadings") || "[]")
				.filter((i: { id: string; }) => i.id !== id)));
		}

		while (true) {
			let res: Response;
			try {
				res = await fetch(`${apiUrl}/progress/${id}`);
			} catch (e) {
				// console.error(e);
				removeFromDownloadings()
				errorNotification("Something went wrong");
				break;
			}

			if (!res.ok) {
				let message = await res.text();
				removeFromDownloadings();
				// console.error(message);
				if (res.status === 429) {
					errorNotification("Too many requests. Please try again later");
				} else {
					errorNotification("Something went wrong");
				}
				break;
			}

			const json = await res.json();
			// console.log("response", json);
			const obj = json.payload;

			if (json.status === "done" || json.status === "emailing") {
				setHistory((prev: BookViewData[]) => {
					// check if book is already in history
					if (prev.some((b) => b.bookResponse.link === obj.link)) {
						return prev;
					}

					const newHistory = [{bookResponse: obj}, ...prev]
					localStorage.setItem("history", JSON.stringify(newHistory));
					return newHistory;
				});
			}
			if (json.status === "done" || json.status === "error") {
				// remove info from downloadingIds
				removeFromDownloadings();
			}

			if (json.status === "error") {
				errorNotification(json.payload.message);
				break;
			} else if (json.status === "done") {
				if (linkNotifId) {
					notifications.hide(linkNotifId);
				}
				if (isSend) {
					localStorage.setItem("email", reqJson.email);
					showNotification(`Sent ${obj.filename.split('/').slice(-1)} to ${reqJson.email}`, {
						color: "green",
						title: "Success"
					});
				} else {
					window.open(`${apiUrl}/${obj.filename}`, "_self"); // download file
					showNotification(`Downloaded ${obj.filename.split('/').slice(-1)}`, {color: "green", title: "Success"});
				}
				break;
			} else if (json.status === "downloading") {
				if (reqJson.query && !linkNotifId) {
					linkNotifId = showNotification(<><a target="_blank" href={obj.link}>Download link</a> to
						"{reqJson.query}"</>, {autoClose: false});
				}

				const message = obj.total === 1 ? "Downloading" :
					`Downloading (${Math.round(obj.done / obj.total * 100)}% of ${Math.round(obj.total / 1024 / 1024 * 100) / 100} MB)`;
				notifications.update({
					id: notifId,
					message
				});
			} else if (json.status === "querying") {
				notifications.update({id: notifId, message: `Querying Anna's Archive`});
			} else if (json.status === "emailing") {
				notifications.update({id: notifId, message: `Sending to ${reqJson.email}`});
			} else if (json.status === "processing") {
				notifications.update({id: notifId, message: `Processing`});
			}

			await sleep(500);
		}

		notifications.hide(notifId); // hide download notification
	}

	async function handleDownload(values: any, isSend: boolean) {
		let reqJson: any = {};
		if (isSend) {
			reqJson.email = values.email;
		}
		try {
			new URL(values.query);
			reqJson.link = values.query;
		} catch (e) {
			reqJson.query = values.query;
		}
		reqJson.searchParams = values.searchParams?.split(" ").map((s: string) => {
			const [k, v] = s.split("=");
			return {[k]: v};
		}).reduce((a: any, b: any) => Object.assign(a, b), {});
		reqJson.customName = values.customName;
		// console.log("reqJson", reqJson);

		// clear input fields
		form.setFieldValue("query", "");
		form.setFieldValue("customName", "");
		form.setFieldValue("searchParams", "");

		const notifId = showDownloadNotification(reqJson);
		let res: Response;
		try {
			res = await fetch(`${apiUrl}/api`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(reqJson),
			});
		} catch (e) {
			// console.error(e);
			errorNotification("Something went wrong");
			notifications.hide(notifId);
			return;
		}

		// console.log("res", res);
		if (!res.ok) {
			if (res.status === 429) {
				errorNotification("Too many requests. Please try again later");
			} else {
				let message = await res.text();
				errorNotification(message);
			}
			notifications.hide(notifId);
			return;
		}
		const id: string = (await res.json()).id; // progress id

		// show downloading notification
		await downloadPoll(reqJson, id, false, notifId);
	}

	function onEmailInput(value: string) {
		if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
			setCanSend(true);
		} else {
			setCanSend(false);
		}
	}

	return (
		<AppShell header={{height: 45}} padding="md">
			<AppShell.Header>
				<Group h="100%" mx="xs" gap="5">
					<IconBook2 style={{width: 35, height: 35}}/>
					<Title order={2}>AutoBook</Title>
					<Modal opened={opened} onClose={close} title="How It Works">
						<Stack gap="10">
							<Title size="md" order={4} style={{textAlign: "center"}}><b>AutoBook magically downloads books for
								free!</b></Title>
							<Image radius="5px" mx="auto" w="100%" maw="275" src={`${apiUrl}/files/demo2.gif`} fit="contain"/>
							<Text mx="10" style={{textAlign: "justify", fontSize: "13px", lineHeight: "1.3"}}>For queries, it
								retrieves the <i>most downloaded</i> edition of a book from Anna's Archive, which can often have better
								typesetting than the official version!</Text>
						</Stack>
					</Modal>
					<Button ml="auto" variant="outline" p="5" h="34" onClick={open}>Tutorial</Button>
					<ActionIcon size="lg" variant="default" onClick={() => toggleColorScheme()}>
						<IconSun className={cx(classes.icon, classes.light)} stroke={1.5}/>
						<IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5}/>
					</ActionIcon>
				</Group>
			</AppShell.Header>
			<AppShell.Main pt="55">
				<Stack w="100%" maw="420" align="center" mx="auto">
					<form style={{width: "100%"}} onSubmit={(e) => e.preventDefault()}>
						<Stack w="100%" gap="xs">
							<TextInput
								label="Query or Link"
								required
								placeholder="1984 george orwell OR https://libgen.li/get.php..."
								{...form.getInputProps("query")}
							/>
							<TextInput
								label={<>Kindle Email (
									<span onClick={async () => {
										if (!c1) {
											setd1(true); // idk why this has to be reversed
											await sleep(75);
											setd1(false);
										}
									}}>
									<Popover withArrow onChange={(b) => {
										setc1(b);
										if (!b) setd1(false);
									}}>
										<Popover.Target>
										<span style={{
											color: "cornflowerblue",
											cursor: "pointer",
											textDecoration: "underline"
										}}>what's this?</span>
										</Popover.Target>
										<Popover.Dropdown>
											<Text w="286" size="xs">
												Send books to Kindle by adding your Kindle email.
												Follow <a target="_blank" href="https://www.amazon.com/sendtokindle/email">this guide</a> to
												find
												your Kindle email and add <b>kindle@blusteve.com</b> to your approved emails.
											</Text>
										</Popover.Dropdown>
									</Popover>
								</span>
									)
								</>}
								placeholder="FOO_ejXlIj@kindle.com"
								onInput={e => onEmailInput(e.currentTarget.value)}
								disabled={d1}
								{...form.getInputProps("email")}
							/>
							<Accordion transitionDuration={0} variant="contained">
								<Accordion.Item value="advanced">
									<Accordion.Control h="35">Advanced</Accordion.Control>
									<Accordion.Panel>
										<TextInput
											label="Custom Title"
											placeholder="Nineteen Eighty-Four (1984)"
											{...form.getInputProps("customName")}
										/>
										<TextInput
											label={<>Search Params (same as <a target="_blank" href="https://annas-archive.org/">Anna's
												Archive</a>)</>}
											placeholder="content=book_fiction lang=en"
											{...form.getInputProps("searchParams")}
										/>
									</Accordion.Panel>
								</Accordion.Item>
							</Accordion>
							<Group gap="xs" justify="center">
								<Button miw="140"
												type="submit"
												onClick={async () => {
													if (!form.validate().hasErrors) {
														await handleDownload(form.values, false);
													}
												}}
												rightSection={<IconDownload/>}>Download</Button>
								<Button miw="140" color="green"
												onClick={async () => {
													if (!form.validate().hasErrors) {
														await handleDownload(form.values, true);
													}
												}}
												disabled={!canSend}
												rightSection={<IconSend/>}>Send</Button>
							</Group>
						</Stack>
					</form>
					<ScrollArea h="500" w="98%" p="10" mt="10" mb="30" style={{
						borderStyle: "solid",
						borderWidth: "thin",
						borderColor: "lightblue",
						borderRadius: "5px"
					}}>
						<Stack gap="0" align="center">
							{history.length === 0 ? <Text c="grey" size="sm">No history</Text> :
								history.map((book, i) => (
									<>
										<BookView bookViewData={book} key={i}/>
										<Divider h="100%" w="100%" my="md"/>
									</>
								))}
						</Stack>
					</ScrollArea>
				</Stack>
			</AppShell.Main>
		</AppShell>
	);
}
