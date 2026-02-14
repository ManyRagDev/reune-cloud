/* ── Neubrutalism Design System ───────────────── */

/** Light mode palette */
export const NBLight = {
    yellow: "#FFD93D",
    orange: "#FF6B35",
    pink: "#FF69B4",
    white: "#FFFDF7",
    black: "#1A1A1A",
    cream: "#FFF8E1",
    mint: "#B8F3D0",
    sky: "#A8D8FF",
    lavender: "#D4BBFF",
    red: "#FF4444",
    green: "#22CC88",
    /* Semantic tokens */
    bg: "#FFFDF7",
    sectionBg: "#FFF8E1",
    cardBg: "#FFFDF7",
    inputBg: "#FFFFFF",
    text: "#1A1A1A",
    textMuted: "#1A1A1A",
    border: "#1A1A1A",
} as const;

/** Dark mode palette — calculated for readability */
export const NBDark = {
    yellow: "#FFD93D",       // kept — great contrast on dark
    orange: "#FF8C5A",       // +lightened for readability
    pink: "#FF7EC3",         // +lightened slightly
    white: "#F5F0E8",        // warm off-white for text
    black: "#1A1A1A",        // borders/shadows stay black
    cream: "#2A2520",        // dark warm section bg
    mint: "#3D7A56",         // desaturated/dark mint
    sky: "#3A6B8A",          // desaturated/dark sky
    lavender: "#5A4D80",     // desaturated/dark lavender
    red: "#CC3333",          // darker/desaturated red
    green: "#1A8855",        // darker/desaturated green
    /* Semantic tokens */
    bg: "#1E1B18",           // main page background
    sectionBg: "#2A2520",    // section backgrounds
    cardBg: "#302C27",       // card backgrounds
    inputBg: "#25211D",      // dark input background
    text: "#F5F0E8",         // primary text
    textMuted: "#C8C0B4",    // muted/secondary text
    border: "#1A1A1A",       // unchanged
} as const;

export type NBPalette = Record<keyof typeof NBLight, string>;

/* ── Reusable style tokens ────────────────────── */
export const nb = {
    border: "border-[3px] border-[#1A1A1A]",
    shadow: "shadow-[4px_4px_0px_#1A1A1A]",
    shadowLg: "shadow-[6px_6px_0px_#1A1A1A]",
    shadowXl: "shadow-[8px_8px_0px_#1A1A1A]",
    hover:
        "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150",
    input: "border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150 outline-none",
    button: "border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150 font-bold",
};
