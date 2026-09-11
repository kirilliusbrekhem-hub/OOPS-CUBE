import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { FutureTokenResponse, QuestDTO } from '../api/types';
import BottomNav from '../components/BottomNav';
import MobileScreen from '../components/MobileScreen';
import coinImg from '../assets/oops-coin.png';

export default function Coin() {
  const [wallet, setWallet] = useState<FutureTokenResponse | null>(null);
  const [quests, setQuests] = useState<QuestDTO[]>([]);

  useEffect(() => {
    api.futureToken().then(setWallet);
    api.quests().then((res) => setQuests(res.quests));
  }, []);

  const claimable = quests
    .filter((q) => q.paysIn === 'future_token' && q.completed && !q.claimed)
    .reduce((sum, q) => sum + q.rewardAmount, 0);

  return (
    <MobileScreen>
      <div
        style={{
          position: 'absolute',
          top: -130,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(76,83,151,.45),transparent 68%)',
        }}
      />

      <div style={{ position: 'relative', padding: '24px 20px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <img src={coinImg} alt="!OOPS!" style={{ width: 60, height: 60, flex: 'none', filter: 'drop-shadow(0 0 20px rgba(145,132,217,.5))' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ font: "700 24px/1 'Inter',sans-serif", letterSpacing: '-.03em', color: '#e9e9ed' }}>!OOPS!</span>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(181,171,252,.14)', boxShadow: 'inset 0 0 0 1px #5d5294', font: "600 10px/1.4 'Inter',sans-serif", letterSpacing: '.08em', color: '#b5abfc' }}>
              OP$
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: "400 11px/1 'Inter',sans-serif", color: '#75798c' }}>
            <i className="ph ph-diamond" style={{ fontSize: 12, color: '#9184d9' }} />
            Not yet deployed on TON
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, margin: '22px 20px 0', background: 'rgba(233,233,237,.12)' }}>
        <div style={{ background: '#191b28', padding: '15px 14px' }}>
          <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#75798c', marginBottom: 7 }}>YOUR OP$</div>
          <div style={{ font: "600 22px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#e9e9ed' }}>
            {(wallet?.balance ?? 0).toLocaleString('en-US')}
          </div>
        </div>
        <div style={{ background: '#191b28', padding: '15px 14px' }}>
          <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.14em', color: '#75798c', marginBottom: 7 }}>CLAIMABLE</div>
          <div style={{ font: "600 22px/1 'Inter',sans-serif", fontVariantNumeric: 'tabular-nums', color: '#b5abfc' }}>{claimable.toLocaleString('en-US')}</div>
        </div>
      </div>

      <div style={{ position: 'relative', margin: '18px 20px 0', padding: 15, borderRadius: 14, background: 'var(--color-surface)', boxShadow: '0 0 0 1px #3f424d' }}>
        <div style={{ font: "500 9px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c', marginBottom: 9 }}>CONTRACT ADDRESS</div>
        <div style={{ font: "400 12px/1.45 'Inter',sans-serif", color: '#75798c' }}>
          Not deployed yet. What you earn here is tracked so it can be converted once the token launches — nothing to trade or transfer today.
        </div>
      </div>

      <div style={{ position: 'relative', margin: '10px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 14, boxShadow: 'inset 0 0 0 1px #595d6c', opacity: 0.6 }}>
          <i className="ph ph-wallet" style={{ fontSize: 20, color: '#9184d9' }} />
          <div style={{ flex: 1 }}>
            <div style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>Connect TON wallet</div>
            <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#75798c' }}>Coming later — not needed yet</div>
          </div>
          <span style={{ padding: '4px 9px', borderRadius: 7, background: 'rgba(63,66,77,.6)', font: "600 10px/1 'Inter',sans-serif", letterSpacing: '.08em', color: '#b2b6ca' }}>
            SOON
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', padding: '26px 20px 0', font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c' }}>HOW TO EARN OP$</div>
      <div style={{ position: 'relative', padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[
          'Finish season quests — they pay in OP$, not CUBES',
          'Weekly airdrop to the top of the world leaderboard',
          'Wallet connection opens once the token is live',
        ].map((text, i) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 13, background: 'rgba(35,37,50,.6)' }}>
            <span style={{ width: 24, height: 24, flex: 'none', borderRadius: 8, background: 'rgba(181,171,252,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 11px/1 'Inter',sans-serif", color: '#b5abfc' }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, font: "400 13px/1.35 'Inter',sans-serif", color: '#cfd3e5' }}>{text}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', padding: '16px 20px 0', font: "400 10px/1.45 'Inter',sans-serif", color: '#595d6c' }}>
        OP$ is planned as a community token on TON. It is not an investment product, not available for purchase, and not exchangeable for CUBES.
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav />
    </MobileScreen>
  );
}
