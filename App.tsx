
import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Settings, 
  Printer, 
  Trash2, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Award, 
  ChevronRight,
  LayoutGrid,
  Hash,
  Info,
  Copy
} from 'lucide-react';
import { EventData } from './types';
import EventForm from './components/EventForm';
import RafflePreview from './components/RafflePreview';
import { generatePDF } from './services/pdfService';

const App: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastConfig, setLastConfig] = useState<Partial<EventData> | null>(null);

  // Persistência no LocalStorage (Banco de Dados Local)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('raffle_master_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        setEvents(parsed);
        if (parsed.length > 0) {
          setSelectedEvent(parsed[0]);
          // Guardar última config para facilitar novos registros
          setLastConfig(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar banco local", e);
    }
  }, []);

  const saveEvent = (data: EventData) => {
    const updated = [data, ...events];
    setEvents(updated);
    localStorage.setItem('raffle_master_db', JSON.stringify(updated));
    setLastConfig(data);
    setIsFormOpen(false);
    setSelectedEvent(data);
  };

  const deleteEvent = (id: string) => {
    if(!confirm("Deseja apagar este sorteio e todas as suas configurações?")) return;
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem('raffle_master_db', JSON.stringify(updated));
    if (selectedEvent?.id === id) setSelectedEvent(updated.length > 0 ? updated[0] : null);
  };

  const handlePrint = async (event: EventData) => {
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        await generatePDF(event);
      } catch (error) {
        console.error("Erro no PDF", error);
        alert("Erro ao gerar o documento. Verifique as permissões de download.");
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  const duplicateEvent = (event: EventData) => {
    setLastConfig(event);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0f1021] text-slate-100 p-4 md:p-10 selection:bg-indigo-500/30">
      {/* Header Principal */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 border border-white/10">
            <Award className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white">RAFFLE MASTER</h1>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">Sorteios Profissionais v2.5</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="group flex items-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-[1.5rem] font-black transition-all hover:bg-indigo-50 hover:shadow-2xl hover:shadow-white/10 active:scale-95"
        >
          <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
          CRIAR NOVO EVENTO
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Barra Lateral de Eventos */}
        <aside className="lg:col-span-3 space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
            <LayoutGrid size={12} /> BANCO DE DADOS LOCAL
          </h2>
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            {events.length === 0 ? (
              <div className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[2rem] p-10 text-center opacity-40">
                <Info className="mx-auto mb-2 opacity-20" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Sem Eventos</p>
              </div>
            ) : (
              events.map(event => (
                <div 
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`relative p-6 rounded-[2rem] cursor-pointer transition-all border group ${
                    selectedEvent?.id === event.id 
                      ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-600/30 translate-x-1' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-black text-sm truncate leading-tight w-full ${selectedEvent?.id === event.id ? 'text-white' : 'text-slate-200'}`}>
                      {event.title}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); duplicateEvent(event); }}
                        title="Usar como base"
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className={`text-[10px] font-black uppercase tracking-wider ${selectedEvent?.id === event.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {new Date(event.drawDate).toLocaleDateString()} • {event.finalSeq - event.initialSeq + 1} CARTELAS
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Painel Central */}
        <section className="lg:col-span-9 space-y-8">
          {selectedEvent ? (
            <>
              {/* Cabeçalho do Evento - Estilo Referência */}
              <div className="bg-[#1a1b3a] rounded-[3rem] p-10 md:p-14 shadow-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-indigo-500/20"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                     <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-indigo-500/20">RIFA ATIVA</span>
                     <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-emerald-500/20">VERIFICADO</span>
                  </div>

                  <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-[1.1] tracking-tighter">
                    {selectedEvent.title}
                  </h2>
                  
                  <div className="max-w-3xl mb-14">
                    <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedEvent.description}
                    </p>
                  </div>

                  {/* Cards de Informação */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
                    <div className="bg-white/[0.03] rounded-[2rem] p-7 border border-white/5 flex flex-col justify-center transition-all hover:bg-white/[0.05]">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin size={10}/> LOCAL</span>
                      <span className="text-xl font-black text-white truncate">{selectedEvent.location}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-[2rem] p-7 border border-white/5 flex flex-col justify-center transition-all hover:bg-white/[0.05]">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar size={10}/> DATA SORTEIO</span>
                      <span className="text-xl font-black text-white">{new Date(selectedEvent.drawDate).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-[2rem] p-7 border border-white/5 flex flex-col justify-center transition-all hover:bg-white/[0.05]">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><DollarSign size={10}/> VALOR UNIT.</span>
                      <span className="text-xl font-black text-emerald-400 uppercase">R$ {selectedEvent.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-[2rem] p-7 border border-white/5 flex flex-col justify-center transition-all hover:bg-white/[0.05]">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Hash size={10}/> SEQUÊNCIA</span>
                      <span className="text-xl font-black text-indigo-400">{selectedEvent.initialSeq} a {selectedEvent.finalSeq}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-white/5">
                    <button 
                      onClick={() => handlePrint(selectedEvent)}
                      disabled={isProcessing}
                      className={`w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-6 rounded-[1.75rem] font-black transition-all shadow-2xl active:scale-95 disabled:cursor-not-allowed ${
                        isProcessing 
                        ? 'animate-shimmer animate-pulse text-slate-700 shadow-indigo-500/20' 
                        : 'bg-white text-slate-950 hover:bg-slate-200 shadow-white/5'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-3 border-slate-900 border-t-transparent" />
                          GERANDO DOCUMENTO...
                        </>
                      ) : (
                        <><Printer size={22} /> PROCESSAR E GERAR PDF</>
                      )}
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Status de Processamento</span>
                      <span className={`text-sm font-bold uppercase ${isProcessing ? 'text-indigo-400 animate-pulse' : 'text-slate-300'}`}>
                        {isProcessing ? 'Construindo PDF de alta qualidade...' : `Pronto para impressão • ${selectedEvent.finalSeq - selectedEvent.initialSeq + 1} unidades`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de Visualização */}
              <div className="bg-[#1a1b3a]/40 rounded-[3rem] p-10 border border-white/5">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                      <LayoutGrid size={24} className="text-indigo-400" />
                    </div>
                    Painel de Pré-Impressão
                  </h3>
                  <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-indigo-400 bg-indigo-500/5 px-5 py-2.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Visualizando Cartelas Finais
                  </div>
                </div>
                <RafflePreview event={selectedEvent} />
              </div>
            </>
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-16 bg-white/[0.01] rounded-[4rem] border-4 border-dashed border-white/[0.03] group transition-all hover:bg-white/[0.02]">
              <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-12">
                <Settings size={56} className="text-slate-800" />
              </div>
              <h2 className="text-3xl font-black text-slate-600 mb-4 uppercase tracking-tighter">Painel em Espera</h2>
              <p className="text-slate-700 max-w-sm font-black uppercase text-[11px] tracking-[0.3em] leading-relaxed">
                Nenhum evento ativo. Comece criando um novo sorteio ou selecione um do banco local para gerar o material.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-950/95 backdrop-blur-3xl">
          <div className="w-full max-w-3xl animate-in zoom-in duration-300 ease-out">
             <EventForm 
               initialData={lastConfig || undefined}
               onSave={saveEvent} 
               onClose={() => setIsFormOpen(false)} 
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;