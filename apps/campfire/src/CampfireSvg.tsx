'use client'

interface CampfireSvgProps {
  size?: number
}

// Animated pixel-art campfire
export function CampfireSvg({ size = 80 }: CampfireSvgProps) {
  const scale = size / 48

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 56"
      width={48 * scale}
      height={56 * scale}
      className="campfire"
    >
      {/* Logs */}
      <rect x={8} y={44} width={32} height={6} rx={2} fill="#8B4513" />
      <rect x={12} y={48} width={24} height={6} rx={2} fill="#6B3410" />

      {/* Fire base (orange) */}
      <rect x={16} y={32} width={6} height={6} fill="#E8572A" className="flame-base" />
      <rect x={22} y={32} width={6} height={6} fill="#FF6B35" className="flame-base" />
      <rect x={28} y={32} width={6} height={6} fill="#E8572A" className="flame-base" />

      {/* Fire middle */}
      <rect x={18} y={26} width={6} height={6} fill="#FF8C42" className="flame-mid" />
      <rect x={24} y={26} width={6} height={6} fill="#FFB347" className="flame-mid" />

      {/* Fire top (flicker) */}
      <rect x={20} y={20} width={6} height={6} fill="#FFD700" className="flame-top" />
      <rect x={22} y={14} width={6} height={6} fill="#FFED4E" className="flame-tip" />

      {/* Sparks */}
      <rect x={14} y={18} width={2} height={2} fill="#FFD700" className="spark spark-1" />
      <rect x={32} y={22} width={2} height={2} fill="#FF8C42" className="spark spark-2" />
      <rect x={26} y={10} width={2} height={2} fill="#FFED4E" className="spark spark-3" />

      <style>{`
        .flame-base { animation: flicker-base 0.8s ease-in-out infinite alternate; }
        .flame-mid { animation: flicker-mid 0.6s ease-in-out infinite alternate; }
        .flame-top { animation: flicker-top 0.4s ease-in-out infinite alternate; }
        .flame-tip { animation: flicker-tip 0.3s ease-in-out infinite alternate; }
        .spark { animation: spark-float 2s ease-out infinite; }
        .spark-1 { animation-delay: 0s; }
        .spark-2 { animation-delay: 0.7s; }
        .spark-3 { animation-delay: 1.3s; }

        @keyframes flicker-base {
          0% { opacity: 0.9; }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes flicker-mid {
          0% { opacity: 0.8; transform: translateX(-1px); }
          100% { opacity: 1; transform: translateX(1px); }
        }
        @keyframes flicker-top {
          0% { opacity: 0.7; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(-2px); }
        }
        @keyframes flicker-tip {
          0% { opacity: 0.5; transform: translateY(0) scale(0.8); }
          100% { opacity: 0.9; transform: translateY(-3px) scale(1.1); }
        }
        @keyframes spark-float {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-12px); }
        }
      `}</style>
    </svg>
  )
}
