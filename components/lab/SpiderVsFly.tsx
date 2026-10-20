"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Mark = "S" | "F" | null; // S = spider (you), F = fly (computer)
type Difficulty = "easy" | "normal" | "hard";
type Outcome = { winner: "S" | "F" | "draw"; line: number[] | null };
type Tally = { win: number; draw: number; loss: number };

const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];
const LABEL: Record<Difficulty, string> = { easy: "EASY", normal: "NORMAL", hard: "HARD" };
const STORE_KEY = "lab-spider-vs-fly-tally";
const EMPTY: Tally = { win: 0, draw: 0, loss: 0 };

function evaluate(b: Mark[]): Outcome | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a] as "S" | "F", line };
  }
  return b.every(Boolean) ? { winner: "draw", line: null } : null;
}

const emptyCells = (b: Mark[]) => b.map((m, i) => (m ? -1 : i)).filter((i) => i >= 0);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

// a cell that completes three in a row for `who`, if any
function findWin(b: Mark[], who: "S" | "F"): number | null {
  for (const cell of emptyCells(b)) {
    const next = b.slice();
    next[cell] = who;
    if (evaluate(next)?.winner === who) return cell;
  }
  return null;
}

// full game-tree search: the fly's score for a position (+1 fly wins, -1 spider wins)
function minimax(b: Mark[], flyTurn: boolean, depth: number): number {
  const res = evaluate(b);
  if (res) return res.winner === "F" ? 10 - depth : res.winner === "S" ? depth - 10 : 0;
  const scores = emptyCells(b).map((cell) => {
    const next = b.slice();
    next[cell] = flyTurn ? "F" : "S";
    return minimax(next, !flyTurn, depth + 1);
  });
  return flyTurn ? Math.max(...scores) : Math.min(...scores);
}

function bestMoves(b: Mark[]): number[] {
  const scored = emptyCells(b).map((cell) => {
    const next = b.slice();
    next[cell] = "F";
    return { cell, score: minimax(next, false, 1) };
  });
  const top = Math.max(...scored.map((s) => s.score));
  return scored.filter((s) => s.score === top).map((s) => s.cell);
}

function flyMove(b: Mark[], level: Difficulty): number {
  const free = emptyCells(b);
  if (level === "hard") return pick(bestMoves(b));
  if (level === "easy") {
    // mostly random, only sometimes sensible
    if (Math.random() < 0.65) return pick(free);
  }
  const win = findWin(b, "F");
  if (win !== null) return win;
  const block = findWin(b, "S");
  if (block !== null) return block;
  if (b[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((c) => b[c] === null);
  return corners.length ? pick(corners) : pick(free);
}

function SpiderGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="-24 -24 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {[-1, 1].map((s) =>
        [0, 1, 2, 3].map((k) => (
          <path key={`${s}${k}`} d={`M${s * 4} ${-5 + k * 4} L${s * (13 + k)} ${-13 + k * 8} L${s * 21} ${-17 + k * 12}`} />
        ))
      )}
      <ellipse cx="0" cy="6" rx="8" ry="10" fill="#19191e" />
      <circle cx="0" cy="-7" r="5" fill="#19191e" />
      <circle cx="0" cy="7" r="2.6" fill="#d4483b" stroke="none" />
    </svg>
  );
}

function FlyGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="-24 -24 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <ellipse cx="-11" cy="-5" rx="11" ry="6" transform="rotate(-25 -11 -5)" fill="currentColor" fillOpacity="0.18" />
      <ellipse cx="11" cy="-5" rx="11" ry="6" transform="rotate(25 11 -5)" fill="currentColor" fillOpacity="0.18" />
      <ellipse cx="0" cy="3" rx="5" ry="11" fill="currentColor" fillOpacity="0.9" />
      <circle cx="0" cy="-10" r="4" fill="currentColor" />
    </svg>
  );
}

const center = (cell: number) => ({ x: ((cell % 3) + 0.5) * 100, y: (Math.floor(cell / 3) + 0.5) * 100 });

