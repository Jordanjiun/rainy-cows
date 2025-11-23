import { extend } from '@pixi/react';
import { Graphics, Text } from 'pixi.js';
import { useMemo, useState, useEffect } from 'react';
import { gameUpgrades } from '../data/gameData';
import { useGameStore } from '../game/store';
import { formatTimerText } from '../game/utils';

extend({ Graphics, Text });

const buttonSize = 50;

export const HarvestButton = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { lastHarvest } = useGameStore();
  const [isHovered, setIsHovered] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(1);

  const cooldownMs = gameUpgrades.harvestCooldownMinutes * 6e4;

  useEffect(() => {
    const last = lastHarvest ?? 0;
    const elapsed = Date.now() - last;

    if (elapsed < cooldownMs) {
      const remaining = cooldownMs - elapsed;
      const progress = 1 - remaining / cooldownMs;
      setCooldownProgress(progress);
    } else {
      setCooldownProgress(1);
      return;
    }

    let frame: number;

    const update = () => {
      const elapsed = Date.now() - last;
      const remaining = Math.max(0, cooldownMs - elapsed);
      const progress = 1 - remaining / cooldownMs;

      setCooldownProgress(progress);

      if (remaining > 0) {
        frame = requestAnimationFrame(update);
      }
    };

    frame = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frame);
  }, [lastHarvest]);

  function handleClick() {
    setIsHovered(false);
    useGameStore.setState({ lastHarvest: Date.now(), isHarvest: true });
    const timer = setTimeout(() => {
      useGameStore.setState({ isHarvest: false });
    }, gameUpgrades.harvestDurationSeconds * 1000);
    return () => clearTimeout(timer);
  }

  function hasCooldownElapsed(last: number | null): boolean {
    if (!last) return true;
    return Date.now() - last >= cooldownMs;
  }

  function formatText(duration: number) {
    const totalSeconds = Math.ceil(
      (1 - duration) * gameUpgrades.harvestCooldownMinutes * 60,
    );
    return formatTimerText(totalSeconds);
  }

  const drawHarvestButton = useMemo(
    () => (
      <pixiContainer
        x={10}
        y={appHeight - buttonSize - 10}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={handleClick}
      >
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.roundRect(0, 0, buttonSize, buttonSize, 10);
            g.fill({ color: isHovered ? 'yellow' : 'white' });
          }}
        />
        <pixiText
          x={buttonSize / 2}
          y={buttonSize / 2 - 1}
          text={'Harvest'}
          anchor={0.5}
          style={{ fontSize: 16, fill: 'black', fontWeight: 'bold' }}
        />
      </pixiContainer>
    ),
    [isHovered, appWidth, appHeight],
  );

  const drawCooldownButton = useMemo(
    () => (
      <>
        <pixiText
          x={65}
          y={appHeight - buttonSize - 4}
          text={'Harvest\nCooldown'}
          style={{ fontSize: 16, fill: 'white', fontWeight: 'bold' }}
        />
        <pixiContainer x={10} y={appHeight - buttonSize - 10}>
          <pixiGraphics
            draw={(g) => {
              const lineWidth = 4;
              const center = Math.round(buttonSize / 2);
              const r = Math.round(center - lineWidth / 2);
              const start = -Math.PI / 2;
              const end = start + Math.PI * 2 * cooldownProgress;
              g.clear();
              g.arc(buttonSize / 2, buttonSize / 2, r, start, end, true);
              g.stroke({
                width: lineWidth,
                color: 'white',
              });
            }}
          />

          <pixiText
            x={buttonSize / 2}
            y={buttonSize / 2 - 1}
            text={formatText(cooldownProgress)}
            anchor={0.5}
            style={{ fontSize: 14, fill: 'white', fontWeight: 'bold' }}
          />
        </pixiContainer>
      </>
    ),
    [cooldownProgress, appWidth, appHeight],
  );

  return (
    <>
      {hasCooldownElapsed(lastHarvest) ? drawHarvestButton : drawCooldownButton}
    </>
  );
};
