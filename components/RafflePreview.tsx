
import React, { useState } from 'react';
import { EventData } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RafflePreviewProps {
  event: EventData;
}

const RafflePreview: React.FC<RafflePreviewProps> = ({ event }) => {
  const [page, setPage] = useState(0);
  const slotsPerPage = 25;
  const totalSlots = event.finalSeq - event.initialSeq + 1;
  const totalPages = Math.ceil(totalSlots / slotsPerPage);

  const startIdx = page * slotsPerPage;
  const currentSlots = Array.from({ length: slotsPerPage }, (_, i) => {
    const num = event.initialSeq + startIdx + i;
    return num <= event.finalSeq ? num : null;
  });

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {currentSlots.map((num, idx) => (
          num ? (
            <div key={idx} className="bg-white rounded-[2rem] p-5 flex flex-col items-start justify-between aspect-square transition-all hover:shadow-2xl hover:-translate-y-1 border border-slate-200 shadow-sm text-slate-900 overflow-hidden relative group">
              {/* Número no topo centralizado - GIGANTE */}
              <div className="w-full text-center mt-1">
                <span className="text-6xl font-black text-slate-900 leading-none tracking-tighter">{num}</span>
              </div>
              
              {/* Corpo da cartela com inputs simulados */}
              <div className="w-full space-y-3 mb-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black text-slate-400 leading-tight">Nome participante</span>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black text-slate-400 leading-tight">Celular</span>
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
              </div>

              {/* Rodapé da cartela */}
              <div className="w-full text-[10px] text-slate-500 font-bold leading-tight pt-2 border-t border-slate-50">
                <div className="flex justify-between items-center mb-0.5">
                  <span>Valor: R$ {formatCurrency(event.value)}</span>
                </div>
                <div className="truncate opacity-70">Sorteio: {event.prize}</div>
              </div>
            </div>
          ) : (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-[2rem] aspect-square opacity-5"></div>
          )
        ))}
      </div>

      <div className="flex justify-between items-center bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 shadow-inner">
        <button 
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl disabled:opacity-20 transition-all text-white font-bold text-sm"
        >
          <ChevronLeft size={18} /> Anterior
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Visualização</span>
          <span className="text-sm font-bold text-slate-300">
            Página <span className="text-white text-lg font-black">{page + 1}</span> de <span className="text-white text-lg font-black">{totalPages}</span>
          </span>
        </div>
        <button 
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl disabled:opacity-20 transition-all text-white font-bold text-sm"
        >
          Próxima <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default RafflePreview;
