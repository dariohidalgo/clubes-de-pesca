import React, { useEffect, useState } from 'react';
import { db, auth } from '../../../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Bell, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: any;
  read: boolean;
  reservaId?: string;
  total?: number;
}

interface NotificationsPanelProps {
  onNotificationClick?: () => void;
}

const iconForType = (type: string) => {
  switch(type) {
    case 'reserva': return <Bell className="w-5 h-5 text-blue-500" />;
    case 'mantenimiento': return <ClipboardList className="w-5 h-5 text-gray-500" />;
    default: return <Bell className="w-5 h-5 text-gray-400" />;
  }
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const club = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!club) return;
    const q = query(
      collection(db, "notifications"),
      where("clubId", "==", club.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const items: Notification[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [club]);

  // Marcar como leído y navegar a la reserva
  const handleNotificationClick = async (notif: Notification) => {
    try {
      // Marcar como leído si no lo está
      if (!notif.read) {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      }
      
      // Cerrar el panel de notificaciones
      if (onNotificationClick) {
        onNotificationClick();
      }
      
      // Navegar a la reserva si tiene un ID de reserva
      if (notif.reservaId) {
        // Forzar un reinicio de la página de reservas para asegurar que el estado se actualice
        if (window.location.pathname.includes('/club/reservas/')) {
          // Si ya estamos en una ruta de reserva, navegar a la raíz primero para forzar un remontaje
          navigate('/club/reservas');
          // Usar setTimeout para asegurar que la navegación se complete
          setTimeout(() => {
            navigate(`/club/reservas/${notif.reservaId}`, { 
              state: { fromNotification: true } 
            });
          }, 100);
        } else {
          // Si no estamos en la ruta de reservas, navegar directamente
          navigate(`/club/reservas/${notif.reservaId}`, { 
            state: { fromNotification: true } 
          });
        }
      }
    } catch (error) {
      console.error('Error al manejar la notificación:', error);
    }
  };

  if (loading) return <div>Cargando notificaciones...</div>;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <Bell className="w-6 h-6 text-blue-600" /> Notificaciones
      </h2>
      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="text-gray-400 text-center">No hay notificaciones.</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm cursor-pointer ${
                !notif.read ? 'border-blue-400 bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notif)}
            >
              {iconForType(notif.type)}
              <div>
                <div className="font-semibold">{notif.title}</div>
                <div className="text-gray-500 text-sm">{notif.message}</div>
                <div className="text-xs text-gray-400">
                  {notif.createdAt?.toDate ? (() => {
                    // Obtener la fecha de Firestore
                    const fechaFirestore = notif.createdAt.toDate();
                    
                    // Crear una nueva fecha con los componentes locales
                    const fechaLocal = new Date(
                      Date.UTC(
                        fechaFirestore.getFullYear(),
                        fechaFirestore.getMonth(),
                        fechaFirestore.getDate(),
                        fechaFirestore.getHours(),
                        fechaFirestore.getMinutes()
                      )
                    );
                    
                    // Obtener componentes de la fecha local
                    const dia = String(fechaLocal.getDate()).padStart(2, '0');
                    const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                    const anio = fechaLocal.getFullYear();
                    const horas = String(fechaLocal.getHours()).padStart(2, '0');
                    const minutos = String(fechaLocal.getMinutes()).padStart(2, '0');
                    
                    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
                  })() : ''}
                </div>
                <div className="text-xs text-gray-400">{notif.total ? `$${notif.total}` : ''}</div>
              </div>
              {!notif.read && <span className="ml-auto text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">Nuevo</span>}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default NotificationsPanel;
