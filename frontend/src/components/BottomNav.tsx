import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', icon: 'house' },
  { path: '/leaderboard', icon: 'trophy' },
  { path: '/quests', icon: 'target' },
  { path: '/topup', icon: 'plus-circle' },
  { path: '/oops', icon: 'currency-circle-dollar' },
  { path: '/profile', icon: 'user' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6,1fr)',
        alignItems: 'center',
        padding: '10px 0 14px',
        background:
          'linear-gradient(to right,transparent,rgba(233,233,237,.16) 48px,rgba(233,233,237,.16) calc(100% - 48px),transparent) top/100% 1px no-repeat',
      }}
    >
      {NAV_ITEMS.map(({ path, icon }) => {
        const active = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            style={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: 21,
              color: active ? '#b5abfc' : '#75798c',
              textDecoration: 'none',
            }}
          >
            <i className={active ? `ph-fill ph-${icon}` : `ph ph-${icon}`} />
          </Link>
        );
      })}
    </div>
  );
}
