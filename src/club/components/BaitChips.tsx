import React from 'react';

const mockBaits = ['Lombriz', 'Maíz', 'Masa', 'Señuelos'];

const BaitChips: React.FC = () => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Tipos de Carnada</h2>
      <div className="flex gap-2 mb-3">
        {mockBaits.map((bait) => (
          <span
            key={bait}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
          >
            {bait}
          </span>
        ))}
      </div>
      <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-semibold">
        Agregar Carnada
      </button>
    </section>
  );
};

export default BaitChips;
