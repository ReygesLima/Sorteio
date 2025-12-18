
import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Printer, 
  Trash2, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Award, 
  LayoutGrid,
  Hash,
  Download,
  Table as TableIcon,
  ChevronRight,
  Database,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { EventData } from './types';
import EventForm from './components/EventForm';
import RafflePreview from './components/RafflePreview';
import { generatePDF } from './services/pdfService';
import { db } from './services/databaseService';

const App: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await db.getEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEvent = async (data: EventData) => {
    try {
      await db.saveEvent(data);
      await loadData();
      setIsFormOpen(false);
      setSelectedEvent(data);
    } catch (e) {
      alert("Erro ao salvar no banco local.");
    }
  };

  const deleteEvent = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if(!confirm("Deseja apagar permanentemente este sorteio?")) return;
    try {
      await db.deleteEvent(id);
      const updated = events.filter(ev => ev.id !== id);
      setEvents(updated);
      if (selectedEvent?.id === id) {
        setSelectedEvent(updated.length > 0 ? updated[0] : null);
      }
    } catch (e) {
      alert("Erro ao remover.");
    }
  };

  const handlePrint = async (event: EventData) => {
    setIsProcessing(true);
    try {
      await generatePDF(event);
    } catch (error) {
      alert("Erro ao gerar PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    if (events.length === 0) return;
    const headers = ["Título", "Local", "Data Sorteio", "Valor", "Prêmio", "Cartelas"];
    const rows = events.map(e => [
      e.title,
      e.location,
      new Date(e.drawDate).toLocaleDateString(),
      e.value.toFixed(2),
      e.prize,
      `${e.initialSeq} a ${e.finalSeq}`
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rifas_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.prize.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Award size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">RAFFLE MASTER</h1>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Gestão de Sorteios v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setViewMode('cards')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <TableIcon size={20} />
            </button>
          </div>
          
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-2xl font-bold text-sm transition-all"
          >
            <FileSpreadsheet size={18} className="text-emerald-400" />
            <span className="hidden sm:inline">Exportar Planilha</span>
          </button>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
          >
            <PlusCircle size={20} />
            NOVO SORTEIO
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[3rem] p-20 text-center">
            <Database size={64} className="mx-auto text-slate-700 mb-6" />
            <h2 className="text-2xl font-bold text-slate-400 mb-2">Nenhum sorteio encontrado</h2>
            <p className="text-slate-500 mb-8">Comece criando seu primeiro evento de rifa.</p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all"
            >
              Criar Agora
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Modo Planilha */
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row justify-between gap-4">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                 <input 
                   placeholder="Pesquisar sorteios..."
                   className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 text-sm"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-8 py-5">Título / Evento</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Valor Unit.</th>
                    <th className="px-8 py-5">Prêmio</th>
                    <th className="px-8 py-5">Sequência</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredEvents.map(event => (
                    <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-bold text-white">{event.title}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={10}/> {event.location}</div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-slate-400">
                        {new Date(event.drawDate).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 text-right font-black text-emerald-400">
                        R$ {event.value.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-indigo-400" />
                          {event.prize}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-indigo-300">
                        {event.initialSeq} - {event.finalSeq}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-3">
                          <button 
                            onClick={() => handlePrint(event)}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                            title="Gerar PDF"
                          >
                            <Printer size={18} />
                          </button>
                          <button 
                            onClick={(e) => deleteEvent(event.id, e)}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Modo Cartões */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-3 space-y-4">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">SELECIONAR RIFA</h2>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {events.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-6 rounded-[2rem] cursor-pointer transition-all border ${
                      selectedEvent?.id === event.id 
                        ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-600/20 scale-[1.02]' 
                        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <h3 className="font-bold text-sm truncate mb-1">{event.title}</h3>
                    <div className="text-[10px] font-black uppercase tracking-wider opacity-60">
                      {new Date(event.drawDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <section className="lg:col-span-9 space-y-6">
              {selectedEvent && (
                <>
                  <div className="bg-[#15162b] rounded-[3rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                    
                    <div className="relative z-10">
                      <h2 className="text-4xl font-black mb-4 tracking-tighter">{selectedEvent.title}</h2>
                      <p className="text-slate-400 mb-8 max-w-2xl leading-relaxed">{selectedEvent.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                          <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Valor</div>
                          <div className="text-xl font-black text-emerald-400">R$ {selectedEvent.value.toFixed(2)}</div>
                        </div>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                          <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Data</div>
                          <div className="text-xl font-black">{new Date(selectedEvent.drawDate).toLocaleDateString()}</div>
                        </div>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                          <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Prêmio</div>
                          <div className="text-xl font-black truncate">{selectedEvent.prize}</div>
                        </div>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                          <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Cartelas</div>
                          <div className="text-xl font-black">{selectedEvent.finalSeq - selectedEvent.initialSeq + 1}</div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => handlePrint(selectedEvent)}
                          disabled={isProcessing}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black transition-all ${
                            isProcessing ? 'bg-slate-700 animate-pulse' : 'bg-white text-indigo-950 hover:bg-slate-200 shadow-xl'
                          }`}
                        >
                          {isProcessing ? 'GERANDO PDF...' : <><Printer size={20} /> GERAR PDF AGORA</>}
                        </button>
                        <button 
                          onClick={() => deleteEvent(selectedEvent.id)}
                          className="p-5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/10 transition-all"
                        >
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                      <LayoutGrid className="text-indigo-400" /> Pré-visualização
                    </h3>
                    <RafflePreview event={selectedEvent} />
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl animate-in zoom-in duration-200">
             <EventForm 
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
