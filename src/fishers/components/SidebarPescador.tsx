import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Fish, CalendarDays, User, Menu, X } from "lucide-react";
import LogoutButton from "../../auth/LogoutButton";

const SidebarPescador: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  

  // Cerrar el menú al cambiar de ruta en móviles
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Verificar tamaño inicial
    handleResize();
    
    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', handleResize);
    
    // Limpiar listener al desmontar
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar menú al hacer clic en un enlace en móviles
  const closeMobileMenu = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Botón de hamburguesa para móviles */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden  fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white"
        aria-label="Menú"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para móviles */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 md:static  z-40 w-64 bg-white border-r h-100dvh flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="py-8 px-6 border-b">
            <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
              <Fish className="w-6 h-6" /> Pescador
            </h1>
            <p className="text-sm text-gray-500 mt-2">Panel de Reservas</p>
          </div>
          
          {/* Navigation Links Container with Scroll */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="flex flex-col gap-2 px-4">
              <NavLink
                to="/fisher/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-blue-50 text-gray-700"
                  }`
                }
                onClick={closeMobileMenu}
              >
                <User className="w-5 h-5" />
                Clubes
              </NavLink>
              <NavLink
                to="/fisher/reservas"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-blue-50 text-gray-700"
                  }`
                }
                onClick={closeMobileMenu}
              >
                <CalendarDays className="w-5 h-5" />
                Mis Reservas
                
              </NavLink>
                {/* Logout Button at Bottom */}
          <div className="mt-auto p-4 border-t">
            <LogoutButton />
          </div>
            </nav>
          </div>
          
        
        </div>
      </aside>
    </>
  );
};

export default SidebarPescador;
