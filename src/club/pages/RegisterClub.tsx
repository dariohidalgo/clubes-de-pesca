import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

const RegisterClub: React.FC = () => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
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
      // 1. Registrar usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Guardar datos adicionales en Firestore
      await setDoc(doc(db, "clubs", user.uid), {
        name,
        surname,
        email,
        phone,
        createdAt: new Date(),
        tipo: 'club', // <-- ¡Este campo es clave!
      });

      // 3. Redirigir al login de clubes
      navigate('/login-club');
    } catch (err: any) {
      // Manejo de errores comunes de Firebase Auth
      if (err.code === 'auth/email-already-in-use') {
        setError('Ya existe un usuario registrado con ese correo.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo electrónico no es válido.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Error al registrar: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-700">Registro de Club</h2>
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="text"
          placeholder="Nombre del club"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="text"
          placeholder="Apellido del responsable"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Vuelve a escribir tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Celular de contacto
            </label>
            <input
              id="phone"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="tel"
              placeholder="Ej: 351 1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md font-semibold transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Registrando...' : 'Crear cuenta de club'}
        </button>
        <p className="text-center text-sm text-gray-600">
          ¿Ya tenés una cuenta?{' '}
          <a href="/login-club" className="text-blue-700 hover:underline font-medium">
            Iniciar sesión
          </a>
        </p>
      </form>
    </div>
  );
};

export default RegisterClub;
