import type Lenis from "lenis";

// The running Lenis instance (set by SmoothScroll), so other components, such
// as the back-to-top button, can scroll through it. Null when smooth scrolling
// is off (reduced motion, touch), in which case callers fall back to native.
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;

export function scrollToTop() {
  if (instance) instance.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
