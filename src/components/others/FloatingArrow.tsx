import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useEffect, useRef } from 'react';

extend({ Graphics });

interface FloatingArrowProps {
  x: number;
  y: number;
  rotation?: number;
  amplitude?: number;
  speed?: number;
  scale?: number;
  arrowColor?: string;
}

export const FloatingArrow = ({
  x,
  y,
  rotation = 0,
  amplitude = 5,
  speed = 1,
  scale = 1,
  arrowColor = 'white',
}: FloatingArrowProps) => {
  const startTime = useRef(performance.now());
  const graphicsRef = useRef<Graphics | null>(null);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      const g = graphicsRef.current;
      if (g) {
        const t = (performance.now() - startTime.current) / 1000;
        const floatOffset = Math.sin(t * speed * 2 * Math.PI) * amplitude;
        g.y = y + floatOffset;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [x, y, amplitude, speed]);

  const drawArrow = (g: Graphics) => {
    g.clear();
    g.moveTo(0, -20 * scale);
    g.lineTo(12 * scale, 0);
    g.lineTo(6 * scale, 0);
    g.lineTo(6 * scale, 20 * scale);
    g.lineTo(-6 * scale, 20 * scale);
    g.lineTo(-6 * scale, 0);
    g.lineTo(-12 * scale, 0);
    g.closePath();
    g.fill({ color: arrowColor });
  };

  return (
    <pixiGraphics
      ref={graphicsRef}
      x={x}
      y={y}
      draw={drawArrow}
      rotation={rotation}
      pivot={{ x: 0, y: 0 }}
    />
  );
};
