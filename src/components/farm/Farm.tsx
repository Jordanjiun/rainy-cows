import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { gameUpgrades } from '../../data/gameData';
import { useGameStore } from '../../game/store';

extend({ Container, Graphics, Text });

const landRatio = Number(import.meta.env.VITE_LAND_RATIO);
const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const Farm = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { isHarvest, lastHarvest, upgrades } = useGameStore();
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      if (!lastHarvest) return setRemainingTime(0);

      const now = Date.now();
      const harvestDuration =
        gameUpgrades.harvestDurationSeconds * 1000 +
        gameUpgrades.harvetDurationIncreasePerUpgrade *
          1000 *
          (upgrades.harvestDurationLevel - 1);
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

  const drawDefaultBackground = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, appWidth, appHeight * (1 - landRatio));
      g.fill({ color: '#87CEEB' });
      g.rect(
        0,
        appHeight - appHeight * landRatio,
        appWidth,
        appHeight * landRatio - footerHeight,
      );
      g.fill({ color: '#32CD32' });
      g.rect(0, appHeight - footerHeight, appWidth, footerHeight);
      g.fill({ color: '#A0522D' });
    },
    [appWidth, appHeight],
  );

  const drawHarvestTime = useMemo(
    () => (
      <pixiContainer
        x={appWidth / 2}
        y={10 + (appHeight * (1 - landRatio)) / 2}
      >
        <pixiText
          text={`Harvest time! (${remainingTime}s)`}
          anchor={0.5}
          style={{ fontSize: 28, fill: 'black', fontWeight: 'bold' }}
        />
      </pixiContainer>
    ),
    [isHarvest, remainingTime, appWidth, appHeight],
  );

  return (
    <>
      <pixiGraphics draw={drawDefaultBackground} />
      {isHarvest && drawHarvestTime}
    </>
  );
};
