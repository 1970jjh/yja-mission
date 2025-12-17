import React, { useState, useRef, useEffect } from 'react';
import { MAX_HINTS } from '../constants';
import { getPuzzleHint } from '../services/geminiService';
import { Loader2, MessageSquareWarning, X, Send, Bot, User } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  puzzleContext: string;
  currentHintsUsed: number;
  onUseHint: () => void;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const HintModal: React.FC<Props> = ({ isOpen, onClose, puzzleContext, currentHintsUsed, onUseHint }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: '본부 연결됨. 지원이 필요한 코드명이나 문제 번호를 말하라. (예: "A-1 힌트 줘", "암호가 안 풀려")' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    if (currentHintsUsed >= MAX_HINTS) return;

    const userMsg = inputText.trim();
    setInputText('');

    // 1. Add User Message
    const newMessages: Message[] = [
      ...messages,
      { id: Date.now(), role: 'user', text: userMsg }
    ];
    setMessages(newMessages);

    // 2. Consume Hint Count
    onUseHint();
    setLoading(true);

    // 3. Request AI Response
    const aiResponseText = await getPuzzleHint(puzzleContext, userMsg);
    
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, role: 'assistant', text: aiResponseText }
    ]);
    setLoading(false);
  };

  const remainingHints = MAX_HINTS - currentHintsUsed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-imf-dark border border-imf-gold/50 shadow-[0_0_30px_rgba(255,215,0,0.1)] rounded-lg flex flex-col h-[600px] max-h-[90vh] relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/50">
          <div className="flex items-center gap-3 text-imf-gold">
            <MessageSquareWarning className="animate-pulse" />
            <div>
              <h3 className="font-bold tracking-widest text-sm uppercase">HQ Tactical Support</h3>
              <p className="text-xs text-gray-400 font-mono">Secure Channel // Hints Left: {remainingHints}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-imf-gold/20 flex items-center justify-center border border-imf-gold/50 shrink-0">
                  <Bot size={16} className="text-imf-gold" />
                </div>
              )}
              <div className={`
                max-w-[80%] rounded-lg p-3 text-sm leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-blue-900/30 text-blue-100 border border-blue-800 rounded-tr-none' 
                  : 'bg-imf-gold/10 text-yellow-100 border border-imf-gold/30 rounded-tl-none'}
              `}>
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-900/20 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <User size={16} className="text-blue-400" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-imf-gold/20 flex items-center justify-center border border-imf-gold/50">
                  <Bot size={16} className="text-imf-gold" />
                </div>
                <div className="bg-imf-gold/10 p-3 rounded-lg border border-imf-gold/30 flex items-center gap-2 text-imf-gold text-xs font-mono">
                  <Loader2 className="animate-spin" size={14} />
                  ANALYZING DATA...
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 border-t border-gray-800">
          {remainingHints > 0 ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="도움이 필요한 문제 번호를 입력하세요..."
                className="flex-1 bg-gray-900/80 border border-gray-700 text-white text-sm rounded px-4 py-3 focus:border-imf-gold focus:outline-none transition-colors font-mono"
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading || !inputText.trim()}
                className="bg-imf-gold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black p-3 rounded transition-colors flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </form>
          ) : (
             <div className="text-center p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-xs font-mono">
                [SYSTEM ALERT] 통신 횟수 초과. 지원 불가.
             </div>
          )}
          
          {remainingHints > 0 && (
             <div className="text-[10px] text-center mt-2 text-red-400 font-mono flex items-center justify-center gap-1">
                <MessageSquareWarning size={10} />
                메시지 전송 시 힌트 1회 차감 (+5분 페널티)
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default HintModal;