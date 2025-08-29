import {FooterLayout} from "@/app/layouts/footer";
import {CustomNumberTicker} from "@/components/shared/custom-number-ticker";
import {Metadata} from "next";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About PawMed AI",
    description: "Get to know us more!"
  };
}

type Statistics = {
  label: string;
  number_value: number;
};

const statistics: Statistics[] = [
  {
    label: "Year Founded",
    number_value: 2025
  },
  {
    label: "Team Members",
    number_value: 1
  },
  {
    label: "Countries Served",
    number_value: 1
  },
  //Veterinarians Counter 
  /*
  {
    label: "Veterinarians",
    number_value: 1
  },
  */
  {
    label: "AI Models",
    number_value: 1
  }
];

export default function About() {
  return (
    <div>
      <div className="p-8 md:p-20 sm:p-8 space-y-10">
        <div className="flex md:flex-row gap-40">
          <div className="w-full space-y-3">
            <h5 className="text-sm font-semibold tracking-widest">ABOUT US</h5>
            <h1 className="text-5xl font-bold text-[#FF7800] leading-14">
              Revolutionizing Pet Healthcare with Artificial Intelligence
            </h1>
            <p className="leading-7">
              At PawMed AI, we're redefining veterinary care through artificial intelligence. Our goal
              is to equip veterinarians with smart tools that boost diagnostic accuracy, simplify
              processes, and elevate animal treatment. With AI integrated into daily routines, we 
              deliver instant insights for quicker, more dependable diagnoses and smoother 
              operations.
            </p>
            <p className="leading-7">
              From analyzing medical images to predicting health issues, PawMed
              AI aims to make veterinary care more efficient and accessible,
              allowing professionals to focus on what truly matters—improving
              the well-being of animals.
            </p>
          </div>

          <div className="md:block hidden">
            <Image
              src={"/pawlogo.png"}
              alt={"Profile Photo"}
              width={900}
              height={900}
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="w-full h-[320px] bg-gray-800 flex flex-col justify-center items-center">
          <div className="w-full h-[300px]">
            <Image
              src={"/cover_paw_new.jpg"}
              alt="cover"
              width={2000}
              height={100}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        <div className="lg:flex lg:justify-center lg:items-center lg:flex-wrap grid grid-cols-2 gap-5">
          {statistics.map((stat, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center space-y-2 border py-5 px-10 rounded-lg ${
                stat.label === "Year Founded" && "col-span-2"
              }`}
            >
              <CustomNumberTicker
                numberValue={stat.number_value}
                textColor="text-[#FF7800]"
              />
              <p className="text-sm text-gray-400 font-bold">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="w-full flex flex-col items-center md:my-16 my-0">
          <div className="lg:w-1/2 text-center space-y-3">
            <h5 className="text-sm font-semibold tracking-widest">
              <span className="text-white  bg-gray-800 py-2 px-3 rounded-sm">
                OUR STORY
              </span>
            </h5>
            <p className="leading-7">
              &quot;PawMed AI was founded from a shared passion for technology
              and animal welfare, with the goal of supporting veterinarians
              through AI-powered tools that make diagnoses more accurate and
              efficient. By addressing challenges in veterinary care, PawMed AI
              aims to help professionals deliver better treatments for pets. The
              platform is continuously evolving, with plans to scale its
              infrastructure and make these solutions accessible to clinics and
              pet care providers worldwide. &quot;
            </p>
          </div>
        </div>
      </div>

      <div>
        <FooterLayout />
      </div>
    </div>
  );
}
