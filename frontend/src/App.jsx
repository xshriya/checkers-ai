import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OtpSignupPage from './pages/OtpSignupPage';
import ForgotPassword from './components/auth/ForgotPassword';
import DashboardPage from './pages/DashboardPage';
import GameSetup from './pages/GameSetup';
import GamePage from './pages/GamePage';
import GamesPage from './pages/GamesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AnalysisPage from './pages/AnalysisPage';

function AppContent() {
  const location = useLocation();

  return (
    <div className="selection:bg-primary-container selection:text-on-primary-container">
      <Navbar />
      <div key={location.pathname} className="page-fade-in">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp-signup" element={<OtpSignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/play" element={<ProtectedRoute><GameSetup /></ProtectedRoute>} />
          <Route path="/game" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/analysis/:gameId" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}