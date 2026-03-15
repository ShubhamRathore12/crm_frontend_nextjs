"use client";

export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[hsl(220,18%,8%)] overflow-hidden">
      {/* Topographic Lines Overlay */}
      <div className="absolute inset-0 opacity-20 transition-transform duration-[20s] ease-linear hover:scale-110 pointer-events-none">
        <svg
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-primary"
        >
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" />
            <feDisplacementMap in="SourceGraphic" scale="50" />
          </filter>
          <g filter="url(#noise)" fill="none" stroke="currentColor" strokeWidth="0.5">
            {[...Array(20)].map((_, i) => (
              <circle key={i} cx="500" cy="500" r={i * 50} />
            ))}
          </g>
        </svg>
      </div>

      {/* Grainy Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Floating Blobs for depth */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] animate-float-delayed" />
    </div>
  );
}
