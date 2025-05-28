import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";
import ClubCard from "../components/ClubCard";
import { useNavigate } from "react-router-dom";

interface Rating {
  id: string;
  clubId: string;
  rating: number;
  comment?: string;
  createdAt: any;
  [key: string]: any; // Para propiedades adicionales que puedan existir
}


interface Club {
  id: string;
  name: string;
  logoUrl: string;
  location: string;
  phone: string;
  boats: any[];
  averageRating?: number;
  ratingCount?: number;
}

const FisherDashboard: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Usamos el hook de autenticación pero no necesitamos la variable user aquí
  // ya que usamos auth.currentUser directamente cuando es necesario
  useAuthState(auth);

  const handleRatingChange = async (clubId: string, rating: number, comment: string = '', userEmail?: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Debes iniciar sesión para calificar");
        return;
      }

      // Obtener el perfil completo del usuario desde Firestore
      const userProfileRef = doc(db, 'users', user.uid);
      const userProfileDoc = await getDoc(userProfileRef);
      
      // Obtener el nombre del perfil o usar un valor por defecto
      let userName = 'Usuario anónimo';
      if (userProfileDoc.exists()) {
        const userData = userProfileDoc.data();
        userName = userData.nombre || user.displayName || 'Usuario anónimo';
      } else if (user.displayName) {
        userName = user.displayName;
      }

      const club = clubs.find(c => c.id === clubId);
      
      if (!club) {
        throw new Error("Club no encontrado");
      }
      
      // Guardar la calificación en Firestore
      const ratingRef = doc(collection(db, 'ratings'), `${user.uid}_${clubId}`);
      await setDoc(ratingRef, {
        userId: user.uid,
        userName: userName,
        userEmail: userEmail || user.email || 'usuario@ejemplo.com',
        clubId: clubId,
        clubName: club.name || 'Club sin nombre',
        rating: rating,
        comment: comment || '',
        createdAt: serverTimestamp()
      });

      // Recargar los datos para asegurar que tenemos la información más reciente
      await fetchClubsWithRatings();
      
      // Mostrar notificación de éxito
      toast.success("¡Gracias por tu calificación!");
      
    } catch (error) {
      console.error("Error al actualizar la calificación:", error);
      toast.error("No se pudo guardar la calificación. Inténtalo de nuevo.");
      throw error; // Propagar el error para que el componente padre lo maneje
    }
  };

  const fetchClubsWithRatings = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Obtener todos los clubes
      const clubsSnapshot = await getDocs(collection(db, "clubs"));
      const clubsData = clubsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Sin nombre',
          logoUrl: data.logoUrl || '',
          location: data.location || '',
          phone: data.phone || '',
          boats: data.boats || [],
          averageRating: 0,
          ratingCount: 0
        } as Club;
      });

      // 2. Obtener todas las calificaciones
      const ratingsSnapshot = await getDocs(collection(db, "ratings"));
      const ratings: Rating[] = [];
      
      ratingsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.clubId && data.rating) {
          ratings.push({
            id: doc.id,
            clubId: data.clubId,
            rating: data.rating,
            comment: data.comment,
            createdAt: data.createdAt,
            ...data
          });
        }
      });

      // 3. Calcular promedios para cada club
      const clubsWithRatings = clubsData.map(club => {
        const clubRatings = ratings.filter(r => r.clubId === club.id);
        const ratingCount = clubRatings.length;
        
        if (ratingCount === 0) return club;
        
        const totalRating = clubRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
        const averageRating = parseFloat((totalRating / ratingCount).toFixed(1));
        
        return {
          ...club,
          averageRating,
          ratingCount
        };
      });

      setClubs(clubsWithRatings);
    } catch (error) {
      console.error("Error al cargar los clubes:", error);
      toast.error("Error al cargar la información de los clubes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubsWithRatings();
  }, [fetchClubsWithRatings]);

  if (loading) return <div className="text-center mt-8">Cargando clubes...</div>;

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl mt-1 sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-blue-800 px-2">
          Reservá tu Club de Pesca
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          {clubs.map((club) => (
            <div key={club.id} className="w-full flex justify-center">
              <ClubCard
                id={club.id}
                name={club.name}
                logoUrl={club.logoUrl}
                location={club.location}
                phone={club.phone}
                boats={Array.isArray(club.boats) ? club.boats : []}
                onReservar={() => navigate(`/fisher/reservar/${club.id}`)}
                averageRating={club.averageRating || 0}
                ratingCount={club.ratingCount || 0}
                onRatingChange={handleRatingChange}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FisherDashboard;
