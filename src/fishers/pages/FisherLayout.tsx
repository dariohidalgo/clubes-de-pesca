import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarPescador from '../components/SidebarPescador';

const FisherLayout: React.FC = () => (
  <div className="flex min-h-screen w-100dvh bg-gray-50">
    {/* Sidebar */}
    <SidebarPescador />
    
    {/* Contenido principal */}
    <main className="flex-1 overflow-y-auto p-6 w-full max-w-100dvh">
      <div className="w-full max-w-[1200px] mx-auto">
        <Outlet />
      </div>
    </main>
  </div>
);

export default FisherLayout;
