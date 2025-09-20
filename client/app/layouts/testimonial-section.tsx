"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

const testimonialsData = [
  [
    {
      id: 1,
      name: "Sam & Peanut",
      image: "/testimonials/sam-peanut.png",
      rating: 5,
      text: "It helped identify triggers and now we have a management plan that works.",
    },
    {
      id: 2,
      name: "Sam & Peanut",
      image: "/testimonials/sam-peanut.png",
      rating: 5,
      text: "So intuitive and fast, it felt like magic. Peanut was calm the whole time.",
    },
    {
      id: 3,
      name: "Dr. Lee",
      image: "/testimonials/dr-lee.png",
      rating: 5,
      text: "As a vet, I'm amazed by the accuracy. I recommend it daily.",
    },
    {
      id: 4,
      name: "Jordan",
      image: "/testimonials/jordan.jpg",
      rating: 5,
      text: "Saved us an emergency ton of stress. Brilliant.",
    },
  ],
  [
    {
      id: 5,
      name: "Maria & Bella",
      image: "/testimonials/bella.png",
      rating: 5,
      text: "The app detected early signs of skin issues. Our vet confirmed it was accurate!",
    },
    {
      id: 6,
      name: "Dr. Smith",
      image: "/testimonials/dr-lee.png",
      rating: 5,
      text: "I use this in my practice daily. It's incredibly reliable for initial assessments.",
    },
    {
      id: 7,
      name: "Alex & Max",
      image: "/testimonials/sam-peanut.png",
      rating: 5,
      text: "Peace of mind at 3 AM when Max wasn't feeling well. Highly recommend!",
    },
    {
      id: 8,
      name: "Sarah",
      image: "/testimonials/sarah.png",
      rating: 5,
      text: "My cat hates vet visits, but this app helps me monitor her health at home.",
    },
  ],
  [
    {
      id: 9,
      name: "Tom & Buddy",
      image: "/testimonials/sam-peanut.png",
      rating: 5,
      text: "Caught a potential issue early. The detailed report helped our vet tremendously.",
    },
    {
      id: 10,
      name: "Lisa & Luna",
      image: "/testimonials/bella.png",
      rating: 5,
      text: "So easy to use! Luna's health tracking has never been this simple.",
    },
    {
      id: 11,
      name: "Dr. Johnson",
      image: "/testimonials/dr-lee.png",
      rating: 5,
      text: "Revolutionary technology. My clients love having this tool between visits.",
    },
    {
      id: 12,
      name: "Mike & Whiskers",
      image: "/testimonials/jordan.jpg",
      rating: 5,
      text: "The AI is incredibly smart. It picked up on something we completely missed.",
    },
  ],
];

export function TestimonialsSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
<<<<<<< HEAD
    <div className="w-full mx-auto px-6 py-13 bg-gray-50">
=======
    <div className="w-full mx-auto px-6 py-13">
>>>>>>> 6db9b4c0f45f0d1ff02b952410f442cfc78ea707
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-[#333333] mb-12">
          What Pet Parents Are Saying
        </h2>

        <Carousel
          setApi={setApi}
          className="w-full max-w-6xl mx-auto"
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="-ml-4 py-5">
            {testimonialsData.map((testimonialSet, index) => (
              <CarouselItem key={index} className="pl-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
                  {testimonialSet.map((testimonial) => (
                    <Card
                      key={testimonial.id}
                      className="border-t-0 border-gray-200 shadow-lg bg-white rounded-xl w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] lg:max-w-[350px] h-[160px]"
                    >
                      <CardContent className="p-2 sm:p-3 text-left h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-black text-xs truncate">
                              {testimonial.name}
                            </h3>
                            <div className="flex gap-0.5 mt-0.5">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-[#374151] leading-tight flex-1 line-clamp-4">
                          &quot;{testimonial.text}&quot;
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`cursor-pointer w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                current === index + 1
                  ? "bg-[#F97316]"
                  : "bg-[#D1D5DB] hover:bg-gray-400"
              }`}
              aria-label={`View testimonials ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
