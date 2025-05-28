import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, updateDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import StarRating from "../../components/common/StarRating";

interface Bote {
  tipo: string;
  cantidad: number;
  capacidad: number;
  precio: number;
  disponible?: boolean;
  stock?: number;
}

interface Club {
  id: string;
  name: string;
  logoUrl: string;
  location: string;
  phone: string;
  boats: Bote[];
  mojarras?: { precio: number; disponible: boolean };
}

const ReservarClub: React.FC = () => {
  const { clubId } = useParams();
  const [user] = useAuthState(auth);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [bote, setBote] = useState<string>("");
  const [capacidad, setCapacidad] = useState<number>(1);
  const [personas, setPersonas] = useState<number>(1);
  const [mojarras, setMojarras] = useState<number>(0);
  const [precioBote, setPrecioBote] = useState<number>(0);
  const [precioMojarra, setPrecioMojarra] = useState<number>(0);
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [stock, setStock] = useState<{[key: string]: number}>({});
  const [showRating, setShowRating] = useState(false);
 
  const [hasRated, setHasRated] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario ya calificó este club
  
    

  const handleRatingSubmit = async (rating: number) => {
    if (!user?.uid || !clubId) return;
    
    try {
      const ratingRef = doc(db, 'ratings', `${user.uid}_${clubId}`);
      await setDoc(ratingRef, {
        userId: user.uid,
        clubId,
        rating,
        createdAt: new Date()
      });
      
      // Actualizar el promedio en el club
      await updateClubAverageRating();
      
  
      setHasRated(true);
      setShowRating(false);
      
    } catch (error) {
      console.error('Error al guardar calificación:', error);
      setError('No se pudo guardar la calificación. Por favor, intentá nuevamente.');
    }
  };

  const updateClubAverageRating = async () => {
    if (!clubId) return;
    
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('clubId', '==', clubId));
      const querySnapshot = await getDocs(q);
      
      let total = 0;
      let count = 0;
      
      querySnapshot.forEach((doc: any) => {
        total += doc.data().rating;
        count++;
      });
      
      const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      
      // Actualizar el promedio en el documento del club
      const clubRef = doc(db, 'clubs', clubId);
      await updateDoc(clubRef, {
        averageRating: average,
        ratingCount: count
      });
      
    } catch (error) {
      console.error('Error al actualizar calificación promedio:', error);
    }
  };

  // Traer datos del club y precios
  useEffect(() => {
    const fetchClub = async () => {
      setLoading(true);
      if (clubId) {
        const docRef = doc(db, "clubs", clubId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Club;
          setClub(data);

          // Inicializar stock
          const stockInicial: {[key: string]: number} = {};
          data.boats.forEach(boat => {
            stockInicial[`${boat.tipo}-${boat.capacidad}`] = boat.cantidad;
          });
          setStock(stockInicial);

          // Set precio mojarra si hay info
          if (data.mojarras && typeof data.mojarras.precio === "number") {
            setPrecioMojarra(data.mojarras.precio);
          }
        }
      }
      setLoading(false);
    };
    fetchClub();
  }, [clubId]);

  // Al cambiar el tipo de bote, buscar precio/capacidad
  useEffect(() => {
    if (club && bote) {
      const found = club.boats.find((b) => b.tipo === bote);
      setCapacidad(found?.capacidad || 1);
      setPrecioBote(found?.precio || 0);
      setPersonas(1);
    }
    if (club && club.mojarras && typeof club.mojarras.precio === "number") {
      setPrecioMojarra(club.mojarras.precio);
    }
  }, [bote, club]);

  // Calcular total
  const total = precioBote + precioMojarra * mojarras;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReservar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    if (isSubmitting) return; // Si ya está enviando, no hace nada
    setIsSubmitting(true);

    if (!bote) return setError("Seleccioná un tipo de bote");
    if (!fecha) return setError("Seleccioná una fecha");
    if (personas < 1 || personas > capacidad) return setError("Cantidad de personas inválida");
    
    // Verificar stock
    const boteKey = `${bote}-${capacidad}`;
    if ((stock[boteKey] || 0) <= 0) {
      return setError("No hay disponibilidad para este tipo de bote");
    }

    try {
      // Recuperar perfil del pescador de Firestore
      let nombre = "";
      let celular = "";
      if (user?.uid) {
        const perfilRef = doc(db, "users", user.uid);
        const perfilSnap = await getDoc(perfilRef);
        if (perfilSnap.exists()) {
          const data = perfilSnap.data();
          nombre = data.nombre || "";
          celular = data.celular || "";
        }
      }

      // Crear la reserva
      const reservaRef = await addDoc(collection(db, "reservas"), {
        clubId,
        clubName: club?.name,
        userId: user?.uid,
        nombre,
        email: user?.email || "",
        celular,
        bote,
        personas,
        mojarras,
        precioBote,
        precioMojarra,
        total,
        fecha,
        estado: "pendiente",
        mensaje: "",
        createdAt: new Date(),
      });

      // Actualizar stock en Firestore
      if (clubId && club) {
        const clubRef = doc(db, "clubs", clubId);
        await updateDoc(clubRef, {
          boats: club.boats.map(boat => 
            boat.tipo === bote && boat.capacidad === capacidad
              ? { ...boat, cantidad: (boat.cantidad || 0) - 1 }
              : boat
          )
        });

        // Actualizar stock local
        setStock(prev => ({
          ...prev,
          [boteKey]: (prev[boteKey] || 0) - 1
        }));
      }

      // Crear notificación para el administrador del club
      if (clubId) {
        // Crear fecha actual con la zona horaria correcta
        const ahora = new Date();
        const offset = ahora.getTimezoneOffset() * 60000; // offset en milisegundos
        const fechaNotificacion = new Date(ahora.getTime() - offset);
        
        // Crear fecha de reserva con la zona horaria correcta
        const fechaReserva = new Date(fecha);
        const fechaReservaAjustada = new Date(fechaReserva.getTime() - (fechaReserva.getTimezoneOffset() * 60000));
        
        // Formatear la fecha de reserva manualmente para evitar problemas de zona horaria
        const dia = String(fechaReservaAjustada.getDate()).padStart(2, '0');
        const mes = String(fechaReservaAjustada.getMonth() + 1).padStart(2, '0');
        const anio = fechaReservaAjustada.getFullYear();
        const fechaReservaFormateada = `${dia}/${mes}/${anio}`;
        
        console.log('Fecha de reserva original:', fecha);
        console.log('Fecha de reserva ajustada:', fechaReservaAjustada);
        console.log('Fecha de reserva formateada:', fechaReservaFormateada);

        await addDoc(collection(db, "notifications"), {
          clubId,
          title: "Nueva reserva recibida",
          message: `${nombre} ha realizado una reserva para el ${fechaReservaFormateada}`,
          type: "reserva",
          read: false,
          reservaId: reservaRef.id,
          total,
          createdAt: fechaNotificacion,
        });
      }

      setMensaje("¡Reserva enviada con éxito! Te avisaremos cuando el club la confirme.");
      setShowRating(true);
      
      // Navegar después de 5 segundos si no califica
      const timer = setTimeout(() => {
        if (!hasRated) {
          navigate("/fisher/reservas");
        }
      }, 10000);
      
      return () => clearTimeout(timer);
    } catch (err: any) {
      console.error("Error al crear la reserva:", err);
      setError("No se pudo registrar la reserva. Por favor, intentá nuevamente.");
    }
  };

  // Clasificar botes por tipo
  const clasificarBotes = () => {
    if (!club) return { conMotor: [], sinMotor: [], conTracker: [] };
    
    return club.boats.reduce<{ 
      conMotor: Bote[]; 
      sinMotor: Bote[]; 
      conTracker: Bote[] 
    }>((acc, bote) => {
      const boteConStock: Bote = {
        ...bote,
        disponible: stock[`${bote.tipo}-${bote.capacidad}`] > 0,
        stock: stock[`${bote.tipo}-${bote.capacidad}`] || 0
      };
      
      if (bote.tipo.toLowerCase().includes('motor')) {
        acc.conMotor.push(boteConStock);
      } else if (bote.tipo.toLowerCase().includes('tracker')) {
        acc.conTracker.push(boteConStock);
      } else {
        acc.sinMotor.push(boteConStock);
      }
      
      return acc;
    }, { conMotor: [], sinMotor: [], conTracker: [] });
  };

  const botesPorTipo = clasificarBotes();

  if (loading) return <div className="text-center mt-8">Cargando club...</div>;
  if (!club) return <div className="text-center mt-8 text-red-600">Club no encontrado.</div>;

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center py-10">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <img src={club.logoUrl} alt={club.name} className="w-20 h-20 rounded-full border-2 border-blue-400 object-cover" />
          <div>
            <h2 className="text-2xl font-bold text-blue-800">{club.name}</h2>
            <p className="text-gray-600">{club.location}</p>
            <p className="text-gray-600">📞 {club.phone}</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleReservar}>
          <div>
            <label className="block font-semibold mb-2">Botes Disponibles</label>
            
            {/* Sección de Botes con Motor */}
            {botesPorTipo.conMotor.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">🛥️</span> Botes con Motor
                </h3>
                <div className="space-y-3">
                  {botesPorTipo.conMotor.map((b) => (
                    <div 
                      key={`${b.tipo}-${b.capacidad}`}
                      className={`p-4 border-2 rounded-lg transition-all ${b.disponible ? 'hover:border-blue-300 hover:shadow-md cursor-pointer border-blue-100' : 'border-gray-200 opacity-70'}`}
                      onClick={() => b.disponible && setBote(b.tipo)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{b.tipo}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            Capacidad: <span className="font-medium">{b.capacidad} personas</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          b.disponible 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {b.disponible ? `✅ ${b.stock} disponibles` : '❌ Sin stock'}
                        </span>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-lg font-bold text-blue-700">
                          ${b.precio.toLocaleString('es-AR')}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">/día</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sección de Botes sin Motor */}
            {botesPorTipo.sinMotor.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">🚣</span> Botes a Remo
                </h3>
                <div className="space-y-3">
                  {botesPorTipo.sinMotor.map((b) => (
                    <div 
                      key={`${b.tipo}-${b.capacidad}`}
                      className={`p-4 border-2 rounded-lg transition-all ${b.disponible ? 'hover:border-blue-300 hover:shadow-md cursor-pointer border-blue-100' : 'border-gray-200 opacity-70'}`}
                      onClick={() => b.disponible && setBote(b.tipo)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{b.tipo}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            Capacidad: <span className="font-medium">{b.capacidad} personas</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          b.disponible 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {b.disponible ? `✅ ${b.stock} disponibles` : '❌ Sin stock'}
                        </span>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-lg font-bold text-blue-700">
                          ${b.precio.toLocaleString('es-AR')}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">/día</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sección de Botes con Tracker */}
            {botesPorTipo.conTracker.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">📍</span> Tracker
                </h3>
                <div className="space-y-3">
                  {botesPorTipo.conTracker.map((b) => (
                    <div 
                      key={`${b.tipo}-${b.capacidad}`}
                      className={`p-4 border-2 rounded-lg transition-all ${b.disponible ? 'hover:border-blue-300 hover:shadow-md cursor-pointer border-blue-100' : 'border-gray-200 opacity-70'}`}
                      onClick={() => b.disponible && setBote(b.tipo)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{b.tipo}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            Capacidad: <span className="font-medium">{b.capacidad} personas</span>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            📍 Traker
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          b.disponible 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {b.disponible ? `✅ ${b.stock} disponibles` : '❌ Sin stock'}
                        </span>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-lg font-bold text-blue-700">
                          ${b.precio.toLocaleString('es-AR')}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">/día</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Select oculto para mantener la selección del formulario */}
            <select
              className="hidden"
              value={bote}
              onChange={(e) => setBote(e.target.value)}
              required
            >
              <option value="">Seleccioná un bote</option>
              {club.boats
                .filter(b => b.cantidad > 0)
                .map((b) => (
                  <option key={`${b.tipo}-${b.capacidad}`} value={b.tipo}>
                    {b.tipo}
                  </option>
                ))}
            </select>
          </div>
          <div>
            {bote && (
              <div className="text-sm text-gray-600 mb-2">
                {stock[`${bote}-${capacidad}`] > 0 
                  ? `✅ ${stock[`${bote}-${capacidad}`]} disponibles`
                  : "❌ No hay disponibilidad"}
              </div>
            )}
            <label className="block font-semibold mb-1">Cantidad de personas</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="number"
              min={1}
              max={capacidad}
              value={personas}
              onChange={(e) => setPersonas(Number(e.target.value))}
              required
            />
            <span className="text-xs text-gray-500">Máximo permitido: {capacidad}</span>
          </div>
          <div>
            <label className="block font-semibold mb-1">Cantidad de mojarras (paquetes de 100)</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="number"
              min={0}
              max={100}
              value={mojarras}
              onChange={(e) => setMojarras(Number(e.target.value))}
            />
            <span className="text-xs text-gray-500">Cada paquete son 100 mojarras</span>
          </div>
          <div>
            <label className="block font-semibold mb-1">Fecha</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Precio total</label>
            <div className="font-bold text-lg text-green-800">
              ${total.toLocaleString("es-AR")}
            </div>
            <div className="text-xs text-gray-500">
              Bote: ${precioBote.toLocaleString("es-AR")} + Mojarras: ${precioMojarra.toLocaleString("es-AR")} x {mojarras}
            </div>
          </div>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
          {mensaje && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
              {mensaje}
              {/* {showRating && !hasRated && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¿Cómo calificarías tu experiencia con {club?.name}?</h3>
                  <div className="flex justify-center my-4">
                    <StarRating 
                      clubId={clubId || ''} 
                      onRatingChange={handleRatingSubmit}
                      size="lg"
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Tu opinión ayuda a otros pescadores a elegir el mejor club.
                  </p>
                </div>
              )} */}
          
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                
                  <button 
                    onClick={() => navigate("/fisher/reservas")}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver mis reservas →
                  </button>
                </div>
          
            </div>
          )}
         <button
  type="submit"
  className="w-full bg-green-700 text-white font-semibold py-2 rounded-md hover:bg-green-800 mt-2 disabled:opacity-60"
  disabled={isSubmitting}
>
  {isSubmitting ? "Procesando..." : "Reservar"}
</button>

        </form>
      </div>
    </div>
  );
};

export default ReservarClub;
