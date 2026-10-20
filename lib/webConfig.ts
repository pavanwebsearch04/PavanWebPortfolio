// One place to tune the whole living-web experience: cursor, interactive
// strands, the page-wide layer, scroll response and the spiders.

export const WEB_COLORS = {
  paper: "#F2EFE8",
  graphite: "#17171B",
  crimson: "#D4483B",
  crimsonText: "#EE6C5C",
} as const;

export const WEB_CONFIG = {
  cursor: {
    // spider glyph box in px (legs span ~28px, body ~20px)
    size: 34,
    // position spring: slightly over-damped, ~50ms of natural lag. The
    // spider's body centre is the hotspot, so clicks always land where the
    // real pointer is even while the glyph is still settling
    spring: { stiffness: 620, damping: 40, mass: 0.45 },
  },

  interactive: {
    // how close (px) the pointer must get to an element before its web forms
    approachRadius: 76,
    // extra distance before an already-active web is released (hysteresis)
    releaseRadius: 104,
    // pointer sampling interval for target detection
    sampleMs: 70,
    // how long a touch "tap" web stays before retracting
    tapMs: 950,
    strandWidth: 0.9,
    strandOpacity: 0.5,
    accentOpacity: 0.85,
    // seconds
    drawDuration: 0.55,
    stretchDuration: 0.16,
    retractDuration: 0.5,
    maxConcurrent: 3,
  },

  layer: {
    // base opacity per layer (multiplied by per-strand weights)
    background: 0.1,
    structural: 0.15,
    // strands further than this many viewport heights from view are skipped
    activeViewportRange: 1.4,
    strandWidth: { thin: 0.5, mid: 0.75, strong: 1 },
    // mobile simplification
    mobileBreakpoint: 768,
    mobileScale: 0.55,
  },

  scroll: {
    // spring that smooths scroll velocity into a "tension" value
    spring: { stiffness: 90, damping: 24, mass: 0.6 },
    // px/s of scroll velocity that maps to full tension
    velocityForFull: 2400,
    // max px the bridge strands are pulled (scaled per strand)
    maxStretchPx: 34,
  },

  spiders: {
    desktop: 5,
    mobile: 3,
    // never more than this many moving at once
    maxMoving: 2,
    // px of crawl speed
    speed: { min: 16, max: 30 },
    // seconds
    pause: { min: 1.6, max: 5.2 },
    // chance a pause at a junction becomes a silk descent
    descentChance: 0.22,
    descentLength: { min: 46, max: 110 },
    // seconds spent hidden between sightings
    hidden: { min: 9, max: 26 },
    // moves before a spider retreats behind a boundary
    movesBeforeHide: { min: 4, max: 8 },
    // overall scale of the spider glyph
    scale: { min: 0.75, max: 1.05 },
  },
} as const;

export const WEB_EASE = [0.16, 1, 0.3, 1] as const;

// Selector for everything that should grow a web when approached or focused.
// Anything can opt in with data-web, or opt out with data-web="off".
export const WEB_TARGET_SELECTOR =
  'a[href], button, input:not([type="hidden"]), textarea, select, summary, [role="button"], [data-web]:not([data-web="off"])';
