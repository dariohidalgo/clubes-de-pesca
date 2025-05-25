import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface PrivateRouteProps {
  children: ReactNode;
  role: 'club' | 'fisher';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const docSnap = await getDoc(ref);
        
        if (!docSnap.exists()) {
          // Intentar buscar en la colección de clubs si no se encuentra en users
          const clubRef = doc(db, 'clubs', user.uid);
          const clubSnap = await getDoc(clubRef);
          
          if (clubSnap.exists()) {
            // Si encontramos el club, establecer el rol como 'club'
            setUserRole('club');
          } else {
            setError('No se encontró el perfil de usuario');
          }
        } else {
          // Verificar si el documento tiene el campo 'tipo'
          const userData = docSnap.data();
          if (userData && 'tipo' in userData) {
            setUserRole(userData.tipo);
          } else {
            // Si no tiene el campo 'tipo', intentar determinar el rol basado en la colección
            setUserRole(docSnap.ref.path.includes('clubs') ? 'club' : 'pescador');
          }
        }
      } catch (err) {
        console.error('Error al verificar el rol del usuario:', err);
        setError('Error al cargar la información del usuario');
      } finally {
        setChecking(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Mostrar carga mientras se verifica la autenticación
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login correspondiente
  if (!user) {
    const redirectTo = role === 'club' ? '/login-club' : '/login-fisher';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Si hay un error al cargar el perfil
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
          <div className="text-red-500 text-center mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">Error de autenticación</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Verificar si el rol del usuario coincide con la ruta
  const isAuthorized = (role === 'club' && userRole === 'club') || 
                     (role === 'fisher' && userRole === 'pescador');

  if (!isAuthorized) {
    // Si el usuario no está autorizado, redirigir según su rol
    const redirectTo = userRole === 'club' ? '/club/inicio' : '/fisher/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  // Si todo está bien, renderizar los hijos
  return <>{children}</>;
};

export default PrivateRoute;
