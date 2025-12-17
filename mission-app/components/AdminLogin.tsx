import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
  onBack: () => void;
}

const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '6749467') {
      onLoginSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-imf-black flex flex-col items-center justify-center p-6 relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-gray-500 hover:text-white flex items-center gap-2">
        <ArrowLeft size={20} /> 뒤로가기
      </button>
      
      <div className="w-full max-w-md bg-imf-dark/80 border border-imf-gray p-8 rounded-lg shadow-[0_0_30px_rgba(0,240,255,0.1)] backdrop-blur-md">
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck className="w-16 h-16 text-imf-cyan mb-4" />
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Admin Access</h2>
          <p className="text-xs text-gray-500 font-mono mt-2">RESTRICTED AREA // AUTHORIZED PERSONNEL ONLY</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-xs font-mono mb-2">ACCESS CODE</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-black border rounded px-4 py-3 text-white text-center font-mono tracking-[0.5em] focus:outline-none transition-all
                  ${error ? 'border-red-500 text-red-500 animate-shake' : 'border-gray-700 focus:border-imf-cyan'}
                `}
                placeholder="-------"
                autoFocus
              />
              <Lock className="absolute left-4 top-3.5 text-gray-600" size={16} />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-imf-cyan/20 hover:bg-imf-cyan/40 text-imf-cyan border border-imf-cyan py-3 rounded uppercase font-bold tracking-widest transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            Authenticate
          </button>
        </form>
      </div>

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

export default AdminLogin;