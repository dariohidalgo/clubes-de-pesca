import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '../../../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';

import { toast } from 'react-toastify';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ClubRatingModal from '../components/ClubRatingModal';

interface HistorialItem {
  fecha: string;
  accion: string;
  detalles: string;
}

interface Reserva {
  id: string;
  clubId: string;
  clubName: string;
  bote: string;
  capacidad: number;
  personas: number;
  mojarras: number;
  fecha: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  mensaje?: string;
  total?: number;
  precioBote?: number;
  precioMojarra?: number;
  fechaCreacion?: string;
  fechaCancelacion?: string;
  actualizadoEl?: string;
  userId?: string;
  historial?: HistorialItem[];
  fechaTimestamp?: Timestamp;
  canceladoPor?: 'club' | 'fisher';
}

type FiltroEstado = 'todas' | 'pendiente' | 'confirmada' | 'cancelada';

const FisherBookings: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtro, setFiltro] = useState<FiltroEstado>('todas');
  const [loading, setLoading] = useState(true);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [modifyData, setModifyData] = useState({
    personas: 1,
    mojarras: 0,
    fecha: ''
  });
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedClub] = useState<{id: string, name: string} | null>(null);

  // Usar useCallback para memoizar la función de carga
  const cargarReservas = useCallback(async () => {
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
      
   
      const reservasVistas = new Set<string>();
      
      querySnapshot.forEach(doc => {
        const reservaId = doc.id;
        if (!reservasVistas.has(reservaId)) {
          const reservaData = doc.data() as Omit<Reserva, 'id'>;
    
          reservasList.push({ id: reservaId, ...reservaData });
          reservasVistas.add(reservaId);
        }
      });
      
     
      setReservas(reservasList);
    } catch (error) {
      console.error("Error trayendo reservas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para cargar las reservas
  useEffect(() => {
    cargarReservas();
    
    // Suscribirse a cambios en la autenticación
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        cargarReservas();
      } else {
        setReservas([]);
      }
    });
    
    // Limpiar suscripción al desmontar
    return () => {
      unsubscribe();
    };
  }, [cargarReservas]);

  // Filtrar y ordenar reservas
  const reservasFiltradas = useMemo(() => {
    const filtered = filtro === 'todas' 
      ? [...reservas] 
      : reservas.filter(reserva => reserva.estado === filtro);

    return filtered.sort((a, b) => {
      const dateA = a.fechaTimestamp?.toDate ? a.fechaTimestamp.toDate() : new Date(a.fecha);
      const dateB = b.fechaTimestamp?.toDate ? b.fechaTimestamp.toDate() : new Date(b.fecha);
      return dateB.getTime() - dateA.getTime();
    });
  }, [reservas, filtro]);

  // Verificar si la reserva puede ser cancelada (más de 48 horas de anticipación)
  const puedeCancelar = useCallback((fechaISO: string) => {
    try {
      // Crear fechas en la zona horaria local
      const fechaReserva = new Date(fechaISO);
      const ahora = new Date();
      
      // Ajustar por la diferencia de zona horaria
      const offset = fechaReserva.getTimezoneOffset() * 60 * 1000;
      const fechaReservaLocal = new Date(fechaReserva.getTime() - offset);
      const ahoraLocal = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60 * 1000));
      
      // Calcular diferencia en horas
      const diferenciaMs = fechaReservaLocal.getTime() - ahoraLocal.getTime();
      const diferenciaHoras = Math.floor(diferenciaMs / (1000 * 60 * 60));
      
     
      
      return diferenciaHoras > 48;
    } catch (e) {
      console.error('Error al verificar fecha de cancelación:', e, 'Fecha recibida:', fechaISO);
      return false;
    }
  }, []);

  // Verificar si la reserva puede ser modificada (más de 24 horas de anticipación)
  const puedeModificar = useCallback((fechaISO: string) => {
    try {
      // Crear fechas en la zona horaria local
      const fechaReserva = new Date(fechaISO);
      const ahora = new Date();
      
      // Ajustar por la diferencia de zona horaria
      const offset = fechaReserva.getTimezoneOffset() * 60 * 1000;
      const fechaReservaLocal = new Date(fechaReserva.getTime() - offset);
      const ahoraLocal = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60 * 1000));
      
      // Calcular diferencia en horas
      const diferenciaMs = fechaReservaLocal.getTime() - ahoraLocal.getTime();
      const diferenciaHoras = Math.floor(diferenciaMs / (1000 * 60 * 60));
      


      
      return diferenciaHoras > 24;
    } catch (e) {
      console.error('Error al verificar fecha de modificación:', e, 'Fecha recibida:', fechaISO);
      return false;
    }
  }, []);

  // Formatear fecha para mostrar (solo fecha, sin hora)
  const formatearFecha = useCallback((fechaISO: string) => {
    try {
      // Extraer año, mes y día del string de fecha (formato YYYY-MM-DD)
      const [year, month, day] = fechaISO.split('-').map(Number);
      
      // Nombres de los días y meses en español
      const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      
      // Crear fecha sin ajustes de zona horaria
      const fecha = new Date(Date.UTC(year, month - 1, day));
      const diaSemana = dias[fecha.getUTCDay()];
      const nombreMes = meses[month - 1];
      
      // Formatear manualmente la fecha (ej: 'lunes 3 de junio de 2025')
      return `${diaSemana} ${day} de ${nombreMes} de ${year}`;
    } catch (e) {
      console.error('Error al formatear fecha:', e, 'Fecha recibida:', fechaISO);
      return fechaISO;
    }
  }, []);



  // Manejar calificación del club
  const handleRateClub = useCallback(async (rating: number, comment: string): Promise<void> => {
    if (!selectedClub) return;
    
    try {
      // Guardar la calificación en la colección de ratings
      await addDoc(collection(db, 'clubRatings'), {
        clubId: selectedClub.id,
        userId: auth.currentUser?.uid,
        rating,
        comment: comment || null,
        createdAt: serverTimestamp(),
        userName: auth.currentUser?.displayName || 'Usuario anónimo',
        clubName: selectedClub.name
      });

      // Actualizar el promedio de calificaciones del club
      const ratingsQuery = query(
        collection(db, 'clubRatings'),
        where('clubId', '==', selectedClub.id)
      );
      
      const snapshot = await getDocs(ratingsQuery);
      let total = 0;
      let count = 0;
      
      snapshot.forEach(doc => {
        total += doc.data().rating;
        count++;
      });
      
      const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      
      // Actualizar el documento del club con el nuevo promedio
      const clubRef = doc(db, 'clubs', selectedClub.id);
      await updateDoc(clubRef, {
        averageRating: average,
        ratingCount: count,
        lastRatedAt: serverTimestamp()
      });
      
      toast.success('¡Gracias por tu calificación!');
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      toast.error('Error al guardar la calificación');
      throw error; // Re-throw to let the modal handle the error
    }
  }, [selectedClub]);

  // Manejar cancelación de reserva
  const handleCancelarReserva = useCallback(async () => {
    if (!selectedReserva) return;
    
    try {
      const reservaRef = doc(db, 'reservas', selectedReserva.id);
      const mensajeCancelacion = puedeCancelar(selectedReserva.fecha) 
        ? 'Reserva cancelada por el usuario con más de 48 horas de anticipación.'
        : 'Reserva cancelada por el usuario con menos de 48 horas de anticipación. Se retendrá la seña.';
      
      // Actualizar la reserva existente con el nuevo estado
      await updateDoc(reservaRef, {
        ...selectedReserva, // Primero esparcimos todos los datos existentes
        estado: 'cancelada', // Luego sobrescribimos solo los campos que necesitamos actualizar
        fechaCancelacion: new Date().toISOString(),
        mensaje: mensajeCancelacion,
        actualizadoEl: new Date().toISOString()
      });
      
      // Crear notificación para el club
      if (selectedReserva.clubId) {
        await addDoc(collection(db, "notifications"), {
          clubId: selectedReserva.clubId,
          title: "Reserva cancelada",
          message: `El usuario ha cancelado una reserva para el ${new Date(selectedReserva.fecha).toLocaleDateString('es-AR')}`,
          tipoAccion: 'cancelacion',
          tipo: 'reserva',
          read: false,
          reservaId: selectedReserva.id,
          total: selectedReserva.total,
          createdAt: new Date(),
        });
      }
      
      // Actualizar estado local
      setReservas(prevReservas => 
        prevReservas.map(r => 
          r.id === selectedReserva.id 
            ? { 
                ...r, 
                estado: 'cancelada',
                mensaje: mensajeCancelacion,
                fechaCancelacion: new Date().toISOString(),
                actualizadoEl: new Date().toISOString()
              } 
            : r
        )
      );
      
      toast.success('Reserva cancelada correctamente');
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error al cancelar la reserva:', error);
      toast.error('Error al cancelar la reserva');
    }
  }, [selectedReserva, puedeCancelar]);

  // Manejar modificación de reserva
  const handleModificarReserva = useCallback(async () => {
    if (!selectedReserva) return;
    
    try {
      const reservaRef = doc(db, 'reservas', selectedReserva.id);
      const fechaActualizada = modifyData.fecha || selectedReserva.fecha;
      const mensajeModificacion = 'Reserva modificada por el usuario. Esperando confirmación.';
      
      // // Crear objeto con los datos actualizados
      // const datosActualizados: Partial<Reserva> = {
      //   personas: modifyData.personas,
      //   mojarras: modifyData.mojarras,
      //   fecha: fechaActualizada,
      //   mensaje: mensajeModificacion,
      //   estado: 'pendiente', // Cambiar a pendiente para que el administrador revise los cambios
      //   actualizadoEl: new Date().toISOString(),
      //   // Mantener el historial de modificaciones
      //   historial: [
      //     ...(selectedReserva.historial || []),
      //     {
      //       fecha: new Date().toISOString(),
      //       accion: 'modificacion',
      //       detalles: `Usuario modificó la reserva: ${modifyData.personas} personas, ${modifyData.mojarras} mojarras, ${fechaActualizada}`
      //     }
      //   ]
      // };
      
      // Actualizar la reserva en Firestore con tipos explícitos
      const updateData = {
        personas: modifyData.personas,
        mojarras: modifyData.mojarras,
        fecha: fechaActualizada,
        mensaje: mensajeModificacion,
        estado: 'pendiente' as const, // Usar 'as const' para el tipo literal
        actualizadoEl: new Date().toISOString(),
        historial: [
          ...(selectedReserva.historial || []),
          {
            fecha: new Date().toISOString(),
            accion: 'modificacion',
            detalles: `Usuario modificó la reserva: ${modifyData.personas} personas, ${modifyData.mojarras} mojarras, ${fechaActualizada}`
          }
        ]
      };

      await updateDoc(reservaRef, updateData);
      
      // Crear notificación para el club
      if (selectedReserva.clubId) {
        await addDoc(collection(db, "notifications"), {
          clubId: selectedReserva.clubId,
          title: "Reserva modificada",
          message: `El usuario ha modificado una reserva para el ${new Date(fechaActualizada).toLocaleDateString('es-AR')}. La reserva está pendiente de confirmación.`,
          tipoAccion: 'modificacion',
          tipo: 'reserva',
          read: false,
          reservaId: selectedReserva.id,
          total: selectedReserva.total,
          createdAt: new Date(),
        });
      }
      
      // Actualizar estado local con el objeto completo de la reserva
      setReservas(prevReservas => 
        prevReservas.map(r => 
          r.id === selectedReserva.id 
            ? { ...r, ...updateData }
            : r
        )
      );
      
      toast.success('Reserva modificada correctamente. Esperando confirmación.');
      setShowModifyDialog(false);
    } catch (error) {
      console.error('Error al modificar la reserva:', error);
      toast.error('Error al modificar la reserva');
    }
  }, [selectedReserva, modifyData]);

  // Función para calcular el total si no viene en la reserva
  const calcularTotal = useCallback((reserva: Reserva) => {
    if (typeof reserva.total === "number") return reserva.total;
    const precioBote = reserva.precioBote ?? 0;
    const precioMojarra = reserva.precioMojarra ?? 0;
    return precioBote + (precioMojarra * (reserva.mojarras || 0));
  }, []);

  // Función para obtener el título del botón de cancelar
  const getCancelButtonTitle = useCallback((estado: Reserva['estado'], fecha: string) => {
    if (estado === 'pendiente') {
      return 'No se puede cancelar una reserva pendiente';
    }
    if (estado === 'cancelada') {
      return 'Reserva ya cancelada';
    }
    if (!puedeCancelar(fecha)) {
      return 'No se puede cancelar con menos de 48 horas de anticipación';
    }
    return 'Cancelar reserva';
  }, [puedeCancelar]);

  // Función para obtener el texto del botón de cancelar


  // Función para obtener el color del estado
  const getEstadoColor = useCallback((estado: string) => {
    switch(estado) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }, []);

  return (
    <>
      <div className="max-w-2xl mx-auto mt-8 px-2 sm:px-0">
      <h1 className="text-3xl font-bold mb-6 text-center">Mis reservas</h1>
      
      {/* Filtro de estado */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {(['todas', 'pendiente', 'confirmada', 'cancelada'] as FiltroEstado[]).map((opcion) => (
          <button
            key={opcion}
            onClick={() => setFiltro(opcion)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filtro === opcion
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opcion === 'todas' ? 'Todas' : opcion.charAt(0).toUpperCase() + opcion.slice(1)}
            {opcion !== 'todas' && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${
                getEstadoColor(opcion).replace('text-', 'text-opacity-90 ')
              }`}>
                {reservas.filter(r => r.estado === opcion).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Cargando reservas...</div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="text-center text-gray-500">
          {filtro === 'todas' 
            ? 'No tenés reservas todavía.' 
            : `No tenés reservas ${filtro === 'confirmada' ? 'confirmadas' : filtro + 's'}.`}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {reservasFiltradas.map(reserva => (
            <div
              key={reserva.id}
              className={`rounded-2xl shadow-md p-5 flex flex-col gap-2 border-l-8 sm:border-l-4
                ${
                  reserva.estado === 'confirmada'
                    ? 'border-green-500'
                    : reserva.estado === 'cancelada'
                    ? 'border-red-500'
                    : 'border-yellow-400'
                }
                bg-white
              `}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-3 gap-2">
                <div>
                  <h3 className="font-semibold text-lg">{reserva.clubName}</h3>
                  <div className="text-blue-700 font-medium">
                    {formatearFecha(reserva.fecha)}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getEstadoColor(reserva.estado)
                }`}>
                  {reserva.estado === 'pendiente' ? 'Pendiente de confirmación' : 
                   reserva.estado === 'confirmada' ? 'Confirmada' :
                   reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700">
                <div>
                  <span className="font-semibold">Bote:</span> {reserva.bote} {reserva.capacidad} 
                </div>
                <div>
                  <span className="font-semibold">Personas:</span> {reserva.personas}
                </div>
                <div>
                  <span className="font-semibold">Mojarras:</span> {reserva.mojarras} unidades
                </div>
                <div className="text-sm text-gray-600">
                  <p>Estado: <span className="font-medium">
                    {reserva.estado === 'pendiente' && 'Pendiente de confirmación'}
                    {reserva.estado === 'confirmada' && 'Confirmada'}
                    {reserva.estado === 'completada' && 'Completada'}
                    {reserva.estado === 'cancelada' && 'Cancelada'}
                  </span></p>
                  
                  {reserva.estado === 'cancelada' && (
                    <div className="w-full mt-2 bg-red-50 p-2 rounded-md">
                      <p className="text-red-700 font-medium">
                        {reserva.canceladoPor === 'club' 
                          ? '⚠️ Reserva cancelada por el club'
                          : '⚠️ Has cancelado esta reserva'}
                      </p>
                      {reserva.mensaje && (
                        <p className="text-red-600 text-sm mt-1">
                          <span className="font-medium"></span> {reserva.mensaje}
                        </p>
                      )}
                    </div>
                  )}
                  

                </div>
                {reserva.estado !== 'cancelada' && (
                  <div className="w-full flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => {
                        setSelectedReserva(reserva);
                        setModifyData({
                          personas: reserva.personas,
                          mojarras: reserva.mojarras,
                          fecha: reserva.fecha
                        });
                        setShowModifyDialog(true);
                      }}
                      disabled={!puedeModificar(reserva.fecha) || reserva.estado !== 'pendiente'}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        puedeModificar(reserva.fecha) && reserva.estado === 'pendiente'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={reserva.estado !== 'pendiente' 
                        ? 'Solo se pueden modificar reservas pendientes'
                        : puedeModificar(reserva.fecha) 
                          ? '' 
                          : 'Solo se pueden modificar reservas con más de 24 horas de anticipación'}
                    >
                      Modificar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReserva(reserva);
                        setShowCancelDialog(true);
                      }}
                      disabled={!['pendiente', 'confirmada'].includes(reserva.estado) || !puedeCancelar(reserva.fecha)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        ['pendiente', 'confirmada'].includes(reserva.estado) && puedeCancelar(reserva.fecha)
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={getCancelButtonTitle(reserva.estado, reserva.fecha)}
                    >
                      Cancelar
                    </button>
                    {(!puedeModificar(reserva.fecha) || !puedeCancelar(reserva.fecha)) && (
                      <div className="w-full text-yellow-600 text-xs mt-1">
                        {!puedeModificar(reserva.fecha) && '⚠️ No se pueden realizar cambios con menos de 24 horas de anticipación'}
                        {!puedeModificar(reserva.fecha) && !puedeCancelar(reserva.fecha) && <br />}
                        {!puedeCancelar(reserva.fecha) && '⚠️ No se puede cancelar con menos de 48 horas de anticipación'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
               
                <div className="flex items-center gap-2">
                <span className="font-bold text-green-800 text-lg">Total:</span>
                  <span className="text-lg font-semibold">
                    ${calcularTotal(reserva).toLocaleString("es-AR")}
                  </span>
                </div>
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

      {/* Diálogo de confirmación de cancelación */}
    <Transition appear show={showCancelDialog} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setShowCancelDialog(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Confirmar cancelación
                </Dialog.Title>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    {selectedReserva && puedeCancelar(selectedReserva.fecha) 
                      ? '¿Estás seguro de que deseas cancelar esta reserva?'
                      : '¿Estás seguro de que deseas cancelar esta reserva? Al cancelar con menos de 48 horas de anticipación, se retendrá la seña.'}
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setShowCancelDialog(false)}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                    onClick={handleCancelarReserva}
                  >
                    Confirmar cancelación
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>

    {/* Diálogo de modificación de reserva */}
    <Transition appear show={showModifyDialog} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setShowModifyDialog(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-1 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Modificar reserva
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha y hora
                    </label>
                    <input
                      type="datetime-local"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={modifyData.fecha ? modifyData.fecha.split('.')[0] : ''}
                      onChange={(e) => setModifyData({...modifyData, fecha: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Número de personas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedReserva?.capacidad || 10}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={modifyData.personas}
                      onChange={(e) => setModifyData({...modifyData, personas: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cantidad de mojarras
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={modifyData.mojarras}
                      onChange={(e) => setModifyData({...modifyData, mojarras: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setShowModifyDialog(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    onClick={handleModificarReserva}
                  >
                    Guardar cambios
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>

    {/* Modal de calificación */}
    {selectedClub && (
      <ClubRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onRate={handleRateClub}
        clubName={selectedClub.name}
        clubId={selectedClub.id}
      />
    )}
    </>
  );
};

export default FisherBookings;