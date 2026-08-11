import type { Config } from "tailwindcss";

/**
 * Global scale for the storefront design tokens.
 *
 * `1` renders the sizes originally approved from the reference; `0.9` renders
 * the whole system 10% smaller at every breakpoint. Every token below is
 * derived from its 100% value, so changing this one number re-scales
 * typography, spacing, control heights, banner heights and the page shell
 * together — nothing has to be re-tuned by hand.
 */
const UI_SCALE = 0.9;

/**
 * The header, nav, mega menu and drawer sit 5% larger than the page beneath
 * them — at 10% down the bar read as undersized next to its own content.
 * Chrome-only tokens (`u-*` steps, row heights, panel widths, `nav-*` type and
 * controls) derive from this; everything else stays on `UI_SCALE`.
 */
const NAV_SCALE = UI_SCALE * 1.05;

/** Scaled px → rem (root font size stays at the browser default). */
const r = (px: number, scale = UI_SCALE) => `${+((px * scale) / 16).toFixed(4)}rem`;
/** Scaled px, kept in px (for clamp intercepts). */
const p = (px: number, scale = UI_SCALE) => `${+(px * scale).toFixed(3)}px`;
/** Scaled viewport-relative coefficient. */
const v = (n: number, unit: "vw" | "vh" = "vw", scale = UI_SCALE) =>
  `${+(n * scale).toFixed(4)}${unit}`;

/**
 * A fluid step of the form `clamp(min, intercept + slope·vw, max)`.
 * Scaling every term — including the slope — shrinks the curve uniformly
 * rather than just clipping its ends.
 */
const fluid = (min: number, intercept: number, slope: number, max: number, scale = UI_SCALE) =>
  `clamp(${r(min, scale)}, ${p(intercept, scale)} + ${v(slope, "vw", scale)}, ${r(max, scale)})`;

/** A fluid step with no intercept: `clamp(min, slope·vw, max)`. */
const ramp = (min: number, slope: number, max: number, unit: "vw" | "vh" = "vw") =>
  `clamp(${r(min)}, ${v(slope, unit)}, ${r(max)})`;

/**
 * Mirror of Tailwind's numeric spacing steps for the chrome's gaps and
 * paddings: `gap-u-4` is 16px × NAV_SCALE. Used only by the header, nav, mega
 * menu and drawer — leaving raw `gap-4` / `px-3.5` behind made the bar read as
 * less scaled than the page under it.
 *
 * Values that are deliberately *not* design-scaled — hairline rules and the
 * 44px accessibility tap-target floor — keep the plain Tailwind steps.
 */
