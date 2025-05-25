import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const LoginClub: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      // 1. Login Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 2. Buscar rol en Firestore
      const clubRef = doc(db, 'clubs', userCredential.user.uid);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        const clubData = clubSnap.data();
        if (clubData.tipo === 'club') {
          navigate('/club/inicio');
        } else {
          setError('Este usuario no es un club. Usá el acceso para pescadores.');
        }
      } else {
        setError('Perfil de usuario no encontrado.');
      }
    } catch (err: any) {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetMessage('');
    setError('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('¡Revisa tu casilla de correo! Hemos enviado el link de recuperación.');
      setShowReset(false);
      setResetEmail('');
    } catch (err: any) {
      setError('No pudimos enviar el email. ¿El correo es correcto?');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-green-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-700">Login Club</h2>
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="email"
          placeholder="Correo del club"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-center">{error}</div>}
        {resetMessage && <div className="text-green-600 text-center">{resetMessage}</div>}
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md font-semibold"
        >
          Ingresar
        </button>
        <div className="text-center mt-2">
          <button
            type="button"
            className="text-blue-700 hover:underline font-semibold"
            onClick={() => setShowReset(!showReset)}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        {showReset && (
          <form
            onSubmit={handleResetPassword}
            className="mt-4 space-y-2"
          >
            <input
              className="w-full px-4 py-2 border rounded-md"
              type="email"
              placeholder="Ingresa tu email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold"
            >
              Enviar link de recuperación
            </button>
          </form>
        )}
        <div className="text-center mt-2">
          <span>¿Aún no tenés cuenta? </span>
          <Link to="/register-club" className="text-blue-700 hover:underline font-semibold">
            Registrate aquí
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginClub;
