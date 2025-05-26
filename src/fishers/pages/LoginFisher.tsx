import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

const LoginFisher: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Login Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
      // 2. Buscar datos del usuario por UID en Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // ATENCIÓN: el campo es 'tipo' y debe ser exactamente 'pescador'
        if (userData.tipo === 'pescador') {
          navigate('/fisher/dashboard');
        } else {
          setError('Este usuario no es un pescador. Usá el acceso de clubes.');
        }
      } else {
        setError('Perfil de usuario no encontrado.');
      }
    } catch (err: any) {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetMessage('');
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('¡Revisa tu casilla de correo! Hemos enviado el link de recuperación.');
      setShowReset(false);
      setResetEmail('');
    } catch (err: any) {
      setError('No pudimos enviar el email. ¿El correo es correcto?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-green-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <h2 className="text-2xl font-bold text-center text-blue-700">Ingreso Pescador</h2>
          <input 
            className="w-full px-4 py-2 border rounded-md" 
            type="email" 
            placeholder="Correo electrónico" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            className="w-full px-4 py-2 border rounded-md" 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          {error && <div className="text-red-500 text-center">{error}</div>}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md font-semibold"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="text-center">
          <div className="mb-2">
            <button
              type="button"
              className="text-blue-700 hover:underline font-semibold"
              onClick={() => setShowReset(!showReset)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div>
            <span>¿No tenés cuenta? </span>
            <Link to="/register-fisher" className="text-blue-700 hover:underline font-semibold">
              Registrate aquí
            </Link>
          </div>
        </div>

        {showReset && (
          <div className="mt-4">
            <div className="p-4 bg-gray-50 rounded-md space-y-2">
              <h3 className="font-semibold text-gray-700">Recuperar contraseña</h3>
              <p className="text-sm text-gray-600 mb-2">
                Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-2">
                <input
                  className="w-full px-4 py-2 border rounded-md text-sm"
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md text-sm font-semibold"
                  >
                    {loading ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
            {resetMessage && (
              <div className="text-green-600 text-center text-sm mt-2">
                {resetMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginFisher;
