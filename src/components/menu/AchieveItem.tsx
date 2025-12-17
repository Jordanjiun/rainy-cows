import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useMemo } from 'react';
import { useGameStore, stats } from '../../game/store';
import type { Stats } from '../../game/store';

extend({ Container, Graphics, Text });

const rightXoffset = 45;
const tickBoxSize = 20;
const barY = 27;

const statKeys = Object.keys(stats) as Array<keyof typeof stats>;

interface ShopItemProps {
  y: number;
  maxWidth: number;
  label: string;
  statName: string;
  target: number;
}

function isStatKey(key: any): key is keyof Stats {
  return statKeys.includes(key);
}

export const AchieveItem = ({
  y,
  maxWidth,
  label,
  statName,
  target,
}: ShopItemProps) => {
  const { stats } = useGameStore();

  function getStat(name: string): number {
    if (isStatKey(name)) {
      return stats[name];
    }
    return 0;
  }

  const stat = getStat(statName);
  const achieved = useGameStore((s) => s.achievements[label]);

  const drawBox = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.rect(
        maxWidth - tickBoxSize - rightXoffset,
        1,
        tickBoxSize,
        tickBoxSize,
      );
      g.stroke({ width: 2, color: 'black' });
    };
  }, [maxWidth]);

  const drawBar = useMemo(() => {
    return (g: Graphics) => {
      const barWidth = maxWidth - rightXoffset;
      let percentage;
      if (stat < target) percentage = stat / target;
      else percentage = 1;
      g.clear();
      g.rect(0, barY, barWidth, 15);
      g.fill({ color: 'black' });
      g.rect(0, barY, barWidth * percentage, 15);
      g.fill({ color: 'green' });
    };
  }, [maxWidth, stat]);

  const drawProgress = useMemo(() => {
    let text;
    if (achieved) text = 'Achieved';
    else {
      text = `${stat.toLocaleString('en-US')} / ${target.toLocaleString('en-US')}`;
    }

    return (
      <>
        <pixiGraphics draw={drawBar} />
        <pixiText
          x={(maxWidth - rightXoffset) / 2}
          y={barY + 7}
          text={`${text}`}
          anchor={0.5}
          style={{ fontSize: 16, fill: 'white', fontFamily: 'pixelFont' }}
        />
      </>
    );
  }, [maxWidth, stat, achieved]);

  const drawTick = useMemo(() => {
    return (
      <>
        <pixiGraphics draw={drawBox} />
        {achieved && (
          <pixiText
            x={maxWidth - rightXoffset - tickBoxSize / 2}
            y={13}
            text={'✓'}
            anchor={0.5}
            style={{
              fontSize: 36,
              fill: 'red',
              fontFamily: 'pixelFont',
              fontWeight: 'bold',
            }}
          />
        )}
      </>
    );
  }, [maxWidth, stat, achieved]);

  return (
    <pixiContainer y={y}>
      <pixiText
        text={label}
        style={{ fontSize: 18, fontFamily: 'pixelFont' }}
      />
      {drawProgress}
      {drawTick}
    </pixiContainer>
  );
};
