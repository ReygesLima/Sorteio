
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Calendar, MapPin, DollarSign, Award, Hash, Settings, AlignLeft, Sparkles, Image as ImageIcon, Trash2, Camera } from 'lucide-react';
import { EventData } from '../types';

interface EventFormProps {
  initialData?: Partial<EventData>;
  onSave: (data: EventData) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ initialData, onSave, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    drawDate: '',
    value: 10.00,
    prize: '',
    initialSeq: 1,
    finalSeq: 999,
    headerImage: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        id: '',
        createdAt: 0
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.drawDate) return;

    const newEvent: EventData = {
      ...formData,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    } as EventData;
    onSave(newEvent);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, headerImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, headerImage: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-[#1a1b3a] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
      {/* Header do Modal com Pré-visualização Dinâmica */}
      <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 overflow-hidden ${
            formData.headerImage ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' : 'bg-indigo-500/10 border-indigo-500/20'
          }`}>
            {formData.headerImage ? (
              <img src={formData.headerImage} className="w-full h-full object-cover animate-in zoom-in duration-300" alt="Thumb" />
            ) : (
              <Sparkles className="text-indigo-400" size={32} />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter">CONFIGURAR RIFA</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              {formData.headerImage ? <><ImageIcon size={12} /> Banner Carregado</> : "Personalize sua arte e dados"}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="bg-white/5 p-4 rounded-2xl text-slate-500 hover:text-white transition-all hover:bg-white/10 active:scale-90">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Área de Upload de Imagem */}
          <div className="col-span-2 space-y-4">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Camera size={14} className="text-indigo-400" /> Banner da Cartela (PDF)
              </label>
              {formData.headerImage && (
                <button 
                  type="button" 
                  onClick={removeImage}
                  className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors"
                >
                  Remover Imagem
                </button>
              )}
            </div>
            
            <div 
              className={`relative w-full h-56 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer group ${
                formData.headerImage ? 'border-indigo-500/50 ring-4 ring-indigo-500/5 bg-black/20' : 'border-white/10 hover:border-indigo-500/30 bg-white/5 hover:bg-white/[0.07]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.headerImage ? (
                <div className="relative w-full h-full group">
                  <img src={formData.headerImage} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white text-indigo-950 px-6 py-3 rounded-2xl font-black text-xs tracking-widest shadow-2xl flex items-center gap-2">
                      <Camera size={16} /> ALTERAR IMAGEM
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-500 p-8 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                    <ImageIcon size={32} />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-slate-300 uppercase tracking-widest mb-1">Upload de Banner</span>
                    <span className="text-[10px] opacity-50 uppercase tracking-tighter">Formatos: PNG, JPG ou WEBP (Max 5MB)</span>
                  </div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
          </div>

          <div className="col-span-2 space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Título do Evento</label>
            <input 
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: GRANDE RIFA BENEFICENTE"
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-slate-700 font-bold text-lg"
            />
          </div>

          <div className="col-span-2 space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
               <AlignLeft size={12} /> Descrição / Regras
            </label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Informações adicionais do sorteio..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-slate-700 font-medium text-base leading-relaxed resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <MapPin size={12} className="text-indigo-400" /> Local
            </label>
            <input 
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Cidade ou Estabelecimento"
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white font-bold"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Calendar size={12} className="text-indigo-400" /> Data Sorteio
            </label>
            <input 
              type="date"
              required
              name="drawDate"
              value={formData.drawDate}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white font-bold appearance-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <DollarSign size={12} className="text-indigo-400" /> Valor Unitário R$
            </label>
            <input 
              type="number"
              step="0.01"
              name="value"
              value={formData.value}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white font-bold text-xl text-emerald-400"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Award size={12} className="text-indigo-400" /> Prêmio Principal
            </label>
            <input 
              name="prize"
              value={formData.prize}
              onChange={handleChange}
              placeholder="O que será sorteado?"
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white font-bold"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Hash size={12} className="text-indigo-400" /> Sequência Inicial
            </label>
            <input 
              type="number"
              name="initialSeq"
              value={formData.initialSeq}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white font-bold"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Hash size={12} className="text-indigo-400" /> Sequência Final
            </label>
            <input 
              type="number"
              name="finalSeq"
              value={formData.finalSeq}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.05] transition-all text-white font-bold"
            />
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row gap-5">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-6 bg-white/5 hover:bg-white/10 text-slate-300 rounded-[1.75rem] font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95"
          >
            CANCELAR
          </button>
          <button 
            type="submit"
            className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.75rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            <Save size={20} />
            SALVAR CONFIGURAÇÕES
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
