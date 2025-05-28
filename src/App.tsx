import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Landing Page
import LandingPage from './pages/LandingPage';

// Club Imports
import LoginClub from './club/pages/LoginClub';
import RegisterClub from './club/pages/RegisterClub';
import ClubDashboard from './club/pages/dashboard';
import PrivateRoute from './components/common/PrivateRoute';
import ClubInfoCard from './club/components/ClubInfoCard';
import BoatsAndBaitPanel from './club/pages/BoatsAndBaitPanel';
import BaitChips from './club/components/BaitChips';
import BookingCalendar from './club/components/BookingCalendar';
import NotificationsPanel from './club/components/NotificationsPanel';
import ClubRatingsPanel from './club/components/ClubRatingsPanel';

// Fisher Imports
import LoginFisher from './fishers/pages/LoginFisher';
import RegisterFisher from './fishers/pages/RegisterFisher';
import FisherDashboard from './fishers/pages/FisherDashboard'; 
import FisherBookings from './fishers/pages/FisherBookings';   
import FisherLayout from './fishers/pages/FisherLayout';
import ReservarClub from './fishers/pages/ReservarClub';
import FishingZones from './fishers/pages/FishingZones';
import ClubRankings from './fishers/pages/ClubRankings';

import './App.css';

const App: React.FC = () => {

  return (
    
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Login y registro para clubes */}
        <Route path="/login-club" element={<LoginClub />} />
        <Route path="/register-club" element={<RegisterClub />} />

        {/* Login y registro para pescadores */}
        <Route path="/login-fisher" element={<LoginFisher />} />
        <Route path="/register-fisher" element={<RegisterFisher />} />

        {/* Rutas protegidas club */}
        <Route
          path="/club"
          element={
            <PrivateRoute role="club">
              <ClubDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/club/inicio" replace />} />
          <Route path="inicio" element={<ClubInfoCard />} />
          <Route path="botes" element={<BoatsAndBaitPanel />} />
          <Route path="carnadas" element={<BaitChips />} />
          <Route path="calificaciones" element={<ClubRatingsPanel />} />
          <Route path="reservas">
            <Route index element={<BookingCalendar />} />
            <Route path=":reservaId" element={<BookingCalendar />} />
          </Route>
          <Route path="notificaciones" element={<NotificationsPanel />} />
        </Route>

        {/* Rutas protegidas pescador */}
        <Route
          path="/fisher"
          element={
            <PrivateRoute role="fisher">
              <FisherLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/fisher/dashboard" replace />} />
          <Route path="dashboard" element={<FisherDashboard />} />
          <Route path="reservas" element={<FisherBookings />} />
          <Route path="reservar/:clubId" element={<ReservarClub />} />
          <Route path="zonas-pesca" element={<FishingZones />} />
          <Route path="ranking-clubes" element={<ClubRankings />} />
        </Route>
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
