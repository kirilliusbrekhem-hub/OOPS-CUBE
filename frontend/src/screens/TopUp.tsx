import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { TopupOrderDTO, TopupPackage } from '../api/types';
import BottomNav from '../components/BottomNav';
import CubeIcon from '../components/CubeIcon';
import MobileScreen from '../components/MobileScreen';
import coin from '../assets/oops-coin.png';
import { useAuth } from '../state/AuthContext';

type Currency = 'RUB' | 'USD';

function formatPrice(pkg: TopupPackage, currency: Currency): string {
  return currency === 'RUB' ? `${pkg.priceRub.toLocaleString('ru-RU')} ₽` : `$${pkg.priceUsd.toFixed(2)}`;
}

export default function TopUp() {
  const { player } = useAuth();
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [currency, setCurrency] = useState<Currency>('RUB');
  const [pendingOrder, setPendingOrder] = useState<TopupOrderDTO | null>(null);
  const [orders, setOrders] = useState<TopupOrderDTO[]>([]);

  useEffect(() => {
    api.topupPackages().then((res) => setPackages(res.packages));
    api.topupOrders().then((res) => setOrders(res.orders));
  }, []);

  const buy = useCallback(async (pkg: TopupPackage) => {
    const res = await api.createTopupOrder({ packageCode: pkg.code, currency });
    setPendingOrder(res.order);
    const list = await api.topupOrders();
    setOrders(list.orders);
  }, [currency]);

  if (!player) return null;

  return (
    <MobileScreen>
      <div style={{ padding: '22px 20px 0' }}>
        <h3 style={{ margin: '0 0 4px', font: "500 25px/1 'Inter',sans-serif", letterSpacing: '-.02em', color: '#e9e9ed' }}>Top up CUBES</h3>
        <div style={{ font: "400 12px/1.4 'Inter',sans-serif", color: '#75798c', maxWidth: 300 }}>
          CUBES are free from quests and streaks. Buying just skips the grind.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, font: "400 12px/1 'Inter',sans-serif", color: '#75798c' }}>
          Balance
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: "600 13px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>
            <CubeIcon size={11} />
            {player.balance.toLocaleString('en-US')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '18px 20px 0' }}>
        <div
          onClick={() => setCurrency('RUB')}
          style={{
            flex: 1,
            padding: '10px 0',
            textAlign: 'center',
            font: "500 13px/1 'Inter',sans-serif",
            color: currency === 'RUB' ? '#d2cefd' : '#75798c',
            boxShadow: currency === 'RUB' ? 'inset 0 -2px 0 #b5abfc' : 'inset 0 -1px 0 #3f424d',
            cursor: 'pointer',
          }}
        >
          SBP · ₽
        </div>
        <div
          onClick={() => setCurrency('USD')}
          style={{
            flex: 1,
            padding: '10px 0',
            textAlign: 'center',
            font: "500 13px/1 'Inter',sans-serif",
            color: currency === 'USD' ? '#d2cefd' : '#75798c',
            boxShadow: currency === 'USD' ? 'inset 0 -2px 0 #b5abfc' : 'inset 0 -1px 0 #3f424d',
            cursor: 'pointer',
          }}
        >
          Card · $
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {packages.map((pkg) => (
          <div
            key={pkg.code}
            onClick={() => buy(pkg)}
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 14,
              padding: pkg.featured ? '17px 15px' : 15,
              borderRadius: 14,
              background: pkg.featured ? 'linear-gradient(100deg,#2c3170,#232532)' : 'var(--color-surface)',
              boxShadow: pkg.featured ? '0 0 0 1px #b5abfc,0 0 34px rgba(145,132,217,.3)' : '0 0 0 1px #3f424d',
              cursor: 'pointer',
            }}
          >
            {pkg.featured && (
              <span
                style={{
                  position: 'absolute',
                  top: -8,
                  left: 15,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: '#b5abfc',
                  font: "600 9px/1.4 'Inter',sans-serif",
                  letterSpacing: '.1em',
                  color: '#161826',
                }}
              >
                BEST VALUE
              </span>
            )}
            <CubeIcon size={pkg.featured ? 34 : 26} topColor={pkg.featured ? '#f5f4ff' : '#b2b6ca'} leftColor={pkg.featured ? '#5d5294' : '#3f424d'} rightColor={pkg.featured ? '#b5abfc' : '#75798c'} />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  style={{
                    font: `${pkg.featured ? 700 : 600} ${pkg.featured ? 26 : 21}px/1 'Inter',sans-serif`,
                    fontVariantNumeric: 'tabular-nums',
                    color: pkg.featured ? '#f5f4ff' : '#e9e9ed',
                  }}
                >
                  {pkg.cubesAmount.toLocaleString('en-US')}
                </span>
                {pkg.bonusPercent > 0 && (
                  <span style={{ font: "600 10px/1 'Inter',sans-serif", color: pkg.featured ? '#b5abfc' : '#9184d9' }}>+{pkg.bonusPercent}%</span>
                )}
              </div>
              <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: pkg.featured ? '#b5afe8' : '#75798c' }}>{pkg.label}</div>
            </div>
            <div
              style={{
                padding: pkg.featured ? '11px 15px' : '9px 14px',
                borderRadius: pkg.featured ? 11 : 10,
                background: pkg.featured ? 'rgba(181,171,252,.12)' : undefined,
                boxShadow: pkg.featured ? 'inset 0 0 0 1.5px #b5abfc' : 'inset 0 0 0 1px #595d6c',
                font: `${pkg.featured ? 600 : 500} ${pkg.featured ? 14 : 13}px/1 'Inter',sans-serif`,
                fontVariantNumeric: 'tabular-nums',
                color: pkg.featured ? '#e7e5fe' : '#cfd3e5',
              }}
            >
              {formatPrice(pkg, currency)}
            </div>
          </div>
        ))}
      </div>

      {pendingOrder && (
        <div style={{ margin: '16px 20px 0', padding: '13px 15px', borderRadius: 12, background: 'rgba(35,37,50,.7)', boxShadow: '0 0 0 1px #423a6a', font: "400 12px/1.4 'Inter',sans-serif", color: '#b2b6ca' }}>
          Order created for {pendingOrder.cubesAmount.toLocaleString('en-US')} CUBES — status: {pendingOrder.status}. No payment provider is
          connected yet, so it stays pending.
        </div>
      )}

      <Link
        to="/oops"
        style={{ margin: '20px 20px 0', padding: '14px 15px', borderRadius: 14, boxShadow: '0 0 0 1px #423a6a', display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}
      >
        <img src={coin} alt="!OOPS!" style={{ width: 28, height: 28, flex: 'none' }} />
        <div style={{ flex: 1 }}>
          <div style={{ font: "500 13px/1.25 'Inter',sans-serif", color: '#e9e9ed' }}>Looking for the coin?</div>
          <div style={{ font: "400 11px/1.35 'Inter',sans-serif", color: '#75798c' }}>!OOPS! (OP$) is a planned token, tracked separately from CUBES — not deployed yet</div>
        </div>
        <span style={{ font: "500 11px/1 'Inter',sans-serif", color: '#b5abfc' }}>Open</span>
      </Link>

      <div style={{ padding: '14px 20px 0', font: "400 10px/1.4 'Inter',sans-serif", color: '#595d6c' }}>
        No payment provider connected yet. CUBES is an in-game currency with no cash value.
      </div>

      {orders.length > 0 && (
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c', marginBottom: 8 }}>RECENT ORDERS</div>
          {orders.slice(0, 3).map((order) => (
            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', font: "400 12px/1.3 'Inter',sans-serif", color: '#9397ab' }}>
              <span>{order.cubesAmount.toLocaleString('en-US')} CUBES</span>
              <span>{order.status}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />
      <BottomNav />
    </MobileScreen>
  );
}
