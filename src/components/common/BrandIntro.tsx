'use client';

import React, { useEffect, useState } from 'react';

interface BrandIntroProps {
  onComplete?: () => void;
}

export function BrandIntro({ onComplete }: BrandIntroProps) {
  const [stage, setStage] = useState<'intro' | 'dissolving' | 'complete'>('intro');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for user's reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    // Preload authoritative logo asset
    const img = new Image();
    img.src = '/images/uk-group-logo.png';

    if (mediaQuery.matches) {
      // Reduced motion timeline: simple gentle fade (1.4s total)
      const dissolveTimer = setTimeout(() => {
        setStage('dissolving');
      }, 950);

      const completeTimer = setTimeout(() => {
        setStage('complete');
        onComplete?.();
      }, 1400);

      return () => {
        clearTimeout(dissolveTimer);
        clearTimeout(completeTimer);
      };
    }

    // Standard cinematic timeline (~3.2s total)
    // 0.0s - 2.75s: Multi-stage logo reveal sequence
    // 2.75s - 3.25s: Dissolve/blur transition into dashboard
    // 3.25s: Complete & unmount
    const dissolveTimer = setTimeout(() => {
      setStage('dissolving');
    }, 2750);

    const completeTimer = setTimeout(() => {
      setStage('complete');
      onComplete?.();
    }, 3250);

    return () => {
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (stage === 'complete') {
    return null;
  }

  const isDissolving = stage === 'dissolving';

  return (
    <div
      aria-label="UK GROUP Brand Introduction"
      role="status"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden transition-all ease-out ${
        isDissolving
          ? 'opacity-0 scale-[1.03] blur-md pointer-events-none duration-500'
          : 'opacity-100 scale-100 blur-0 pointer-events-auto duration-0'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 45%, #0B172E 0%, #060B16 55%, #02060D 100%)',
      }}
    >
      <style>{`
        /* Reduced motion simple fade */
        .ukg-reduced-fade {
          animation: ukgSimpleFade 0.4s ease-out forwards;
        }
        @keyframes ukgSimpleFade {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Ambient Glows */
        @keyframes ukgGlowFadeCrown {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes ukgGlowFadeEmblem {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes ukgHaloFade {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .ukg-ambient-crown {
          animation: ukgGlowFadeCrown 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }
        .ukg-ambient-emblem {
          animation: ukgGlowFadeEmblem 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
        }
        .ukg-stage-halo {
          animation: ukgHaloFade 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
        }

        /* Stage 1: Crown Reveal */
        @keyframes ukgCrownReveal {
          0% {
            opacity: 0;
            transform: scale(0.93) translateY(-8px);
            filter: brightness(1.2);
          }
          70% {
            filter: brightness(1.08);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: brightness(1);
          }
        }
        .ukg-layer-crown {
          clip-path: inset(0 0 65.8% 0);
          opacity: 0;
          animation: ukgCrownReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
        }

        /* Crown Gold Sweep */
        @keyframes ukgCrownSweep {
          0% {
            opacity: 0;
            transform: translateX(-110%) skewX(-20deg);
          }
          25% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translateX(140%) skewX(-20deg);
          }
        }
        .ukg-crown-shimmer {
          animation: ukgCrownSweep 0.85s ease-out 0.75s forwards;
        }

        /* Stage 2: UKG Monogram Reveal */
        @keyframes ukgEmblemReveal {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
            filter: drop-shadow(0 0 16px rgba(37, 99, 235, 0.25));
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 0 0px transparent);
          }
        }
        .ukg-layer-emblem {
          clip-path: inset(34.2% 0 24.2% 0);
          opacity: 0;
          animation: ukgEmblemReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.95s forwards;
        }

        /* Stage 3: UK GROUP Typography Reveal */
        @keyframes ukgTypographyReveal {
          0% {
            opacity: 0;
            transform: translateY(8px);
            letter-spacing: 0.04em;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: normal;
          }
        }
        .ukg-layer-typography {
          clip-path: inset(75.8% 0 0 0);
          opacity: 0;
          animation: ukgTypographyReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.55s forwards;
        }

        /* Stage 4: Master Composite Settle & Shimmer */
        @keyframes ukgMasterShimmer {
          0% {
            opacity: 0;
            transform: translateX(-125%) skewX(-25deg);
          }
          20% {
            opacity: 0.85;
          }
          75% {
            opacity: 0.85;
          }
          100% {
            opacity: 0;
            transform: translateX(145%) skewX(-25deg);
          }
        }
        .ukg-master-shimmer {
          animation: ukgMasterShimmer 0.85s cubic-bezier(0.4, 0, 0.2, 1) 2.15s forwards;
        }

        /* Subtitle Fade */
        @keyframes ukgSubtextFade {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 0.8;
            transform: translateY(0);
          }
        }
        .ukg-subtext-fade {
          animation: ukgSubtextFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.9s forwards;
        }
      `}</style>

      {/* Ambient background glows */}
      <div
        className="ukg-ambient-crown pointer-events-none absolute w-[260px] h-[160px] opacity-0"
        style={{
          top: 'calc(50% - 100px)',
          left: '50%',
          background:
            'radial-gradient(circle, rgba(234, 179, 8, 0.16) 0%, rgba(202, 138, 4, 0.04) 55%, transparent 75%)',
          filter: 'blur(32px)',
        }}
      />
      <div
        className="ukg-ambient-emblem pointer-events-none absolute w-[340px] h-[300px] opacity-0"
        style={{
          top: '50%',
          left: '50%',
          background:
            'radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(30, 58, 138, 0.05) 55%, transparent 75%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Luminous Presentation Stage / Pedestal Halo */}
      <div
        className="ukg-stage-halo pointer-events-none absolute w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full opacity-0"
        style={{
          top: '50%',
          left: '50%',
          background:
            'radial-gradient(circle at center, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.94) 42%, rgba(241, 245, 249, 0.5) 60%, rgba(255, 255, 255, 0) 74%)',
          filter: 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.55))',
        }}
      />

      {/* Main Logo Composition Frame */}
      <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] flex items-center justify-center">
        {reducedMotion ? (
          /* Reduced Motion: Clean, static full logo fade-in */
          <img
            src="/images/uk-group-logo.png"
            alt="UK GROUP"
            className="ukg-reduced-fade w-full h-full object-contain pointer-events-none"
          />
        ) : (
          /* Cinematic Multi-Stage Reveal */
          <>
            {/* Crown Restrained Gold Shimmer Sweep */}
            <div
              className="ukg-crown-shimmer pointer-events-none absolute z-20 opacity-0"
              style={{
                top: '4%',
                left: '12%',
                width: '76%',
                height: '32%',
                background:
                  'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.7) 48%, rgba(254, 240, 138, 0.5) 52%, transparent 75%)',
              }}
            />

            {/* Layer 1: Crown */}
            <img
              src="/images/uk-group-logo.png"
              alt=""
              aria-hidden="true"
              className="ukg-layer-crown pointer-events-none absolute inset-0 w-full h-full object-contain"
            />

            {/* Layer 2: UKG Monogram Emblem */}
            <img
              src="/images/uk-group-logo.png"
              alt=""
              aria-hidden="true"
              className="ukg-layer-emblem pointer-events-none absolute inset-0 w-full h-full object-contain"
            />

            {/* Layer 3: UK GROUP Typography & Flourish */}
            <img
              src="/images/uk-group-logo.png"
              alt="UK GROUP"
              className="ukg-layer-typography pointer-events-none absolute inset-0 w-full h-full object-contain"
            />

            {/* Stage 4: Master Diagonal Shimmer */}
            <div
              className="ukg-master-shimmer pointer-events-none absolute inset-0 z-30 opacity-0"
              style={{
                background:
                  'linear-gradient(115deg, transparent 32%, rgba(255, 255, 255, 0.55) 50%, transparent 68%)',
              }}
            />
          </>
        )}
      </div>

      {/* Prestigious System Identity Subtext */}
      <div className="ukg-subtext-fade mt-6 text-center opacity-0 pointer-events-none">
        <div className="text-[11px] sm:text-xs font-semibold tracking-[0.24em] text-slate-300 uppercase font-sans">
          UK Enterprise &bull; Administration System
        </div>
        <div className="text-[10px] tracking-[0.16em] text-slate-500 uppercase mt-1">
          Project Control Center
        </div>
      </div>
    </div>
  );
}
export default BrandIntro;
