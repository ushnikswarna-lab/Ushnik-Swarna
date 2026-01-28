"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define item type – supports both images and videos
type SliderItem =
  | { type: "image"; src: string; alt?: string }
  | { type: "video"; src: string; poster?: string };

// Example data – replace with your real URLs
const items: SliderItem[] = [
  {
    type: "image",
    src: "https://cdn.joyalukkas.in/media/wysiwyg/web_banner_2560X930.jpg",
    alt: "Joyalukkas Banner 1",
  },
  {
    type: "video",
    src: "https://cdn.joyalukkas.in/videos/JA_KRISHNALEELA_RE%20SIZE_800x800_20SEC.mp4?tr=q-50",           // ← put your video in /public/videos/
  },
  {
    type: "image",
    src: "https://cdn.joyalukkas.in/media/wysiwyg/Desktop-home-page-banner.jpg",
    alt: "Joyalukkas Banner 2",
  },
  {
    type: "video",
    src: "https://cdn.joyalukkas.in/videos/JA_KRISHNALEELA_RE%20SIZE_800x800_20SEC.mp4?tr=q-50",
  },
];

export default function ImageVideoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  // Autoplay when not hovered
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // ← adjust timing (videos usually need longer → 6-8s)

    return () => clearInterval(interval);
  }, [isHovered]);

  const currentItem = items[currentIndex];

  return (
    <div className="relative w-full mx-auto max-w-[2560px]">
      <div
        className="relative aspect-[16/12] sm:aspect-[16/6] overflow-hidden group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {currentItem.type === "image" ? (
          <Image
            src={currentItem.src}
            alt={currentItem.alt ?? `Slide ${currentIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-700 opacity-100 group-hover:opacity-95"
            priority={currentIndex === 0}
            quality={85}
            sizes="(max-width: 768px) 100vw, 90vw"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={currentItem.poster}
            className="w-full h-full object-cover"
          >
            <source src={currentItem.src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Navigation arrows (optional – you can remove if you only want dots) */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 p-3 hover:bg-black/60 transition"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 p-3 hover:bg-black/60 transition"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-3 my-4">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`rounded-full transition-all duration-400 ${
              idx === currentIndex
                ? "bg-primary h-1.5 w-12"   // ← using your primary color (change if needed)
                : "bg-gray-400/70 hover:bg-gray-300 h-1.5 w-6"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}