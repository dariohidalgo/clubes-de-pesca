import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

interface StarRatingProps {
  clubId: string;
  readOnly?: boolean;
  rating?: number;
  size?: 'sm' | 'md' | 'lg';
  onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  clubId,
  readOnly = false,
  rating: initialRating = 0,
  size = 'md',
  onRatingChange
}) => {
  const [user] = useAuthState(auth);
  const [hover, setHover] = useState<number | null>(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  
  // Inicializar la calificación actual
  useEffect(() => {
    setCurrentRating(initialRating);
  }, [initialRating]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  useEffect(() => {
    const checkIfUserRated = async () => {
      if (!user?.uid) return;
      
      try {
        const ratingRef = doc(db, 'ratings', `${user.uid}_${clubId}`);
        const ratingSnap = await getDoc(ratingRef);
        if (ratingSnap.exists()) {
          setHasRated(true);
          setCurrentRating(ratingSnap.data().rating);
        }
      } catch (error) {
        console.error('Error al verificar calificación:', error);
      }
    };
    
    checkIfUserRated();
  }, [user, clubId]);

  const handleRating = async (rating: number) => {
    if (readOnly) return;
    
    try {
      if (user?.uid) {
        const ratingRef = doc(db, 'ratings', `${user.uid}_${clubId}`);
        await setDoc(ratingRef, {
          userId: user.uid,
          clubId,
          rating,
          createdAt: new Date()
        });
        
        // Actualizar el promedio en el club
        await updateClubAverageRating(clubId);
        setHasRated(true);
      }
      
      setCurrentRating(rating);
      if (onRatingChange) onRatingChange(rating);
      
    } catch (error) {
      console.error('Error al guardar calificación:', error);
    }
  };

  const updateClubAverageRating = async (clubId: string) => {
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('clubId', '==', clubId));
      const querySnapshot = await getDocs(q);
      
      let total = 0;
      let count = 0;
      
      querySnapshot.forEach((doc) => {
        total += doc.data().rating;
        count++;
      });
      
      const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      
      // Actualizar el promedio en el documento del club
      const clubRef = doc(db, 'clubs', clubId);
      await setDoc(clubRef, {
        averageRating: average,
        ratingCount: count
      }, { merge: true });
      
    } catch (error) {
      console.error('Error al actualizar calificación promedio:', error);
    }
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hover !== null ? hover : currentRating) >= star;
        
        return (
          <button
            key={star}
            type="button"
            className={`${sizeClasses[size]} ${!readOnly && !hasRated ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => !readOnly && !hasRated && handleRating(star)}
            onMouseEnter={() => !readOnly && !hasRated && setHover(star)}
            onMouseLeave={() => !readOnly && !hasRated && setHover(null)}
            disabled={readOnly || hasRated}
            aria-label={`Calificar con ${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          >
            <svg
              className={`w-full h-full ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
      {!readOnly && hasRated && (
        <span className="text-sm text-gray-500 ml-2">¡Gracias por calificar!</span>
      )}
    </div>
  );
};

export default StarRating;
