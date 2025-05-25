import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";

const LogoutButton: React.FC<{ to?: string }> = ({ to = "/" }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Limpiar cualquier estado de autenticación si es necesario
      localStorage.removeItem('user'); // Opcional: eliminar datos de usuario del localStorage
      
      // Redirigir a la página de inicio
      navigate(to, { replace: true });
      
      // Recargar la página para asegurar un estado limpio
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aún así redirigir en caso de error
      navigate(to, { replace: true });
    }
  };

  return (
    <button
      className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors duration-200"
      onClick={handleLogout}
    >
      Cerrar sesión
    </button>
  );
};

export default LogoutButton;
