import React, { useState } from 'react';
import { Tag, Route, Gift, DollarSign } from 'lucide-react';
import { Tarifas } from './Tarifas';
import { Fletes } from './Fletes';
import { Promociones } from './Promociones';

export const Precios = () => {
  const [activeTab, setActiveTab] = useState('tarifas');

  const tabs = [
    { id: 'tarifas', label: 'Tarifas Base', icon: Tag },
    { id: 'fletes', label: 'Zonas y Fletes', icon: Route },
    { id: 'promociones', label: 'Promociones', icon: Gift },
  ];

  return (
    <div className="animate-fade-in flex flex-col h-full gap-6 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2 flex items-center gap-3">
          <DollarSign className="text-primary" size={30} />
          Configuración de Precios
        </h2>
        <p className="text-text-muted">
          Gestiona los precios base, fletes por zonas y códigos promocionales desde un solo lugar.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-surface-bright/30 backdrop-blur-md border border-border/40 rounded-xl w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-text-muted hover:text-text-main hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 mt-2">
        {activeTab === 'tarifas' && <Tarifas isEmbedded={true} />}
        {activeTab === 'fletes' && <Fletes isEmbedded={true} />}
        {activeTab === 'promociones' && <Promociones isEmbedded={true} />}
      </div>
    </div>
  );
};
