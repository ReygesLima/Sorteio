
import React, { useState, useEffect, useRef } from 'react';
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
  FileSpreadsheet,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import Papa from 'papaparse';
import { EventData } from './types';
import EventForm from './components/EventForm';
import RafflePreview from './components/RafflePreview';
import DrawModal from './components/DrawModal';
import { generatePDF } from './services/pdfService';
import { db } from './services/databaseService';

const App: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDrawOpen, setIsDrawOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o fluxo de importação
  const [pendingImports, setPendingImports] = useState<EventData[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [globalImportImage, setGlobalImportImage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importImageRef = useRef<HTMLInputElement>(null);

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
    const headers = ["Título", "Local", "Data Sorteio", "Valor", "Prêmio", "Cartelas", "BannerBase64"];
    const rows = events.map(e => [
      e.title,
      e.location,
      new Date(e.drawDate).toLocaleDateString('pt-BR'),
      e.value.toFixed(2),
      e.prize,
      `${e.initialSeq} a ${e.finalSeq}`,
      e.headerImage || ""
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rifas_completo_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      complete: (results) => {
        try {
          const imported: EventData[] = results.data.map((row: any) => {
            const title = row["Título"] || row["title"] || "Sem Título";
            const location = row["Local"] || row["location"] || "";
            const drawDateRaw = row["Data Sorteio"] || row["drawDate"] || new Date().toISOString();
            const valueRaw = row["Valor"] || row["value"] || "0";
            const prize = row["Prêmio"] || row["prize"] || "";
            const cartelasRaw = row["Cartelas"] || row["sequence"] || "1 a 100";
            const headerImage = row["BannerBase64"] || row["headerImage"] || "";

            const seqParts = cartelasRaw.split(/\s+a\s+/i);
            const initialSeq = parseInt(seqParts[0]) || 1;
            const finalSeq = parseInt(seqParts[1]) || (initialSeq + 99);

            let drawDate = drawDateRaw;
            if (drawDateRaw.includes('/')) {
              const [d, m, y] = drawDateRaw.split('/');
              drawDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }

            return {
              id: crypto.randomUUID(),
              title,
              description: `Importado em ${new Date().toLocaleDateString()}`,
              location,
              startDate: new Date().toISOString(),
              endDate: drawDate,
              drawDate,
              value: parseFloat(valueRaw.replace(',', '.')) || 0,
              prize,
              initialSeq,
              finalSeq,
              headerImage,
              createdAt: Date.now()
            };
          });

          setPendingImports(imported);
          setIsImportModalOpen(true);
        } catch (err) {
          console.error(err);
          alert("Formato de planilha inválido.");
        } finally {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    });
  };

  const finalizeImport = async () => {
    setIsLoading(true);
    try {
      for (const ev of pendingImports) {
        // Aplica a imagem global se o evento não tiver uma específica
        const finalEvent = {
          ...ev,
          headerImage: ev.headerImage || globalImportImage
        };
        await db.saveEvent(finalEvent);
      }
      setIsImportModalOpen(false);
      setPendingImports([]);
      setGlobalImportImage('');
      await loadData();
      alert("Dados importados e salvos com sucesso!");
    } catch (err) {
      alert("Erro ao finalizar importação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGlobalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setGlobalImportImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.prize.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 p-4 md:p-8">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Award size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">RAFFLE MASTER</h1>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Gestão de Sorteios v2.5</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button onClick={() => setViewMode('cards')} className={`p-3 rounded-xl transition-all active:scale-95 ${viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewMode('table')} className={`p-3 rounded-xl transition-all active:scale-95 ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><TableIcon size={20} /></button>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleImportClick} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"><Upload size={18} className="text-indigo-400" /><span className="hidden sm:inline">Importar Planilha</span></button>
            <button onClick={exportToCSV} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"><FileSpreadsheet size={18} className="text-emerald-400" /><span className="hidden sm:inline">Exportar Tudo</span></button>
          </div>

          <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95"><PlusCircle size={20} />NOVO SORTEIO</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div></div>
        ) : events.length === 0 ? (
          <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[3rem] p-20 text-center">
            <Database size={64} className="mx-auto text-slate-700 mb-6" />
            <h2 className="text-2xl font-bold text-slate-400 mb-2">Nenhum sorteio encontrado</h2>
            <p className="text-slate-500 mb-8">Comece criando um novo sorteio ou importe uma planilha CSV completa.</p>
            <div className="flex justify-center gap-4">
               <button onClick={() => setIsFormOpen(true)} className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95">Criar Manualmente</button>
               <button onClick={handleImportClick} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95">Importar CSV</button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row justify-between gap-4">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                 <input placeholder="Pesquisar sorteios..." className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-8 py-5">Título / Banner</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Valor</th>
                    <th className="px-8 py-5">Prêmio</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredEvents.map(event => (
                    <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {event.headerImage ? (
                            <img src={event.headerImage} className="w-12 h-8 rounded-lg object-cover border border-white/10" alt="" />
                          ) : (
                            <div className="w-12 h-8 rounded-lg bg-white/5 flex items-center justify-center"><ImageIcon size={14} className="text-slate-600" /></div>
                          )}
                          <div>
                            <div className="font-bold text-white">{event.title}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={10}/> {event.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-slate-400">{new Date(event.drawDate).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-right font-black text-emerald-400">R$ {event.value.toFixed(2)}</td>
                      <td className="px-8 py-6 text-sm text-slate-300 truncate max-w-[200px]">{event.prize}</td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => { setSelectedEvent(event); setIsDrawOpen(true); }} className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all active:scale-90"><Sparkles size={18} /></button>
                          <button onClick={() => handlePrint(event)} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all active:scale-90"><Printer size={18} /></button>
                          <button onClick={(e) => deleteEvent(event.id, e)} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all active:scale-90"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-3 space-y-4">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">RIFAS ATIVAS</h2>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {events.map(event => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} className={`p-6 rounded-[2rem] cursor-pointer transition-all border active:scale-95 ${selectedEvent?.id === event.id ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-600/20 scale-[1.02]' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'}`}>
                    <h3 className="font-bold text-sm truncate mb-1">{event.title}</h3>
                    <div className="text-[10px] font-black uppercase tracking-wider opacity-60">{new Date(event.drawDate).toLocaleDateString()}</div>
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
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                          <h2 className="text-4xl font-black mb-2 tracking-tighter">{selectedEvent.title}</h2>
                          <p className="text-slate-400 max-w-2xl leading-relaxed">{selectedEvent.description}</p>
                        </div>
                        <button onClick={() => setIsDrawOpen(true)} className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"><Sparkles size={24} /> REALIZAR SORTEIO</button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><div className="text-[10px] font-black text-slate-500 uppercase mb-2">Valor</div><div className="text-xl font-black text-emerald-400">R$ {selectedEvent.value.toFixed(2)}</div></div>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><div className="text-[10px] font-black text-slate-500 uppercase mb-2">Data</div><div className="text-xl font-black">{new Date(selectedEvent.drawDate).toLocaleDateString()}</div></div>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><div className="text-[10px] font-black text-slate-500 uppercase mb-2">Prêmio</div><div className="text-xl font-black truncate">{selectedEvent.prize}</div></div>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><div className="text-[10px] font-black text-slate-500 uppercase mb-2">Cartelas</div><div className="text-xl font-black">{selectedEvent.finalSeq - selectedEvent.initialSeq + 1}</div></div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => handlePrint(selectedEvent)} disabled={isProcessing} className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black transition-all active:scale-95 ${isProcessing ? 'bg-slate-700 animate-pulse' : 'bg-white text-indigo-950 hover:bg-slate-200 shadow-xl'}`}>{isProcessing ? 'GERANDO PDF...' : <><Printer size={20} /> GERAR PDF</>}</button>
                        <button onClick={() => deleteEvent(selectedEvent.id)} className="p-5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/10 transition-all active:scale-90"><Trash2 size={24} /></button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10"><h3 className="text-xl font-black mb-8 flex items-center gap-3"><LayoutGrid className="text-indigo-400" /> Visualizar Arte</h3><RafflePreview event={selectedEvent} /></div>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {/* MODAL DE REVISÃO DE IMPORTAÇÃO */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-5xl bg-[#15162b] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-white">REVISAR IMPORTAÇÃO</h2>
                <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mt-1">Foram encontrados {pendingImports.length} sorteios na planilha</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 transition-all"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Sparkles size={20} className="text-indigo-400"/> Aplicar Banner em Massa</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Deseja aplicar uma imagem padrão para todos os itens importados que não possuem banner? Isso economiza tempo na configuração individual.</p>
                </div>
                <div className="w-full md:w-auto flex flex-col items-center gap-4">
                  <div 
                    onClick={() => importImageRef.current?.click()}
                    className="w-48 h-28 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-all group overflow-hidden"
                  >
                    {globalImportImage ? (
                      <img src={globalImportImage} className="w-full h-full object-cover" alt="Global" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon size={24} className="mx-auto text-slate-600 mb-2 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Escolher Imagem</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={importImageRef} className="hidden" accept="image/*" onChange={handleGlobalImageChange} />
                  {globalImportImage && (
                    <button onClick={() => setGlobalImportImage('')} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300">Remover Imagem Global</button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">LISTA DE ITENS DETECTADOS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingImports.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-indigo-400">{idx + 1}</div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-white truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">R$ {item.value.toFixed(2)}</span>
                          <span className="text-[10px] font-black text-slate-500 truncate">{item.prize}</span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-600 mt-2 flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-indigo-500" /> {item.finalSeq - item.initialSeq + 1} Cartelas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-4">
              <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Cancelar</button>
              <button onClick={finalizeImport} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"><CheckCircle2 size={18} /> CONFIRMAR E SALVAR TUDO</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals Form & Draw */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl animate-in zoom-in duration-200">
             <EventForm onSave={saveEvent} onClose={() => setIsFormOpen(false)} />
          </div>
        </div>
      )}
      {isDrawOpen && selectedEvent && (
        <DrawModal title={selectedEvent.title} initialSeq={selectedEvent.initialSeq} finalSeq={selectedEvent.finalSeq} onClose={() => setIsDrawOpen(false)} />
      )}
    </div>
  );
};

export default App;
