"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function ServiceDetails({
  id,
  expanded,
  capabilities,
}: {
  id: string;
  expanded: boolean;
  capabilities: string[];
}) {
  return (
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          id={id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <ul className="mt-5 flex flex-col gap-2 border-l border-crimson-bright/50 pl-4 text-support text-paper-body">
            {capabilities.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
