import React, { useEffect, useRef } from "react";

export const WakandaTechBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let particles: Array<{x: number, y: number, r: number, dx: number, dy: number, opacity: number}> = [];
    for(let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.2
        });
    }

    let time = 0;
    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Gradient background
      const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, height);
      grad.addColorStop(0, "rgba(21, 15, 0, 0.4)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.8)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Holographic lines
      time += 0.005;
      ctx.lineWidth = 1;
      for (let i = 0; i < height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i + Math.sin(time + i * 0.01) * 15);
        ctx.bezierCurveTo(width/3, i - Math.cos(time + i * 0.02) * 20, width/1.5, i + Math.sin(time + i * 0.01) * 20, width, i - Math.sin(time + i * 0.01) * 15);
        ctx.strokeStyle = `rgba(212, 175, 55, ${0.03 + Math.sin(time + i * 0.05) * 0.02})`;
        ctx.stroke();
      }

      // Particles
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
        ctx.fill();
      });

      // African luminous halo
      ctx.beginPath();
      ctx.arc(width/2, height/2, height * 0.3, 0, Math.PI * 2);
      const haloGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, height * 0.4);
      haloGrad.addColorStop(0, "rgba(212, 175, 55, 0.03)");
      haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = haloGrad;
      ctx.fill();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[-1] mix-blend-screen"
      style={{ isolation: 'isolate' }}
    />
  );
};

export default WakandaTechBackground;
