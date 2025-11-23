import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { gameUpgrades } from '../data/gameData';
import { purgeGameData, useGameStore } from '../game/store';
import { formatTimerText } from '../game/utils';

extend({ Container, Graphics, Text });

const landRatio = Number(import.meta.env.VITE_LAND_RATIO);
const buttonSize = 50;

export const Farm = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { isHarvest, lastHarvest } = useGameStore();
  const [isHovered, setIsHovered] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      if (!lastHarvest) return setRemainingTime(0);

      const now = Date.now();
      const harvestDuration = gameUpgrades.harvestDurationSeconds * 1000;
      const timeLeft = Math.max(
        0,
        Math.ceil((lastHarvest + harvestDuration - now) / 1000),
      );

      setRemainingTime(timeLeft);

      if (timeLeft === 0 && isHarvest) {
        useGameStore.setState({ isHarvest: false });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastHarvest, isHarvest]);

  const drawBackground = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, appWidth, appHeight * (1 - landRatio));
      g.fill({ color: '#87CEEB' });
      g.rect(
        0,
        appHeight - appHeight * landRatio,
        appWidth,
        appHeight * landRatio,
      );
      g.fill({ color: '#32CD32' });
    },
    [appWidth, appHeight],
  );

  // chore: move into settings menu when that is available
  const drawPurgeButton = useMemo(
    () => (
      <pixiContainer
        x={appWidth - buttonSize - 10}
        y={appHeight - buttonSize - 10}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={purgeGameData}
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
          text={'Purge'}
          anchor={0.5}
          style={{ fontSize: 16, fill: 'black', fontWeight: 'bold' }}
        />
      </pixiContainer>
    ),
    [isHovered, appWidth, appHeight, purgeGameData],
  );

  const drawHarvestTime = useMemo(
    () => (
      <pixiContainer x={appWidth / 2} y={(appHeight * (1 - landRatio)) / 2}>
        <pixiText
          text={`Harvest time! (${formatTimerText(remainingTime)})`}
          anchor={0.5}
          style={{ fontSize: 28, fill: 'black', fontWeight: 'bold' }}
        />
      </pixiContainer>
    ),
    [isHarvest, remainingTime, appWidth, appHeight],
  );

  return (
    <>
      <pixiGraphics draw={drawBackground} />
      {drawPurgeButton}
      {isHarvest && drawHarvestTime}
    </>
  );
};
