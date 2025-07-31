import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { CustomTextMotion } from '@/components/shared/custom-text-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AtiplaHeading } from '@/app/(pages)/(root)/layout';

export function HeroBanner() {
  return (
    <div className="xl:space-y-10 space-y-5 p-8 md:p-20 sm:p-8">
      <section className="md:w-[35em] mx-auto space-y-5">
        <CustomTextMotion
          text="Smart Care for Every Paw"
          styling={`text-5xl md:text-7xl ${AtiplaHeading.className} text-[#FF7800]`}
        />
      </section>
      <section className="md:w-[45em] mx-auto space-y-5">
        <CustomTextMotion
          text="AI diagnostics, real-time health updates, seamless pet records, and more. Pet owners rely on PawMed AI for modern, reliable care."
          styling="tracking-wider md:text-lg text-sm text-gray-500"
        />
      </section>

      <section className="flex justify-center items-center gap-3">
        <Button variant={'outline'} className="cursor-pointer text-[.9em] p-5 text-gray-400">
          <Link href={'/about'}>Learn more..</Link>
        </Button>
        <InteractiveHoverButton>
          <Link href="/classify-disease">Get Started</Link>
        </InteractiveHoverButton>
      </section>
    </div>
  );
}