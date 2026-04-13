import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";

interface CountUpProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
  formatter?: (value: number) => string;
}

export function CountUp({
  value,
  className,
  formatter = (val) => val.toLocaleString(),
}: CountUpProps) {
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15,
  });
  const displayValue = useTransform(spring, (current) => formatter(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{displayValue}</motion.span>;
}
