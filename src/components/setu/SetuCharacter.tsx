'use client';

import React from 'react';
import Image from 'next/image';
import styles from './setu.module.css';
import { type SetuState, stateToClassName } from './setu-animation';

interface SetuCharacterProps {
  state: SetuState;
  onClick: () => void;
}

/**
 * Renders the Setu character image with state-driven CSS animations.
 *
 * Animation approach (honest assessment):
 * - The master image (setu-character.png) is a single static 3D render.
 * - True articulated walking (alternating legs) is NOT possible from a
 *   single image — the mekhela chador covers the legs entirely.
 * - The character's hands ARE already clasped together in the source
 *   image, so a forward bow via CSS transform creates a convincing
 *   Namaskar gesture (bow + existing clasped hands = recognisable 🙏).
 * - Entrance uses a progressive reveal from the right edge with subtle
 *   vertical bobbing — NOT a simple translateX "fake walk".
 * - Idle uses extremely subtle breathing/sway.
 */
export function SetuCharacter({ state, onClick }: SetuCharacterProps) {
  const stateClass = styles[stateToClassName(state)] || '';

  const isClickable =
    state === 'IDLE' ||
    state === 'GREETING' ||
    state === 'STOPPING' ||
    state === 'NAMASKAR';

  return (
    <button
      className={`${styles.characterContainer}`}
      onClick={isClickable ? onClick : undefined}
      aria-label="Open UK Setu AI Assistant"
      tabIndex={isClickable ? 0 : -1}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
    >
      <div className={stateClass}>
        <Image
          src="/images/setu/setu-character.png"
          alt="UK Setu — AI Assistant"
          width={682}
          height={1024}
          className={styles.characterImage}
          priority
          draggable={false}
        />
      </div>
      {(state === 'IDLE' || state === 'GREETING') && (
        <div className={styles.statusDot} />
      )}
    </button>
  );
}
