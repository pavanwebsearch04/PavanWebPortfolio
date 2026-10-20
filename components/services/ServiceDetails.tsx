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
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <ul className="mt-5 flex flex-col gap-2 border-l border-crimson-bright/50 pl-4 text-support text-paper-body">
            {capabilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
