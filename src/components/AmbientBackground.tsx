"use client";

import { motion, useReducedMotion } from "framer-motion";

const particles = Array.from({ length: 48 }, (_, index) => ({
  id: index,
  left: (index * 37 + 11) % 100,
  top: (index * 53 + 7) % 100,
  size: 1 + ((index * 7) % 3),
  opacity: 0.18 + ((index * 13) % 35) / 100,
  duration: 4 + ((index * 11) % 7),
  delay: ((index * 17) % 50) / 10,
}));

export default function AmbientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070914]"
    >
      {/* Grundgradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.09),transparent_38%),radial-gradient(circle_at_80%_50%,rgba(37,99,235,0.07),transparent_32%),radial-gradient(circle_at_20%_85%,rgba(168,85,247,0.06),transparent_35%)]" />

      {/* Diskret rutnät */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "linear-gradient(to bottom, black, transparent 85%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black, transparent 85%)",
        }}
      />

      {/* Svävande lila glow */}
      <motion.div
        className="absolute -left-48 top-[8%] h-[520px] w-[520px] rounded-full bg-purple-600/10 blur-[130px]"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 90, 20, 0],
                y: [0, 70, 140, 0],
                scale: [1, 1.12, 0.96, 1],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Svävande blå glow */}
      <motion.div
        className="absolute -right-52 top-[30%] h-[580px] w-[580px] rounded-full bg-blue-600/10 blur-[145px]"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -90, -30, 0],
                y: [0, 120, -40, 0],
                scale: [1, 0.94, 1.1, 1],
              }
        }
        transition={{
          duration: 27,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Nedre glow */}
      <motion.div
        className="absolute bottom-[-280px] left-1/2 h-[620px] w-[820px] -translate-x-1/2 rounded-full bg-fuchsia-600/[0.07] blur-[160px]"
        animate={
          reduceMotion
            ? undefined
            : {
                x: ["-50%", "-43%", "-56%", "-50%"],
                scale: [1, 1.08, 0.97, 1],
              }
        }
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Stjärnor */}
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [
                    particle.opacity,
                    Math.min(particle.opacity + 0.45, 0.9),
                    particle.opacity,
                  ],
                  scale: [1, 1.7, 1],
                }
          }
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Mörk vinjettering */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,5,15,0.55)_100%)]" />
    </div>
  );
}