import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

interface Club {
  id: string;
  name: string;
  logoUrl: string;
  location: string;
  phone: string;
  boats: { tipo: string; cantidad: number; capacidad: number; precio: number }[];
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
  const navigate = useNavigate();

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

  const handleReservar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!bote) return setError("Seleccioná un tipo de bote");
    if (!fecha) return setError("Seleccioná una fecha");
    if (personas < 1 || personas > capacidad) return setError("Cantidad de personas inválida");

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

      // Crear notificación para el administrador del club
      if (clubId) {
        await addDoc(collection(db, "notifications"), {
          clubId,
          title: "Nueva reserva recibida",
          message: `${nombre} ha realizado una reserva para ${new Date(fecha).toLocaleDateString('es-AR')}`,
          type: "reserva",
          read: false,
          reservaId: reservaRef.id,
          total,
          createdAt: new Date(),
        });
      }

      setMensaje("¡Reserva enviada con éxito! Te avisaremos cuando el club la confirme.");
      setTimeout(() => navigate("/fisher/reservas"), 1800);
    } catch (err: any) {
      console.error("Error al crear la reserva:", err);
      setError("No se pudo registrar la reserva. Por favor, intentá nuevamente.");
    }
  };

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
            <label className="block font-semibold mb-1">Tipo de Bote</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={bote}
              onChange={(e) => setBote(e.target.value)}
              required
            >
              <option value="">Seleccioná un bote</option>
              {club.boats.filter(b => b.cantidad > 0).map((b) => (
                <option key={`${b.tipo}-${b.capacidad}`} value={b.tipo}>
                  {b.tipo} (capacidad {b.capacidad}) - ${b.precio}
                </option>
              ))}
            </select>
          </div>
          <div>
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
          {error && <div className="text-red-600 text-center">{error}</div>}
          {mensaje && <div className="text-green-700 text-center">{mensaje}</div>}
          <button
            type="submit"
            className="w-full bg-green-700 text-white font-semibold py-2 rounded-md hover:bg-green-800 mt-2"
          >
            Reservar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservarClub;
