"use client";

import { useEffect, useMemo, useState } from "react";
import { useMotionValue, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import { WEB_CONFIG, WEB_TARGET_SELECTOR } from "@/lib/webConfig";
import { hashString } from "@/lib/webGeometry";
import { WebContext, WebContextValue, WebInstance, WebMode } from "./webContext";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

/**
 * Owns everything the web needs to react to:
 *  - shared pointer / cursor springs and scroll tension (MotionValues, so
 *    nothing re-renders on pointer move or scroll),
 *  - one delegated set of listeners that decides which interactive element
 *    (button, link, field, card, node...) currently has a web formed around
 *    it, from mouse proximity, keyboard focus or a touch tap.
 *
 * Elements opt out with data-web="off"; anything else matching
 * WEB_TARGET_SELECTOR works with no per-component wiring.
 */
export default function WebInteractionProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const isCoarse = useIsCoarsePointer();
  const wide = useMediaQuery("(min-width: 768px)");
  const finePointer = useMediaQuery("(pointer: fine)");
  // reduced motion keeps the cursor (as a static spider) — SiteCursor
  // drops the springs, gait and trail itself
  const cursorActive = !isCoarse && wide && finePointer;

  const pointerX = useMotionValue(-200);
  const pointerY = useMotionValue(-200);
  const cursorX = useSpring(pointerX, WEB_CONFIG.cursor.spring);
  const cursorY = useSpring(pointerY, WEB_CONFIG.cursor.spring);
  const engageRaw = useMotionValue(0);
  const engage = useSpring(engageRaw, { stiffness: 260, damping: 28 });

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, WEB_CONFIG.scroll.spring);
  const tension = useTransform(smoothVelocity, (v) => clamp(v / WEB_CONFIG.scroll.velocityForFull, -1, 1));

  const [webs, setWebs] = useState<WebInstance[]>([]);

  useEffect(() => {
    const cfg = WEB_CONFIG.interactive;
    const leaveMs = (cfg.stretchDuration + cfg.retractDuration + 0.35) * 1000;

    let store: WebInstance[] = [];
    let keyCounter = 0;
    const commit = () => setWebs(store.slice());
    const replace = (key: number, patch: Partial<WebInstance>) => {
      store = store.map((i) => (i.key === key ? { ...i, ...patch } : i));
    };
    const liveFor = (el: Element) => store.find((i) => i.el === el && !i.leaving);

    const leave = (inst: WebInstance) => {
      replace(inst.key, { leaving: true });
      if (!store.some((i) => i.key !== inst.key && i.el === inst.el && !i.leaving)) {
        inst.el.removeAttribute("data-web-active");
      }
      commit();
      window.setTimeout(() => {
        store = store.filter((i) => i.key !== inst.key);
        commit();
      }, leaveMs);
    };

    const addMode = (el: Element, mode: WebMode, pointer: { x: number; y: number } | null) => {
      const existing = liveFor(el);
      if (existing) {
        if (!existing.modes.includes(mode)) replace(existing.key, { modes: [...existing.modes, mode] });
        return;
      }
      const live = store.filter((i) => !i.leaving);
      if (live.length >= cfg.maxConcurrent) leave(live[0]);

      const r = el.getBoundingClientRect();
      const label =
        el.getAttribute("data-web-id") ||
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        el.textContent ||
        "";
      store.push({
        key: keyCounter++,
        el,
        modes: [mode],
        rect: { left: r.left, top: r.top, width: r.width, height: r.height },
        scrollY0: window.scrollY,
        seed: hashString(`${el.tagName}|${label.trim().slice(0, 40)}`),
        inHeader: Boolean(el.closest("header")),
        pointer,
        leaving: false,
      });
      el.setAttribute("data-web-active", "true");
      commit();
    };

    const removeMode = (el: Element, mode: WebMode) => {
      const inst = liveFor(el);
      if (!inst) return;
      const modes = inst.modes.filter((m) => m !== mode);
      if (modes.length === 0) leave(inst);
      else replace(inst.key, { modes });
    };

    /* ---------- target discovery ---------- */
    const onScreen = new Set<Element>();
    const observed = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onScreen.add(entry.target);
          else onScreen.delete(entry.target);
        });
      },
      { rootMargin: "140px" }
    );
    const scan = () => {
      document.querySelectorAll(WEB_TARGET_SELECTOR).forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        io.observe(el);
      });
    };
    scan();
    let scanTimer = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scan, 250);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    /* ---------- hover proximity ---------- */
    let hoverEl: Element | null = null;
    let lastX = -1;
    let lastY = -1;
    let lastSample = 0;
    let trailing = 0;

    const setHover = (el: Element | null) => {
      if (el === hoverEl) return;
      if (hoverEl) removeMode(hoverEl, "hover");
      hoverEl = el;
      if (el) addMode(el, "hover", { x: lastX, y: lastY });
      engageRaw.set(el ? 1 : 0);
    };

    const evaluate = () => {
      if (lastX < 0) return;
      let best: Element | null = null;
      let bestScore = Infinity;
      onScreen.forEach((el) => {
        if (!el.isConnected) {
          onScreen.delete(el);
          return;
        }
        if ((el as HTMLButtonElement).disabled || el.closest('[data-web="off"]')) return;
        const r = el.getBoundingClientRect();
        if (r.width < 6 || r.height < 6) return;
        const dx = Math.max(r.left - lastX, 0, lastX - r.right);
        const dy = Math.max(r.top - lastY, 0, lastY - r.bottom);
        const d = Math.hypot(dx, dy);
        const limit = el === hoverEl ? cfg.releaseRadius : cfg.approachRadius;
        if (d > limit) return;
        // nearest wins; for equal distance (nested targets) the smaller one does
        const score = d * 1000 + Math.min(r.width * r.height, 9e6) / 9e6 * 500;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      });
      setHover(best);
    };

    const schedule = () => {
      const now = performance.now();
      if (now - lastSample >= cfg.sampleMs) {
        lastSample = now;
        evaluate();
      } else if (!trailing) {
        trailing = window.setTimeout(() => {
          trailing = 0;
          lastSample = performance.now();
          evaluate();
        }, cfg.sampleMs);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointerX.set(e.clientX);
      pointerY.set(e.clientY);
      lastX = e.clientX;
      lastY = e.clientY;
      schedule();
    };
    const onScroll = () => {
      if (hoverEl || lastX >= 0) schedule();
    };
    const onLeaveWindow = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        lastX = -1;
        lastY = -1;
        pointerX.set(-200);
        pointerY.set(-200);
        setHover(null);
      }
    };

    /* ---------- keyboard focus ---------- */
    const targetOf = (t: EventTarget | null) =>
      t instanceof Element ? (t.closest(WEB_TARGET_SELECTOR) as Element | null) : null;

    const onFocusIn = (e: FocusEvent) => {
      const el = targetOf(e.target);
      if (!el || el.closest('[data-web="off"]')) return;
      let keyboard = true;
      try {
        keyboard = el.matches(":focus-visible");
      } catch {
        /* older engines: treat as keyboard focus */
      }
      const isField = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
      if (!keyboard && !isField) return;
      addMode(el, "focus", null);
    };
    const onFocusOut = (e: FocusEvent) => {
      const el = targetOf(e.target);
      if (el) removeMode(el, "focus");
    };

    /* ---------- touch / pen tap ---------- */
    const tapTimers = new Map<Element, number>();
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const el = targetOf(e.target);
      if (!el || el.closest('[data-web="off"]')) return;
      addMode(el, "tap", { x: e.clientX, y: e.clientY });
      window.clearTimeout(tapTimers.get(el));
      tapTimers.set(
        el,
        window.setTimeout(() => {
          tapTimers.delete(el);
          removeMode(el, "tap");
        }, cfg.tapMs)
      );
    };

    const onVisibility = () => {
      if (document.hidden) setHover(null);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onLeaveWindow);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onLeaveWindow);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(scanTimer);
      window.clearTimeout(trailing);
      tapTimers.forEach((t) => window.clearTimeout(t));
      io.disconnect();
      mo.disconnect();
      store.forEach((i) => i.el.removeAttribute("data-web-active"));
    };
  }, [pointerX, pointerY, engageRaw]);

  const value = useMemo<WebContextValue>(
    () => ({
      reducedMotion,
      isCoarse,
      cursorActive,
      isMobile: !wide,
      pointerX,
      pointerY,
      cursorX,
      cursorY,
      engage,
      scrollY,
      tension,
      webs,
    }),
    [reducedMotion, isCoarse, cursorActive, wide, pointerX, pointerY, cursorX, cursorY, engage, scrollY, tension, webs]
  );

  return <WebContext.Provider value={value}>{children}</WebContext.Provider>;
}
