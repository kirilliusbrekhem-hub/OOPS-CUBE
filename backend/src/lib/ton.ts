// Lightweight shape check only — this is not a full TON SDK validation
// (no checksum verification), just enough to reject obvious garbage before
// it's stored and shown back to the project owner for a manual payout.
const TON_ADDRESS_RE = /^[A-Za-z0-9_-]{48}$/;

export function isPlausibleTonAddress(address: string): boolean {
  return TON_ADDRESS_RE.test(address);
}
