import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  startTime: number;
  durationMinutes: number;
  onTimeExpire: () => void;
}

const Timer: React.FC<Props> = ({ startTime, durationMinutes, onTimeExpire }) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    // Safety Check: If startTime is 0 or invalid, do not run logic that might trigger expire
    if (!startTime || startTime <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const remaining = (durationMinutes * 60) - elapsedSeconds;

      // Safety Check: If calculated remaining is excessively negative immediately (e.g. clock skew > game time), 
      // treat as 0 but maybe don't expire if it feels like a glitch?
      // For now, standard logic:
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        // Only trigger expire if we actually had a valid session running.
        // Prevent triggering on initial glitches if elapsedSeconds is wildly huge (e.g. > 24 hours) due to old data
        if (elapsedSeconds < 86400) {
            onTimeExpire();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onTimeExpire]);

  // Prevent displaying NaN or weird numbers
  const safeTimeLeft = isNaN(timeLeft) ? durationMinutes * 60 : timeLeft;
  const minutes = Math.floor(safeTimeLeft / 60);
  const seconds = safeTimeLeft % 60;
  const isUrgent = safeTimeLeft < 300; // Less than 5 minutes

  // Don't render if start time is invalid
  if (!startTime || startTime <= 0) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none`}>
       <div className={`
          mt-2 px-6 py-2 rounded-b-lg font-mono text-xl md:text-2xl font-bold tracking-widest shadow-lg flex items-center gap-3 border-x border-b transition-colors duration-500
          ${isUrgent 
            ? 'bg-red-600/90 text-white border-red-500 animate-pulse' 
            : 'bg-black/80 text-imf-red border-imf-red/50 backdrop-blur-md'}
       `}>
          {isUrgent && <AlertTriangle size={24} className="animate-bounce" />}
          <Clock size={20} className={isUrgent ? "animate-spin" : ""} />
          <span>
            {String(minutes >= 0 ? minutes : 0).padStart(2, '0')}:{String(seconds >= 0 ? seconds : 0).padStart(2, '0')}
          </span>
       </div>
    </div>
  );
};

export default Timer;