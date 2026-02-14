import { motion } from "framer-motion";
import { nb } from "@/lib/neobrutalism";

interface MarqueeStripProps {
    texts: string[];
    bg: string;
    textColor?: string;
    speed?: number;
}

export function MarqueeStrip({
    texts,
    bg,
    textColor,
    speed = 20,
}: MarqueeStripProps) {
    const content = texts.join(" ★ ");
    return (
        <div
            className={`overflow-hidden py-3 ${nb.border} border-x-0`}
            style={{ backgroundColor: bg }}
        >
            <div className="relative flex">
                <motion.div
                    className="flex whitespace-nowrap gap-0 text-sm md:text-base font-black uppercase tracking-wider"
                    style={{ color: textColor || "#1A1A1A" }}
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        x: { repeat: Infinity, repeatType: "loop", duration: speed, ease: "linear" },
                    }}
                >
                    {[...Array(2)].map((_, i) => (
                        <span key={i} className="flex-shrink-0 px-4">
                            {content} ★ {content} ★{" "}
                        </span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
