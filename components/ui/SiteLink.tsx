"use client";

import Link from "next/link";
import { forwardRef, type AnchorHTMLAttributes } from "react";

// In-page hashes stay plain anchors (native smooth scroll + scroll-margin);
// anything that leaves the current page goes through the Next router.
const SiteLink = forwardRef<HTMLAnchorElement, { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">>(
  function SiteLink({ href, children, ...rest }, ref) {
    if (href.startsWith("#")) {
      return (
        <a ref={ref} href={href} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link ref={ref} href={href} {...rest}>
        {children}
      </Link>
    );
  }
);

export default SiteLink;
