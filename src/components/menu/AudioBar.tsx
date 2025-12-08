import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../../context/hooks';

extend({ Container, Graphics, Text });

const barY = 25;
const barHeight = 20;

export const AudioBar = ({
  x,
  y,
  width,
}: {
  x: number;
  y: number;
  width: number;
}) => {
  const { globalVolume, setGlobalVolume } = useAudio();

  const [dragging, setDragging] = useState(false);
  const graphicsRef = useRef<Graphics>(null);

  const handlePointerDown = (e: any) => {
    setDragging(true);
    updateVolume(e);
  };

  const updateVolume = (e: any | PointerEvent) => {
    let localX: number;
    if ('data' in e) {
      const local = e.data.getLocalPosition(graphicsRef.current!.parent);
      localX = local.x;
    } else {
      const rect = graphicsRef.current!.getBounds();
      localX = e.clientX - rect.x;
    }

    let newVolume = localX / width;
    newVolume = Math.max(0, Math.min(1, newVolume));
    newVolume = Math.round(newVolume * 100) / 100;
    setGlobalVolume(newVolume);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (dragging) updateVolume(e);
    };
    const handlePointerUp = () => setDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiText
        text={`Audio: (${Math.round(globalVolume * 100)}%)`}
        style={{ fontSize: 22, fontFamily: 'pixelFont' }}
      />

      <pixiGraphics
        ref={graphicsRef}
        interactive={true}
        onPointerDown={handlePointerDown}
        draw={(g) => {
          g.clear();
          g.rect(0, barY, width, barHeight);
          g.fill({ color: 'black' });
          g.rect(0, barY, width * globalVolume, barHeight);
          g.fill({ color: 'green' });
        }}
      />
    </pixiContainer>
  );
};
