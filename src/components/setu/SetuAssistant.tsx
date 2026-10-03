'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  type SetuState,
  STATE_DURATIONS,
  NEXT_STATE,
  SESSION_KEY,
} from './setu-animation';
import { SetuCharacter } from './SetuCharacter';
import { SetuGreeting } from './SetuGreeting';
import styles from './setu.module.css';

interface SetuAssistantProps {
  /** Called when the user clicks Setu to open the chat. */
  onOpenChat: () => void;
  /** Whether the chat panel is currently open. */
  isChatOpen: boolean;
  /** Full name of the authenticated user. */
  userName: string;
}

/**
 * Determine initial state on mount — checks sessionStorage and reduced motion.
 * Called as the initializer for useState to avoid setState-in-effect lint warning.
 */
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

  return 'HIDDEN'; // will be advanced to ENTERING via effect
}

/**
 * SetuAssistant — Main orchestrator for the UK Setu character experience.
 *
 * Manages the state machine lifecycle:
 *   HIDDEN → ENTERING → STOPPING → NAMASKAR → GREETING → IDLE
 *                                                          ↕
 *                                               OPENING_CHAT ↔ CHAT_OPEN
 *                                                          ↕
 *                                                    CLOSING_CHAT
 *
 * The entrance + greeting sequence plays once per browser session
 * (tracked via sessionStorage).
 */
export function SetuAssistant({ onOpenChat, isChatOpen, userName }: SetuAssistantProps) {
  const [state, setState] = useState<SetuState>(getInitialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevChatOpen = useRef(isChatOpen);

  const firstName = userName?.split(' ')[0] || 'there';

  // ── Clear any pending timer ──
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Schedule the next auto-transition for a state ──
  const scheduleNext = useCallback(
    (currentState: SetuState) => {
      const duration = STATE_DURATIONS[currentState];
      const next = NEXT_STATE[currentState];

      if (duration && next) {
        timerRef.current = setTimeout(() => {
          // When greeting finishes, mark session as greeted
          if (currentState === 'GREETING') {
            try {
              sessionStorage.setItem(SESSION_KEY, 'true');
            } catch {
              // sessionStorage unavailable — graceful fallback
            }
          }
          setState(next);
          // Schedule the transition for the new state too
          clearTimer();
          const nextDuration = STATE_DURATIONS[next];
          const nextNext = NEXT_STATE[next];
          if (nextDuration && nextNext) {
            timerRef.current = setTimeout(() => {
              if (next === 'GREETING') {
                try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* */ }
              }
              setState(nextNext);
            }, nextDuration);
          }
        }, duration);
      }
    },
    [clearTimer]
  );

  // ── Advance state and schedule its auto-transition ──
  const advanceTo = useCallback(
    (newState: SetuState) => {
      clearTimer();
      setState(newState);
      scheduleNext(newState);
    },
    [clearTimer, scheduleNext]
  );

  // ── If initial state was HIDDEN, kick off the entrance ──
  useEffect(() => {
    // Only run on mount for HIDDEN → ENTERING.
    // Other initial states (IDLE) don't need the entrance.
    if (state !== 'HIDDEN') return;

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        // Start the entrance chain: ENTERING → STOPPING → NAMASKAR → GREETING → IDLE
        setState('ENTERING');

        // Schedule the full chain via nested timeouts
        const t1 = setTimeout(() => {
          setState('STOPPING');
          const t2 = setTimeout(() => {
            setState('NAMASKAR');
            const t3 = setTimeout(() => {
              setState('GREETING');
              const t4 = setTimeout(() => {
                try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* */ }
                setState('IDLE');
              }, STATE_DURATIONS.GREETING!);
              timerRef.current = t4;
            }, STATE_DURATIONS.NAMASKAR!);
            timerRef.current = t3;
          }, STATE_DURATIONS.STOPPING!);
          timerRef.current = t2;
        }, STATE_DURATIONS.ENTERING!);
        timerRef.current = t1;
      });

      return () => cancelAnimationFrame(raf2);
    });

    return () => {
      cancelAnimationFrame(raf1);
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync with external chat open/close ──
  useEffect(() => {
    const wasOpen = prevChatOpen.current;
    prevChatOpen.current = isChatOpen;

    if (isChatOpen && !wasOpen) {
      advanceTo('OPENING_CHAT');
    } else if (!isChatOpen && wasOpen) {
      advanceTo('CLOSING_CHAT');
    }
  }, [isChatOpen, advanceTo]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // ── Click handler ──
  const handleClick = useCallback(() => {
    if (
      state === 'IDLE' ||
      state === 'GREETING' ||
      state === 'STOPPING' ||
      state === 'NAMASKAR'
    ) {
      // If the greeting is still playing, mark it as seen
      if (state === 'GREETING' || state === 'NAMASKAR') {
        try {
          sessionStorage.setItem(SESSION_KEY, 'true');
        } catch {
          // ignore
        }
      }
      clearTimer();
      onOpenChat();
    }
  }, [state, onOpenChat, clearTimer]);

  // Don't render when chat is fully open
  if (state === 'CHAT_OPEN') return null;

  const showGreeting = state === 'GREETING';

  return (
    <div className={styles.setuWrapper}>
      <SetuGreeting
        firstName={firstName}
        visible={showGreeting}
        onClick={handleClick}
      />
      <SetuCharacter state={state} onClick={handleClick} />
    </div>
  );
}
