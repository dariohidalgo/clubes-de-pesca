import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { X } from "lucide-react";


interface Reserva {
  id: string;
  nombre: string;
  email: string;
  celular: string;
  bote: string;
  capacidad: number;
  personas: number;
  mojarras: number;
  fecha: string; // ISO string
  estado: "pendiente" | "confirmada" | "eliminada" | "cancelada" | string;
  mensaje?: string;
  total?: number;
  userId?: string; // Add userId to the interface
  clubId?: string;
  clubName?: string;
}

const ITEMS_PER_PAGE = 5; // Número de reservas por página

type FiltroEstado = 'todas' | 'pendiente' | 'confirmada' | 'eliminada';
type VistaReservas = 'dia' | 'mes';

const BookingCalendar: React.FC = () => {
  const { reservaId } = useParams<{ reservaId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [reservaDetalle, setReservaDetalle] = useState<Reserva | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [paginaActual, setPaginaActual] = useState(1);
  const [vistaReservas, setVistaReservas] = useState<VistaReservas>('dia');
  const [modalReserva, setModalReserva] = useState<Reserva | null>(null);
  const [modalAccion, setModalAccion] = useState<"confirmar" | "eliminar" | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar reserva específica si hay un ID en la URL
  useEffect(() => {
    const fetchReservaDetalle = async () => {
      if (!reservaId) return;
      
      try {
        setLoading(true);
        const docRef = doc(db, "reservas", reservaId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const reservaData = { id: docSnap.id, ...docSnap.data() } as Reserva;
          setReservaDetalle(reservaData);
          
          // Si la reserva tiene fecha, la establecemos como fecha seleccionada
          if (docSnap.data().fecha) {
            setSelectedDate(new Date(docSnap.data().fecha));
          }
          
          // Verificar si venimos de una notificación o si debemos mostrar el modal
          const fromNotification = location.state?.fromNotification === true;
          const shouldShowModal = location.state?.shouldShowModal === true;
          
          // Mostrar el modal si venimos de una notificación, si debemos mostrarlo o si la reserva está pendiente
          if (fromNotification || shouldShowModal || reservaData.estado === 'pendiente') {
            const accion = location.state?.accion || 'confirmar';
            // Usar setTimeout para asegurar que el estado se actualice después del renderizado
            setTimeout(() => {
              setModalReserva(reservaData);
              setModalAccion(accion);
              setMensaje(accion === 'confirmar' 
                ? `¡Hola ${reservaData.nombre}! Tu reserva ha sido confirmada. ¡Te esperamos!`
                : `Lamentamos informarte que tu reserva ha sido cancelada.`);
            }, 100);
          }
          
          // Limpiar el estado de navegación para la próxima vez
          if (fromNotification || shouldShowModal) {
            window.history.replaceState({}, document.title);
          }
        } else {
          console.log("No se encontró la reserva");
          navigate('/club/reservas', { replace: true });
        }
      } catch (error) {
        console.error("Error al cargar la reserva:", error);
      } finally {
        setLoading(false);
      }
    };

    if (reservaId) {
      // Resetear estados del modal al cargar una nueva reserva
      setModalReserva(null);
      setModalAccion(null);
      setMensaje("");
      
      fetchReservaDetalle();
    } else {
      setReservaDetalle(null);
    }
  }, [reservaId, navigate]);

  // Cargar reservas de Firestore filtradas por clubId
  useEffect(() => {
    const fetchReservas = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Buscar el clubId (que es el uid del usuario logueado)
      const clubId = user.uid;

      // Consultar todas las reservas para este club
      const reservasRef = collection(db, "reservas");
      const q = query(reservasRef, where("clubId", "==", clubId));
      const querySnapshot = await getDocs(q);
      const reservasList: Reserva[] = [];
      querySnapshot.forEach(docu => {
        reservasList.push({ id: docu.id, ...docu.data() } as Reserva);
      });
      setReservas(reservasList);
    };
    fetchReservas();
  }, []);

  // Cerrar vista de detalle
  const handleCerrarDetalle = () => {
    navigate('/club/reservas');
  };

  // Función para abrir el modal de confirmación o cancelación
  const abrirModal = (reserva: Reserva, accion: 'confirmar' | 'eliminar') => {
    // Si estamos en la vista de detalle, primero volvemos al listado
    if (reservaId) {
      navigate('/club/reservas', {
        state: { 
          shouldShowModal: true,
          reservaId: reserva.id,
          accion: accion
        }
      });
    } else {
      // Si ya estamos en el listado, mostramos el modal directamente
      setModalReserva(reserva);
      setModalAccion(accion);
      setMensaje(accion === 'confirmar' 
        ? `¡Hola ${reserva.nombre}! Tu reserva ha sido confirmada. ¡Te esperamos!`
        : `Lamentamos informarte que tu reserva ha sido cancelada.`);
    }
  };

  // Si estamos cargando una reserva específica, mostrar loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Mostrar vista de detalle de reserva si hay una reserva seleccionada y estamos en la ruta de detalle
  if (reservaDetalle && reservaId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Detalle de la Reserva</h2>
          <button 
            onClick={handleCerrarDetalle}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Cliente</h3>
              <p className="text-gray-600">{reservaDetalle.nombre}</p>
              <p className="text-gray-600">{reservaDetalle.email}</p>
              <p className="text-gray-600">Tel: {reservaDetalle.celular}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Detalles</h3>
              <p className="text-gray-600">Bote: {reservaDetalle.bote} (Capacidad: {reservaDetalle.capacidad})</p>
              <p className="text-gray-600">Personas: {reservaDetalle.personas}</p>
              <p className="text-gray-600">Mojarras: {reservaDetalle.mojarras || 0}</p>
              <p className="text-gray-600">
                Fecha: {new Date(reservaDetalle.fecha).toLocaleDateString()}
              </p>
              <p className="text-gray-600">Total: ${reservaDetalle.total}</p>
            </div>
          </div>
          
          {reservaDetalle.mensaje && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Mensaje</h3>
              <p className="text-gray-600">{reservaDetalle.mensaje}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              reservaDetalle.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
              reservaDetalle.estado === 'eliminada' || reservaDetalle.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {reservaDetalle.estado.charAt(0).toUpperCase() + reservaDetalle.estado.slice(1)}
            </span>
            
            <div className="flex gap-2">
              {reservaDetalle.estado === 'pendiente' && (
                <>
                  <button
                    onClick={() => abrirModal(reservaDetalle, 'confirmar')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => abrirModal(reservaDetalle, 'eliminar')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </>
              )}
              <button
                onClick={handleCerrarDetalle}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                Volver al listado
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar reservas según la vista (día/mes) y estado
  const reservasFiltradas = reservas.filter((res) => {
    if (!res.fecha) return false;
    
    try {
      const fechaReserva = new Date(res.fecha);
      
      // Asegurarse de que la fecha es válida
      if (isNaN(fechaReserva.getTime())) return false;
      
      // Normalizar fechas para comparación (ignorar hora)
      const fechaReservaNormalizada = new Date(
        fechaReserva.getFullYear(), 
        fechaReserva.getMonth(), 
        fechaReserva.getDate()
      );
      
      const fechaSeleccionadaNormalizada = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      
      const esMismoDia = fechaReservaNormalizada.getTime() === fechaSeleccionadaNormalizada.getTime();
      const esMismoMes = 
        fechaReserva.getMonth() === selectedDate.getMonth() && 
        fechaReserva.getFullYear() === selectedDate.getFullYear();
        
      const coincideVista = vistaReservas === 'dia' ? esMismoDia : esMismoMes;
      const coincideEstado = filtroEstado === 'todas' || res.estado === filtroEstado;
      
      return coincideVista && coincideEstado;
    } catch (error) {
      console.error('Error al procesar fecha de reserva:', error, res);
      return false;
    }
  });
  
  // Ordenar por fecha (más recientes primero)
  reservasFiltradas.sort((a, b) => {
    if (!a.fecha || !b.fecha) return 0;
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });

  // Lógica de paginación
  const totalPaginas = Math.ceil(reservasFiltradas.length / ITEMS_PER_PAGE);
  const indiceInicial = (paginaActual - 1) * ITEMS_PER_PAGE;
  const reservasPaginadas = reservasFiltradas.slice(indiceInicial, indiceInicial + ITEMS_PER_PAGE);

  // Cambiar de página
  const cambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
    // Desplazarse al inicio de la lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Confirmar o eliminar reservas (actualiza la reserva en la colección 'reservas')
  const cambiarEstadoReserva = async (reserva: Reserva, nuevoEstado: string, mensaje?: string) => {
    if (!reserva.id) return;

    try {
      setLoading(true);
      const reservaRef = doc(db, "reservas", reserva.id);
      await updateDoc(reservaRef, {
        estado: nuevoEstado,
        ...(mensaje && { mensaje })
      });
      
      // Actualizar el estado local
      setReservas(prevReservas =>
        prevReservas.map(r =>
          r.id === reserva.id
            ? { ...r, estado: nuevoEstado, ...(mensaje && { mensaje }) }
            : r
        )
      );
      
      // Si estamos en la vista de detalle, actualizar también el estado local
      if (reservaDetalle && reservaDetalle.id === reserva.id) {
        setReservaDetalle({
          ...reservaDetalle,
          estado: nuevoEstado,
          ...(mensaje && { mensaje })
        });
      }
      
      setMensaje(`Reserva ${nuevoEstado} correctamente`);
      setTimeout(() => setMensaje(""), 3000);
      
      // Si se eliminó la reserva, volver al listado
      if (nuevoEstado === 'eliminada' || nuevoEstado === 'cancelada') {
        setTimeout(() => {
          navigate('/club/reservas');
        }, 1000);
      }
      
    } catch (error) {
      console.error("Error al actualizar la reserva:", error);
      setMensaje("Error al actualizar la reserva");
      setTimeout(() => setMensaje(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Manejador para las acciones del modal (confirmar/eliminar)
  const handleAction = async () => {
    if (!modalReserva || !modalAccion) return;
    
    try {
      setLoading(true);
      
      // Crear mensaje predeterminado si no se ingresó ninguno
      const mensajeAMostrar = mensaje.trim() || 
        (modalAccion === 'confirmar' 
          ? `Su reserva para el ${new Date(modalReserva.fecha).toLocaleDateString('es-AR')} ha sido confirmada.`
          : `Lamentamos informarle que su reserva para el ${new Date(modalReserva.fecha).toLocaleDateString('es-AR')} ha sido cancelada.`);
      
      // Actualizar el estado de la reserva
      if (modalAccion === 'confirmar') {
        await cambiarEstadoReserva(modalReserva, 'confirmada', mensajeAMostrar);
        
        // Crear notificación para el pescador
        if (modalReserva.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: modalReserva.userId,
            title: 'Reserva Confirmada',
            message: `Tu reserva para el ${new Date(modalReserva.fecha).toLocaleDateString('es-AR')} ha sido confirmada`,
            type: 'reserva_confirmada',
            read: false,
            reservaId: modalReserva.id,
            createdAt: new Date(),
          });
        }
        
      } else if (modalAccion === 'eliminar') {
        await cambiarEstadoReserva(modalReserva, 'cancelada', mensajeAMostrar);
        
        // Crear notificación para el pescador
        if (modalReserva.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: modalReserva.userId,
            title: 'Reserva Cancelada',
            message: `Tu reserva para el ${new Date(modalReserva.fecha).toLocaleDateString('es-AR')} ha sido cancelada`,
            type: 'reserva_cancelada',
            read: false,
            reservaId: modalReserva.id,
            mensaje: mensajeAMostrar,
            createdAt: new Date(),
          });
        }
      }
      
      // Actualizar el estado local de la reserva si estamos en la vista de detalle
      if (reservaDetalle && reservaDetalle.id === modalReserva.id) {
        setTimeout(() => {
          setReservaDetalle({
            ...reservaDetalle,
            estado: modalAccion === 'confirmar' ? 'confirmada' : 'cancelada',
            mensaje: mensajeAMostrar
          });
        }, 0);
      }
      
      // Cerrar el modal y limpiar el estado
      setModalReserva(null);
      setModalAccion(null);
      setMensaje('');
      
    } catch (error) {
      console.error('Error al procesar la acción:', error);
      setMensaje('Error al procesar la acción');
      setTimeout(() => setMensaje(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Reservas del Club</h2>
      
      {/* Calendario */}
      <div className="bg-white rounded-xl shadow p-3 sm:p-4 flex justify-center mb-6">
        <Calendar
          value={selectedDate}
          onChange={(date) => setSelectedDate(date as Date)}
          locale="es-AR"
          className="w-full max-w-xs sm:max-w-md"
        />
      </div>

      {/* Lista de reservas */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">
              {vistaReservas === 'dia' 
                ? `Reservas para el ${selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                : `Reservas de ${selectedDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
              }
            </h3>
            <button 
              onClick={() => setVistaReservas(vistaReservas === 'dia' ? 'mes' : 'dia')}
              className="text-sm text-blue-600 hover:text-blue-800 text-left mt-1"
            >
              {vistaReservas === 'dia' 
                ? 'Ver todo el mes' 
                : 'Ver solo el día actual'}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value as FiltroEstado);
                setPaginaActual(1); // Resetear a la primera página al cambiar el filtro
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas las reservas</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="eliminada">Eliminadas</option>
            </select>
          </div>
        </div>
        
        {reservasFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            {vistaReservas === 'dia' 
              ? `No hay reservas para el ${selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`
              : `No hay reservas para ${selectedDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
            }
          </div>
        ) : (
          <div className="space-y-3">
            {/* Versión móvil: Tarjetas */}
            <div className="sm:hidden space-y-3">
              {reservasPaginadas.map((res) => {
                const fecha = new Date(res.fecha);
                const fechaFormateada = fecha.toLocaleDateString('es-AR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                <div key={res.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header con fecha y estado */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-900">{fechaFormateada}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      res.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                      res.estado === 'eliminada' || res.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {res.estado === "confirmada" ? "Confirmada" : 
                       res.estado === "eliminada" || res.estado === "cancelada" ? "Cancelada" : 
                       "Pendiente"}
                    </span>
                  </div>
                  
                  {/* Contenido principal */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-base">{res.nombre}</h4>
                        <p className="text-sm text-gray-500">{res.email}</p>
                      </div>
                      <a 
                        href={`tel:${res.celular}`}
                        className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        aria-label="Llamar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {fechaFormateada}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {res.bote} (Cap. {res.capacidad})
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {res.personas} persona{res.personas !== 1 ? 's' : ''}
                      </div>
                      {res.mojarras > 0 && (
                        <div className="flex items-center text-amber-700">
                          <svg className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                          {res.mojarras} mojarra{res.mojarras !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    
                    {res.estado === "pendiente" && (
                      <div className="w-full mt-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            className="flex-1 flex items-center justify-center px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors whitespace-nowrap"
                            onClick={() => abrirModal(res, 'confirmar')}
                          >
                            <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirmar
                          </button>
                          <button
                            className="flex-1 flex items-center justify-center px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors whitespace-nowrap"
                            onClick={() => abrirModal(res, 'eliminar')}
                          >
                            <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
            
            {/* Versión escritorio: Tabla */}
            <div className="hidden sm:block overflow-x-auto mb-4">
              <table className="min-w-full bg-white border rounded-xl shadow">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Contacto</th>
                    <th className="px-4 py-2 text-left">Bote</th>
                    <th className="px-4 py-2 text-center">Personas</th>
                    <th className="px-4 py-2 text-center">Mojarras</th>
                    <th className="px-4 py-2 text-center">Estado</th>
                    <th className="px-4 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reservasPaginadas.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{res.nombre}</div>
                        <div className="text-sm text-gray-500">{res.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{res.celular}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{res.bote}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">{res.personas}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">
                        {res.mojarras > 0 ? `🐟 ${res.mojarras}` : '-'}
                      </td>
                      <td className="px-4 py-2 font-semibold text-green-700">
        {res.total !== undefined
          ? `$${Number(res.total).toLocaleString("es-AR")}`
          : "--"}
      </td>
      
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          res.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                          res.estado === 'eliminada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {res.estado === "confirmada" ? "Confirmada" : res.estado === "eliminada" ? "Eliminada" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {res.estado === "pendiente" && (
                          <div className="flex justify-end space-x-2">
                            <button
                              className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 text-sm font-medium"
                              onClick={() => {
                                setModalReserva(res);
                                setModalAccion("confirmar");
                              }}
                            >
                              Confirmar
                            </button>
                            <button
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                              onClick={() => {
                                setModalReserva(res);
                                setModalAccion("eliminar");
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-1">
                  <button
                    onClick={() => cambiarPagina(1)}
                    disabled={paginaActual === 1}
                    className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    «
                  </button>
                  <button
                    onClick={() => cambiarPagina(Math.max(1, paginaActual - 1))}
                    disabled={paginaActual === 1}
                    className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    // Mostrar páginas alrededor de la actual
                    let paginaAMostrar;
                    if (totalPaginas <= 5) {
                      paginaAMostrar = i + 1;
                    } else if (paginaActual <= 3) {
                      paginaAMostrar = i + 1;
                    } else if (paginaActual >= totalPaginas - 2) {
                      paginaAMostrar = totalPaginas - 4 + i;
                    } else {
                      paginaAMostrar = paginaActual - 2 + i;
                    }
                    
                    return (
                      <button
                        key={paginaAMostrar}
                        onClick={() => cambiarPagina(paginaAMostrar)}
                        className={`w-8 h-8 rounded-md text-sm font-medium ${
                          paginaActual === paginaAMostrar
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {paginaAMostrar}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => cambiarPagina(Math.min(totalPaginas, paginaActual + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => cambiarPagina(totalPaginas)}
                    disabled={paginaActual === totalPaginas}
                    className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »
                  </button>
                </div>
              )}
              
              <div className="text-sm text-gray-500 text-center mt-2">
                Mostrando {Math.min(indiceInicial + 1, reservasFiltradas.length)}-{Math.min(indiceInicial + ITEMS_PER_PAGE, reservasFiltradas.length)} de {reservasFiltradas.length} reservas
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL para confirmar/eliminar reserva */}
      {modalReserva && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                {modalAccion === "confirmar" ? (
                  <>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirmar Reserva
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar Reserva
                  </>
                )}
              </h4>
              
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="font-medium">{modalReserva.nombre}</p>
                  <p className="text-sm text-gray-600">{modalReserva.email}</p>
                  <p className="text-sm text-gray-600">Tel: {modalReserva.celular}</p>
                  <p className="mt-2 font-medium">
                    {modalReserva.bote} - {new Date(modalReserva.fecha).toLocaleDateString('es-AR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje para el cliente:
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder={
                      modalAccion === "confirmar" 
                        ? "¡Hola! Tu reserva ha sido confirmada. ¡Te esperamos!"
                        : "Lamentamos informarte que tu reserva ha sido cancelada..."
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Este mensaje se enviará al pescador por correo electrónico.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    setModalReserva(null);
                    setModalAccion(null);
                    setMensaje("");
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    modalAccion === "confirmar"
                      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  }`}
                  onClick={handleAction}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </span>
                  ) : modalAccion === "confirmar" ? (
                    "Confirmar Reserva"
                  ) : (
                    "Cancelar Reserva"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
