import React, { useState, useEffect } from 'react';
import { LocationId, PuzzleData } from '../types';
import { ArrowLeft, ExternalLink, Bomb, Key, Youtube, AlertTriangle, X, Lock, Unlock, Check, MapPin, PlayCircle, ShieldBan } from 'lucide-react';
import HintModal from './HintModal';
import { GlitchText } from './VisualEffects';

interface Props {
  puzzle: PuzzleData;
  onBack: () => void;
  onSolve: () => void;
  onSubPuzzleSolve?: (id: string) => void;
  hintCount: number;
  onUseHint: () => void;
  solvedSubPuzzles?: string[];
}

const PuzzleView: React.FC<Props> = ({ puzzle, onBack, onSolve, onSubPuzzleSolve, hintCount, onUseHint, solvedSubPuzzles: globalSolvedSubPuzzles = [] }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [currentDocUrl, setCurrentDocUrl] = useState<string | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // States for Multi-Lock System (San Francisco, France, Incheon)
  const [subPuzzleInputs, setSubPuzzleInputs] = useState<Record<string, string>>({});
  const [isFinalStage, setIsFinalStage] = useState(false);
  const [finalStageInput, setFinalStageInput] = useState('');
  const [autoSolving, setAutoSolving] = useState(false);

  // Initial setup
  useEffect(() => {
    if (puzzle.subPuzzles) {
        setSubPuzzleInputs({});
        setIsFinalStage(false);
        setFinalStageInput('');
        setAutoSolving(false);
    }
  }, [puzzle.id]);

  // Check if all sub-puzzles are solved based on global props or local checking
  useEffect(() => {
    if (puzzle.subPuzzles && !autoSolving) {
        // Check if all subpuzzles required for this stage are in the global solved list
        const allSolved = puzzle.subPuzzles.every(sp => globalSolvedSubPuzzles.includes(sp.id));
        
        if (allSolved) {
            if (puzzle.finalStage) {
                if (!isFinalStage) {
                    setIsFinalStage(true);
                }
            } else {
                setAutoSolving(true);
                setTimeout(() => {
                    onSolve();
                }, 1500);
            }
        }
    }
  }, [globalSolvedSubPuzzles, puzzle.subPuzzles, isFinalStage, puzzle.finalStage, onSolve, autoSolving]);

  const triggerVibration = () => {
    if (navigator.vibrate) {
        navigator.vibrate([200, 50, 200]);
    }
  };

  const triggerAccessDenied = () => {
      setShowAccessDenied(true);
      setTimeout(() => setShowAccessDenied(false), 2000);
  };

  const handleSubPuzzleSubmit = (id: string, answer: string) => {
    const currentInput = subPuzzleInputs[id] || '';
    if (currentInput.replace(/\s/g, '').toLowerCase() === answer.toLowerCase()) {
        triggerVibration();
        // Update globally (which updates local prop eventually)
        if (onSubPuzzleSolve) {
            onSubPuzzleSolve(id);
        }
    } else {
        triggerAccessDenied();
        setSubPuzzleInputs(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleFinalStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puzzle.finalStage) return;

    const normalizedInput = finalStageInput.replace(/\s/g, '').toLowerCase();
    const normalizedAnswer = puzzle.finalStage.answer.replace(/\s/g, '').toLowerCase();

    if (normalizedInput === normalizedAnswer) {
        triggerVibration();
        onSolve();
    } else {
        triggerAccessDenied();
        setFinalStageInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = input.replace(/\s/g, '').toLowerCase();
    const normalizedAnswer = puzzle.answer.replace(/\s/g, '').toLowerCase();

    if (normalizedInput === normalizedAnswer) {
      triggerVibration();
      onSolve();
    } else {
      triggerAccessDenied();
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1000);
    }
  };

  // Convert view link to preview link for iframe embedding
  const getPreviewLink = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
        return url.replace('/view', '/preview');
    }
    if (url.includes('imgur.com') && !url.includes('/embed')) {
        return url + '/embed?pub=true';
    }
    return url;
  };

  const openDocument = (url: string) => {
    setCurrentDocUrl(url);
    setShowDoc(true);
  }

  const descriptionToShow = (isFinalStage && puzzle.finalStage) 
    ? puzzle.finalStage.description 
    : puzzle.description;

  return (
    <div className="min-h-screen bg-imf-black text-gray-200 font-sans flex flex-col pt-12 relative">
      
      {/* Access Denied Overlay */}
      {showAccessDenied && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="border-4 border-red-600 bg-black/90 p-8 rounded-lg shadow-[0_0_50px_rgba(255,0,0,0.5)] transform scale-110 flex flex-col items-center">
                  <div className="absolute top-2 right-2">
                      <button onClick={() => setShowAccessDenied(false)} className="text-red-500 hover:text-white"><X size={24} /></button>
                  </div>
                  <ShieldBan size={64} className="text-red-600 mb-4 animate-bounce" />
                  <h2 className="text-4xl md:text-5xl font-black text-red-600 tracking-tighter uppercase mb-2">ACCESS DENIED</h2>
                  <p className="text-white font-mono text-lg tracking-widest">승인 거부</p>
              </div>
          </div>
      )}

      {/* Header Image Area */}
      <div className="relative h-48 md:h-64 overflow-hidden group">
          <div 
             className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
             style={{ backgroundImage: `url(${puzzle.backgroundImage})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-imf-black via-imf-black/60 to-transparent"></div>
          
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10">
            <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 backdrop-blur-md px-4 py-2 rounded-full transition-all border border-white/10 hover:border-white/30">
                <ArrowLeft size={18} />
                <span className="text-sm font-bold">지도 복귀</span>
            </button>
            {puzzle.isBomb && (
                <div className={`flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full text-white shadow-[0_0_15px_rgba(255,0,0,0.5)] ${isFinalStage || autoSolving ? 'bg-green-600/90' : 'bg-red-600/90 animate-pulse'}`}>
                    {isFinalStage || autoSolving ? <Check size={18} /> : <Bomb size={18} />}
                    <span className="text-xs font-bold tracking-wider">{isFinalStage || autoSolving ? '핵무기 무력화 완료' : '핵무기 무력화 작전'}</span>
                </div>
            )}
          </div>

          <div className="absolute bottom-6 left-6 z-10">
              <GlitchText text={puzzle.title} as="h1" className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-xl tracking-tight" />
              <p className="text-imf-cyan font-mono text-sm tracking-wider flex items-center gap-2">
                 <span className="w-2 h-2 bg-imf-cyan rounded-full animate-pulse"></span>
                 현장 요원 투입됨
              </p>
          </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 pb-24 -mt-6 relative z-20">
        
        {/* Intel Card */}
        <div className="bg-[#111] border border-gray-800 shadow-2xl rounded-xl overflow-hidden mb-8 relative">
           {/* Subtle Noise Overlay on Card */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-bg"></div>
           
           <div className="p-6 pb-8 relative z-10">
               <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-widest ${isFinalStage ? 'text-green-500' : 'text-imf-gold'}`}>
                 <AlertTriangle size={16} />
                 작전 브리핑
               </h3>
               <p className="text-base md:text-lg leading-relaxed text-gray-300 font-light mb-6 whitespace-pre-line">
                 {descriptionToShow}
               </p>

               {/* Legacy Single External Link (e.g., Blue House, France) */}
               {puzzle.externalLink && !puzzle.subPuzzles && (
                <div className="relative">
                  <button 
                      onClick={() => openDocument(puzzle.externalLink!)}
                      className="w-full flex items-center justify-between p-5 border-2 border-dashed border-imf-cyan/50 rounded-lg bg-imf-cyan/5 hover:bg-imf-cyan/10 hover:border-imf-cyan transition-all group cursor-pointer"
                  >
                      <div className="flex items-center gap-4">
                          <div className="p-2 bg-imf-cyan/10 rounded-full text-imf-cyan group-hover:scale-110 transition-transform">
                             <Key size={24} />
                          </div>
                          <div className="text-left">
                              <div className="text-white font-bold text-base md:text-lg tracking-wide group-hover:text-imf-cyan transition-colors">기밀 문서 접근</div>
                              <div className="text-xs text-gray-400 font-mono">외부 데이터베이스 연결</div>
                          </div>
                      </div>
                      <ExternalLink size={20} className="text-gray-500 group-hover:text-imf-cyan transition-colors" />
                  </button>
                  <div className="absolute -top-3 left-4 px-2 bg-[#111] text-imf-cyan text-[10px] font-bold tracking-widest uppercase">
                    Classified
                  </div>
                </div>
               )}

                {/* Video Links for Bomb B */}
                {puzzle.videoLinks && (
                <div className="grid gap-2 mt-6">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider ml-1">감시 카메라 영상 분석</span>
                    {puzzle.videoLinks.map((link, idx) => (
                    <a 
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-red-900/10 border border-red-900/30 rounded hover:bg-red-900/20 text-red-300 text-sm transition-colors"
                    >
                        <Youtube size={18} />
                        영상 자료 #{idx + 1} 재생
                    </a>
                    ))}
                </div>
                )}
           </div>
        </div>

        {/* Input Area Logic */}
        {puzzle.subPuzzles ? (
            /* Multi-Lock System for San Francisco, France, Incheon */
            <div className="space-y-6 mb-8">
                {!isFinalStage ? (
                    <div className="grid gap-4 md:grid-cols-1">
                        {puzzle.subPuzzles.map((subPuzzle) => {
                            const isSolved = globalSolvedSubPuzzles.includes(subPuzzle.id);
                            return (
                                <div key={subPuzzle.id} className={`border rounded-lg p-4 transition-all ${isSolved ? 'border-green-500/50 bg-green-900/10' : 'border-gray-800 bg-[#0a0a0a]'}`}>
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className={`p-3 rounded-full ${isSolved ? 'bg-green-500/20 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {isSolved ? <Unlock size={24} /> : <Lock size={24} />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-bold ${isSolved ? 'text-green-400' : 'text-gray-200'}`}>{subPuzzle.title}</h4>
                                                <div className="flex flex-col gap-2 mt-1">
                                                    <button 
                                                        onClick={() => openDocument(subPuzzle.imageUrl)}
                                                        className="text-xs text-imf-cyan hover:underline flex items-center gap-1"
                                                    >
                                                        <ExternalLink size={12} /> 문제 이미지 확인
                                                    </button>
                                                    
                                                    {subPuzzle.relatedLink && (
                                                        <button 
                                                            onClick={() => openDocument(subPuzzle.relatedLink!.url)}
                                                            className="text-xs text-imf-gold hover:text-yellow-300 hover:underline flex items-center gap-1 font-bold"
                                                        >
                                                            <PlayCircle size={12} /> {subPuzzle.relatedLink.title}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {!isSolved ? (
                                            <div className="flex w-full md:w-auto gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="코드 입력"
                                                    value={subPuzzleInputs[subPuzzle.id] || ''}
                                                    onChange={(e) => setSubPuzzleInputs(prev => ({...prev, [subPuzzle.id]: e.target.value}))}
                                                    className="bg-black border border-gray-700 rounded px-3 py-2 text-center w-full md:w-32 focus:border-imf-cyan outline-none font-mono"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSubPuzzleSubmit(subPuzzle.id, subPuzzle.answer)}
                                                />
                                                <button 
                                                    onClick={() => handleSubPuzzleSubmit(subPuzzle.id, subPuzzle.answer)}
                                                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold text-sm"
                                                >
                                                    확인
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="px-6 py-2 bg-green-500/10 rounded border border-green-500/30 text-green-400 font-mono text-sm font-bold tracking-wider flex items-center gap-2">
                                                <Check size={16} /> ACCESS GRANTED
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Final Stage - Location Input */
                    <div className="bg-[#0a0a0a] border border-imf-cyan/50 rounded-xl overflow-hidden relative shadow-[0_0_30px_rgba(0,240,255,0.1)]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-imf-cyan to-transparent opacity-50"></div>
                        
                        {/* Final Clue Image Embed */}
                        {puzzle.finalStage?.imageUrl && (
                            <div className="w-full aspect-video bg-black relative border-b border-gray-800">
                                <iframe 
                                    src={getPreviewLink(puzzle.finalStage.imageUrl)} 
                                    className="w-full h-full border-0"
                                    title="Final Clue"
                                    allow="autoplay; encrypted-media"
                                ></iframe>
                            </div>
                        )}

                        <div className="p-6 md:p-8">
                            <h3 className="text-imf-cyan text-center text-xl font-bold mb-6 flex items-center justify-center gap-2">
                                <MapPin className="animate-bounce" />
                                다음 목적지 입력
                            </h3>
                            <form onSubmit={handleFinalStageSubmit} className="space-y-4">
                                <input 
                                    type="text" 
                                    value={finalStageInput}
                                    onChange={(e) => setFinalStageInput(e.target.value)}
                                    placeholder={puzzle.finalStage?.placeholder || "장소 이름"}
                                    className="w-full bg-black border border-imf-cyan/50 rounded p-4 text-center text-xl font-bold text-white focus:border-imf-cyan outline-none shadow-[0_0_10px_rgba(0,240,255,0.2)] tracking-widest placeholder:font-normal placeholder:text-gray-700"
                                />
                                <button 
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-imf-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold py-4 rounded-lg uppercase tracking-widest shadow-lg transition-all"
                                >
                                    위치 이동 실행
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            /* Standard Single Answer Puzzle */
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 md:p-8 mb-8 relative shadow-lg">
                <label className="block text-white font-bold mb-6 text-center text-lg md:text-xl tracking-tight">
                    {puzzle.question}
                </label>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="코드 입력"
                    className={`w-full bg-black border-2 rounded-lg p-4 text-center text-xl font-mono tracking-[0.2em] outline-none transition-all placeholder:text-gray-800 placeholder:tracking-normal
                        ${error ? 'border-imf-red text-imf-red animate-shake' : 'border-imf-cyan/30 text-imf-cyan focus:border-imf-cyan focus:shadow-[0_0_20px_rgba(0,240,255,0.2)]'}
                    `}
                    />
                    
                    <button 
                    type="submit"
                    className={`w-full font-bold py-4 rounded-lg uppercase tracking-widest transition-all shadow-lg text-sm md:text-base transform active:scale-[0.98]
                        ${puzzle.isBomb 
                            ? 'bg-gradient-to-r from-red-600 to-imf-red hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_20px_rgba(255,0,60,0.3)]' 
                            : 'bg-gradient-to-r from-imf-cyan to-cyan-400 hover:from-cyan-300 hover:to-cyan-200 text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]'}
                    `}
                    >
                    {puzzle.isBomb ? '핵무기 무력화 실행' : '암호 해독 확인'}
                    </button>
                </form>
            </div>
        )}

        {/* Hint Button */}
        <div className="flex justify-center">
          <button 
            onClick={() => setShowHint(true)}
            className="text-xs md:text-sm text-gray-500 hover:text-imf-gold transition-colors flex items-center gap-2 px-6 py-3 border border-dashed border-gray-800 rounded-full hover:border-imf-gold hover:bg-imf-gold/5"
          >
            본부 지원 요청 (남은 횟수: {3 - hintCount})
          </button>
        </div>

      </main>

      {/* Hint Modal */}
      {showHint && (
        <HintModal 
          isOpen={showHint} 
          onClose={() => setShowHint(false)} 
          puzzleContext={puzzle.hintContext}
          currentHintsUsed={hintCount}
          onUseHint={onUseHint}
        />
      )}

      {/* Document Viewer Modal */}
      {showDoc && (currentDocUrl || puzzle.externalLink) && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-imf-dark">
                <div className="flex items-center gap-3">
                    <Key className="text-imf-cyan" size={20} />
                    <span className="text-white font-bold tracking-wider">TOP SECRET // DOCUMENT</span>
                </div>
                <button onClick={() => setShowDoc(false)} className="text-gray-400 hover:text-white p-2">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 w-full h-full relative overflow-hidden bg-white/5">
                <iframe 
                    src={getPreviewLink(currentDocUrl || puzzle.externalLink || '')} 
                    className="w-full h-full border-0"
                    title="Mission Document"
                    allow="autoplay; encrypted-media"
                ></iframe>
                {/* Fallback link if iframe fails */}
                <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
                     <span className="inline-block bg-black/80 text-gray-400 text-xs px-4 py-2 rounded-full pointer-events-auto">
                        문서가 보이지 않나요? <a href={currentDocUrl || puzzle.externalLink} target="_blank" rel="noopener noreferrer" className="text-imf-cyan hover:underline ml-1">새 창에서 열기</a>
                     </span>
                </div>
            </div>
        </div>
      )}
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PuzzleView;