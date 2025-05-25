import React, { useEffect, useState } from 'react';
import { auth, db } from '../../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Reserva {
  id: string;
  clubId: string;
  clubName: string;
  bote: string;
  capacidad: number;
  personas: number;
  mojarras: number;
  fecha: string; // ISO string o dd/mm/yyyy
  estado: 'pendiente' | 'confirmada' | 'eliminada';
  mensaje?: string;
  total?: number;
  precioBote?: number;
  precioMojarra?: number;
}

const FisherBookings: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservas = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, 'reservas'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const reservasList: Reserva[] = [];
        querySnapshot.forEach(doc => {
          reservasList.push({ id: doc.id, ...doc.data() } as Reserva);
        });
        setReservas(reservasList);
      } catch (error) {
        console.error("Error trayendo reservas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, []);

  // Función para calcular el total si no viene en la reserva
  const calcularTotal = (reserva: Reserva) => {
    if (typeof reserva.total === "number") return reserva.total;
    const precioBote = reserva.precioBote ?? 0;
    const precioMojarra = reserva.precioMojarra ?? 0;
    return precioBote + (precioMojarra * (reserva.mojarras || 0));
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 px-2 sm:px-0">
      <h1 className="text-3xl font-bold mb-8 text-center">Mis reservas</h1>
      {loading ? (
        <div className="text-center text-gray-500">Cargando reservas...</div>
      ) : reservas.length === 0 ? (
        <div className="text-center text-gray-500">No tenés reservas todavía.</div>
      ) : (
        <div className="flex flex-col gap-5">
          {reservas.map(reserva => (
            <div
              key={reserva.id}
              className={`rounded-2xl shadow-md p-5 flex flex-col gap-2 border-l-8 sm:border-l-4
                ${
                  reserva.estado === 'confirmada'
                    ? 'border-green-500'
                    : reserva.estado === 'eliminada'
                    ? 'border-red-500'
                    : 'border-yellow-400'
                }
                bg-white
              `}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1">
                <span className="font-semibold text-lg">{reserva.clubName}</span>
                <span className={
                  reserva.estado === 'confirmada'
                    ? 'text-green-700 font-bold'
                    : reserva.estado === 'eliminada'
                    ? 'text-red-700 font-bold'
                    : 'text-orange-600 font-bold'
                }>
                  {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700">
                <div>
                  <span className="font-semibold">Fecha:</span> {reserva.fecha}
                </div>
                <div>
                  <span className="font-semibold">Bote:</span> {reserva.bote} ({reserva.capacidad} personas)
                </div>
                <div>
                  <span className="font-semibold">Personas:</span> {reserva.personas}
                </div>
                <div>
                  <span className="font-semibold">Mojarras:</span> {reserva.mojarras} unidades
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-bold text-green-800 text-lg">Total:</span>
                <span className="text-lg font-semibold">
                  ${calcularTotal(reserva).toLocaleString("es-AR")}
                </span>
              </div>
              {reserva.mensaje && (
                <div className="bg-gray-100 border rounded p-2 mt-2 text-sm text-gray-700">
                  <span className="font-semibold">Mensaje del club:</span> {reserva.mensaje}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FisherBookings;
