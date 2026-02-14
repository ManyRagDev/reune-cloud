import React, { useEffect, useState } from 'react';

interface Particle {
  id: string;
  left: number;
  delay: number;
  duration: number;
  color: string;
}

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6'];
    const newParticles: Particle[] = Array.from({ length: 50 }).map((_, i) => ({
      id: `particle-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      duration: 2 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setParticles(newParticles);

    // Remove particles after animation completes
    const timer = setTimeout(() => {
      setParticles([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed pointer-events-none"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            animation: `fall ${particle.duration}s linear ${particle.delay}s forwards`,
            zIndex: 9999,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`,
              animation: `spin ${particle.duration}s linear ${particle.delay}s forwards`,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
