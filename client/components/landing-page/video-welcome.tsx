import Image from "next/image";

export function VideoWelcome() {
  return (
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
            — the next evolution in intelligent pet care. Powered by advanced
            machine learning and image classification, PawMed AI lets you assess
            your pet&apos;s health in seconds with a simple photo upload.
            It&apos;s fast, accurate, and built to give you peace of mind.
          </p>
        </div>
      </div>
    </section>
  );
}
