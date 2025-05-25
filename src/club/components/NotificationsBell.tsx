import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationsPanel from './NotificationsPanel';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';

const NotificationsBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;

  // Obtener notificaciones no leídas
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('clubId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={bellRef}>
      <button
        className="relative p-2 rounded-full hover:bg-blue-100 transition"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Ver notificaciones ${unreadCount > 0 ? `(${unreadCount} sin leer)` : ''}`}
      >
        <Bell className="w-6 h-6 text-blue-700" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
            aria-live="polite"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div 
          className="absolute right-0 mt-2 w-80 z-40 bg-white shadow-xl rounded-xl border p-4"
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          <NotificationsPanel onNotificationClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
