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
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
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
      setError(err.message || "Error al registrar club.");
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
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-2 border rounded-md"
          type="tel"
          placeholder="Celular de contacto"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md font-semibold"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default RegisterClub;
