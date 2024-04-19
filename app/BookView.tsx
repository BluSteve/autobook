import {apiUrl, BookViewData, showNotification} from "@/app/Models";
import {Button, Group, Image, Popover, Stack, Text, TextInput} from "@mantine/core";
import {IconCloudDownload, IconDownload, IconSend} from "@tabler/icons-react";
import {useForm} from "@mantine/form";
import {notifications} from "@mantine/notifications";
import {useState} from "react";

export default function BookView(props: { bookViewData: BookViewData }) {
	const {bookResponse} = props.bookViewData;
	const [opened, setOpened] = useState(false);

	const form = useForm({
		initialValues: {
			email: localStorage.getItem("email") || ""
		},
		validate: {
			email: (value: string) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value) ? null : "Invalid email"
		}
	});

	async function handleEmail(values: { email: string; }) {
		if (!form.validate().hasErrors) {
			const id = showNotification(`Sending ${bookResponse.filename.split('/').slice(-1)}`, {
				color: "blue",
				loading: true,
				autoClose: false,
				withCloseButton: false,
			})
			const res = await fetch(`${apiUrl}/email`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					email: values.email,
					filename: bookResponse.filename
				})
			});
			notifications.hide(id);

			if (res.ok) {
				showNotification(`Sent ${bookResponse.filename.split('/').slice(-1)} to ${values.email}`, {
					color: "green",
					title: "Success"
				});
				localStorage.setItem("email", values.email);
			} else {
				let message = await res.text();
				console.error(message);
				showNotification(message, {color: "red", title: "Error"});
			}
		}
	}

	return (
		<Group h="120" w="100%" wrap="nowrap" align="top">
			<Image fit="contain" h="auto" miw="85" w="85" src={`${apiUrl}/${bookResponse.cover}`}/>
			<Stack ml="0">
				<Stack gap="0">
					<Text style={{textWrap: "nowrap"}}><b>{bookResponse.title}</b></Text>
					<Text style={{fontSize: "smaller"}}><i>{bookResponse.author}</i></Text>
				</Stack>
				<Group m="auto 10 10 0">
					<a href={`${apiUrl}/${bookResponse.filename}`}><Button p="0" w="36"><IconDownload/></Button></a>
					<a href={`${bookResponse.link}`}><Button p="0" w="36" color="orange"><IconCloudDownload/></Button></a>
					<Popover withArrow opened={opened}>
						<Popover.Target>
							<Button onClick={() => setOpened(!opened)} p="0" w="36" color="green"><IconSend/></Button>
						</Popover.Target>
						<Popover.Dropdown>
							<form onSubmit={form.onSubmit(handleEmail)}>
								<Stack align="center" gap="xs">
									<TextInput
										w="250"
										label="Kindle Email"
										placeholder="FOO_ejXlIj@kindle.com"
										{...form.getInputProps("email")}
									/>
									<Button onClick={() => setOpened(false)} type="submit" color="green" ml="auto"
													rightSection={<IconSend/>}>Send</Button>
								</Stack>
							</form>
						</Popover.Dropdown>
					</Popover>
				</Group>
			</Stack>
		</Group>
	);
}
