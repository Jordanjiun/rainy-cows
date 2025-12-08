import { extend, useApplication } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useEffect, useState } from 'react';

extend({ Container, Graphics, Text });

export interface ToastMessage {
  text: string;
  color: string;
  id: string;
}

interface ToastOverlayProps {
  toasts: ToastMessage[];
}

interface ToastItemProps {
  message: ToastMessage;
  offset: number;
}

export function ToastOverlay({ toasts }: ToastOverlayProps) {
  return (
    <pixiContainer>
      {toasts.map((t, index) => (
        <ToastItem key={t.id} message={t} offset={index * 50} />
      ))}
    </pixiContainer>
  );
}

function ToastItem({ message, offset }: ToastItemProps) {
  const { app } = useApplication();

  const [alpha, setAlpha] = useState(0);
  const [yPos, setYPos] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!app) return;

    const updateSize = () => {
      setSize({ width: app.renderer.width, height: app.renderer.height });
    };

    updateSize();
    app.renderer.on('resize', updateSize);

    return () => {
      app.renderer.off('resize', updateSize);
    };
  }, [app]);

  useEffect(() => {
    const startY = 0;
    const finalY = 50 + offset;
    const duration = 500;
    const displayTime = 1500;
    const fadeOutDuration = 500;

    let startTime: number | null = null;
    let animationFrame: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      if (elapsed <= duration) {
        const t = easeOutCubic(elapsed / duration);
        setAlpha(t);
        setYPos(startY + t * (finalY - startY));
      } else if (elapsed <= duration + displayTime) {
        setAlpha(1);
        setYPos(finalY);
      } else if (elapsed <= duration + displayTime + fadeOutDuration) {
        const t = (elapsed - duration - displayTime) / fadeOutDuration;
        setAlpha(1 - t);
        setYPos(finalY - t * 20);
      } else {
        setAlpha(0);
        setYPos(finalY);
        cancelAnimationFrame(animationFrame);
        return;
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [offset]);

  const height = 40;

  if (!app || size.width === 0 || size.height === 0) return null;

  const tempText = new Text({
    text: message.text,
    style: {
      fontFamily: 'pixelFont',
      fontSize: 18,
    },
  });
  const width = tempText.width + 20;

  return (
    <pixiContainer x={(size.width - width) / 2} y={yPos} alpha={alpha}>
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.roundRect(0, 0, width, height, 10);
          g.fill({ color: message.color });
          g.stroke({ width: 3, color: 'black' });
        }}
      />
      <pixiText
        text={message.text}
        x={width / 2}
        y={height / 2}
        anchor={0.5}
        style={{ fontSize: 18, fontFamily: 'pixelFont' }}
      />
    </pixiContainer>
  );
}
