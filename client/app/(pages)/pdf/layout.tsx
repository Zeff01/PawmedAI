import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	verification: {
		google: "V-geZ47dJfxUYZMo_BFsw6SacQZ27dCr8FtFR5JOeRE",
	},
	keywords: [
		"PawMed AI",
		"pawmed ai",
		"pawmed",
		"paw",
		"med",
		"AI",
		"Pet Health",
		"Veterinary",
		"Machine Learning",
		"programming",
		"coding",
	],
	metadataBase: new URL("https://pawmed-ai-v2-0.vercel.app"),
	title: {
		default: "PawMed AI",
		template: "%s | jpdevdotcom-",
	},
	openGraph: {
		title: "PawMed AI",
		description: "Revolutionizing Pet Healthcare with Artificial Intelligence",
		siteName: "PawMed AI",
		url: "https://pawmed-ai-v2-0.vercel.app",
		type: "website",
		locale: "en_US",
		images: [
			{
				url: "/pawlogo.png",
				width: 1200,
				height: 1200,
				alt: "PawMed AI",
				type: "image/png",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "PawMed AI",
		description: "Revolutionizing Pet Healthcare with Artificial Intelligence",
		images: ["/pawlogo.png"],
	},
	icons: {
		icon: ["/assets/favicon.ico?v=4"],
		apple: ["/assets/apple-touch-icon.png?v=4"],
		shortcut: ["/assets/apple-touch-icon.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
			>
				{children}
			</body>
		</html>
	);
}
