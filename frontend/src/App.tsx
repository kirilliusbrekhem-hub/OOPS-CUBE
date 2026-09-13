import { Navigate, Route, Routes } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AuthProvider, useAuth } from './state/AuthContext';
import Coin from './screens/Coin';
import Home from './screens/Home';
import Leaderboard from './screens/Leaderboard';
import Profile from './screens/Profile';
import Quests from './screens/Quests';
import Result from './screens/Result';
import Run from './screens/Run';
import Skins from './screens/Skins';
import TopUp from './screens/TopUp';

const TONCONNECT_MANIFEST_URL = 'https://oops-cube-frontend.onrender.com/tonconnect-manifest.json';

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <div>OOPS CUBE</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/run" element={<Run />} />
      <Route path="/result" element={<Result />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/quests" element={<Quests />} />
      <Route path="/topup" element={<TopUp />} />
      <Route path="/oops" element={<Coin />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/skins" element={<Skins />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <TonConnectUIProvider manifestUrl={TONCONNECT_MANIFEST_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TonConnectUIProvider>
  );
}

export default App;
