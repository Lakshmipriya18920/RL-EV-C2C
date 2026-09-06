"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

interface AnimatedHeadingProps {
  text: string;
  className?: string;
}

export default function AnimatedHeading({
  text = "Bringing intelligence to the grid",
  className = "",
}: AnimatedHeadingProps) {
  // Split heading into words and letters for natural spacing
  const words = text.split(" ");

  // Container variant for staggering children
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.035, // Smooth left-to-right sequential delay per letter
        delayChildren: 0.1,
      },
    },
  };

  // Letter variant: subtle fade-in and slight upward translation (e.g., from y: 12 to y: 0)
  const letterVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 12,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <motion.h1
      className={`font-semibold tracking-tight text-white ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.28em]">
          {word.split("").map((letter, letterIndex) => (
            <motion.span
              key={`${wordIndex}-${letterIndex}`}
              variants={letterVariants}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
}
