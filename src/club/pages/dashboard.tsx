import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationsBell from '../components/NotificationsBell';

const ClubDashboard: React.FC = () => {
 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Actualizar estado de móvil cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main 
        className={`flex-1 transition-all duration-300 ${
          isMobile ? 'p-4 pt-20' : 'p-6 md:p-8 lg:p-10 pt-20 md:pt-10'
        } w-full max-w-full overflow-x-hidden`}
      >
        <div className="max-w-7xl mx-auto">
         <div className="flex justify-end mb-5">
         <NotificationsBell />
         </div>
          <Outlet /> {/* Aquí se renderizan las rutas hijas */}
        </div>
      </main>
    </div>
  );
};

export default ClubDashboard;
