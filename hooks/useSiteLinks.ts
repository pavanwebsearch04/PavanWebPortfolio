"use client";

import { usePathname } from "next/navigation";

// One real route per page. `section(id)` is kept as the single place that
// maps a navigation id to its URL.
export const ROUTES: Record<string, string> = {
  hero: "/",
  work: "/projects",
  experience: "/experience",
  skills: "/skills",
  services: "/services",
  about: "/about",
  lab: "/lab",
  contact: "/contact",
};

export function useSiteLinks() {
  const pathname = usePathname() ?? "/";
  const home = pathname === "/";
  const section = (id: string) => ROUTES[id] ?? "/";
  /** nav id of the page currently shown, or "" */
  const activeId = Object.keys(ROUTES).find((id) => (ROUTES[id] === "/" ? home : pathname.startsWith(ROUTES[id]))) ?? "";
  return { pathname, home, section, activeId };
}
