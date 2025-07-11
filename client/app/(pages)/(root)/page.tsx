import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { CustomTextMotion } from "@/components/shared/custom-text-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AtiplaHeading } from "./layout";
import Image from "next/image";
import { CustomMarqueeCardHorizontal } from "@/components/shared/custom-marquee-horizontal";
import { FooterLayout } from "@/app/layouts/footer";
// import { CustomMarqueeCardHorizontal } from "@/components/shared/custom-marquee-horizontal";

type PawMedStepsProps = {
	title: string;
	instructions: string;
	image: string;
};

const PawMedSteps: PawMedStepsProps[] = [
	{
		title: "Upload Photo",
		instructions: "Take a clear image of your pet&apos; condition.",
		image: "/pawmed-steps/step1.png",
	},
	{
		title: "Let AI Analyze",
		instructions: "Our system scans for symptoms and patterns.",
		image: "/pawmed-steps/step2.png",
	},
	{
		title: "Get Insights",
		instructions: "Receive feedback and suggested next steps.",
		image: "/pawmed-steps/step3.png",
	},
	{
		title: "Download PDF",
		instructions: "Preview and download a PDF file for reference.",
		image: "/pawmed-steps/step4.png",
	},
];

export default function LandingPage() {
	return (
		<div className="relative gap-5 md:mt-12 mt-10">
			<div className="text-center">
				<div className="xl:space-y-10 space-y-5 p-8 md:p-20 sm:p-8">
					<section className="md:w-[35em] mx-auto space-y-5">
						<CustomTextMotion
							text="Smart Care for Every Paw"
							styling={`text-5xl md:text-7xl ${AtiplaHeading.className} text-[#FF7800]`}
						/>
					</section>
					<section className="md:w-[45em] mx-auto space-y-5">
						<CustomTextMotion
							text="AI diagnostics, real-time health updates, seamless pet records, and more. Pet owners rely on PawMed AI for modern, reliable care."
							styling="tracking-wider md:text-lg text-sm text-gray-500"
						/>
					</section>

					<section className="flex justify-center items-center gap-3">
						<Button
							variant={"outline"}
							className="cursor-pointer text-[.9em] p-5 text-gray-400"
						>
							<Link href={"/about"}>Learn more..</Link>
						</Button>
						<InteractiveHoverButton>
							<Link href="/classify-disease">Get Started</Link>
						</InteractiveHoverButton>
					</section>
				</div>

				<section className="space-y-5">
					<section>
						<div className="px-8 md:px-20 sm:px-8">
							<video
								className="w-full h-auto md:rounded-t-2xl rounded-t-lg border-4 border-gray-950"
								controls
								autoPlay
								preload="none"
								muted
								loop
							>
								<source src="/videos/pawmed_ai.mp4" type="video/mp4" />
							</video>
						</div>
						<div className="bg-[linear-gradient(rgba(0,0,0,0.8),rgba(0,0,0,0.8)),url('/cover_paw_new.jpg')] bg-cover bg-center bg-no-repeat w-full py-10">
							<div className="flex md:flex-row flex-col gap-5 md:w-[50em] md:mx-auto items-center">
								<Image
									src="/pawlogo-w.png"
									alt="PawMed AI Logo"
									width={150}
									height={150}
								/>
								<p className="text-white text-lg md:text-left text-center md:px-0 px-10">
									<span className="font-bold text-[#FF7800]">
										Welcome to PawMed AI
									</span>{" "}
									— the next evolution in intelligent pet care. Powered by
									advanced machine learning and image classification, PawMed AI
									lets you assess your pet&apos;s health in seconds with a
									simple photo upload. It&apos;s fast, accurate, and built to
									give you peace of mind.
								</p>
							</div>
						</div>

						<section className="w-full">
							<div className="bg-gray-200 dark:bg-slate-950 px-8 md:px-24 py-10 space-y-5">
								<h1 className={`${AtiplaHeading.className} text-4xl font-bold`}>
									How It Works
								</h1>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{PawMedSteps.map((step, idx) => (
										<div
											key={idx}
											className={`group bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row ${
												idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
											} w-full gap-10 md:gap-16 p-5 items-center rounded-lg hover:bg-gray-100 transition-all`}
										>
											{/* Image */}
											<div className="md:w-1/2">
												<Image
													src={step.image}
													alt={step.title}
													className="rounded-lg border-2 border-gray-950 object-cover w-full h-auto"
													width={650}
													height={650}
												/>
											</div>

											{/* Text */}
											<div
												className={`space-y-2 md:w-1/2 ${
													idx % 2 === 0 ? "md:text-left" : "md:text-right"
												} text-center md:text-inherit`}
											>
												<h2
													className={`${
														AtiplaHeading.className
													} text-2xl md:text-3xl transition-colors duration-300 group-hover:text-[#FF7800]`}
												>
													{step.title}
												</h2>
												<p className="text-gray-700">{step.instructions}</p>

												<Link
													href={"/classify-disease"}
													className="underline hover:text-gray-950 text-gray-400"
												>
													Get started
												</Link>
											</div>
										</div>
									))}
								</div>
							</div>
						</section>
					</section>

					<div className="px-8 md:px-20 sm:px-8 py-8 -z-10">
						<section className="space-y-3">
							<div className="relative text-center max-w-xl mx-auto">
								{/* Quote Icon */}
								<span className="absolute text-[8rem] text-gray-200 opacity-70 -top-10 -left-5 select-none z-0">
									&ldquo;
								</span>

								{/* Quote Text */}
								<blockquote className="relative -z-10 text-lg md:text-xl text-gray-700 dark:text-gray-500 italic leading-relaxed">
									They can&apos;t tell us when something&apos;s wrong—but with
									compassion and care, we can still hear them.
								</blockquote>
							</div>

							<div className="w-full flex justify-center items-center">
								<CustomMarqueeCardHorizontal />
							</div>
						</section>
					</div>

					<div className="hidden md:flex bg-[url('/dog_cat_wallpaper.jpeg')] items-end bg-cover bg-center bg-no-repeat w-full h-[40em] py-10 px-10 md:px-32">
						<div className="bg-[#B46F27] text-white w-[35em] px-10 py-12 text-left">
							<h1 className={`${AtiplaHeading.className} text-4xl`}>
								Pet. Cared.
							</h1>
							<p>
								Stay assured of your pet&apos;s health no matter where they are.
								With just a quick scan using PawMed AI, you&apos;ll get instant
								insights—because true peace of mind comes from knowing
								they&apos;re safe and well.
							</p>
						</div>
					</div>

					<div className="block md:hidden">
						<div className="bg-[url('/dog_cat_wallpaper.jpeg')] flex items-end bg-cover bg-center bg-no-repeat w-full h-[20em] py-10 px-10 md:px-32"></div>
						<div className="bg-[#B46F27] text-white px-10 py-8 text-left">
							<h1 className={`${AtiplaHeading.className} text-4xl`}>
								Pet. Cared.
							</h1>
							<p>
								Stay assured of your pet&apos;s health no matter where they are.
								With just a quick scan using PawMed AI, you&apos;ll get instant
								insights—because true peace of mind comes from knowing
								they&apos;re safe and well.
							</p>
						</div>
					</div>

					<section className="bg-gray-100 dark:bg-gray-900 text-center">
						<div className="max-w-xl mx-auto space-y-3 py-8">
							<h2 className="text-2xl font-semibold">
								Your Pet&apos;s Privacy Matters
							</h2>
							<p className="text-sm text-gray-600">
								All data and images are stored securely and used only for
								diagnostics.
							</p>
						</div>
						<section>
							<FooterLayout />
						</section>
					</section>
				</section>
			</div>
		</div>
	);
}
