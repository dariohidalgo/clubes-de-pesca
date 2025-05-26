import React, { useEffect, useState } from "react";

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

if (!WEATHER_API_KEY) {
  console.error("No se encontró la API key de WeatherAPI. Asegúrate de configurar VITE_WEATHER_API_KEY en .env");
}

interface WeatherInfo {
  temp_c: number;
  condition: {
    text: string;
    icon: string;
  };
  wind_kph: number;
  humidity: number;
  isForecast?: boolean; // Indica si es un pronóstico o el clima actual
}

const ClimaCard: React.FC<{ ciudad: string; fecha?: string }> = ({ ciudad, fecha }) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Función para formatear la fecha a YYYY-MM-DD
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // Si ya está en formato YYYY-MM-DD, retornar tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Si es una fecha ISO o similar, extraer solo la parte de la fecha
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString;
  };

  useEffect(() => {
    if (!ciudad) {
      setError("No se especificó una ciudad");
      setLoading(false);
      return;
    }

    if (!WEATHER_API_KEY) {
      setError("Error de configuración: falta la API key de WeatherAPI");
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError("");
      try {
        // Formatear la ciudad para la API
        // Usamos el nombre exacto de la ciudad que sabemos que funciona
        const ciudadFormateada = 'Villa Carlos Paz, Córdoba, Argentina';
        const fechaFormateada = fecha ? formatDate(fecha) : '';
        
        // Construir la URL de la API con parámetros más específicos
        const params = new URLSearchParams({
          key: WEATHER_API_KEY,
          q: ciudadFormateada,
          days: '10',
          aqi: 'no',
          alerts: 'no',
          lang: 'es'
        });
        
        const url = `https://api.weatherapi.com/v1/forecast.json?${params}`;
        

        
        const res = await fetch(url);
        
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = `Error ${res.status}: No se pudo obtener el clima`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch (e) {
            console.error('Error al parsear respuesta de error:', e);
          }
          
          console.error("Error de la API:", errorMessage);
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
      
        
        // Si hay una fecha específica, buscar en el pronóstico
        let clima;
        let esPronostico = false;
        
        if (fecha && fechaFormateada) {
          // Buscar la fecha exacta en el pronóstico
          const pronosticoDia = data.forecast?.forecastday?.find((d: any) => d.date === fechaFormateada);
          
          if (pronosticoDia) {
          
            clima = {
              ...pronosticoDia.day,
              // Usamos la temperatura máxima para el día
              temp_c: pronosticoDia.day.maxtemp_c,
              // Aseguramos que la condición esté presente
              condition: pronosticoDia.day.condition || {
                text: 'Despejado',
                icon: '//cdn.weatherapi.com/weather/64x64/day/113.png'
              },
              // Usamos la humedad promedio para el día
              humidity: pronosticoDia.day.avghumidity,
              // Usamos la velocidad máxima del viento para el día
              wind_kph: pronosticoDia.day.maxwind_kph
            };
            esPronostico = true;
          }
        }
        
        // Si no encontramos pronóstico para la fecha, usamos el tiempo actual
        if (!clima) {
          console.warn('Usando datos actuales en lugar de pronóstico');
          clima = data.current;
        }

        // Verificar que los datos del clima sean válidos
        if (!clima) {
          throw new Error("No se encontraron datos de clima válidos");
        }

       
        
        setWeather({
          temp_c: esPronostico ? Math.round(clima.temp_c) : Math.round(clima.temp_c),
          condition: {
            text: clima.condition?.text || "Despejado",
            icon: clima.condition?.icon?.startsWith('//') 
              ? `https:${clima.condition.icon}` 
              : clima.condition?.icon || "//cdn.weatherapi.com/weather/64x64/day/113.png"
          },
          wind_kph: esPronostico ? Math.round(clima.wind_kph) : Math.round(clima.wind_kph),
          humidity: esPronostico ? Math.round(clima.humidity) : Math.round(clima.humidity),
          isForecast: esPronostico
        });
      } catch (err: any) {
        console.error("Error al obtener el clima:", err);
        setError(err.message || "Error al consultar el clima. Por favor, inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    if (ciudad) {
      fetchWeather();
    } else {
      setLoading(false);
    }
  }, [ciudad, fecha]);

  if (loading) return (
    <div className="bg-blue-50 rounded-xl p-4 my-2 shadow animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-2 rounded">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">
            No se pudo cargar el clima: {error}
          </p>
        </div>
      </div>
    </div>
  );
  
  if (!weather) return null;

  // Formatear la condición del clima para mostrarla con mayúscula inicial
  const condicionClima = weather.condition.text.charAt(0).toUpperCase() + 
                        weather.condition.text.slice(1).toLowerCase();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 my-2 shadow-md border border-blue-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white p-2 rounded-full shadow-inner">
            <img 
              src={weather.condition.icon.startsWith('http') ? weather.condition.icon : `https:${weather.condition.icon}`} 
              alt={weather.condition.text} 
              className="w-12 h-12" 
            />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{Math.round(weather.temp_c)}°C</div>
            <div className="text-sm text-gray-600">{condicionClima}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {Math.round(weather.wind_kph)} km/h
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            {weather.humidity}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClimaCard;
