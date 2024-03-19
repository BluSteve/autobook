'use client'

import {Box, Button, Stack, TextInput} from "@mantine/core";
import {FormEvent, useState} from "react";
import {useForm} from "@mantine/form";

export default function Main() {
	const [submitText, setSubmitText] = useState("Download");
	const [displayCustomName, setDisplayCustomName] = useState(false);

	const form = useForm({
		initialValues: {
			query: "",
			email: ""
		},

		validate: {
			query: (value) => !/^\s*$/.test(value) ? null : "Query cannot be empty"
		}
	});

	class BookResponse {
		link!: string;
		filename!: string;
		title!: string;
		author!: string;
		cover!: string;
	}

	async function handleSubmit(values: any) {
		let reqJson: any = {};
		if (submitText === "Send to Kindle") {
			reqJson.recipientEmail = values.email;
		}
		try {
			new URL(values.query);
			reqJson.link = values.query;
		} catch (e) {
			reqJson.query = values.query;
		}
		reqJson.searchParams = values.searchParams;
		reqJson.customName = values.customName;
		console.log("reqJson", reqJson);

		const res = await fetch("http://localhost:3600/api", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(reqJson),
		});
		const obj: BookResponse = await res.json();
	}

	function onEmailInput(e: FormEvent<HTMLInputElement>) {
		const value = e.currentTarget.value;
		if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
			setSubmitText("Send to Kindle");
		} else {
			setSubmitText("Download");
		}
	}

	function onQueryInput(e: FormEvent<HTMLInputElement>) {
		let value = e.currentTarget.value;
		try {
			new URL(value);
			setDisplayCustomName(true);
		} catch (e) {
			setDisplayCustomName(false);
		}
	}

	return (
		<Box mt="10" style={{display: "flex", justifyContent: "center"}}>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack gap="xs">
					<TextInput
						label="Query or link"
						withAsterisk
						onInput={onQueryInput}
						{...form.getInputProps("query")}
					/>
					<TextInput
						style={{display: displayCustomName ? 'inline' : 'none'}}
						label="Custom title"
						{...form.getInputProps("customName")}
					/>
					<TextInput
						label="Email"
						onInput={onEmailInput}
						{...form.getInputProps("email")}
					/>
					<Button type="submit">{submitText}</Button>
				</Stack>
			</form>
		</Box>
	);
}
