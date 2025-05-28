import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Rating {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface ClubRatingsPanelProps {}

const ClubRatingsPanel: React.FC<ClubRatingsPanelProps> = () => {
  const [user] = useAuthState(auth);
  const clubId = user?.uid || '';
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('clubId', '==', clubId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(ratingsQuery).catch(async (error) => {
          if (error.code === 'failed-precondition') {
            // Si el error es por falta de índice, intentamos sin ordenar
            const simpleQuery = query(
              collection(db, 'ratings'),
              where('clubId', '==', clubId)
            );
            return await getDocs(simpleQuery);
          }
          throw error;
        });
        
        if (snapshot.empty) {
          setLoading(false);
          return;
        }

        const ratingsData: Rating[] = [];
        let sum = 0;
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.userId && data.rating !== undefined) {
            ratingsData.push({
              id: doc.id,
              userName: data.userName || 'Usuario anónimo',
              rating: data.rating,
              comment: data.comment || '',
              createdAt: data.createdAt
            });
            sum += data.rating;
          }
        });

        // Ordenar manualmente por fecha si no se pudo hacer en la consulta
        if (ratingsData[0]?.createdAt?.toDate) {
          ratingsData.sort((a, b) => 
            b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
          );
        }

        setRatings(ratingsData);
        setTotalRatings(ratingsData.length);
        setAverageRating(ratingsData.length > 0 ? sum / ratingsData.length : 0);
      } catch (error) {
        console.error('Error al cargar las calificaciones:', error);
        setError('No se pudieron cargar las calificaciones. Por favor, asegúrate de que el índice de Firestore esté configurado correctamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [clubId]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Error al cargar las calificaciones</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <a 
          href="https://console.firebase.google.com/v1/r/project/pescacordoba-7925c/firestore/indexes?create_composite=ClJwcm9qZWN0cy9wZXNjYWNvcmRvYmEtNzkyNWMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3JhdGluZ3MvaW5kZXhlcy9fEAEaCgoGY2x1YklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Crear índice en Firebase
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Función para renderizar las estrellas
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Calificaciones del Club</h2>
      
      {totalRatings === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aún no hay calificaciones para este club.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-lg">
            <div>
              <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-500">de 5.0 estrellas</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium">{totalRatings} {totalRatings === 1 ? 'calificación' : 'calificaciones'}</div>
              {renderStars(averageRating)}
            </div>
          </div>

          <div className="space-y-6">
            {ratings.map((rating) => (
              <div key={rating.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {rating.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">{rating.userName}</p>
                      <div className="flex items-center">
                        {renderStars(rating.rating)}
                        <span className="ml-2 text-sm text-gray-500">
                          {rating.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {rating.createdAt ? format(rating.createdAt.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es }) : 'Fecha desconocida'}
                  </span>
                </div>
                {rating.comment && (
                  <div className="mt-3 pl-13">
                    <p className="text-gray-600 text-sm">"{rating.comment}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClubRatingsPanel;
