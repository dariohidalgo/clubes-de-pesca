import React from "react";

interface Boat {
  tipo: string;
  cantidad: number;
  capacidad: number;
  precio: number;
}

interface ClubCardProps {
  name: string;
  logoUrl: string;
  location: string;
  phone: string;
  boats: Boat[];
  onReservar: () => void;
}

const ClubCard: React.FC<ClubCardProps> = ({
  name,
  logoUrl,
  location,
  phone,
  boats,
  onReservar,
}) => {
  const botesDisponibles = boats.reduce((acc, b) => acc + (b.cantidad ?? 0), 0);

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
        <h2 className="text-xl font-bold text-blue-800 mb-2" title={name}>
          {name}
        </h2>
        
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
      
      <div className="w-full mt-2 mb-4 px-2">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <span className="text-sm sm:text-base font-medium text-gray-700">
            🚤 <span className="font-bold text-green-700">{botesDisponibles}</span> botes disponibles
          </span>
        </div>
      </div>
      
      <button
        className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        onClick={onReservar}
      >
        Reservar Ahora
      </button>
    </div>
  );
};

export default ClubCard;
