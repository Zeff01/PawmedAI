import { createFileRoute } from '@tanstack/react-router'
import heroImage from '@/assets/images/about/hero.png'
import { Info } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import {
  PawPrint,
  Cross,
  SearchCheck,
  HandshakeIcon,
} from "lucide-react";
import { ArrowRight } from "lucide-react";
import {
  Zap,
  ScanSearch,
  ShieldCheck,
  BarChart3,
} from "lucide-react";



const objectives = [
  {
    title: "Faster Assessments",
    description:
      "Cut the time between observation and a structured diagnostic starting point.",
    icon: Zap,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-600",
  },
  {
    title: "Bridge Concern to Care",
    description:
      "Connect what you notice about your pet directly to the help they need.",
    icon: HandshakeIcon,
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-500",
  },
  {
    title: "Support, Not Replace",
    description:
      "Complement professional veterinary judgment — never substitute it.",
    icon: PawPrint,
    bg: "bg-pink-50",
    border: "border-pink-200",
    iconBg: "bg-pink-600",
  },
  {
    title: "Accessible Pattern Recognition",
    description:
      "Make early visual diagnostic skills available to vets, students, and owners alike.",
    icon: ScanSearch,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-600",
  },
];

const features = [
  {
    title: "Disease Classification",
    description:
      "Analyze visual symptoms from a photo and get a structured diagnostic brief in minutes.",
    image: "/src/assets/images/about/scope1.png",
    icon: Zap,
  },
  {
    title: "Breed Identification",
    description:
      "Identifies your pet's breed and surfaces breed-linked health tendencies instantly.",
    image: "/src/assets/images/about/scope2.png",

    icon: ScanSearch,
  },
  {
    title: "Nearby Vet Locator",
    description:
      "Find licensed clinics near you and act on your results right away.",
    image: "/src/assets/images/about/scope3.png",

    icon: ShieldCheck,
  },
  {
    title: "Structured Diagnostic Output",
    description:
      "Every result comes back as a clean, organized report you can bring to your vet.",
    image: "/src/assets/images/about/scope4.png",

    icon: BarChart3,
  },
];

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

    {/* Section 1 - About us */}
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

    

      {/* Section 2 - Pawmed covers*/}
<section className="py-20">
  <div className="max-w-7xl mx-auto px-4">

    {/* Header */}
    <div className="mb-14">
      <span className="inline-flex rounded-full border border-[#BEDBFF] bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
        What PawMed AI Covers
      </span>

      <h2 className="mt-6 max-w-4xl text-5xl font-bold leading-tight text-slate-900">
        Built for Every Step of the Diagnostic Journey
      </h2>

      <p className="mt-6 max-w-5xl text-xl leading-9 text-slate-500">
        PawMed AI analyzes clinical pet photos and returns a structured
        diagnostic brief in under 5 minutes whether you're a vet reviewing a
        case, a student sharpening your skills, or a pet owner trying to
        understand what's wrong. PawMed AI gives you a clear, organized
        starting point.
      </p>
    </div>

    {/* Feature Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <article
            key={feature.title}
            className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <img
              src={feature.image}
              alt={feature.title}
              className="h-60 w-full object-cover"
            />

            <div className="p-7">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>

                <h3 className="text-2xl font-bold leading-snug text-slate-900">
                  {feature.title}
                </h3>
              </div>

              <p className="text-lg leading-8 text-slate-500">
                {feature.description}
              </p>
            </div>
          </article>
        );
      })}
    </div>

  </div>
</section>

      {/* Section 3 - Objectives */}
<section className="py-20">
  <div className="max-w-7xl mx-auto px-4">

    {/* Header */}
    <div className="mb-14">
      <span className="inline-flex rounded-full border border-[#BEDBFF] bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-600">
        Our Objectives
      </span>

      <h2 className="mt-6 text-5xl font-bold text-slate-900">
        What We're Here to Do
      </h2>

      <p className="mt-6 max-w-5xl text-xl leading-9 text-slate-500">
        PawMed AI is built with a clear purpose. Every feature, every model,
        and every output is shaped by these goals:
      </p>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
      {objectives.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.title}
            className={`${item.bg} ${item.border} rounded-3xl border p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl`}
          >
            {/* Icon */}
            <div
              className={`mb-10 flex h-16 w-16 items-center justify-center rounded-2xl ${item.iconBg} shadow-lg`}
            >
              <Icon className="h-8 w-8 text-white" />
            </div>

            {/* Title */}
            <h3 className="mb-6 text-4xl font-bold leading-tight text-slate-900">
              {item.title}
            </h3>

            {/* Description */}
            <p className="text-xl leading-9 text-slate-500">
              {item.description}
            </p>
          </article>
        );
      })}
    </div>

  </div>
