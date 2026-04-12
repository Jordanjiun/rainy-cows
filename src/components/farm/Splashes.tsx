import { extend, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useState, type RefObject } from 'react';

extend({ Container, Graphics });

export type Splash = {
  id: number;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  life: number;
};

const maxSplashes = 120;

export const Splashes = ({
  incomingSplashesRef,
}: {
  incomingSplashesRef: RefObject<Splash[]>;
}) => {
  const [splashes, setSplashes] = useState<Splash[]>([]);

  const draw = useCallback(
    (g: any) => {
      g.clear();
      for (const s of splashes) {
        g.setStrokeStyle({
          width: 1,
          color: 0xaad4ff,
          alpha: s.alpha,
        });
        g.beginPath();
        g.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        g.stroke();
      }
    },
    [splashes],
  );

  useTick((ticker) => {
    const delta = ticker.deltaTime;

    if (incomingSplashesRef.current.length) {
      const newOnes = incomingSplashesRef.current;
      incomingSplashesRef.current = [];
      setSplashes((prev) => [...prev, ...newOnes].slice(-maxSplashes));
    }

    setSplashes((prev) =>
      prev
        .map((s) => ({
          ...s,
          radius: s.radius + 0.6 * delta,
          alpha: s.alpha - 0.03 * delta,
          life: s.life - 0.03 * delta,
        }))
        .filter((s) => s.alpha > 0),
    );
  });

  return (
    <pixiContainer>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
};
