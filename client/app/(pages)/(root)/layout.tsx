import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import { HeaderLayout } from "../../layouts/header";
import { ThemeProvider } from "@/components/theme-provider";
import { CustomDock } from "@/components/shared/custom-dock";
import { Modals } from "@/components/modals";
import { Drawers } from "@/components/drawers";
import localFont from "next/font/local";
import { PetHealthCTA } from "@/app/layouts/pet-health-cta";
import { FooterLayout } from "@/app/layouts/footer";

export const AtiplaHeading = localFont({
  src: "../../fonts/AtiplaND-Bold.otf",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pawmed-ai-v2-0.vercel.app"),
  verification: {
    google: "V-geZ47dJfxUYZMo_BFsw6SacQZ27dCr8FtFR5JOeRE",
    other: {
      "msvalidate.01": "850207C668A91F37C992C628F6C33AC8",
    },
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
    "Veterinary AI",
    "Animal Healthcare",
    "Pet Diagnosis",
    "AI Diagnosis",
    "Veterinary Medicine",
    "Veterinary Technology",
    "Veterinary Assistant",
    "Vet App",
    "Pet App",
    "Pet Health App",
    "AI for Pets",
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "Image Classification",
    "Vet Disease Classifier",
    "Animal Disease Detection",
    "Pet Disease Detection",
    "programming",
    "coding",
    "Next.js",
    "NestJS",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "OpenAI",
    "AI Project",
    "Full Stack App",
    "Web Development",
    "Tech for Vets",
    "Digital Vet Tools",
  ],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Modals />
          <Drawers />

          <HeaderLayout />
          <div className="relative md:h-screen font-[family-name:var(--font-geist-sans)]">
            {children}

            <PetHealthCTA />
            <FooterLayout />

            <CustomDock />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
