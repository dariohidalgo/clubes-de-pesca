import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import ClubCard from "../components/ClubCard";
import { useNavigate } from "react-router-dom";


interface Club {
  id: string;
  name: string;
  logoUrl: string;
  location: string;
  phone: string;
  boats: any[];
}

const FisherDashboard: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "clubs"));
      const clubes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Club[];
      setClubs(clubes);
      setLoading(false);
    };

    fetchClubs();
  }, []);

  if (loading) return <div className="text-center mt-8">Cargando clubes...</div>;

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl mt-8 sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-blue-800 px-2">
          Reservá tu Club de Pesca
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          {clubs.map((club) => (
            <div key={club.id} className="w-full flex justify-center">
              <ClubCard
                name={club.name}
                logoUrl={club.logoUrl}
                location={club.location}
                phone={club.phone}
                boats={Array.isArray(club.boats) ? club.boats : []}
                onReservar={() => navigate(`/fisher/reservar/${club.id}`)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FisherDashboard;
