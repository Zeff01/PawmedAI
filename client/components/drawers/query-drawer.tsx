import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "../ui/button";
import Image from "next/image";
import { CustomDrawer } from "../ui/custom-drawer";
import { useQueryDrawer } from "@/hooks/drawer-trigger";
import { QuerySchema } from "@/schema/query-schema";

type queryModalDataProps = {
	name: string;
	label: string;
	placeholder: string;
};

const queryModalData: queryModalDataProps[] = [
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

export const QueryDrawer = () => {
	const queryDrawer = useQueryDrawer();

	const form = useForm<z.infer<typeof QuerySchema>>({
		resolver: zodResolver(QuerySchema),
		defaultValues: {
			firstname: "",
			lastname: "",
			emailAddress: "",
			feedback: "",
		},
	});

	async function onSubmitFeedback(values: z.infer<typeof QuerySchema>) {
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
		queryDrawer.onClose();
	}

	return (
		<CustomDrawer
			title="Query"
			description="We welcome your comments and idea"
			isOpen={queryDrawer.isOpen}
			onClose={queryDrawer.onClose}
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmitFeedback)}
					className="space-y-5"
				>
						<div className="flex flex-col sm:flex-row justify-center items-center sm:items-center gap-4 sm:gap-3 bg-orange-50 p-5 sm:p-7 rounded-lg text-center sm:text-left">
						<Image
							src="/pawlogo.png"
							alt="PawMed AI Logo"
							width={60}
							height={60}
							className="w-12 h-12 sm:w-[60px] sm:h-[60px]"
						/>

						<div>
							<h3 className="text-base sm:text-lg font-bold leading-snug">We value your suggestions.</h3>
							<p className="text-xs sm:text-sm">
								We appreciate you taking the time to share your thoughts.
								What&apos;s your suggestion?
							</p>
						</div>
					</div>

					<div className="md:grid grid-cols-2 gap-3 space-y-3">
						{queryModalData.map((query, idx) => (
							<FormField
								key={idx}
								name={query.name as keyof z.infer<typeof QuerySchema>}
								render={({ field }) => (
									<FormItem
										className={query.name === "feedback" ? "col-span-2" : ""}
									>
										<FormLabel>{query.label}</FormLabel>
										{query.name === "feedback" ? (
											<Textarea
												placeholder={query.placeholder}
												{...field}
												className="resize-none h-36"
											/>
										) : (
											<FormControl>
												<Input placeholder={query.placeholder} {...field} />
											</FormControl>
										)}
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
							Submit Query
						</Button>
					</div>
				</form>
			</Form>
		</CustomDrawer>
	);
};
