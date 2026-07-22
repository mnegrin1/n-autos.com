"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  id?: string;
  as?: "div" | "section";
}

export default function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  direction = "up",
  id,
  as = "div"
}: AnimatedSectionProps) {
  
  const getVariants = () => {
    switch(direction) {
      case "up": return { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } };
      case "down": return { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 } };
      case "left": return { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } };
      case "right": return { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } };
      case "none": return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    }
  };

  const MotionComponent = as === "section" ? motion.section : motion.div;

  return (
    <MotionComponent
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
      variants={getVariants()}
    >
      {children}
    </MotionComponent>
  );
}