// Tic-tac-toe against the computer. You are the spider and always move
// first; the fly answers. Nothing here needs explaining: tap a square.
export default function SpiderVsFly() {
  const reduced = useReducedMotion();
  const [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [level, setLevel] = useState<Difficulty>("normal");
  const [turn, setTurn] = useState<"you" | "fly">("you");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [tally, setTally] = useState<Record<Difficulty, Tally>>({ easy: EMPTY, normal: EMPTY, hard: EMPTY });
  const [announce, setAnnounce] = useState("");
  const timer = useRef<number | null>(null);
  const againRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setTally({
          easy: { ...EMPTY, ...parsed.easy },
          normal: { ...EMPTY, ...parsed.normal },
          hard: { ...EMPTY, ...parsed.hard },
        });
      }
    } catch {
      /* no saved tally: start from zero */
    }
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const record = useCallback((lvl: Difficulty, kind: keyof Tally) => {
    setTally((prev) => {
      const next = { ...prev, [lvl]: { ...prev[lvl], [kind]: prev[lvl][kind] + 1 } };
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: the tally just isn't remembered */
      }
      return next;
    });
  }, []);

  const finish = useCallback(
    (res: Outcome, lvl: Difficulty) => {
      setOutcome(res);
      setTurn("you");
      if (res.winner === "S") {
        record(lvl, "win");
        setAnnounce("You win! Three spiders in a row.");
      } else if (res.winner === "F") {
        record(lvl, "loss");
        setAnnounce("The fly wins this one.");
      } else {
        record(lvl, "draw");
        setAnnounce("It's a draw.");
      }
    },
    [record]
  );

  useEffect(() => {
    if (outcome) againRef.current?.focus({ preventScroll: true });
  }, [outcome]);

  const play = (cell: number) => {
    if (outcome || turn !== "you" || board[cell]) return;
    const next = board.slice();
    next[cell] = "S";
    setBoard(next);
    const res = evaluate(next);
    if (res) {
      finish(res, level);
      return;
    }
    setTurn("fly");
    setAnnounce(`Spider placed. The fly is thinking.`);
    timer.current = window.setTimeout(
      () => {
        const move = flyMove(next, level);
        const after = next.slice();
        after[move] = "F";
        setBoard(after);
        const r = evaluate(after);
        if (r) finish(r, level);
        else {
          setTurn("you");
          setAnnounce("Fly moved. Your turn.");
        }
      },
      reduced ? 150 : 550
    );
  };

  const newGame = (lvl: Difficulty = level) => {
    if (timer.current) window.clearTimeout(timer.current);
    setBoard(Array(9).fill(null));
    setOutcome(null);
    setTurn("you");
    setLevel(lvl);
    setAnnounce("New game. Your turn.");
  };

  const resetScore = () => {
    const cleared = { easy: EMPTY, normal: EMPTY, hard: EMPTY };
    setTally(cleared);
    try {
      window.localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    setAnnounce("Score reset.");
  };

  const t = tally[level];
  const started = board.some(Boolean);
  const status = outcome
    ? outcome.winner === "S"
      ? "You win! Three spiders in a row."
      : outcome.winner === "F"
        ? "The fly wins this one."
        : "It's a draw."
    : turn === "fly"
      ? "The fly is thinking…"
      : started
        ? "Your turn. Tap an empty square."
        : "You are the spider. Tap any square to start.";
  const primary = "border-crimson-bright/60 bg-crimson/25 hover:!bg-crimson/40";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="group" aria-label="Difficulty" className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-label tracking-[0.12em] text-paper-muted">DIFFICULTY</span>
          <div className="flex">
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" className="lab-btn" aria-pressed={level === d} onClick={() => newGame(d)}>
                {LABEL[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* score */}
      <dl className="grid grid-cols-3 gap-px border border-paper/15 bg-paper/10">
        {[
          { label: "YOU", value: t.win },
          { label: "DRAWS", value: t.draw },
          { label: "FLY", value: t.loss },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-3 bg-ink-graphite px-3 py-2.5">
            <dt className="font-mono text-label tracking-[0.12em] text-paper-muted">{s.label}</dt>
            <dd className="font-mono text-nav text-paper">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* who is who + board */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 font-mono text-label tracking-[0.12em] text-paper-body">
          <span className="flex items-center gap-2">
            <SpiderGlyph className="h-7 w-7 text-paper" /> YOU
          </span>
          <span className="flex items-center gap-2">
            <FlyGlyph className="h-7 w-7 text-crimson-text" /> COMPUTER
          </span>
        </div>

        <div className="relative w-full max-w-[400px] border border-paper/20 bg-ink">
          <svg viewBox="0 0 300 300" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" fill="none" strokeLinecap="round">
            <g stroke="#f2efe8" strokeOpacity="0.4" strokeWidth="1.5">
              <path d="M100 10 Q 104 150 100 290" />
              <path d="M200 10 Q 196 150 200 290" />
              <path d="M10 100 Q 150 104 290 100" />
              <path d="M10 200 Q 150 196 290 200" />
            </g>
            {outcome?.line && (
              <line
                x1={center(outcome.line[0]).x}
                y1={center(outcome.line[0]).y}
                x2={center(outcome.line[2]).x}
                y2={center(outcome.line[2]).y}
                stroke="#ee6c5c"
                strokeWidth="5"
              />
            )}
          </svg>
          <div className="relative grid grid-cols-3">
            {board.map((m, i) => {
              const row = Math.floor(i / 3) + 1;
              const col = (i % 3) + 1;
              const canPlay = !m && !outcome && turn === "you";
              return (
                <button
                  key={i}
                  type="button"
                  aria-disabled={!canPlay}
                  aria-label={`Row ${row}, column ${col}, ${m === "S" ? "spider" : m === "F" ? "fly" : "empty"}`}
                  onClick={() => play(i)}
                  className={`group flex aspect-square items-center justify-center p-3 transition-colors md:p-4 ${
                    canPlay ? "cursor-pointer hover:bg-paper/[0.06]" : "cursor-default"
                  }`}
                >
                  {m === "S" && <SpiderGlyph className="h-full w-full text-paper" />}
                  {m === "F" && <FlyGlyph className="h-full w-full text-crimson-text" />}
                  {!m && canPlay && (
                    <SpiderGlyph className="h-full w-full text-paper opacity-0 transition-opacity group-hover:opacity-25 group-focus-visible:opacity-25" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p role="status" aria-live="polite" className="font-display text-card font-medium text-paper">
          {status}
        </p>

        {outcome && (
          <button ref={againRef} type="button" className={`lab-btn ${primary}`} onClick={() => newGame()}>
            PLAY AGAIN
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="lab-btn" disabled={!started && !outcome} onClick={() => newGame()}>
          NEW GAME
        </button>
        <button type="button" className="lab-btn" disabled={t.win + t.draw + t.loss === 0} onClick={resetScore}>
          RESET SCORE
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
