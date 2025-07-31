import Image from 'next/image';
import Link from 'next/link';
import { AtiplaHeading } from '@/app/(pages)/(root)/layout';

type PawMedStepsProps = {
  title: string;
  instructions: string;
  image: string;
};

const PawMedSteps: PawMedStepsProps[] = [
  {
    title: 'Upload Photo',
    instructions: 'Take a clear image of your pet condition.',
    image: '/pawmed-steps/step1.png',
  },
  {
    title: 'Let AI Analyze',
    instructions: 'Our system scans for symptoms and patterns.',
    image: '/pawmed-steps/step2.png',
  },
  {
    title: 'Get Insights',
    instructions: 'Receive feedback and suggested next steps.',
    image: '/pawmed-steps/step3.png',
  },
  {
    title: 'Download PDF',
    instructions: 'Preview and download a PDF file for reference.',
    image: '/pawmed-steps/step4.png',
  },
];

export function HowItWorks() {
  return (
    <section className="w-full">
      <div className="bg-gray-200 dark:bg-slate-950 px-8 md:px-24 py-10 space-y-5">
        <h1 className={`${AtiplaHeading.className} text-4xl font-bold`}>How It Works</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PawMedSteps.map((step, idx) => (
            <div
              key={idx}
              className={`group bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row ${
                idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
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
                  idx % 2 === 0 ? 'md:text-left' : 'md:text-right'
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

                <Link href={'/classify-disease'} className="underline hover:text-gray-950 text-gray-400">
                  Get started
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}