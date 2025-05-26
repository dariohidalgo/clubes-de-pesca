import React from 'react';
import { MapPin } from 'lucide-react';

const FishingZones: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">Zonas de Pesca - Dique San Roque</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">Zonas Principales de Pesca</h2>
        
        <div className="space-y-8">
          {/* Puente de Bialet Massé */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Puente de Bialet Massé sobre el Río Cosquín
              <a 
                href="https://www.google.com/maps?q=-31.31949115965145,-64.45562555724784" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Detalles: </span>
              Pesca prohibida en el puente. En las costas cercanas hay buena pesca de pejerrey cuando el nivel del dique es medio a alto.
            </p>
          </div>
          
          {/* Las Piedras */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Lugar llamado "Las Piedras"
              <a 
                href="https://www.google.com/maps?q=-31.324830112855825,-64.46159435660785" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Técnica: </span>
              Buena pesca de pejerrey con Chirimbolo o balancín.
            </p>
          </div>
          
          {/* Costa entre puente y Plaza Federal */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Costa entre el puente de Bialet Massé y la Plaza Federal
              <a 
                href="https://www.google.com/maps?q=-31.327512090643005,-64.46163491517743" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Especies: </span>
              Buena pesca de Carpas y Tarariras.
            </p>
          </div>
          
          {/* Puente de Las Mojarras */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Puente de Las Mojarras
              <a 
                href="https://www.google.com/maps?q=-31.33697259656427,-64.470076002488" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Detalles: </span>
              Excelente pesca de pejerrey cuando el dique tiene un nivel de agua medio o alto. En la entrada del río hay grandes ejemplares de tarariras.
            </p>
          </div>
          
          {/* Playas para pesca de Carpas */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Playas para pesca de Carpas
              <a 
                href="https://www.google.com/maps?q=-31.342247625899855,-64.47011425104075" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Recomendación: </span>
              Especialmente efectivo con el nivel bajo del dique.
            </p>
          </div>
          
          {/* Zona de clubes de pesca */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Zona de pesca de pejerrey frente a los clubes de pesca
              <a 
                href="https://www.google.com/maps?q=-31.360008862025712,-64.46345775725266" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Técnica: </span>
              Entre 200 y 400 mts. de la costa al barco con aparatito o balancín entre 5 y 9 metros.
            </p>
          </div>
          
          {/* Zona del eucaliptus */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Zona de pesca embarcado frente al eucaliptus
              <a 
                href="https://www.google.com/maps?q=-31.370542784459502,-64.47234261311719" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Técnica: </span>
              Especial para línea de vuelo buscando los grandes ejemplares.
            </p>
          </div>
          
          {/* Zona de los 4 vientos */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Zona de los 4 vientos
              <a 
                href="https://www.google.com/maps?q=-31.373680119665295,-64.45937966395383" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Recomendación: </span>
              Ideal para usar línea de vuelo.
            </p>
          </div>
          
          {/* Paredón del dique */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Paredón del dique
              <a 
                href="https://www.google.com/maps?q=-31.37467091434608,-64.43478472748318" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Características: </span>
              En su nivel bajo, zona para pejerrey con balancín. Es la zona más resguardada del viento en todo el pesquero.
            </p>
          </div>
          
          {/* Zona embarcado con balancín */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Zona para pesca embarcado
              <a 
                href="https://www.google.com/maps?q=-31.375660197455204,-64.4548583797508" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Técnica: </span>
              Pesca de pejerrey con balancín.
            </p>
          </div>
          
          {/* Bahías para carpa */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Bahías para la pesca de tarariras
              <a 
                href="https://www.google.com/maps?q=-31.376942585928706,-64.44932230032067" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
          </div>
          
          {/* Playas para carpa */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Playas para la pesca de carpas
              <a 
                href="https://www.google.com/maps?q=-31.384429467110674,-64.48729982541172" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
          </div>
          
          {/* Puente Negro */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Puente Negro
              <a 
                href="https://www.google.com/maps?q=-31.399892121218215,-64.49860918841479" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
                  </a>
            </h3>
            <p className="text-gray-600">
              <span className="font-medium">Especies: </span>
              Grandes tarariras en la entrada del arroyo.
            </p>
          </div>
          
          {/* Cueva de la leona */}
          <div className="pb-2">
            <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center">
              Cueva de la leona
              <a 
                href="https://www.google.com/maps?q=-31.36708259325577,-64.47664395413608" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Ver en Maps"
              >
                <MapPin className="w-4 h-4 inline" />
                <span className='ml-2'>Ver en Maps</span>
              </a>
            </h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recomendaciones</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Verificar siempre las condiciones climáticas antes de salir a pescar.</li>
          <li>Respetar los tamaños mínimos de captura y las vedas.</li>
          <li>Llevar siempre chaleco salvavidas cuando se pesque desde embarcación.</li>
          <li>No dejar residuos en la zona de pesca.</li>
          <li>Respetar las zonas de pesca restringidas.</li>
        </ul>
      </div>
    </div>
  );
};

export default FishingZones;
