import Image from "next/image";
import React from "react";

export default function VideoSection() {
  return (
    <div className="max-w-7xl mx-auto flex flex-row shadow-2xl rounded-3xl">
      <div className="p-10 flex-grow max-w-[50%] text-left flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="font-extrabold text-4xl text-[#333333]">
            PawMed AI in Action
          </h2>
          <p className="max-w-[50%]">
            Watch how easy it is to detect a pet&apos;s health condition with
            PawMed AI
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          <li className="flex flex-row items-center gap-4">
            <div className="w-8 h-10 bg-orange-500/15 rounded-full flex flex-row justify-center items-center">
              <Image
                className="h-fit w-fit"
                src="lightning.svg"
                alt=""
                width={50}
                height={50}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-md font-bold text-[#1F2937]">Quick & Easy</p>
              <p className="text-[#6B7280]">
                Just upload a photo and get results in seconds
              </p>
            </div>
          </li>
          <li className="flex flex-row items-center gap-4">
            <div className="w-8 h-10 bg-orange-500/15 rounded-full flex flex-row justify-center items-center">
              <Image
                className="h-fit w-fit"
                src="question.svg"
                alt=""
                width={50}
                height={50}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-md font-bold text-[#1F2937]">
                Vet-Backed Technology
              </p>
              <p className="text-[#6B7280]">
                Our AI is trained on vet-verified cases
              </p>
            </div>
          </li>
          <li className="flex flex-row items-center gap-4">
            <div className="w-8 h-10 bg-orange-500/15 rounded-full flex flex-row justify-center items-center">
              <Image
                className="h-fit w-fit"
                src="lock.svg"
                alt=""
                width={50}
                height={50}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-md font-bold text-[#1F2937]">Privacy First</p>
              <p className="text-[#6B7280]">
                Your pet&apos;s photos aren&apos;t stored or shared
              </p>
            </div>
          </li>
        </ul>
      </div>
      <div className=" flex-grow p-10">
        <Image
          className="w-full h-70 object-cover rounded-2xl"
          src="/thumbnail.png"
          alt=""
          width={500}
          height={500}
        />
        <div className="pt-4 flex flex-row gap-2 justify-center items-center">
          <p className=" text-[#ED6109]">
            Try it now with your pet&apos;s photo
          </p>
          <Image src="/arrow.svg" alt="" width={15} height={15} />
        </div>
      </div>
    </div>
  );
}
