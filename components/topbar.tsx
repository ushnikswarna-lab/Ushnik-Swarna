"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState, useEffect } from "react";

const announcements = [
  "Free shipping on orders above ₹4999",
  "New arrivals: Festive gold collection 2025",
  "Exchange old jewellery & get 20% extra",
  "EMI options available on all purchases",
];

const variants: Variants = {
  initial: {
    y: 20,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",          // ← this works in most recent versions
      // or: ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: "easeIn",
      // or: ease: [0.4, 0.0, 1, 1] as const,
    },
  },
};

export function Topbar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full border-b bg-primary font-semibold text-white text-center text-sm py-1.5 overflow-hidden"
    >
      <div className="relative h-5 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center"
          >
            {announcements[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}