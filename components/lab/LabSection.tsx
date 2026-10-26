"use client";

import { motion } from "framer-motion";
import { PrimaryHeading, SectionCta } from "@/components/ui/PageContext";
import LabCard, { InfoList, InfoSteps, InfoTerms } from "./LabCard";
import SpiderVsFly from "./SpiderVsFly";
import SpiderSnake from "./SpiderSnake";
import FlyCatcher from "./FlyCatcher";

const CATEGORIES = ["Strategy Game", "Reflex Game", "Classic Game"];
const EASE = [0.16, 1, 0.3, 1] as const;

// Intro + experiments. The homepage shows only the featured one (the
// first experiment); the dedicated /lab page passes `full` to show all three.
export default function LabSection({ full = false }: { full?: boolean }) {
  return (
    <section id="lab" className="surface surface-ink relative w-full overflow-x-clip px-6 py-24 md:px-14 md:py-32 lg:px-20">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-14 flex flex-col gap-6 md:mb-20">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-crimson-bright" />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-mono text-label tracking-[0.14em] text-paper-muted"
            >
              06 / EXPERIMENTS
            </motion.p>
          </div>

          <PrimaryHeading className="font-display text-section font-medium text-paper">
            {["WHERE CURIOSITY", "MEETS CODE."].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.85, delay: i * 0.1, ease: EASE }}
              >
                {line}
              </motion.span>
            ))}
          </PrimaryHeading>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex max-w-2xl flex-col gap-4"
          >
            <p className="text-body text-paper-body">
              The Lab is where I try ideas that don&rsquo;t belong in a client brief: interface concepts, small
              interaction prototypes and animation studies built with the same tools as this site.
            </p>
            <p className="text-support text-paper-muted">
              Everything below is an experiment I built for this portfolio. These are not client projects or
              published products, and each demo works right here on the page.
            </p>
          </motion.div>

          <ul className="flex flex-wrap gap-3 pt-2" aria-label="Experiment categories">
            {CATEGORIES.map((c) => (
              <li key={c} className="border border-paper/25 px-3 py-1.5 font-mono text-label tracking-[0.1em] text-paper-body">
                {c.toUpperCase()}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-10 md:gap-14">
          <LabCard
            index="01"
            category="Strategy game"
            title="Spider vs Fly"
            description="Tic-tac-toe against the computer. You are the spider and move first; the fly answers."
            quickStart="Tap any square to place your spider. Three in a row wins."
            info={[
              {
                id: "how",
                label: "How to Play",
                content: (
                  <InfoSteps
                    steps={[
                      "You are the spider and always move first: tap any empty square.",
                      "The fly (the computer) replies on its own turn.",
                      "Get three spiders in a row, across, down or diagonally, to win.",
                      "If the board fills with no three in a row, it is a draw.",
                      "Press PLAY AGAIN or NEW GAME for another round. Changing the difficulty starts a new game.",
                    ]}
                  />
                ),
              },
              {
                id: "levels",
                label: "Game Details",
                content: (
                  <div className="flex flex-col gap-3">
                    <InfoTerms
                      terms={[
                        { term: "Easy", meaning: "The fly plays at random most of the time, so it is beatable." },
                        { term: "Normal", meaning: "The fly always takes a win or blocks yours, otherwise prefers the centre and corners." },
                        { term: "Hard", meaning: "The fly checks every possible game and plays the best move. It never loses." },
                      ]}
                    />
                    <p>Your wins, draws and losses are counted separately for each difficulty and saved in your browser only.</p>
                  </div>
                ),
              },
              {
                id: "learn",
                label: "What You'll Learn",
                content: (
                  <div className="flex flex-col gap-3">
                    <p>
                      A familiar game with a computer opponent. It shows how a program can choose moves, from random
                      guesses on Easy to planning every possible outcome on Hard.
                    </p>
                    <p>
                      On Hard, the computer tries every way the game could continue and picks the move with the best
                      worst-case result. That is why it can&rsquo;t be beaten, and a draw against it is a good result.
                    </p>
                  </div>
                ),
              },
              {
                id: "tips",
                label: "Tips & Tricks",
                content: (
                  <InfoList
                    items={[
                      "Taking the centre or a corner first gives you the most ways to win.",
                      "Always check whether the fly has two in a row, and block the third square.",
                      "On Hard, aim for a draw: that is the best anyone can do against it.",
                    ]}
                  />
                ),
              },
              {
                id: "terms",
                label: "Key Terms",
                content: (
                  <InfoTerms
                    terms={[
                      { term: "Minimax", meaning: "A method where the computer assumes you play your best and chooses the move that gives it the best outcome anyway." },
                      { term: "Game tree", meaning: "Every possible way a game can continue, drawn as branches from the current board." },
                      { term: "Draw", meaning: "A finished game where nobody has three in a row." },
                    ]}
                  />
                ),
              },
              {
                id: "hood",
                label: "Under the Hood",
                content: (
                  <p>
                    The computer&rsquo;s moves are chosen in the browser. Easy mixes random moves with simple win-or-block
                    checks, Normal always takes a win or a block, and Hard runs a full minimax search of the game tree
                    (small enough for tic-tac-toe to check every game). Your win, draw and loss counts for each
                    difficulty are kept only in your browser&rsquo;s localStorage.
                  </p>
                ),
              },
            ]}
          >
            <SpiderVsFly />
          </LabCard>

          {full && (
            <LabCard
              index="02"
              category="Mini game"
              title="Fly Catcher"
              description="A 30-second reaction game: tap the flies to catch them in silk, leave the moths alone, and chain catches for a combo."
              quickStart="Press START ROUND, then tap or click the flies. Avoid the moths with a dashed red ring."
              info={[
                {
                  id: "how",
                  label: "How to Play",
                  content: (
                    <div className="flex flex-col gap-3">
                      <InfoSteps
                        steps={[
                          "Pick a difficulty, or switch on CALM MODE to play without a timer.",
                          "Press START ROUND. You have 30 seconds (no limit in calm mode).",
                          "Tap or click a fly to shoot silk at it. Leave the moths (dashed red ring) alone.",
                          "Catch flies three in a row to raise your multiplier, up to ×4. A miss resets it.",
                        ]}
                      />
                      <p>
                        On a keyboard, use the arrow keys to aim (hold Shift for bigger steps), Enter or Space to shoot,
                        and P to pause.
                      </p>
                    </div>
                  ),
                },
                {
                  id: "details",
                  label: "Game Details",
                  content: (
                    <InfoList
                      items={[
                        "Each fly is worth 10 points, multiplied by your combo (×1 to ×4).",
                        "A moth costs 15 points (never below zero) and resets your combo. A miss also resets it.",
                        "Difficulty changes how fast insects fly, how many appear and how often a moth shows up.",
                        "Calm mode removes the timer and the moth penalty, slows everything down, and does not record a best score.",
                        "Your best score is saved separately for each difficulty, in your browser only.",
                      ]}
                    />
                  ),
                },
                {
                  id: "tips",
                  label: "Tips & Tricks",
                  content: (
                    <InfoList
                      items={[
                        "Keep your combo going: three catches in a row raises each fly's value.",
                        "Tap only when you are sure of a fly: a miss resets your combo, and a moth costs points as well.",
                        "On a touch screen the hit area is larger, so you do not need to be precise.",
                        "Try calm mode to learn how the insects move before racing the clock.",
                      ]}
                    />
                  ),
                },
                {
                  id: "learn",
                  label: "What You'll Learn",
                  content: (
                    <div className="flex flex-col gap-3">
                      <p>
                        A quick test of spotting and reacting. It also shows what every real-time screen does behind the
                        scenes: read your input, update what moves, and redraw, many times a second.
                      </p>
                      <p>
                        Speed, spawn rate and scoring are just numbers the loop uses, which is why difficulty can be tuned
                        so easily.
                      </p>
                    </div>
                  ),
                },
                {
                  id: "terms",
                  label: "Key Terms",
                  content: (
                    <InfoTerms
                      terms={[
                        { term: "Frame", meaning: "One redraw of the screen; the game draws dozens of them every second." },
                        { term: "Combo", meaning: "Consecutive catches without a miss or a moth, which raise your multiplier." },
                        { term: "Hit area", meaning: "The invisible circle around each insect that counts as a hit; larger on touch screens." },
                      ]}
                    />
                  ),
                },
                {
                  id: "hood",
                  label: "Under the Hood",
                  content: (
                    <p>
                      Drawn on an HTML canvas and updated with requestAnimationFrame, using elapsed time so speed does not
                      depend on frame rate. The game pauses when it scrolls out of view. Best scores are kept only in your
                      browser (localStorage) and are never sent anywhere. With reduced motion enabled it starts in calm
                      mode, with slower insects and no wing flutter or pop-up drift.
                    </p>
                  ),
                },
              ]}
            >
              <FlyCatcher />
            </LabCard>
          )}

          {full && (
            <LabCard
              index="03"
              category="Classic game"
              title="Spider Snake"
              description="Steer the spider to catch flies. Every catch makes your silk trail longer."
              quickStart="Press START, then press an arrow (or tap an arrow button) to set off."
              info={[
                {
                  id: "how",
                  label: "How to Play",
                  content: (
                    <div className="flex flex-col gap-3">
                      <InfoSteps
                        steps={[
                          "Press START. The spider waits in the middle until you press your first arrow.",
                          "Steer onto the fly. Each catch scores 10 and makes your silk trail longer.",
                          "Avoid the walls and your own silk: touching either ends the round.",
                          "Pause any time with the PAUSE button or the P key.",
                        ]}
                      />
                      <p>
                        Controls: the arrow keys or W A S D, the on-screen arrow buttons, or a swipe on the board. The
                        spider cannot turn straight back into itself.
                      </p>
                    </div>
                  ),
                },
                {
                  id: "details",
                  label: "Game Details",
                  content: (
                    <InfoList
                      items={[
                        "Speed: Easy 5, Normal 8 and Hard 12 squares per second, rising slightly every 5 flies (up to 4 faster).",
                        "A round ends when the spider touches a wall or its own silk, or fills the whole board.",
                        "Your best score is saved for each speed, in your browser only.",
                        "The board is larger on wide screens (22×22) than on phones (16×16).",
                      ]}
                    />
                  ),
                },
                {
                  id: "tips",
                  label: "Tips & Tricks",
                  content: (
                    <InfoList
                      items={[
                        "Plan a turn or two ahead: a long trail leaves less room to turn.",
                        "Stay away from the walls until the board is empty enough to loop back.",
                        "You can press two directions quickly; they are lined up so a fast turn is not lost.",
                        "Start on Easy to get a feel for the speed.",
                      ]}
                    />
                  ),
                },
                {
                  id: "learn",
                  label: "What You'll Learn",
                  content: (
                    <div className="flex flex-col gap-3">
                      <p>
                        A classic arcade game with a spider. It also shows what every game does behind the scenes: take
                        your input, move things one step, check for a crash, and redraw, over and over.
                      </p>
                      <p>
                        A game is a loop with a fixed beat: every step it moves the head, checks for a crash, checks for
                        food, then redraws. Making the beat faster is all that &lsquo;harder&rsquo; means.
                      </p>
                    </div>
                  ),
                },
                {
                  id: "terms",
                  label: "Key Terms",
                  content: (
                    <InfoTerms
                      terms={[
                        { term: "Step", meaning: "One beat of the game, when the spider moves one square." },
                        { term: "Collision", meaning: "When the spider touches a wall or its own silk, which ends the round." },
                        { term: "Input queue", meaning: "Quick key presses are lined up so fast turns are not lost." },
                      ]}
                    />
                  ),
                },
                {
                  id: "hood",
                  label: "Under the Hood",
                  content: (
                    <p>
                      A canvas game that advances on a fixed step and draws between steps for smooth motion. The spider
                      cannot reverse into itself, and up to two turns are queued. Arrow keys steer instead of scrolling the
                      page while a round runs. The game pauses when it scrolls out of view. Best scores are kept only in
                      your browser&rsquo;s localStorage.
                    </p>
                  ),
                },
              ]}
            >
              <SpiderSnake />
            </LabCard>
          )}
        </div>

        <SectionCta href="/lab" label="OPEN THE LAB" />
      </div>
    </section>
  );
}
