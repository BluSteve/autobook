'use client'

import {Box, Button, Stack, TextInput} from "@mantine/core";
import {FormEvent, useState} from "react";
import {useForm} from "@mantine/form";

export default function Main() {
	const [submitText, setSubmitText] = useState("Download");
	const form = useForm({
		initialValues: {
			query: "",
			email: ""
		}
	});

	async function handleSubmit(values: any) {
		console.log(values);
		const res = await fetch("http://localhost:3600/api", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: values.query,
				recipientEmail: values.email
			}),
		});
		const json = await res.json();
		console.log(json);
	}

	function onEmailInput(e: FormEvent<HTMLInputElement>) {
		const value = e.currentTarget.value;
		if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
			setSubmitText("Send to Kindle");
		} else {
			setSubmitText("Download");
		}
	}

	return (
		<Box mt="10" style={{display: "flex", justifyContent: "center"}}>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					<TextInput
						placeholder="Query or link"
						{...form.getInputProps("query")}
					/>
					<TextInput
						placeholder="Email (optional)"
						onInput={onEmailInput}
						{...form.getInputProps("email")}
					/>
					<Button type="submit">{submitText}</Button>
				</Stack>
			</form>
		</Box>
	);
}
