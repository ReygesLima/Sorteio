
import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, RefreshCw, PartyPopper, Sparkles, Star, Loader2, Hash, History } from 'lucide-react';

interface DrawModalProps {
  initialSeq: number;
  finalSeq: number;
  title: string;
  onClose: () => void;
}

const DrawModal: React.FC<DrawModalProps> = ({ initialSeq, finalSeq, title, onClose }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const timerRef = useRef<number | null>(null);

  // Calcula números disponíveis
  const allNumbers = Array.from(
    { length: finalSeq - initialSeq + 1 },
    (_, i) => initialSeq + i
  );
  const availableNumbers = allNumbers.filter(n => !history.includes(n));
  const isSoldOut = availableNumbers.length === 0;

  const startDraw = () => {
    if (isDrawing || isRevealing || isSoldOut) return;
    
    setIsDrawing(true);
    setIsRevealing(false);
    setWinner(null);
    setCurrentNumber(null);
    
    const duration = 4000;
    const startTime = Date.now();
    let interval = 50;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      // Durante o giro, mostra qualquer número da sequência para efeito visual
      const visualNum = Math.floor(Math.random() * (finalSeq - initialSeq + 1)) + initialSeq;
      setCurrentNumber(visualNum);

      if (elapsed < duration) {
        interval = 50 + Math.pow(progress, 3) * 800;
        timerRef.current = window.setTimeout(animate, interval);
      } else {
        setIsDrawing(false);
        setIsRevealing(true);
        
        // FASE DE CLÍMAX: Seleciona o vencedor APENAS dos números disponíveis
        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * availableNumbers.length);
          const finalWinner = availableNumbers[randomIndex];
          
          setCurrentNumber(finalWinner);
          setWinner(finalWinner);
          setIsRevealing(false);
          setHistory(prev => [finalWinner, ...prev]);
        }, 1200);
      }
    };

    animate();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl transition-all duration-500 overflow-y-auto">
      {winner && <div className="absolute inset-0 bg-white/10 animate-bg-flash pointer-events-none"></div>}

      <div className="w-full max-w-4xl bg-[#15162b] rounded-[4rem] border border-white/10 shadow-[0_0_120px_rgba(79,70,229,0.4)] overflow-hidden relative my-8">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] blur-[160px] rounded-full transition-all duration-1000 ${
          winner ? 'bg-indigo-500/30' : isRevealing ? 'bg-amber-500/20' : 'bg-indigo-600/10'
        }`}></div>

        <div className="relative z-10 p-12 flex flex-col items-center">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all active:scale-90"
          >
            <X size={24} />
          </button>

          <div className="mb-10 text-center">
            <div className="flex justify-center mb-6">
              <div className={`p-5 rounded-3xl border transition-all duration-700 ${
                winner ? 'bg-yellow-500/20 border-yellow-500/40 scale-110' : 'bg-indigo-500/10 border-indigo-500/20'
              }`}>
                {isRevealing ? (
                   <Loader2 size={40} className="text-amber-400 animate-spin" />
                ) : (
                   <Trophy size={40} className={winner ? 'text-yellow-400' : 'text-indigo-400'} />
                )}
              </div>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">{title}</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
              {availableNumbers.length} números restantes no globo
            </p>
          </div>

          <div className="relative w-72 h-72 flex items-center justify-center mb-12">
            <div className={`absolute inset-0 border-4 border-dashed rounded-full transition-all duration-700 ${
              isDrawing ? 'border-indigo-500/40 animate-[spin_2s_linear_infinite]' : 
              isRevealing ? 'border-amber-500/60 animate-[spin_1s_linear_infinite] scale-105' : 
              winner ? 'border-yellow-500/30 border-solid animate-[spin_30s_linear_infinite]' : 'border-white/5'
            }`}></div>
            
            {winner && (
              <>
                <Star className="absolute -top-4 -right-4 text-yellow-400 animate-bounce" size={32} />
                <Star className="absolute -bottom-4 -left-4 text-indigo-400 animate-pulse" size={24} />
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
              </>
            )}
            
            <div className={`
              font-black tracking-tighter transition-all duration-500
              ${isDrawing ? 'text-7xl text-indigo-400/40 blur-[4px] scale-90' : ''}
              ${isRevealing ? 'text-8xl text-amber-500/20 blur-[15px] scale-110 animate-pulse' : ''}
              ${winner ? 'text-[9rem] text-white drop-shadow-[0_0_50px_rgba(99,102,241,1)] animate-winner-reveal' : ''}
              ${!isDrawing && !isRevealing && !winner ? 'text-8xl text-slate-800' : ''}
            `}>
              <span className={winner ? 'animate-winner-pulse inline-block' : ''}>
                {currentNumber ?? '---'}
              </span>
            </div>
          </div>

          {winner ? (
            <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full">
              <div className="flex flex-col items-center mb-10">
                <div className="flex items-center gap-3 mb-2">
                   <PartyPopper className="text-yellow-400 animate-tada" size={32} />
                   <h3 className="text-5xl font-black text-white tracking-tighter">VENCEDOR: {winner}</h3>
                   <PartyPopper className="text-yellow-400 animate-tada" size={32} />
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <button 
                  onClick={startDraw}
                  disabled={isSoldOut}
                  className="group flex items-center gap-3 bg-white text-indigo-950 px-10 py-5 rounded-[2rem] font-black text-sm transition-all shadow-2xl hover:bg-indigo-50 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" /> 
                  PRÓXIMO SORTEIO
                </button>
                <button 
                  onClick={onClose}
                  className="px-10 py-5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-[2rem] font-black text-sm transition-all border border-white/5"
                >
                  CONCLUIR
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={startDraw}
                disabled={isDrawing || isRevealing || isSoldOut}
                className={`
                  relative flex items-center gap-4 px-16 py-8 rounded-[3rem] font-black text-2xl transition-all shadow-2xl overflow-hidden
                  ${isDrawing || isRevealing || isSoldOut
                    ? 'bg-slate-800/50 text-slate-600 border border-white/5' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-indigo-600/30'}
                `}
              >
                {isDrawing ? (
                  <><RefreshCw className="animate-spin" size={28} /> GIRANDO...</>
                ) : isRevealing ? (
                  <><Loader2 className="animate-spin" size={28} /> AGUARDE...</>
                ) : isSoldOut ? (
                  <><X size={28} /> ESGOTADO</>
                ) : (
                  <><Sparkles size={32} className="text-white animate-pulse" /> INICIAR SORTEIO</>
                )}
                
                {!isDrawing && !isRevealing && !isSoldOut && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none"></div>
                )}
              </button>
              
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 opacity-50">
                {isSoldOut ? 'Todos os números já foram contemplados' : 'Sorteio aleatório sem repetições'}
              </p>
            </div>
          )}

          {/* Seção de Histórico Completo */}
          <div className="mt-16 w-full border-t border-white/5 pt-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl">
                  <History size={18} className="text-indigo-400" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Números Sorteados</h4>
              </div>
              <div className="text-[10px] font-black text-slate-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                TOTAL: {history.length}
              </div>
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {history.map((num, i) => (
                  <div 
                    key={i} 
                    className={`
                      aspect-square rounded-2xl flex items-center justify-center font-black text-sm border transition-all animate-in zoom-in duration-300
                      ${i === 0 
                        ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-lg shadow-indigo-600/20 ring-2 ring-white/10' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}
                    `}
                  >
                    {num}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-dashed border-white/5 rounded-3xl py-12 flex flex-col items-center justify-center">
                <Hash size={32} className="text-slate-800 mb-3" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Nenhum número sorteado nesta sessão</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawModal;
