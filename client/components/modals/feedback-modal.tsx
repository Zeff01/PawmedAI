import { useFeedbackModal } from "@/hooks/modal-trigger";
import { Modal } from "../ui/modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FeedbackSchema } from "@/schema/feedback-schema";
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

type feedbackModalDataProps = {
	name: string;
	label: string;
	placeholder: string;
};

const feedbackModalData: feedbackModalDataProps[] = [
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

export const FeedbackModal = () => {
	const feedbackModal = useFeedbackModal();

	const form = useForm<z.infer<typeof FeedbackSchema>>({
		resolver: zodResolver(FeedbackSchema),
		defaultValues: {
			firstname: "",
			lastname: "",
			emailAddress: "",
			feedback: "",
		},
	});

	async function onSubmitFeedback(values: z.infer<typeof FeedbackSchema>) {
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
		feedbackModal.onClose();
	}

	return (
		<Modal
			title="Feedback"
			description="We welcome your comments and idea"
			isOpen={feedbackModal.isOpen}
			onClose={feedbackModal.onClose}
			modalWidth="sm:max-w-[50em]"
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmitFeedback)}
					className="space-y-5"
				>
					<div className="flex justify-center items-center gap-3 bg-orange-50 dark:bg-gray-900 p-7 rounded-lg">
						<Image
							src="/pawlogo.png"
							alt="PawMed AI Logo"
							width={60}
							height={60}
						/>

						<div>
							<h3 className="text-lg font-bold">We value your suggestions.</h3>
							<p className="text-sm">
								We value your feedback and appreciate you taking the time to share it with us. Let us know your thoughts or suggestions.
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 space-y-3">
						{feedbackModalData.map((feedback, idx) => (
							<FormField
								key={idx}
								name={feedback.name as keyof z.infer<typeof FeedbackSchema>}
								render={({ field }) => (
									<FormItem
										className={feedback.name === "feedback" ? "col-span-2" : ""}
									>
										<FormLabel>{feedback.label}</FormLabel>
										<FormControl>
											{feedback.name === "feedback" ? (
												<Textarea
													placeholder={feedback.placeholder}
													{...field}
													className="resize-none h-36"
												/>
											) : (
												<Input placeholder={feedback.placeholder} {...field} />
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
