import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Rating {
  id: string;
  clubId: string;
  clubName: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: any;
}

interface ClubRating {
  id: string;
  name: string;
  averageRating: number;
  ratingCount: number;
  ratings: Rating[];
}

const ClubRankings: React.FC = () => {
  const [clubs, setClubs] = useState<ClubRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
       
        // Obtener todos los ratings
        const ratingsQuery = query(
          collection(db, 'ratings'), // Cambiado de 'clubRatings' a 'ratings'
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(ratingsQuery);
        
        
        if (snapshot.empty) {
         
          setClubs([]);
          setLoading(false);
          return;
        }
        
        const ratings: Rating[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
       
          
          // Verificar que los campos obligatorios existan
          if (data.clubId && data.userId && data.rating !== undefined) {
            ratings.push({
              id: doc.id,
              clubId: data.clubId,
              clubName: data.clubName || 'Club sin nombre',
              userName: data.userName || 'Usuario anónimo',
              userEmail: data.userEmail || 'Usuario anónimo',
              rating: Number(data.rating),
              comment: data.comment,
              createdAt: data.createdAt?.toDate() || new Date()
            });
          }
        });

        if (ratings.length === 0) {
          setClubs([]);
          setLoading(false);
          return;
        }

        // Obtener información de los clubes
        const clubesSnapshot = await getDocs(collection(db, 'clubs'));
        const clubesMap = new Map<string, any>();
        
        clubesSnapshot.forEach(doc => {
          clubesMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // Agrupar ratings por club
        const clubsMap = new Map<string, ClubRating>();
        
        ratings.forEach(rating => {
          const clubData = clubesMap.get(rating.clubId);
          
          if (!clubsMap.has(rating.clubId)) {
            clubsMap.set(rating.clubId, {
              id: rating.clubId,
              name: clubData?.name || `Club ${rating.clubId.substring(0, 5)}`,
              averageRating: 0,
              ratingCount: 0,
              ratings: []
            });
          }
          
          const club = clubsMap.get(rating.clubId)!;
          club.ratings.push(rating);
        });

        // Calcular promedios
        const clubsList = Array.from(clubsMap.values()).map(club => {
          const avgRating = club.ratings.length > 0 
            ? club.ratings.reduce((sum, r) => sum + r.rating, 0) / club.ratings.length
            : 0;
            
          return {
            ...club,
            averageRating: parseFloat(avgRating.toFixed(1)),
            ratingCount: club.ratings.length
          };
        });

        // Ordenar por rating promedio
        clubsList.sort((a, b) => b.averageRating - a.averageRating);
     
        setClubs(clubsList);
      } catch (error) {
        console.error('Error al cargar las calificaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            aria-hidden="true"
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ranking de Clubes</h1>
      
      <div className="space-y-6">
        {clubs.map((club) => (
          <div key={club.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
              className="p-4 cursor-pointer flex justify-between items-center"
              onClick={() => setSelectedClub(selectedClub === club.id ? null : club.id)}
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{club.name}</h2>
                <div className="flex items-center mt-1">
                  {renderStars(club.averageRating)}
                  <span className="ml-3 text-sm text-gray-500">
                    {club.ratingCount} {club.ratingCount === 1 ? 'calificación' : 'calificaciones'}
                  </span>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  selectedClub === club.id ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            
            {selectedClub === club.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Calificaciones y Comentarios</h3>
                  </div>
                  {club.ratings.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {club.ratings.slice(0, 5).map((rating, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                  {rating.userName?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium text-gray-800">
                                    {rating.userName || 'Usuario anónimo'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {rating.userEmail || 'Usuario anónimo'}
                                  </p>
                                  <div className="flex items-center mt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <StarIcon
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                        aria-hidden="true"
                                      />
                                    ))}
                                    <span className="ml-2 text-xs text-gray-500">
                                      {rating.rating.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {rating.comment && (
                                <div className="mt-3 pl-11">
                                  <p className="text-gray-600 text-sm">
                                    "{rating.comment}"
                                  </p>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                              {rating.createdAt ? (
                                format(rating.createdAt, "d 'de' MMMM 'de' yyyy", { locale: es })
                              ) : 'Fecha desconocida'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Este club aún no tiene calificaciones.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClubRankings;
