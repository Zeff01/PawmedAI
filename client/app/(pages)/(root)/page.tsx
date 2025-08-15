import { CustomMarqueeCardHorizontal } from '@/components/shared/custom-marquee-horizontal';
import { FooterLayout } from '@/app/layouts/footer';
import { HeroBanner } from '@/components/landing-page/hero-banner';
/* import { VideoWelcome } from '@/components/landing-page/video-welcome'; */
import { HowItWorks } from '@/components/landing-page/how-it-works';
import { AtiplaHeading } from './layout';

export default function LandingPage() {
  return (
    <div className="relative gap-5 md:mt-12 mt-10 ">
      <div className="text-center">
        {/* Banner Section */}
        <HeroBanner />

        {/* <VideoWelcome /> */}

        <section className="space-y-5">
          <HowItWorks />

          <div className="px-8 md:px-20 sm:px-8 py-8 -z-10">
            <section className="space-y-3">
              <div className="relative text-center max-w-xl mx-auto">
                {/* Quote Icon */}
                <span className="absolute text-[8rem] text-gray-200 opacity-70 -top-10 -left-5 select-none z-0">
                  &ldquo;
                </span>

                {/* Quote Text */}
                <blockquote className="relative -z-10 text-lg md:text-xl text-gray-700 dark:text-gray-500 italic leading-relaxed">
                  They can&apos;t tell us when something&apos;s wrong—but with compassion and care, we can still hear
                  them.
                </blockquote>
              </div>

              <div className="w-full flex justify-center items-center">
                <CustomMarqueeCardHorizontal />
              </div>
            </section>
          </div>

          <div className="hidden md:flex bg-[url('/dog_cat_wallpaper.jpeg')] items-end bg-cover bg-center bg-no-repeat w-full h-[40em] py-10 px-10 md:px-32">
            <div className="bg-[#B46F27] text-white w-[35em] px-10 py-12 text-left">
              <h1 className={`${AtiplaHeading.className} text-4xl`}>Pet. Cared.</h1>
              <p>
                Stay assured of your pet&apos;s health no matter where they are. With just a quick scan using PawMed AI,
                you&apos;ll get instant insights—because true peace of mind comes from knowing they&apos;re safe and
                well.
              </p>
            </div>
          </div>

          <div className="block md:hidden">
            <div className="bg-[url('/dog_cat_wallpaper.jpeg')] flex items-end bg-cover bg-center bg-no-repeat w-full h-[20em] py-10 px-10 md:px-32" />
            <div className="bg-[#B46F27] text-white px-10 py-8 text-left">
              <h1 className={`${AtiplaHeading.className} text-4xl`}>Pet. Cared.</h1>
              <p>
                Stay assured of your pet&apos;s health no matter where they are. With just a quick scan using PawMed AI,
                you&apos;ll get instant insights—because true peace of mind comes from knowing they&apos;re safe and
                well.
              </p>
            </div>
          </div>

          <section className="bg-gray-100 dark:bg-gray-900 text-center">
            <div className="max-w-xl mx-auto space-y-3 py-8">
              <h2 className="text-2xl font-semibold">Your Pet&apos;s Privacy Matters</h2>
              <p className="text-sm text-gray-600">
                All data and images are stored securely and used only for diagnostics.
              </p>
            </div>
            <section>
              <FooterLayout />
            </section>
          </section>
        </section>
      </div>
    </div>
  );
}
