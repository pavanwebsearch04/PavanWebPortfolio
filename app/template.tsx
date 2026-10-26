"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

// Re-mounts on every navigation. After the first in-app navigation the new
// page rises in by 40px as the transition panel wipes away. The first load
// renders normally (no hidden initial state), so content never depends on JS.
export default function Template({ children }: { children: React.ReactNode }) {
  const [animateIn] = useState(
    () => typeof window !== "undefined" && (window as unknown as { __pvNav?: boolean }).__pvNav === true
  );
  // the flag only covers the navigation that set it, so back/forward and later
  // loads never start hidden
  useEffect(() => {
    (window as unknown as { __pvNav?: boolean }).__pvNav = false;
  }, []);
  return (
    <motion.div
      initial={animateIn ? { opacity: 0, y: 40 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: animateIn ? 0.25 : 0, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
