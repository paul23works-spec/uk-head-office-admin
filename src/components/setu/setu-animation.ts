/**
 * UK Setu — Animation State Machine
 * 
 * Explicit state machine for the Setu character lifecycle.
 * Each state maps to a specific CSS class and animation behavior.
 */

export type SetuState =
  | 'HIDDEN'
  | 'VIDEO_GREETING'
  | 'POST_GREETING_PAUSE'
  | 'COLLAPSING'
  | 'IDLE'
  | 'OPENING_CHAT'
  | 'CHAT_OPEN'
  | 'CLOSING_CHAT';

/** Duration (ms) for each animated state before transitioning to the next. */
export const STATE_DURATIONS: Partial<Record<SetuState, number>> = {
  POST_GREETING_PAUSE: 1200,
  COLLAPSING: 2000,
  OPENING_CHAT: 400,
  CLOSING_CHAT: 500,
};

/** The automatic next state after a timed state completes. */
export const NEXT_STATE: Partial<Record<SetuState, SetuState>> = {
  POST_GREETING_PAUSE: 'COLLAPSING',
  COLLAPSING: 'IDLE',
  CLOSING_CHAT: 'IDLE',
  OPENING_CHAT: 'CHAT_OPEN',
};

/** Session storage key — prevents greeting replay within the same session. */
export const SESSION_KEY = 'uk_setu_greeted_session';

/** Map SetuState → CSS module class suffix. */
export function stateToClassName(state: SetuState): string {
  const map: Record<SetuState, string> = {
    HIDDEN: 'stateHidden',
    VIDEO_GREETING: 'stateVideoGreeting',
    POST_GREETING_PAUSE: 'statePostGreetingPause',
    COLLAPSING: 'stateCollapsing',
    IDLE: 'stateIdle',
    OPENING_CHAT: 'stateOpeningChat',
    CHAT_OPEN: 'stateChatOpen',
    CLOSING_CHAT: 'stateClosingChat',
  };
  return map[state];
}
