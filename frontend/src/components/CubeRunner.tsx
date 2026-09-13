import CubeIcon from './CubeIcon';
import type { CubeSkinDTO } from '../api/types';

interface CubeRunnerProps {
  skin: CubeSkinDTO;
  size?: number;
  jumping?: boolean;
}

/** The player's equipped cube, used as the jumping character in-game. */
export default function CubeRunner({ skin, size = 64, jumping = false }: CubeRunnerProps) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.28,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${skin.topColor}59, transparent 70%)`,
        }}
      />
      <CubeIcon
        size={size * 0.78}
        topColor={skin.topColor}
        leftColor={skin.leftColor}
        rightColor={skin.rightColor}
        style={{
          position: 'relative',
          filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.55))',
          transform: jumping ? 'rotate(22deg)' : 'rotate(0deg)',
          transition: 'transform .3s cubic-bezier(.3,0,.4,1)',
        }}
      />
    </div>
  );
}