const CHROME_STEPS = Object.fromEntries(
  [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((n) => [
    `u-${n}`,
    r(n * 4, NAV_SCALE),
  ]),
);

/**
 * Named widths for chrome popovers and panels. Spread into both `spacing` and
 * `maxWidth` so `w-menu` and `max-w-drawer` both resolve — Tailwind's `width`
 * scale inherits from `spacing`, but `maxWidth` has its own.
 */
const PANEL_WIDTHS = {
  /** "All Categories" flyout. */
  menu: r(268, NAV_SCALE),
  /** Promo tile inside a mega menu. */
  mega: r(280, NAV_SCALE),
  /** Off-canvas mobile navigation. */
  drawer: r(340, NAV_SCALE),
  /** Search field at its widest. */
  search: r(544, NAV_SCALE),
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Approved homepage palette — see app/components-home/*
        navy: {
          DEFAULT: "#13293F",
          950: "#0A1727",
          900: "#0F2135",
          800: "#13293F",
          700: "#1B3A58",
          600: "#274D71",
        },
        gold: {
          DEFAULT: "#E3A33B",
          50: "#FDF8EF",
          100: "#F9EDD6",
          200: "#F3DCAF",
          300: "#EDC682",
          400: "#E7B45C",
          500: "#E3A33B",
          600: "#CB8A24",
          700: "#A46C1B",
        },
        cream: {
          DEFAULT: "#FBF4E7",
          50: "#FDFAF4",
          100: "#FBF4E7",
          200: "#F6EAD5",
          300: "#EFDCBC",
        },
        ink: "#16263B",
        line: "#EBE9E4",
        mist: "#F7F6F2",
        sky: "#E6EEF4",
      },
      fontFamily: {
        script: ["var(--font-script)", "cursive"],
      },

      screens: {
        // Separates 320px phones from 375/390px ones, where a little more room
        // lets compact controls show their icons.
        xs: "400px",
      },

      maxWidth: {
        /**
         * Page shell width — one continuous curve rather than per-breakpoint
         * steps, so dragging a window across 1536 or 1920 never pops the
         * content sideways.
         *
         *   `100%`         full-bleed (minus gutters) on laptops
         *   `461px+65.7vw` grows sub-linearly with the monitor
         *   `1840px`       hard cap so ultrawides keep readable measures
         */
        shell: `min(100%, ${p(461)} + ${v(65.7)}, ${r(1840)})`,
        ...PANEL_WIDTHS,
      },

      /**
       * Fluid type ramp at 100%: hero 30 → 64px, section 26 → 40px,
       * promo 20 → 30px, then body copy, controls and labels. Each step
       * interpolates between its mobile and large-desktop size, so there are no
       * jumps at breakpoints.
       */
      fontSize: {
        hero: [fluid(30, 25.2, 1.81, 64), { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: [fluid(26, 22.6, 0.906, 40), { lineHeight: "1.16", letterSpacing: "-0.015em" }],
        promo: [fluid(20, 16.8, 0.85, 30), { lineHeight: "1.18", letterSpacing: "-0.01em" }],
        lead: [fluid(13, 12.48, 0.16, 15), { lineHeight: "1.65" }],
        ui: [fluid(12, 11.52, 0.14, 14), { lineHeight: "1.45" }],
        micro: [fluid(11, 10.64, 0.1, 13), { lineHeight: "1.4" }],
        nano: [fluid(10, 9.76, 0.07, 12), { lineHeight: "1.35" }],

        // Same ramp at NAV_SCALE, for the header / nav / mega menu / drawer.
        "nav-lead": [fluid(13, 12.48, 0.16, 15, NAV_SCALE), { lineHeight: "1.65" }],
        "nav-ui": [fluid(12, 11.52, 0.14, 14, NAV_SCALE), { lineHeight: "1.45" }],
        "nav-micro": [fluid(11, 10.64, 0.1, 13, NAV_SCALE), { lineHeight: "1.4" }],
        "nav-nano": [fluid(10, 9.76, 0.07, 12, NAV_SCALE), { lineHeight: "1.35" }],
      },

      spacing: {
        ...PANEL_WIDTHS,
        ...CHROME_STEPS,
        /** Vertical rhythm between page sections: 48 → 120px at 100%. */
        section: ramp(48, 4.5, 120),
        /** Container side padding: 16 → 64px, tracking the 16/24/32/48/64 scale. */
        gutter: ramp(16, 3.2, 64),
        /** Gap between cards in every grid and carousel. */
        card: ramp(10, 0.9, 18),
        /** Space between a section heading block and its grid. */
        heading: ramp(16, 1.6, 28),
        /** Inner padding for the panel-style blocks (newsletter, hero copy). */
        panel: ramp(20, 2, 32),

        // Page control sizes.
        "control-xs": r(28),
        "control-sm": r(36),
        "control-md": r(44),

        // Chrome controls and rows, one step larger than the page.
        "nav-control-xs": r(28, NAV_SCALE),
        "nav-control-sm": r(36, NAV_SCALE),
        "nav-control-md": r(44, NAV_SCALE),
        bar: r(32, NAV_SCALE),
        "bar-lg": r(36, NAV_SCALE),
        row: r(56, NAV_SCALE),
        "row-sm": r(64, NAV_SCALE),
        "row-lg": r(80, NAV_SCALE),
        nav: r(44, NAV_SCALE),

        // Banner heights.
        hero: ramp(384, 62, 608, "vh"),
        promo: ramp(176, 17, 240),
        lifestyle: ramp(136, 11, 168),
      },

      boxShadow: {
        card: "0 1px 2px rgba(16, 33, 53, 0.04)",
        "card-hover": "0 10px 28px -12px rgba(16, 33, 53, 0.22)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },

      // Sweep used by the admin loading skeletons. A CSS animation rather than
      // a JS one so it keeps running when the tab is backgrounded.
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
