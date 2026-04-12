import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameUpgrades } from '../../data/gameData';
import { useGameStore } from '../../game/store';
import { CowManager } from '../cow/CowManager';
import { FarmBarn } from './FarmBarn';
import { FarmHud } from './FarmHud';
import { Grass } from './Grass';
import { Sky } from './Sky';
import { Rain } from './Rain';
import { Splashes, type Splash } from './Splashes';

extend({ Container, Graphics, Text });

const landRatio = Number(import.meta.env.VITE_LAND_RATIO);
const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

const offset = 2;
const offsets = [
  [offset, offset],
  [offset, 0],
  [offset, -offset],
  [0, offset],
  [0, -offset],
  [-offset, offset],
  [-offset, 0],
  [-offset, -offset],
];

export const Farm = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { isHarvest, lastHarvest, upgrades } = useGameStore();
  const [remainingTime, setRemainingTime] = useState(0);
  const splashRef = useRef<Splash[]>([]);

  let harvestTimeYoffset = 20;
  if (appWidth > 600) harvestTimeYoffset = 0;

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
    },
    [appWidth, appHeight],
  );

  const drawFooter = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, appHeight - footerHeight, appWidth, footerHeight);
      g.fill({ color: '#A0522D' });
    },
    [appWidth, appHeight],
  );

  const drawHarvestTime = useMemo(
    () => (
      <pixiContainer
        x={appWidth / 2}
        y={(appHeight * (1 - landRatio)) / 2 + harvestTimeYoffset}
      >
        {offsets.map(([dx, dy], i) => (
          <pixiText
            key={i}
            text={`Harvest time!\n(${remainingTime} seconds left)`}
            x={dx}
            y={dy}
            anchor={0.5}
            style={{
              fontSize: 32,
              fontFamily: 'pixelFont',
              fill: 'white',
              align: 'center',
              wordWrap: true,
              wordWrapWidth: appWidth,
            }}
          />
        ))}
        <pixiText
          text={`Harvest time!\n(${remainingTime} seconds left)`}
          anchor={0.5}
          style={{
            fontSize: 32,
            fontFamily: 'pixelFont',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: appWidth,
          }}
        />
      </pixiContainer>
    ),
    [isHarvest, remainingTime, appWidth, appHeight],
  );

  return (
    <>
      <pixiGraphics draw={drawDefaultBackground} />
      <Sky appWidth={appWidth} appHeight={appHeight} landRatio={landRatio} />
      <FarmBarn appWidth={appWidth} appHeight={appHeight} />
      <Grass appWidth={appWidth} appHeight={appHeight} />
      <Splashes incomingSplashesRef={splashRef} />
      <FarmHud />
      <CowManager appWidth={appWidth} appHeight={appHeight} />
      <Rain
        appWidth={appWidth}
        appHeight={appHeight}
        onSplash={(newSplashes) => {
          splashRef.current.push(...newSplashes);
        }}
      />
      {isHarvest && drawHarvestTime}
      <pixiGraphics draw={drawFooter} />
    </>
  );
};
