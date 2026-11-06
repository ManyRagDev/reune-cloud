import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'square' | 'circle' | 'ribbon';
}

const COLORS = [
  '#FFD93D', // Yellow
  '#FF6B35', // Orange
  '#FF69B4', // Pink
  '#25D366', // Green
  '#00F0FF', // Cyan
  '#B8F3D0', // Mint
  '#FF4757', // Red
  '#2ED573', // Emerald
];

interface CelebrationConfettiProps {
  active?: boolean;
  durationMs?: number;
  particleCount?: number;
}

export const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({
  active = true,
  durationMs = 3500,
  particleCount = 50,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    // Gerar partículas aleatórias simulando explosão a partir do centro
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5);
      const distance = 120 + Math.random() * 260;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - 80; // Levanta um pouco antes de cair

      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        targetX,
        targetY,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 8 + Math.floor(Math.random() * 8),
        rotation: Math.random() * 720 - 360,
        shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'ribbon' : 'square',
      });
    }

    setParticles(newParticles);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [active, durationMs, particleCount]);

  if (!visible || particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: 0,
              y: 0,
              scale: 0.2,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              x: p.targetX,
              y: [p.targetY, p.targetY + 300], // Sobe e depois cai pela gravidade
              scale: [0.2, 1.2, 0.9],
              rotate: p.rotation,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 2.2 + Math.random() * 0.8,
              ease: [0.25, 1, 0.5, 1],
            }}
            style={{
              position: 'absolute',
              width: p.shape === 'ribbon' ? p.size * 2 : p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'ribbon' ? '4px' : '2px',
              border: '1.5px solid #000000',
              boxShadow: '1px 1px 0px #000000',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
