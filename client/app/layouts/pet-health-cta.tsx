import { Button } from "@/components/ui/button";
import Image from "next/image";

export function PetHealthCTA() {
  return (
    <div className="w-full mx-auto px-6">
      <div
        className="relative rounded-3xl px-12 py-16 text-center overflow-hidden lg:max-w-6xl mx-auto"
        style={{
          background:
            "linear-gradient(90deg, rgba(237, 97, 9, 0.73) 0%, #ED6109 100%)",
        }}
      >
        <div className="absolute top-7 left-5 md:top-35 md:left-12 opacity-60">
          <Image src="/bone.svg" alt="bone" width={50} height={50} />
        </div>
        <div className="absolute top-5 right-5 md:top-15 lg:right-16 opacity-40">
          <Image src="/heart.svg" alt="heart" width={50} height={50} />
        </div>
        <div className="absolute top-83 right-30 md:top-55 lg:top-50 lg:right-40 opacity-10">
          <Image src="/paw.svg" alt="paw" width={50} height={50} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-10 leading-tight">
            Diagnose smarter — anytime, anywhere.
          </h2>

          <Button
            size="lg"
            className="cursor-pointer bg-white text-[#ED6109] hover:bg-gray-50 font-bold px-10 py-4 rounded-full mb-4 text-base shadow-none border-0"
          >
            Upload a Photo
          </Button>

          <p className="text-white text-sm font-light">
            Instant and Effortless
          </p>
        </div>
      </div>
    </div>
  );
}
