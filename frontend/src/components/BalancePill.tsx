import CubeIcon from './CubeIcon';

export default function BalancePill({ balance, large = false }: { balance: number; large?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: large ? 9 : 8,
        padding: large ? '6px 12px 6px 9px' : '6px 11px 6px 8px',
        borderRadius: 999,
        background: 'rgba(35,37,50,.85)',
        boxShadow: '0 0 0 1px #3f424d',
      }}
    >
      <CubeIcon size={large ? 13 : 15} />
      <span
        style={{
          font: `600 ${large ? 13 : 14}px/1 'Inter',sans-serif`,
          fontVariantNumeric: 'tabular-nums',
          color: '#e9e9ed',
        }}
      >
        {balance.toLocaleString('en-US')}
      </span>
      {!large && <span style={{ font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.06em', color: '#9397ab' }}>CUBES</span>}
    </div>
  );
}
