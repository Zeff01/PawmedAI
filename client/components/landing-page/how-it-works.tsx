import Image from "next/image";
<<<<<<< HEAD
import {AtiplaHeading} from "@/app/(pages)/(root)/layout";
=======
import { AtiplaHeading } from "@/app/(pages)/(root)/layout";
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707

type PawMedStepsProps = {
  title: string;
  instructions: string;
  paragraph: string;
  bullets: string[];
  image: string;
};

const PawMedSteps: PawMedStepsProps[] = [
  {
    title: "Upload a Photo",
    instructions: "Take or upload a photo of your pet",
    paragraph:
      "Capture a clear image of the affected area. No sign-up required, just a simple upload.",
    bullets: [
      "Works with any recent photo from your gallery",
      "Use your camera for real-time diagnosis",
<<<<<<< HEAD
      "Privacy-first approach—we don't store your photos"
    ],
    image: "/assets/how_it_works_1.png"
=======
      "Privacy-first approach—we don't store your photos",
    ],
    image: "/assets/how_it_works_1.png",
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
  },
  {
    title: "Instant AI Scan",
    instructions: "Our AI scans for early signs of issues",
    paragraph:
      "PawMed AI analyzes your pet's skin for irritation, rashes, or abnormalities in seconds.",
    bullets: [
      "Trained on thousands of vet-verified cases",
      "Detects potential health conditions with high accuracy",
<<<<<<< HEAD
      "Results in under 10 seconds"
    ],
    image: "/assets/how_it_works_2.png"
=======
      "Results in under 10 seconds",
    ],
    image: "/assets/how_it_works_2.png",
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
  },
  {
    title: "Get your Report",
    instructions: "Receive a simple, actionable report.",
    paragraph:
      "You'll get an easy-to-understand report with insights from real vet data and next steps.",
    bullets: [
      "Clear explanation of findings",
      "Recommendations for home care",
<<<<<<< HEAD
      "Guidance on when to see a vet"
    ],
    image: "/assets/how_it_works_3.png"
  }
=======
      "Guidance on when to see a vet",
    ],
    image: "/assets/how_it_works_3.png",
  },
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
];

export function HowItWorks() {
  return (
    <section className="w-full">
<<<<<<< HEAD
      <div className="bg-gray-200 dark:bg-slate-950 px-8 md:px-24 py-27 space-y-5">
=======
      <div className="px-8 md:px-24 py-27 space-y-5">
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
        <h1 className={`${AtiplaHeading.className} text-4xl font-bold mt-6`}>
          How It Works
        </h1>
        <p>
          Three simple steps to get insights about your pet&apos;s skin
          condition
        </p>
        <div className=" flex flex-col gap-10 pt-10 ">
          {PawMedSteps.map((step, idx) => (
<<<<<<< HEAD
            <div 
=======
            <div
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
              key={idx}
              className={`group rounded-lg dark:bg-slate-900 flex flex-col md:flex-row ${
                idx % 2 === 0
                  ? "md:flex-row-reverse bg-[#FFF8ED]"
                  : "md:flex-row bg-[#FFEFD4]"
              } w-full gap-10 md:gap-16 p-5 md:py-12 md:px-20 items-center rounded-lgl`}
            >
<<<<<<< HEAD
              
=======
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
              {/* Image */}
              <div className="md:w-1/2">
                <Image
                  src={step.image}
                  alt={step.title}
                  className="object-cover w-full h-auto rounded-[2rem] drop-shadow-xl"
                  width={600}
                  height={200}
                />
              </div>

              {/* Text */}
              <div
                className={`space-y-2 md:w-1/2  text-center md:text-left md:px-8 md:text-inherit`}
              >
                <div className="mb-6">
<<<<<<< HEAD
                  <span 
=======
                  <span
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
                    className={` text-2xl text-[#ED6109] md:text-[1rem] bg-[#FFDBA9] py-1 px-3 rounded-xl `}
                  >
                    {step.title}
                  </span>
                </div>

<<<<<<< HEAD
                <p className=" font-bold md:text-[1.5rem] mb-4">{step.instructions}</p>
=======
                <p className=" font-bold md:text-[1.5rem] mb-4">
                  {step.instructions}
                </p>
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
                <p className="text-[#6B7280]">{step.paragraph}</p>
                {step.bullets && (
                  <ul className="list-none list-inside ">
                    {step.bullets.map((bullet, index) => (
<<<<<<< HEAD
                      <li className="relative pl-6 before:content-['\2713'] before:absolute before:left-0 before:text-orange-500  leading-9" key={index}>{bullet.trim()}</li>
=======
                      <li
                        className="relative pl-6 before:content-['\2713'] before:absolute before:left-0 before:text-orange-500  leading-9"
                        key={index}
                      >
                        {bullet.trim()}
                      </li>
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
