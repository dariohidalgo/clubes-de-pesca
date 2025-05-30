// src/club/components/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Bell, Fish, Ship, ClipboardList, Menu, X, Star } from 'lucide-react';
import LogoutButton from "../../auth/LogoutButton";
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const navLinks = [
  { to: '/club/inicio', label: 'Inicio', icon: <ClipboardList className="w-5 h-5" /> },
  { to: '/club/reservas', label: 'Reservas', icon: <CalendarDays className="w-5 h-5" /> },
  { to: '/club/botes', label: 'Botes', icon: <Ship className="w-5 h-5" /> },
  { to: '/club/carnadas', label: 'Carnadas', icon: <Fish className="w-5 h-5" /> },
  { to: '/club/calificaciones', label: 'Calificaciones', icon: <Star className="w-5 h-5" /> },
  { to: '/club/notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> },
];

const Sidebar: React.FC = () => {
  const [user] = useAuthState(auth);
  const [clubName, setClubName] = useState('');
  
  useEffect(() => {
    const fetchClubName = async () => {
      if (user) {
        const clubDoc = await getDoc(doc(db, 'clubs', user.uid));
        if (clubDoc.exists()) {
          setClubName(clubDoc.data().name || '');
        }
      }
    };
    
    fetchClubName();
  }, [user]);
  const { pathname } = useLocation();
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white"
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
        className={`fixed md:static z-40 w-64 bg-white border-r h-100dvh flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="text-lg font-bold mb-10 mt-10">
            {clubName ? (
              <>
                ¡Bienvenido!<br />
                <span className="text-blue-600">{clubName}</span>
              </>
            ) : (
              'Cargando...'
            )}
            <div className="text-sm font-normal text-gray-500 mt-2">Panel de administración</div>
          </div>
          <nav className="flex flex-col gap-2">
    
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm sm:text-base ${
                  pathname === to
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-blue-600">{icon}</span> {label}
              </Link>
            ))}
            <div className="mt-2 mx-auto" onClick={closeMobileMenu}>
              <LogoutButton />
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
