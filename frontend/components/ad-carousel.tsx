"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

const sampleAds = [
  {
    id: 1,
    thumbnail: "/placeholder.jpg",
    title: "Nike Air Max",
    views: "2.4M",
  },
  {
    id: 2,
    thumbnail: "/placeholder.jpg",
    title: "Rolex Submariner",
    views: "1.8M",
  },
  {
    id: 3,
    thumbnail: "/placeholder.jpg",
    title: "iPhone 15 Pro",
    views: "3.2M",
  },
  {
    id: 4,
    thumbnail: "/placeholder.jpg",
    title: "Red Bull Energy",
    views: "2.1M",
  },
  {
    id: 5,
    thumbnail: "/placeholder.jpg",
    title: "Chanel No. 5",
    views: "1.5M",
  },
  {
    id: 6,
    thumbnail: "/placeholder.jpg",
    title: "Razer Kraken",
    views: "980K",
  },
];

export function AdCarousel() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const scroll = () => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
    };

    const intervalId = setInterval(scroll, 30);

    return () => clearInterval(intervalId);
  }, []);

  // Duplicate ads for infinite scroll effect
  const duplicatedAds = [...sampleAds, ...sampleAds, ...sampleAds];

  return (
    <section
      ref={sectionRef}
      className="py-24 px-4 bg-secondary/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2
            className={`text-4xl md:text-5xl font-bold transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {"See what others are "}
            <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              {"creating"}
            </span>
          </h2>
          <p
            className={`text-xl text-muted-foreground transition-all duration-700 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {"Thousands of viral ads generated every day"}
          </p>
        </div>

        {/* Carousel container */}
        <div className="relative">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-secondary/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-secondary/30 to-transparent z-10 pointer-events-none" />

          {/* Scrolling container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-hidden py-4"
            style={{ scrollBehavior: "auto" }}
          >
            {duplicatedAds.map((ad, index) => (
              <div
                key={`${ad.id}-${index}`}
                className="flex-shrink-0 group cursor-pointer"
                style={{ width: "280px" }}
              >
                {/* 9:16 aspect ratio container */}
                <div className="relative rounded-2xl overflow-hidden bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:scale-105">
                  <div className="relative" style={{ aspectRatio: "9/16" }}>
                    <img
                      src={ad.thumbnail || "/placeholder.svg"}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-8 h-8 text-background fill-background ml-1" />
                      </div>
                    </div>

                    {/* Views badge */}
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border">
                      <span className="text-xs font-medium">
                        {ad.views} views
                      </span>
                    </div>
                  </div>

                  {/* Ad info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{ad.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {"AI Generated Ad"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
