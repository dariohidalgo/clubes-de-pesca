import React, { useState } from "react";

import ClubRatingModal from "./ClubRatingModal";
import { auth } from "../../../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

interface Boat {
  tipo: string;
  cantidad: number;
  capacidad: number;
  precio: number;
  disponible?: boolean;
}

interface ClubCardProps {
  id: string;
  name: string;
  logoUrl: string;
  location: string;
  phone: string;
  boats: Boat[];
  onReservar: () => void;
  averageRating?: number;
  ratingCount?: number;
  onRatingChange?: (clubId: string, rating: number, comment?: string, userEmail?: string) => void;
}

const ClubCard: React.FC<ClubCardProps> = ({
  id,
  name,
  logoUrl,
  location,
  phone,
  boats,
  onReservar,
  averageRating = 0,
  ratingCount = 0,
  onRatingChange
}) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [user] = useAuthState(auth);

  const handleRateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Por favor inicia sesión para calificar este club');
      return;
    }
    setShowRatingModal(true);
  };



  const handleRatingSubmit = async (rating: number, comment: string): Promise<void> => {
    try {
      if (onRatingChange && user?.email) {
        await onRatingChange(id, rating, comment, user.email);
        setShowRatingModal(false);
      } else if (!user?.email) {
        throw new Error('No se pudo obtener el correo electrónico del usuario');
      }
    } catch (error) {
      console.error('Error al enviar la calificación:', error);
      throw error; // Propagar el error para que el modal pueda manejarlo
    }
  };
  // Clasificar botes por tipo
  const clasificarBotes = () => {
    return boats.reduce<{ 
      conMotor: Boat[]; 
      sinMotor: Boat[]; 
      conTracker: Boat[] 
    }>((acc, bote) => {
      if (bote.tipo.toLowerCase().includes('motor')) {
        acc.conMotor.push(bote);
      } else if (bote.tipo.toLowerCase().includes('tracker')) {
        acc.conTracker.push(bote);
      } else {
        acc.sinMotor.push(bote);
      }
      return acc;
    }, { conMotor: [], sinMotor: [], conTracker: [] });
  };

  const botesPorTipo = clasificarBotes();

  return (
    <div className="bg-white shadow-md hover:shadow-lg rounded-xl p-4 sm:p-6 flex flex-col items-center w-full max-w-sm transition-shadow duration-300">
      {/* Logo centrado en móvil, alineado a la izquierda en desktop */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 mb-4">
        <img 
          src={logoUrl} 
          alt={name} 
          className="w-full h-full object-cover rounded-full border-2 border-blue-300 mx-auto" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
          }}
        />
      </div>
      
      {/* Contenido de la tarjeta */}
      <div className="w-full text-center sm:text-left">
        <div className="w-full flex justify-between items-start">
          <h2 className="text-xl font-bold text-blue-800 mb-2" title={name}>
            {name}
          </h2>
          <div className="flex flex-col items-end">
            <div className="flex flex-col items-end space-y-1">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-800 mr-2">{averageRating.toFixed(1)}</span>
                <div className="flex flex-col items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {ratingCount} {ratingCount === 1 ? 'calificación' : 'calificaciones'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleRateClick}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-full transition-colors flex items-center"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Calificar
              </button>
            </div>
          </div>
        </div>
        
        {/* Información de ubicación */}
        <div className="flex flex-col items-center sm:items-start space-y-2 text-gray-600 mb-3">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {location}
          </span>
          
          <a 
            href={`tel:${phone}`} 
            className="text-blue-600 hover:text-blue-800 flex items-center justify-center sm:justify-start"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            {phone}
          </a>
        </div>
      </div>
      
      <div className="w-full mt-2 mb-4 px-2 space-y-4">
        {/* Mensaje de disponibilidad */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
          <p className="text-sm text-yellow-700">
            ⚠️ La disponibilidad puede variar según la fecha seleccionada al realizar la reserva.
          </p>
        </div>
        
        {/* Resumen de botes por categoría */}
        <div className="space-y-3">
          {botesPorTipo.conMotor.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="font-medium text-blue-800 text-sm mb-1">🛥️ Botes</h3>
              <div className="space-y-1">
                {botesPorTipo.conMotor.map((b, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{b.tipo} ({b.capacidad} pers.)</span>
                    <span className="font-medium">{b.cantidad} disponibles</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {botesPorTipo.sinMotor.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <h3 className="font-medium text-green-800 text-sm mb-1">🚣 Sin Motor</h3>
              <div className="space-y-1">
                {botesPorTipo.sinMotor.map((b, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{b.tipo} ({b.capacidad} pers.)</span>
                    <span className="font-medium">{b.cantidad} disponibles</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {botesPorTipo.conTracker.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3">
              <h3 className="font-medium text-purple-800 text-sm mb-1">📍Tracker</h3>
              <div className="space-y-1">
                {botesPorTipo.conTracker.map((b, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{b.tipo} ({b.capacidad} pers.)</span>
                    <span className="font-medium">{b.cantidad} disponibles</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <button
        className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        onClick={onReservar}
      >
        Reservar Ahora
      </button>
      
      <ClubRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onRate={handleRatingSubmit}
        clubName={name}
        clubId={id}
      />
    </div>
  );
};

export default ClubCard;
