import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

const LoginFisher: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-green-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-700">Ingreso Pescador</h2>
        <input className="w-full px-4 py-2 border rounded-md" type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="w-full px-4 py-2 border rounded-md" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="text-red-500 text-center">{error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md font-semibold">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        <div className="text-center mt-2">
          <span>¿No tenés cuenta? </span>
          <Link to="/register-fisher" className="text-blue-700 hover:underline font-semibold">Registrate aquí</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginFisher;
