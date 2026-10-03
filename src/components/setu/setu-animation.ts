/**
 * UK Setu — Animation State Machine
 * 
 * Explicit state machine for the Setu character lifecycle.
 * Each state maps to a specific CSS class and animation behavior.
 */

export type SetuState =
  | 'HIDDEN'
  | 'ENTERING'
  | 'STOPPING'
  | 'NAMASKAR'
  | 'GREETING'
  | 'IDLE'
  | 'OPENING_CHAT'
  | 'CHAT_OPEN'
  | 'CLOSING_CHAT';

/** Duration (ms) for each animated state before transitioning to the next. */
export const STATE_DURATIONS: Partial<Record<SetuState, number>> = {
  ENTERING: 2400,
  STOPPING: 600,
  NAMASKAR: 1600,
  GREETING: 5000,
  OPENING_CHAT: 400,
  CLOSING_CHAT: 500,
};

/** The automatic next state after a timed state completes. */
export const NEXT_STATE: Partial<Record<SetuState, SetuState>> = {
  ENTERING: 'STOPPING',
  STOPPING: 'NAMASKAR',
  NAMASKAR: 'GREETING',
  GREETING: 'IDLE',
  CLOSING_CHAT: 'IDLE',
  OPENING_CHAT: 'CHAT_OPEN',
};

/** Session storage key — prevents greeting replay within the same session. */
export const SESSION_KEY = 'uk_setu_greeted_session';

/** Map SetuState → CSS module class suffix. */
export function stateToClassName(state: SetuState): string {
  const map: Record<SetuState, string> = {
    HIDDEN: 'stateHidden',
    ENTERING: 'stateEntering',
    STOPPING: 'stateStopping',
    NAMASKAR: 'stateNamaskar',
    GREETING: 'stateGreeting',
    IDLE: 'stateIdle',
    OPENING_CHAT: 'stateOpeningChat',
    CHAT_OPEN: 'stateChatOpen',
    CLOSING_CHAT: 'stateClosingChat',
  };
  return map[state];
}
