import { createFileRoute } from '@tanstack/react-router'
import heroImage from '@/assets/images/about/hero.png'
import { Info } from "lucide-react";


export const Route = createFileRoute('/about/')({
  // component: RouteComponent,
  component: App,

})

// function RouteComponent() {
//   return <div>Hello "/about/about"!</div>
// }

// function App() {
//   return (
//   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//   <div className="bg-blue-200 p-4">Left</div>
//   <div className="bg-green-200 p-4">Right</div>
// </div>
//   )
// }

function App() {
  return (
    <main className="bg-white">

    {/* Section 2 - Our Story */}
<section className="py-20">
  <div className="max-w-7xl mx-auto px-4">

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

      {/* Left Content */}
      <div>
  <span className="inline-flex items-center gap-2 border border-[#BEDBFF] text-xs rounded-full  bg-blue-100 px-3 py-1  font-medium text-blue-400">
  <Info className="h-4 w-4" />
  ABOUT US
</span>

<h2 className="mt-2 text-4xl font-bold leading-tight">
  <span className="text-[#165DFC]">Smart Diagnostics</span>
  <br />
  <span className="text-[#0E172B]">Healthier Pets</span>
</h2>

        <p className="mt-6 text-gray-600 leading-8">
          Pawmed AI is a clinical support tool that helps vets, veterinary students, and informed pet owners make faster, more structured decisions. Powered by AI, grounded in veterinary science.
        </p>

       
      </div>

      {/* Right Image */}
      <div>
       <img
              src={heroImage}
              alt="About Hero"
              className="w-full h-auto rounded-xl"
            />
      </div>

    </div>

  </div>
</section>

    

      {/* Section 3 - Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>Mission</div>
          <div>Vision</div>
        </div>
      </section>

      {/* Section 4 - Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          Team Cards
        </div>
      </section>

      {/* Section 5 - Timeline */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          Timeline
        </div>
      </section>

      {/* Section 6 - Statistics */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          Stats
        </div>
      </section>

      {/* Section 7 - CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          Contact Us
        </div>
      </section>

    </main>
  );
}


