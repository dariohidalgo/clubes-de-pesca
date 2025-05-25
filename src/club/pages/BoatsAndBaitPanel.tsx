import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";

// Tipos
interface BoatStock {
  tipo: string;
  capacidad: number;
  cantidad: number;
  precio: number;
}

interface MojarrasStock {
  disponible: boolean;
  precio: number;
}

const BOAT_TYPES: BoatStock[] = [
  { tipo: "Botes con motor", capacidad: 3, cantidad: 0, precio: 0 },
  { tipo: "Botes sin motor", capacidad: 3, cantidad: 0, precio: 0 },
  { tipo: "Tracker", capacidad: 4, cantidad: 0, precio: 0 },
  { tipo: "Tracker", capacidad: 5, cantidad: 0, precio: 0 },
];

const DEFAULT_MOJARRAS: MojarrasStock = {
  disponible: true,
  precio: 0,
};

const BoatsAndBaitPanel: React.FC = () => {
  const [boats, setBoats] = useState<BoatStock[]>(BOAT_TYPES);
  const [mojarras, setMojarras] = useState<MojarrasStock>(DEFAULT_MOJARRAS);
  const [edit, setEdit] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Carga datos del club desde Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "clubs", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Leer botes
          if (Array.isArray(data.boats)) {
            // Mapear y asegurar presencia de los 4 tipos
            const boatsMerged = BOAT_TYPES.map((defaultBoat) => {
              const found = data.boats.find(
                (b: any) =>
                  b.tipo === defaultBoat.tipo &&
                  b.capacidad === defaultBoat.capacidad
              );
              return found
                ? {
                    ...defaultBoat,
                    cantidad: Number(found.cantidad) || 0,
                    precio: Number(found.precio) || 0,
                  }
                : defaultBoat;
            });
            setBoats(boatsMerged);
          }
          // Leer mojarras (carnada)
          if (data.mojarras) {
            setMojarras({
              disponible:
                typeof data.mojarras.disponible === "boolean"
                  ? data.mojarras.disponible
                  : true,
              precio: Number(data.mojarras.precio) || 0,
            });
          }
        }
      }
    };
    fetchData();
  }, []);

  // Editar botes
  const handleBoatChange = (
    idx: number,
    field: keyof BoatStock,
    value: string | number
  ) => {
    setBoats((prev) =>
      prev.map((b, i) =>
        i === idx ? { ...b, [field]: field === "tipo" ? String(value) : Number(value) } : b
      )
    );
  };

  // Editar mojarras
  const handleMojarrasChange = (
    field: keyof MojarrasStock,
    value: string | boolean | number
  ) => {
    setMojarras((prev) => ({
      ...prev,
      [field]: field === "precio"
        ? Number(value)
        : field === "disponible"
        ? Boolean(value)
        : value,
    }));
  };

  // Guardar en Firestore
  const handleSave = async () => {
    setError("");
    setMessage("");
    try {
      if (!auth.currentUser) throw new Error("No autenticado");
      const docRef = doc(db, "clubs", auth.currentUser.uid);
      await updateDoc(docRef, {
        boats,
        mojarras,
      });
      setMessage("¡Datos actualizados!");
      setEdit(false);
    } catch (err: any) {
      setError("Error al guardar los datos: " + (err.message || "Intente de nuevo."));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Botes y Carnadas</h1>
        {!edit ? (
          <button
            onClick={() => setEdit(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEdit(false)}
              className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Guardar
            </button>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {/* Sección de Botes - Versión móvil */}
      <section className="mb-10 sm:hidden">
        <h2 className="text-xl font-semibold mb-4">Botes</h2>
        <div className="space-y-4">
          {boats.map((boat, i) => (
            <div key={`${boat.tipo}-${boat.capacidad}-mobile`} className="bg-white rounded-xl shadow p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">
                  {boat.tipo}
                  {boat.tipo === "Tracker" ? ` (${boat.capacidad} pers.)` : ` (${boat.capacidad} personas)`}
                </h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {boat.cantidad} disponibles
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Precio</label>
                  {edit ? (
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min={0}
                        value={boat.precio}
                        className="border rounded-lg pl-6 pr-2 py-1.5 w-full"
                        onChange={e => handleBoatChange(i, "precio", e.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900 font-medium">${boat.precio.toLocaleString("es-AR")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cantidad</label>
                  {edit ? (
                    <input
                      type="number"
                      min={0}
                      value={boat.cantidad}
                      className="border rounded-lg px-3 py-1.5 w-full"
                      onChange={e => handleBoatChange(i, "cantidad", e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{boat.cantidad}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Botes - Versión escritorio */}
      <section className="mb-10 hidden sm:block">
        <h2 className="text-xl font-semibold mb-4">Botes</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio ($)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {boats.map((boat, i) => (
                  <tr key={`${boat.tipo}-${boat.capacidad}-desktop`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {boat.tipo}
                        {boat.tipo === "Tracker" ? ` (${boat.capacidad} pers.)` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{boat.capacidad}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {edit ? (
                        <input
                          type="number"
                          min={0}
                          value={boat.cantidad}
                          className="border rounded px-3 py-1 w-20 text-sm"
                          onChange={e => handleBoatChange(i, "cantidad", e.target.value)}
                        />
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {boat.cantidad} disponible{boat.cantidad !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {edit ? (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            min={0}
                            value={boat.precio}
                            className="border rounded pl-6 pr-2 py-1 w-24 text-sm"
                            onChange={e => handleBoatChange(i, "precio", e.target.value)}
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">${boat.precio.toLocaleString("es-AR")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sección de Carnadas - Versión móvil */}
      <section className="sm:hidden">
        <h2 className="text-xl font-semibold mb-4">Carnadas</h2>
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Mojarras</h3>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
              mojarras.disponible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {mojarras.disponible ? 'Disponible' : 'No disponible'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Precio</label>
              {edit ? (
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min={0}
                    value={mojarras.precio}
                    className="border rounded-lg pl-6 pr-2 py-1.5 w-full"
                    onChange={e => handleMojarrasChange("precio", e.target.value)}
                  />
                </div>
              ) : (
                <p className="text-gray-900 font-medium">${mojarras.precio.toLocaleString("es-AR")}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Disponibilidad</label>
              {edit ? (
                <div className="relative">
                  <select
                    value={mojarras.disponible ? 'si' : 'no'}
                    onChange={e => handleMojarrasChange("disponible", e.target.value === 'si')}
                    className="border rounded-lg px-3 py-1.5 w-full appearance-none bg-white"
                  >
                    <option value="si">Disponible</option>
                    <option value="no">No disponible</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                <p className="text-gray-900 font-medium">
                  {mojarras.disponible ? 'Disponible' : 'No disponible'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Carnadas - Versión escritorio */}
      <section className="hidden sm:block">
        <h2 className="text-xl font-semibold mb-4">Carnadas</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponibilidad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio ($)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Mojarras</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {edit ? (
                      <select
                        value={mojarras.disponible ? 'si' : 'no'}
                        onChange={e => handleMojarrasChange("disponible", e.target.value === 'si')}
                        className="border rounded px-3 py-1 text-sm"
                      >
                        <option value="si">Disponible</option>
                        <option value="no">No disponible</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        mojarras.disponible 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mojarras.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {edit ? (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          min={0}
                          value={mojarras.precio}
                          className="border rounded pl-6 pr-2 py-1 w-24 text-sm"
                          onChange={e => handleMojarrasChange("precio", e.target.value)}
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">${mojarras.precio.toLocaleString("es-AR")}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>
    
     

  
  );
};

export default BoatsAndBaitPanel;
