import { HeroBanner } from "@/components/landing-page/hero-banner";
/* import { VideoWelcome } from '@/components/landing-page/video-welcome'; */
import { HowItWorks } from "@/components/landing-page/how-it-works";
import VideoSection from "@/app/layouts/videoSection";
import { TestimonialsSection } from "@/app/layouts/testimonial-section";

export default function LandingPage() {
  return (
    <div className="bg-white relative gap-2 md:mt-12 mt-10">
      <div className="text-center space-y-16">
        {/* Banner Section */}
        <HeroBanner />

        {/* <VideoWelcome /> */}
        <section>
          <HowItWorks />
        </section>

        <section className="mx-auto">
          <VideoSection />
        </section>

        <section>
          <TestimonialsSection />
        </section>
      </div>
    </div>
  );
}
