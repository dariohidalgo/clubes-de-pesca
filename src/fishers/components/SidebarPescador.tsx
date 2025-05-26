import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Fish, CalendarDays, User, Menu, X, MapPin } from "lucide-react";
import LogoutButton from "../../auth/LogoutButton";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebaseConfig";

const SidebarPescador: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useAuthState(auth);
  

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
        className="md:hidden fixed top-3 left-3 z-[60] p-2 rounded-md bg-blue-600 text-white shadow-md"
        aria-label="Menú"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para móviles */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-white bg-opacity-90 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 md:relative z-50 w-64 bg-white border-r h-screen flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="py-8 px-6 border-b mt-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Fish className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-700">Pescador</h1>
                <p className="text-sm text-gray-500">Panel de Reservas</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Bienvenido</p>
              <p className="font-medium text-gray-800">
                {user?.displayName || user?.email || 'Usuario'}
              </p>
            </div>
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
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`
                }
                onClick={closeMobileMenu}
              >
                <CalendarDays className="w-5 h-5 mr-3" />
                Mis Reservas
              </NavLink>
              <NavLink
                to="/fisher/zonas-pesca"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`
                }
                onClick={closeMobileMenu}
              >
                <MapPin className="w-5 h-5 mr-3" />
                Zonas de Pesca
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
