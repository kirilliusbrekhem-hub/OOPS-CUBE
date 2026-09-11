import type { CSSProperties } from 'react';

interface CubeIconProps {
  size?: number;
  topColor?: string;
  leftColor?: string;
  rightColor?: string;
  style?: CSSProperties;
}

/** The isometric 3-facet cube used everywhere as the CUBES currency mark. */
export default function CubeIcon({
  size = 14,
  topColor = '#b5abfc',
  leftColor = '#5d5294',
  rightColor = '#9184d9',
  style,
}: CubeIconProps) {
  const width = size;
  const height = Math.round((size * 116) / 100);
  return (
    <svg width={width} height={height} viewBox="0 0 100 116" style={style}>
      <polygon points="50,0 100,29 50,58 0,29" fill={topColor} />
      <polygon points="0,29 50,58 50,116 0,87" fill={leftColor} />
      <polygon points="100,29 50,58 50,116 100,87" fill={rightColor} />
    </svg>
  );
}
