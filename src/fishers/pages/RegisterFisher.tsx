import React, { useState } from 'react';
import { auth, db } from '../../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

const RegisterFisher: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Guardar datos extra en Firestore SOLO si Auth fue exitoso
      await setDoc(doc(db, 'users', uid), {
        nombre,
        celular,
        email,
        tipo: 'pescador',
        creadoEn: new Date(),
      });

      navigate('/fisher/dashboard'); // Redirigir al dashboard de pescadores
    } catch (err: any) {
      // Manejo de errores comunes de Firebase Auth
      if (err.code === 'auth/email-already-in-use') {
        setError('Ya existe un usuario registrado con ese correo.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo electrónico no es válido.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('No se pudo registrar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-green-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-700">Registro Pescador</h2>
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="text"
          placeholder="Ej: 351 1234-5678"
          value={celular}
          onChange={e => setCelular(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            
            minLength={6}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Contraseña
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={6}
          />
        </div>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-md font-semibold"
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        <div className="text-center mt-2">
          <span>¿Ya tenés cuenta? </span>
          <Link to="/login-fisher" className="text-blue-700 hover:underline font-semibold">
            Ingresá aquí
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterFisher;
