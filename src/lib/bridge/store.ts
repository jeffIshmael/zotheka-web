import type { BridgeUserState } from "./types";

const STORAGE_PREFIX = "zotheka_bridge_v1_";

export function loadBridgeState(email: string): BridgeUserState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${email.toLowerCase()}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BridgeUserState;
  } catch {
    return null;
  }
}

export function saveBridgeState(state: BridgeUserState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${state.email.toLowerCase()}`, JSON.stringify(state));
}

export function clearBridgeState(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${email.toLowerCase()}`);
}
