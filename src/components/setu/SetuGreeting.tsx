'use client';

import React from 'react';
import styles from './setu.module.css';

interface SetuGreetingProps {
  firstName: string;
  visible: boolean;
  onClick: () => void;
}

/**
 * Speech bubble greeting shown after Setu's Namaskar gesture.
 * Displays bilingual greeting with the authenticated user's first name.
 */
export function SetuGreeting({ firstName, visible, onClick }: SetuGreetingProps) {
  return (
    <div
      className={`${styles.speechBubble} ${
        visible ? styles.speechBubbleVisible : styles.speechBubbleHidden
      }`}
      onClick={onClick}
      role="button"
      tabIndex={visible ? 0 : -1}
      aria-label="Open UK Setu Chat"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <p className={styles.greetingPrimary}>
        Namaskar, {firstName}! 🙏
        <br />
        I&apos;m Setu. How are you today?
      </p>
      <p className={styles.greetingAssamese}>
        নমস্কাৰ! মই Setu। আজি আপুনি কেনে আছে?
      </p>
      <p className={styles.greetingHint}>
        Click me to start a conversation
      </p>
    </div>
  );
}
