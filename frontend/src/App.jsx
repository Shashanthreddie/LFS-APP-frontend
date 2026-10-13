/* @Author - Ram-Ambati 
   @ This file tells the app what to render based on the route and auth state
*/
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { authService } from './services/authService';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Download from './pages/Download';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import WelcomeModal from './components/WelcomeModal';
import './styles/globals.css';

function AppContent() {
  const { type } = useAuth();
  const location = useLocation();
  const isAuthRoute = location.pathname === '/signin' || location.pathname === '/register'; // checks if user is on login/register pages... don't want to show the welcome modal here
  const shouldShowWelcomeModal = type === 'new' && !authService.isWelcomeSeen() && !isAuthRoute;  
  // Shows Welcome modal only for first-time visitors on non-auth routes. (logic)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Actually Loading the Welcome Modal (code)*/}
      {shouldShowWelcomeModal && <WelcomeModal />}

      <Navbar />
      {/* actually loading routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/download" element={<Download />} />
        <Route path="/download/:token" element={<Download />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} /> {/* fallback route in case user inputs random stuff in url */}
      </Routes>
    </div>
  );
}

export default function App() { // calling appcontent() within AuthProvider. 
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  );
}
