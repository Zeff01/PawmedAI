import React from 'react';

export default function VideoSection() {
  return (
    <div className="bg-white max-w-7xl mx-auto  flex flex-row shadow-2xl rounded-3xl my-20">
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
              <img className="h-fit w-fit" src="lightning.svg" alt="" />
            </div>
            <p className="flex flex-col">
              <p className="text-md font-bold text-[#1F2937]">Quick & Easy</p>
              <p className="text-[#6B7280]">
                Just upload a photo and get results in seconds
              </p>
            </p>
          </li>
          <li className="flex flex-row items-center gap-4">
            <div className="w-8 h-10 bg-orange-500/15 rounded-full flex flex-row justify-center items-center">
              <img className="h-fit w-fit" src="question.svg" alt="" />
            </div>
            <p className="flex flex-col">
              <p className="text-md font-bold text-[#1F2937]">
                Vet-Backed Technology
              </p>
              <p className="text-[#6B7280]">
                Our AI is trained on vet-verified cases
              </p>
            </p>
          </li>
          <li className="flex flex-row items-center gap-4">
            <div className="w-8 h-10 bg-orange-500/15 rounded-full flex flex-row justify-center items-center">
              <img className="h-fit w-fit" src="lock.svg" alt="" />
            </div>
            <p className="flex flex-col">
              <p className="text-md font-bold text-[#1F2937]">Privacy First</p>
              <p className="text-[#6B7280]">
                Your pet's photos aren't stored or shared
              </p>
            </p>
          </li>
        </ul>
      </div>
      <div className=" flex-grow p-10">
        <img
          className="w-full h-70 object-cover rounded-2xl"
          src="thumbnail.png"
          alt=""
        />
        <div className="pt-4 flex flex-row gap-2 justify-center items-center">
          <p className=" text-[#ED6109]">
            Try it now with your pet's photo
          </p>
          <img src="/arrow.svg" alt="" />
        </div>
      </div>
    </div>
  );
}
