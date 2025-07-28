import { useQueryModal } from "@/hooks/modal-trigger";
import { Modal } from "../ui/modal";
import { useForm } from "react-hook-form";
import { QuerySchema } from "@/schema/query-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { Button } from "../ui/button";

type queryModalProps = {
	name: string;
	label: string;
	placeholder: string;
};

const queryModalData: queryModalProps[] = [
	{
		name: "firstname",
		label: "Firstname",
		placeholder: "Enter your firstname...",
	},
	{
		name: "lastname",
		label: "Lastname",
		placeholder: "Enter your lastname...",
	},
	{
		name: "emailAddress",
		label: "Email Address",
		placeholder: "e.g. juandelacruz@gmail.com",
	},
	{
		name: "feedback",
		label:
			"Please give as much detail as you can and share examples if you have any:",
		placeholder: "Enter your thoughts...",
	},
];

export const QueryModal = () => {
	const queryModal = useQueryModal();

	const form = useForm<z.infer<typeof QuerySchema>>({
		resolver: zodResolver(QuerySchema),
		defaultValues: {
			firstname: "",
			lastname: "",
			feedback: "",
		},
	});

	async function onSubmitQuery(values: z.infer<typeof QuerySchema>) {
		console.log(values);
		resetForm();
	}

	function resetForm() {
		form.reset({
			firstname: "",
			lastname: "",
			emailAddress: "",
			feedback: "",
		});
		queryModal.onClose();
	}

	return (
		<Modal
			title="Query"
			description="Request for information or clarification"
			isOpen={queryModal.isOpen}
			onClose={queryModal.onClose}
			modalWidth="sm:max-w-[50em]"
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmitQuery)} className="space-y-5">
					<div className="flex justify-center items-center gap-3 bg-gray-100 dark:bg-gray-900 p-7 rounded-lg">
						<Image
							src="/pawlogo.png"
							alt="PawMed AI Logo"
							width={60}
							height={60}
						/>

						<div>
							<h3 className="text-lg font-bold">We value your suggestions.</h3>
							<p className="text-sm">
								We value your queries and insights. Share your questions or suggestions with us—we're here to listen and help.
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 space-y-3">
						{queryModalData.map((query, idx) => (
							<FormField
								key={idx}
								name={query.name as keyof z.infer<typeof QuerySchema>}
								render={({ field }) => (
									<FormItem
										className={query.name === "feedback" ? "col-span-2" : ""}
									>
										<FormLabel>{query.label}</FormLabel>
										<FormControl>
											{query.name === "feedback" ? (
												<Textarea
													placeholder={query.placeholder}
													{...field}
													className="resize-none h-36"
												/>
											) : (
												<Input placeholder={query.placeholder} {...field} />
											)}
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						))}
					</div>

					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant={"outline"}
							className="px-5 cursor-pointer"
							onClick={() => resetForm()}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="px-5 cursor-pointer hover:bg-gray-700"
						>
							Submit Feedback
						</Button>
					</div>
				</form>
			</Form>
		</Modal>
	);
};
