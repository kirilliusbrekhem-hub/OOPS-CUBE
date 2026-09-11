import type { CSSProperties, ReactNode } from 'react';

interface MobileScreenProps {
  children: ReactNode;
  background?: string;
}

/**
 * Full-bleed on a real phone, centered as a phone-width column on wider
 * viewports — the design's 390×844 artboard was a mockup canvas size, not
 * a fixed layout for the shipped app.
 */
export default function MobileScreen({ children, background }: MobileScreenProps) {
  const outer: CSSProperties = {
    minHeight: '100dvh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    background: '#0d0f18',
  };
  const inner: CSSProperties = {
    width: '100%',
    maxWidth: 430,
    minHeight: '100dvh',
    background: background ?? 'var(--color-bg)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };
  return (
    <div style={outer}>
      <div style={inner}>{children}</div>
    </div>
  );
}
