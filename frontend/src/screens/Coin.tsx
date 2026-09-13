import { useCallback, useEffect, useState } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { api, ApiError } from '../api/client';
import type { FutureTokenResponse, QuestDTO } from '../api/types';
import BottomNav from '../components/BottomNav';
import MobileScreen from '../components/MobileScreen';
import coinImg from '../assets/oops-coin.png';
import { useAuth } from '../state/AuthContext';

function truncateAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export default function Coin() {
  const { player, refresh } = useAuth();
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();

  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [wallet, setWallet] = useState<FutureTokenResponse | null>(null);
  const [quests, setQuests] = useState<QuestDTO[]>([]);
  const [copied, setCopied] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutBusy, setPayoutBusy] = useState(false);

  const loadWallet = useCallback(() => {
    api.futureToken().then(setWallet);
  }, []);

  useEffect(() => {
    api.tokenInfo().then((res) => setContractAddress(res.contractAddress));
    loadWallet();
    api.quests().then((res) => setQuests(res.quests));
  }, [loadWallet]);

  // Once the player's own wallet connects via TonConnect, tell the server
  // (it's just a public address — the wallet signs with its own key,
  // which never reaches this app).
  useEffect(() => {
    if (tonAddress && tonAddress !== player?.tonWalletAddress) {
      api.connectTonWallet(tonAddress).then(() => refresh());
    }
  }, [tonAddress, player?.tonWalletAddress, refresh]);

  const claimable = quests
    .filter((q) => q.paysIn === 'future_token' && q.completed && !q.claimed)
    .reduce((sum, q) => sum + q.rewardAmount, 0);

  const copyContract = useCallback(() => {
    if (!contractAddress) return;
    navigator.clipboard?.writeText(contractAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [contractAddress]);

  const requestPayout = useCallback(async () => {
    setPayoutBusy(true);
    setPayoutMessage(null);
    try {
      const res = await api.requestPayout();
      setPayoutMessage(`Requested ${res.request.amount.toLocaleString('en-US')} OP$ — the project owner sends it to your wallet manually and marks it paid.`);
      loadWallet();
    } catch (err) {
      setPayoutMessage(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setPayoutBusy(false);
    }
  }, [loadWallet]);

  if (!player) return null;

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
            Jetton on TON
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
        {contractAddress ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, minWidth: 0, font: '500 12px/1.45 ui-monospace,Menlo,monospace', color: '#cfd3e5', wordBreak: 'break-all' }}>
              {contractAddress}
            </span>
            <button
              onClick={copyContract}
              style={{ width: 38, height: 38, flex: 'none', borderRadius: 11, boxShadow: 'inset 0 0 0 1px #595d6c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#b5abfc', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <i className={copied ? 'ph-fill ph-check' : 'ph ph-copy'} />
            </button>
          </div>
        ) : (
          <div style={{ font: "400 12px/1.45 'Inter',sans-serif", color: '#75798c' }}>Loading…</div>
        )}
      </div>

      <div style={{ position: 'relative', margin: '10px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {tonAddress ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 14, boxShadow: 'inset 0 0 0 1.5px #b5abfc' }}>
            <i className="ph-fill ph-wallet" style={{ fontSize: 20, color: '#b5abfc' }} />
            <div style={{ flex: 1 }}>
              <div style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>Wallet connected</div>
              <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#75798c', fontFamily: 'ui-monospace,Menlo,monospace' }}>{truncateAddress(tonAddress)}</div>
            </div>
            <button
              onClick={() => tonConnectUI.disconnect()}
              style={{ font: "500 11px/1 'Inter',sans-serif", color: '#75798c', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => tonConnectUI.openModal()}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 14, boxShadow: 'inset 0 0 0 1px #595d6c', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <i className="ph ph-wallet" style={{ fontSize: 20, color: '#9184d9' }} />
            <div style={{ flex: 1 }}>
              <div style={{ font: "500 14px/1.2 'Inter',sans-serif", color: '#e9e9ed' }}>Connect TON wallet</div>
              <div style={{ font: "400 11px/1.3 'Inter',sans-serif", color: '#75798c' }}>Tonkeeper, MyTonWallet, Wallet in Telegram</div>
            </div>
            <i className="ph ph-caret-right" style={{ fontSize: 15, color: '#75798c' }} />
          </button>
        )}

        {claimable > 0 && (
          <button
            onClick={requestPayout}
            disabled={!tonAddress || payoutBusy}
            style={{
              height: 48,
              borderRadius: 14,
              border: 'none',
              background: 'rgba(181,171,252,.1)',
              boxShadow: 'inset 0 0 0 1.5px #b5abfc',
              color: '#e7e5fe',
              font: "600 13px/1 'Inter',sans-serif",
              cursor: tonAddress ? 'pointer' : 'not-allowed',
              opacity: tonAddress ? 1 : 0.5,
            }}
          >
            {tonAddress ? `Request payout — ${claimable.toLocaleString('en-US')} OP$` : 'Connect a wallet to request payout'}
          </button>
        )}
        {payoutMessage && (
          <div style={{ padding: '10px 13px', borderRadius: 10, background: 'rgba(181,171,252,.08)', font: "400 12px/1.4 'Inter',sans-serif", color: '#cfd3e5' }}>
            {payoutMessage}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', padding: '26px 20px 0', font: "500 10px/1 'Inter',sans-serif", letterSpacing: '.16em', color: '#75798c' }}>HOW TO EARN OP$</div>
      <div style={{ position: 'relative', padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[
          'Finish season quests — they pay in OP$, not CUBES',
          'Weekly airdrop to the top of the world leaderboard',
          'Connect a wallet, then request a payout of what you’ve earned',
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
        OP$ is a community token on TON. Payouts are sent manually by the project owner — this app never holds or sends OP$ itself.
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav />
    </MobileScreen>
  );
}
