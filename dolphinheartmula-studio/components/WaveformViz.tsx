import React, { useEffect, useState, useRef } from 'react';

interface WaveformVizProps {
  color?: string;
  active?: boolean;
  height?: string;
  count?: number;
  progress?: number;
  onScrub?: (progress: number) => void;
}

const WaveformViz: React.FC<WaveformVizProps> = ({ 
  color = 'bg-primary', 
  active = false,
  height = 'h-full',
  count = 20,
  progress,
  onScrub
}) => {
  const [bars, setBars] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate random heights for the waveform
    const newBars = Array.from({ length: count }, () => Math.floor(Math.random() * 70) + 15);
    setBars(newBars);
  }, [count]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onScrub || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, x / rect.width));
    onScrub(newProgress);
  };

  return (
    <div 
      ref={containerRef}
      className={`flex items-center justify-center gap-[2px] w-full ${height} ${active ? 'opacity-100' : 'opacity-60'} ${onScrub ? 'cursor-pointer' : ''} relative`}
      onClick={handleClick}
    >
      {bars.map((h, i) => {
        let barColor = color;
        // If progress is active (scrubbable mode), dim future bars
        if (progress !== undefined) {
            const barPos = i / count;
            barColor = barPos <= progress ? color : 'bg-slate-700';
        }

        return (
            <div 
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${active ? 'animate-wave' : ''} ${barColor}`}
            style={{ 
                height: `${h}%`,
                animationDelay: `${i * 0.05}s`,
                animationPlayState: active ? 'running' : 'paused'
            }}
            />
        );
      })}
    </div>
  );
};

export default WaveformViz;