</section>

      {/* Section 4 - Warning tool support */}
     <section className="py-20">
  <div className="max-w-7xl mx-auto px-4">
    <div className="rounded-3xl border-l-4 border-orange-500 bg-[#FFF8E8] p-10 shadow-lg">

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <AlertTriangle className="h-7 w-7 text-orange-500 fill-orange-500" />
        </div>

        <h2 className="text-4xl font-bold text-slate-900">
          A Tool to Support. Not to Replace.
        </h2>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

        {/* Left */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-700">
            For Professionals & Students
          </h3>

          <p className="text-lg leading-9 text-slate-600">
            PawMed AI is designed to augment clinical judgment, providing
            rapid access to differential diagnoses and literature. It does
            not replace independent veterinary assessment.
          </p>
        </div>

        {/* Right */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-700">
            For Owners
          </h3>

          <p className="text-lg leading-9 text-slate-600">
            This platform offers educational insights based on your pet's
            symptoms. It is not a substitute for professional veterinary
            advice, diagnosis, or treatment. Always consult a licensed
            veterinarian in emergencies.
          </p>
        </div>

      </div>
    </div>
  </div>
</section>

      {/* Section 5 - Mission and Vision */}
   <section className="py-20">
  <div className="max-w-7xl mx-auto px-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

      {/* Left - Image */}
      <div>
        <img
          src="/src/assets/images/about/Mission&Vision.png"
          alt="Veterinarian examining a dog"
          className="w-full h-[600px] object-cover rounded-3xl shadow-xl"
        />
      </div>

      {/* Right - Content */}
      <div className="space-y-8">

        {/* Badge */}
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
          Our Mission & Vision
        </span>

        {/* Heading */}
        <h2 className="text-5xl font-bold leading-tight text-slate-900">
          Faster Clarity.
          <br />
          Better Care.
        </h2>

        {/* Paragraph */}
        <p className="text-xl leading-10 text-slate-600">
          Our mission is simple: give everyone from the seasoned clinician
          to the first-time pet owner a smarter, faster way to understand
          what they're seeing. We built PawMed AI to close the gap between
          what pet owners notice and what veterinarians need to know.
        </p>

        <p className="text-xl leading-10 text-slate-600">
          Veterinary diagnostics shouldn't be slow, inaccessible, or
          confusing. PawMed AI makes the first step clearer.
        </p>

      </div>
    </div>
  </div>
</section>

      {/* Section 6 - stand for */}
    <section className="py-20">
  <div className="max-w-7xl mx-auto px-4">

    {/* Section Header */}
    <div className="text-center max-w-4xl mx-auto mb-16">
      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
        What We Stand For
      </span>

      <h2 className="mt-6 text-5xl font-bold leading-tight text-slate-900">
        Care-First. Science-Backed. Responsible.
      </h2>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

      {/* Card 1 */}
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">

        <img
          src="/src/assets/images/about/values1.png"
          alt="Animal Welfare"
          className="h-64 w-full object-cover"
        />

        <div className="p-8">

          <div className="mb-6 flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <PawPrint className="h-7 w-7 text-blue-600" />
            </div>

            <h3 className="text-3xl font-bold text-slate-900">
              Animal Welfare First
            </h3>

          </div>

          <p className="text-lg leading-8 text-slate-600">
            Every feature we build is guided by one question:
            does this help animals get better care faster?
          </p>

        </div>
      </article>

      {/* Card 2 */}
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">

        <img
          src="/src/assets/images/about/values2.png"

          alt="Clinical"
          className="h-64 w-full object-cover"
        />

        <div className="p-8">

          <div className="mb-6 flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Cross className="h-7 w-7 text-blue-600" />
            </div>

            <h3 className="text-3xl font-bold text-slate-900">
              Clinically Grounded
            </h3>

          </div>

          <p className="text-lg leading-8 text-slate-600">
            Our models are trained on veterinary data.
            We build for accuracy, not just speed.
          </p>

        </div>
      </article>

      {/* Card 3 */}
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">

        <img
          src="/src/assets/images/about/values3.png"

          alt="Transparency"
          className="h-64 w-full object-cover"
        />

        <div className="p-8">

          <div className="mb-6 flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <SearchCheck className="h-7 w-7 text-blue-600" />
            </div>

            <h3 className="text-3xl font-bold text-slate-900">
              Radically Transparent
            </h3>

          </div>

          <p className="text-lg leading-8 text-slate-600">
            We're an AI tool. We know our limits.
            We'll always tell you when to see a veterinarian.
          </p>

        </div>
      </article>

    </div>

  </div>
</section>

         {/* Section 7 - get started */}
 <section className="py-20">
  <div className="max-w-7xl mx-auto px-4">
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-8 py-20 shadow-2xl">

      {/* Decorative Background */}
      <div className="absolute inset-y-0 left-0 w-12 bg-white/5" />

      {/* Content */}
      <div className="relative mx-auto max-w-3xl text-center">

        {/* Badge */}
        <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-white">
          Get Started Today
        </span>

        {/* Heading */}
        <h2 className="mt-8 text-5xl font-bold tracking-tight text-white">
          Ready to Get Started?
        </h2>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-blue-100">
          Try the classification tool or sign in to access your
          full diagnostic dashboard.
        </p>

        {/* Buttons */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">

          {/* Primary Button */}
          <button className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            Try PawMed AI Now
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* Secondary Button */}
          <button className="rounded-2xl border border-white/40 px-8 py-4 text-lg font-medium text-white transition-all duration-300 hover:bg-white hover:text-blue-600">
            Sign In
          </button>

        </div>

      </div>
    </div>
  </div>
</section>

    </main>
  );
}


