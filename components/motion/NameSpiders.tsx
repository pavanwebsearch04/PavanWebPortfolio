"use client";

// PAVAN VASITA for the route-change curtain, in the site's red-and-black
// horror-web style: huge bold letters filled with a blood-red gradient and
// outlined in black, a glow behind them, cobweb strands drawn across them,
// slow red drips, and spiders that drop in on threads and crawl over the
// letters. Everything is a CSS animation (compositor-driven), so it keeps
// running smoothly while the browser renders the next page. Remount it
// (change `key`) to replay. Decorative: the page's own heading carries the
// real text.
const NAME = "PAVAN VASITA".split("");

function Spider({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.08} viewBox="0 0 24 26" fill="none" className="block overflow-visible">
      <g stroke="#EDEAE3" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11 L3 7 L1 10 M9 13 L2 13 L1 17 M9 15 L3 19 L3 24 M10 17 L7 22 L8 25" />
        <path d="M15 11 L21 7 L23 10 M15 13 L22 13 L23 17 M15 15 L21 19 L21 24 M14 17 L17 22 L16 25" />
      </g>
      <ellipse cx="12" cy="16" rx="4.2" ry="5.2" fill="#D4483B" />
      <ellipse cx="12" cy="10.2" rx="3" ry="3" fill="#A73A2F" />
      <circle cx="10.8" cy="9.6" r="0.7" fill="#EDEAE3" />
      <circle cx="13.2" cy="9.6" r="0.7" fill="#EDEAE3" />
    </svg>
  );
}

// a spider lowering itself on a thread that runs up past the top of the screen
function Hanging({ left, drop, delay, size }: { left: string; drop: string; delay: number; size: number }) {
  return (
    <div
      className="ns-drop absolute bottom-[62%] flex flex-col items-center"
      style={{ left, animationDelay: `${delay}s`, ["--drop" as string]: drop }}
    >
      <span className="block h-[70vh] w-px bg-gradient-to-b from-transparent to-paper/60" />
      <span className="spider-sway block origin-top">
        <Spider size={size} />
      </span>
    </div>
  );
}

// thin strands sagging across the letters, plus a cobweb fan in each top corner
const STRANDS = [
  "M0 38 Q250 108 500 58 T1000 52",
  "M0 118 Q300 62 560 104 T1000 86",
  "M0 6 L240 92 M0 6 L120 120 M0 6 L360 40",
  "M1000 6 L760 92 M1000 6 L880 120 M1000 6 L640 40",
  "M0 6 Q70 40 40 96 M0 6 Q120 22 150 70",
  "M1000 6 Q930 40 960 96 M1000 6 Q880 22 850 70",
  "M120 0 Q180 70 130 130 M880 0 Q820 70 870 130",
];

// slow red drips under some letters: [left %, length px, delay s]
const DRIPS: Array<[number, number, number]> = [
  [9, 46, 1.0],
  [24, 74, 1.25],
  [41, 38, 1.1],
  [58, 62, 1.4],
  [73, 44, 1.15],
  [90, 70, 1.3],
];

export default function NameSpiders() {
  return (
    <div className="relative flex flex-col items-center">
      {/* red glow behind the name */}
      <span
        aria-hidden
        className="ns-glow pointer-events-none absolute -inset-x-[8%] -inset-y-[60%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(212,72,59,0.42),rgba(125,31,23,0.18)_55%,transparent_75%)] blur-2xl"
      />

      <h2 className="ns-name relative flex font-display text-[clamp(2.4rem,10.5vw,8.6rem)] font-bold uppercase leading-none tracking-[0.06em]">
        <span className="sr-only">Pavan Vasita</span>
        {NAME.map((ch, i) => (
          <span key={i} aria-hidden className="inline-block overflow-hidden px-[0.01em] pb-[0.14em]">
            <span className="ns-letter ns-scary inline-block" style={{ animationDelay: `${0.12 + i * 0.05}s` }}>
              {ch === " " ? " " : ch}
            </span>
          </span>
        ))}
      </h2>

      {/* cobweb strands across the name */}
      <svg
        aria-hidden
        viewBox="0 0 1000 130"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-x-[3%] -top-[8%] h-[118%] w-[106%] overflow-visible"
      >
        <g fill="none" stroke="#EDEAE3" strokeOpacity="0.5" strokeWidth="1.1" strokeLinecap="round">
          {STRANDS.map((d, i) => (
            <path key={d} d={d} pathLength={1} className="ns-strand" style={{ animationDelay: `${0.45 + i * 0.07}s` }} />
          ))}
        </g>
      </svg>

      {/* drips */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[70%] h-0">
        {DRIPS.map(([left, len, delay]) => (
          <span
            key={left}
            className="ns-drip absolute top-0 block w-[4px] origin-top rounded-b-full bg-gradient-to-b from-[#a73a2f] to-[#d4483b]"
            style={{ left: `${left}%`, height: len, animationDelay: `${delay}s` }}
          />
        ))}
      </div>

      <Hanging left="17%" drop="0vh" delay={0.3} size={40} />
      <Hanging left="68%" drop="5vh" delay={0.55} size={32} />

      {/* one more walks along the tops of the letters */}
      <div aria-hidden className="ns-crawl absolute -top-5 left-0" style={{ animationDelay: "0.7s" }}>
        <span className="spider-scuttle block" style={{ transform: "rotate(90deg)" }}>
          <Spider size={30} />
        </span>
      </div>
    </div>
  );
}
