import { CustomNavigationMenu } from "@/components/shared/navigation";
import { ModeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export const HeaderLayout = () => {
  return (
    <div className="w-full fixed top-0 py-3 md:px-24 px-7 z-10 border border-b bg-white dark:bg-gray-950">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image src={"/pawlogo.png"} alt="Logo" width={40} height={40} />
          <h2 className="text-2xl font-bold">Pawmed AI</h2>
        </div>

        <div className="md:block hidden">
          <CustomNavigationMenu />
        </div>

        <div>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};
