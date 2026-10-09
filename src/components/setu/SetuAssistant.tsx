'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  type SetuState,
  STATE_DURATIONS,
  NEXT_STATE,
  SESSION_KEY,
  stateToClassName,
} from './setu-animation';
import styles from './setu.module.css';

interface SetuAssistantProps {
  onOpenChat: () => void;
  isChatOpen: boolean;
  userName: string;
}

function getInitialState(): SetuState {
  if (typeof window === 'undefined') return 'HIDDEN';

  let greeted = false;
  try {
    greeted = sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    // SSR or private mode
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (greeted) return 'IDLE';
  if (reducedMotion) {
    try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* ignore */ }
    return 'IDLE';
  }

  return 'HIDDEN';
}

export function SetuAssistant({ onOpenChat, isChatOpen, userName }: SetuAssistantProps) {
  const [state, setState] = useState<SetuState>(getInitialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevChatOpen = useRef(isChatOpen);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceTo = useCallback(
    (newState: SetuState) => {
      clearTimer();
      setState(newState);
      
      const duration = STATE_DURATIONS[newState];
      const next = NEXT_STATE[newState];

      if (duration && next) {
        timerRef.current = setTimeout(() => {
          if (newState === 'POST_GREETING_PAUSE' || newState === 'COLLAPSING') {
            try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* ignore */ }
          }
          advanceTo(next);
        }, duration);
      }
    },
    [clearTimer]
  );

  useEffect(() => {
    if (state !== 'HIDDEN') return;

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setState('VIDEO_GREETING');
      });
      return () => cancelAnimationFrame(raf2);
    });

    return () => {
      cancelAnimationFrame(raf1);
      clearTimer();
    };
  }, []);

  useEffect(() => {
    const wasOpen = prevChatOpen.current;
    prevChatOpen.current = isChatOpen;

    if (!wasOpen && isChatOpen) {
      advanceTo('OPENING_CHAT');
    } else if (wasOpen && !isChatOpen) {
      advanceTo('CLOSING_CHAT');
    }
  }, [isChatOpen, advanceTo]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const handleClick = useCallback(() => {
    if (state === 'IDLE' || state === 'VIDEO_GREETING' || state === 'POST_GREETING_PAUSE' || state === 'COLLAPSING') {
      if (state !== 'IDLE') {
        try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* ignore */ }
      }
      clearTimer();
      onOpenChat();
    }
  }, [state, onOpenChat, clearTimer]);

  const handleVideoEnded = useCallback(() => {
    if (state === 'VIDEO_GREETING') {
      advanceTo('POST_GREETING_PAUSE');
    }
  }, [state, advanceTo]);

  if (state === 'CHAT_OPEN') return null;

  const showStartupVisual = state === 'VIDEO_GREETING' || state === 'POST_GREETING_PAUSE' || state === 'COLLAPSING';
  const showIdleButton = state === 'IDLE' || state === 'CLOSING_CHAT' || state === 'OPENING_CHAT' || state === 'COLLAPSING';

  return (
    <>
      {showStartupVisual && (
        <div className={`${styles.startupVisualContainer} ${styles[stateToClassName(state)] || ''}`}>
          <video
            src="/setu/WhatsApp Video 2026-10-08 at 11.23.06 AM.mp4"
            className={styles.startupVideo}
            autoPlay
            playsInline
            muted={false}
            onEnded={handleVideoEnded}
            onClick={handleClick}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* The interactive idle icon layer */}
      <button
        className={`${styles.idleButton} ${showIdleButton ? styles.idleVisible : styles.idleHidden} ${styles[stateToClassName(state)] || ''}`}
        onClick={handleClick}
        aria-label="Open UK Enterprise AI Assistant"
        tabIndex={0}
      >
        <div className={styles.idleIconWrapper}>
          <Image
            src="/images/setu/setu-character.png"
            alt="SETU"
            width={100}
            height={150}
            className={styles.idleIconImage}
            priority
            draggable={false}
          />
        </div>
        {(state === 'IDLE' || state === 'VIDEO_GREETING' || state === 'POST_GREETING_PAUSE') && (
          <div className={styles.statusDot} />
        )}
      </button>
    </>
  );
}
