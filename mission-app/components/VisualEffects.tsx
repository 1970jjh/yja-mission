import React, { useEffect, useRef, useState } from 'react';

// --- CRT Overlay ---
export const ScanlineOverlay: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
    <div className="absolute inset-0 scanlines opacity-30"></div>
    <div className="absolute inset-0 vignette"></div>
    <div className="absolute inset-0 noise-bg opacity-20 mix-blend-overlay"></div>
  </div>
);

// --- Glitch Text ---
interface GlitchTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div' | 'p';
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, as: Component = 'span', className = '', intensity = 'medium' }) => {
  return (
    <Component className={`relative inline-block ${className} group`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-imf-red opacity-0 group-hover:opacity-70 glitch-layer-1" aria-hidden="true">{text}</span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-imf-cyan opacity-0 group-hover:opacity-70 glitch-layer-2" aria-hidden="true">{text}</span>
    </Component>
  );
};

// --- Deciphering Text Effect ---
interface DecipherTextProps {
  text: string;
  speed?: number;
  className?: string;
  reveal?: boolean;
}

export const DecipherText: React.FC<DecipherTextProps> = ({ text, speed = 50, className = '', reveal = true }) => {
  const [display, setDisplay] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

  useEffect(() => {
    if (!reveal) return;
    
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1/3; // Slow down the reveal
    }, speed);

    return () => clearInterval(interval);
  }, [text, reveal, speed]);

  return <span className={className}>{display}</span>;
};

// --- Particle Network Background ---
export const ParticleNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = Math.min(Math.floor(width * height / 15000), 100); // Density control

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Init
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update and Draw Particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Draw Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-40" />;
};
