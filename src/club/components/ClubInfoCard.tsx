import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

interface ClubData {
  name: string;
  location: string;
  boatsCount: number;
  email: string;
  phone: string;
  logoUrl: string;
}

const ClubInfoCard: React.FC = () => {
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ClubData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) throw new Error('No hay usuario autenticado');
      const docRef = doc(db, 'clubs', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('No se encontraron datos del club');
      const data = docSnap.data() as ClubData;
      setClubData(data);
      setForm(data);
      if (data.logoUrl) setImagePreview(data.logoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del club');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cambios en inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading || !form) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Imagen nueva
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setMessage('');
    setError('');
  };

  const handleCancel = () => {
    setEditing(false);
    setForm(clubData);
    setImageFile(null);
    setImagePreview(clubData?.logoUrl || null);
    setMessage('');
    setError('');
  };

  // Guardar cambios (subir imagen si hay)
  const handleSave = async () => {
    setError('');
    if (!form || !auth.currentUser) {
      setError('Error de autenticación.');
      return;
    }
    setLoading(true);
    let logoUrl = form.logoUrl || '';
    try {
      // 1. Subir imagen si hay
      if (imageFile) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) throw new Error('Faltan credenciales de Cloudinary');
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', uploadPreset);
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const res = await fetch(uploadUrl, { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.secure_url) throw new Error('No se pudo subir la imagen');
        logoUrl = data.secure_url;
      }
      // 2. Actualizar Firestore
      const docRef = doc(db, 'clubs', auth.currentUser.uid);
      await updateDoc(docRef, { ...form, logoUrl });
      await fetchData();
      setEditing(false);
      setImageFile(null);
      setImagePreview(logoUrl);
      setMessage('¡Perfil actualizado con éxito!');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al actualizar los datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Cargando información del club...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={fetchData} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? 'Cargando...' : error || 'No se pudieron cargar los datos del club.'}
      </div>
    );
  }

  // --- CARD ---
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl px-6 py-8 sm:p-12 my-6 transition-all duration-300">
      {/* Encabezado logo y nombre */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 sm:w-40 sm:h-40 mb-3 shadow-md ring-4 ring-blue-100 overflow-hidden bg-gray-100 relative">
          {editing ? (
            <label className="cursor-pointer w-full h-full block">
              <img
                src={imagePreview || form.logoUrl || '/placeholder.jpg'}
                alt="Logo club"
                className="w-full h-full object-cover rounded-full "
              />
              <span className="absolute inset-x-0 bottom-0 text-xs text-blue-800 rounded-b-full py-1 text-center">Cambiar imagen</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <img
              src={form.logoUrl || '/placeholder.jpg'}
              alt="Logo club"
              className="w-full h-full object-cover rounded-full border-2 border-blue-100"
            />
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-800 mt-2">{form.name}</h2>
        <p className="text-gray-500 text-base sm:text-lg">{form.location}</p>
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 mt-8">
        <div>
          <div className="text-sm font-medium text-gray-500">Nombre del club</div>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              name="name"
              value={form.name}
              onChange={handleInputChange}
            />
          ) : (
            <div className="font-semibold text-lg">{form.name}</div>
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Ubicación</div>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              name="location"
              value={form.location}
              onChange={handleInputChange}
            />
          ) : (
            <div className="font-semibold text-lg">{form.location}</div>
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Cantidad de botes</div>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              name="boatsCount"
              type="number"
              value={form.boatsCount}
              onChange={handleInputChange}
            />
          ) : (
            <div className="font-semibold text-lg">{form.boatsCount}</div>
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Correo electrónico</div>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              name="email"
              value={form.email}
              onChange={handleInputChange}
            />
          ) : (
            <div className="font-semibold text-lg">{form.email}</div>
          )}
        </div>
        <div className="sm:col-span-2">
          <div className="text-sm font-medium text-gray-500">Celular</div>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              name="phone"
              value={form.phone}
              onChange={handleInputChange}
            />
          ) : (
            <div className="font-semibold text-lg">{form.phone}</div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {message && <div className="mt-4 text-green-700 font-medium text-center">{message}</div>}
      {error && <div className="mt-4 text-red-600 font-medium text-center">{error}</div>}

      {/* Botones */}
      <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
        {editing ? (
          <>
            <button
              className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 font-semibold transition"
              onClick={handleSave}
              disabled={loading}
              type="button"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold transition"
              onClick={handleCancel}
              disabled={loading}
              type="button"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 font-semibold transition"
            onClick={handleEdit}
            type="button"
          >
            Editar perfil
          </button>
        )}
      </div>
    </div>
  );
};

export default ClubInfoCard;
