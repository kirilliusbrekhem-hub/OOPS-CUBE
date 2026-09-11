export default function Avatar({ displayName, size = 34 }: { displayName: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size >= 60 ? 18 : size >= 34 ? 10 : 9,
        background: 'linear-gradient(140deg,#423a6a,#262a60)',
        boxShadow: '0 0 0 1px #595d6c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `600 ${Math.round(size * 0.35)}px/1 'Inter',sans-serif`,
        color: '#d2cefd',
        flex: 'none',
      }}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}
