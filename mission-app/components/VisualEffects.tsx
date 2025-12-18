import React, { useEffect, useRef, useState, useMemo } from 'react';

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

// --- Animated Earth Background ---
export const AnimatedEarthBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate random twinkling stars
  const stars = useMemo(() => {
    const starArray: { x: number; y: number; size: number; twinkleSpeed: number; opacity: number }[] = [];
    for (let i = 0; i < 200; i++) {
      starArray.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        twinkleSpeed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    return starArray;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let time = 0;

    const animate = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw twinkling stars
      stars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
        const x = (star.x / 100) * width;
        const y = (star.y / 100) * height;

        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();

        // Add a subtle glow to some stars
        if (star.size > 1.5) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 3);
          gradient.addColorStop(0, `rgba(0, 240, 255, ${0.2 * twinkle})`);
          gradient.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(x, y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      // Draw animated city lights clusters (simulating earth lights) with pulsing glow
      const drawCityLights = () => {
        // Global pulse effect - makes the whole earth "breathe" with light
        const globalPulse = Math.sin(time * 0.5) * 0.4 + 0.6; // Slow pulse between 0.2 and 1.0

        const clusters = [
          { x: width * 0.15, y: height * 0.75, count: 35, baseColor: [255, 220, 150] },
          { x: width * 0.3, y: height * 0.7, count: 50, baseColor: [255, 200, 100] },
          { x: width * 0.45, y: height * 0.65, count: 60, baseColor: [255, 230, 120] },
          { x: width * 0.6, y: height * 0.68, count: 55, baseColor: [255, 210, 110] },
          { x: width * 0.75, y: height * 0.72, count: 45, baseColor: [255, 200, 100] },
          { x: width * 0.85, y: height * 0.78, count: 30, baseColor: [255, 220, 130] },
          // Additional scattered lights
          { x: width * 0.25, y: height * 0.85, count: 20, baseColor: [255, 180, 80] },
          { x: width * 0.5, y: height * 0.8, count: 25, baseColor: [255, 200, 100] },
          { x: width * 0.7, y: height * 0.85, count: 22, baseColor: [255, 190, 90] },
        ];

        clusters.forEach(cluster => {
          // Draw glow effect for each cluster
          const clusterPulse = Math.sin(time * 0.8 + cluster.x * 0.01) * 0.3 + 0.7;
          const glowRadius = 80 * clusterPulse * globalPulse;

          const gradient = ctx.createRadialGradient(
            cluster.x, cluster.y, 0,
            cluster.x, cluster.y, glowRadius
          );
          gradient.addColorStop(0, `rgba(${cluster.baseColor[0]}, ${cluster.baseColor[1]}, ${cluster.baseColor[2]}, ${0.15 * globalPulse})`);
          gradient.addColorStop(0.5, `rgba(${cluster.baseColor[0]}, ${cluster.baseColor[1]}, ${cluster.baseColor[2]}, ${0.05 * globalPulse})`);
          gradient.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(cluster.x, cluster.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Draw individual lights
          for (let i = 0; i < cluster.count; i++) {
            const angle = (i / cluster.count) * Math.PI * 2 + time * 0.05;
            const radius = Math.sin(i * 0.5 + time * 0.2) * 60 + 30;
            const x = cluster.x + Math.cos(angle) * radius + Math.sin(time * 0.5 + i) * 8;
            const y = cluster.y + Math.sin(angle) * radius * 0.35 + Math.cos(time * 0.5 + i) * 5;

            // Each light has its own flicker
            const flicker = Math.sin(time * 2 + i * 1.3) * 0.4 + 0.6;
            const intensity = flicker * globalPulse;
            const lightSize = 1.5 + Math.random() * 1;

            // Light core
            ctx.beginPath();
            ctx.arc(x, y, lightSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${cluster.baseColor[0]}, ${cluster.baseColor[1]}, ${cluster.baseColor[2]}, ${0.8 * intensity})`;
            ctx.fill();

            // Light glow
            const lightGlow = ctx.createRadialGradient(x, y, 0, x, y, lightSize * 4);
            lightGlow.addColorStop(0, `rgba(${cluster.baseColor[0]}, ${cluster.baseColor[1]}, ${cluster.baseColor[2]}, ${0.3 * intensity})`);
            lightGlow.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(x, y, lightSize * 4, 0, Math.PI * 2);
            ctx.fillStyle = lightGlow;
            ctx.fill();
          }
        });
      };

      drawCityLights();

      // Draw a subtle earth curve at the bottom
      const earthCurve = () => {
        const gradient = ctx.createRadialGradient(
          width / 2, height + 200, 100,
          width / 2, height + 200, 600
        );
        gradient.addColorStop(0, 'rgba(30, 60, 100, 0.5)');
        gradient.addColorStop(0.5, 'rgba(20, 40, 80, 0.3)');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.ellipse(width / 2, height + 200, 700, 400, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add atmospheric glow
        const atmosGradient = ctx.createRadialGradient(
          width / 2, height + 200, 350,
          width / 2, height + 200, 450
        );
        atmosGradient.addColorStop(0, 'rgba(0, 100, 200, 0.1)');
        atmosGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.05)');
        atmosGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.ellipse(width / 2, height + 200, 750, 450, 0, 0, Math.PI * 2);
        ctx.fillStyle = atmosGradient;
        ctx.fill();
      };

      earthCurve();

      time += 0.02;
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
  }, [stars]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
      {/* Earth image overlay with slow movement */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          opacity: 0.3,
          animation: 'slowPan 60s ease-in-out infinite alternate',
        }}
      />
      <style>{`
        @keyframes slowPan {
          0% { background-position: 40% 100%; }
          100% { background-position: 60% 100%; }
        }
      `}</style>
    </>
  );
};
