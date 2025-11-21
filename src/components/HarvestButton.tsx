import { extend } from '@pixi/react';
import { Graphics, Text } from 'pixi.js';
import { useMemo, useState } from 'react';
import { gameUpgrades } from '../data/gameData';
import { useGameStore } from '../game/store';

extend({ Graphics, Text });

const buttonSize = 50;

function hasCooldownElapsed(last: number | null): boolean {
  if (!last) return true;
  return Date.now() - last >= gameUpgrades.harvestCooldownMinutes * 6e4;
}

export const HarvestButton = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { lastHarvest } = useGameStore();
  const [isHovered, setIsHovered] = useState(false);

  function handleClick() {
    setIsHovered(false);
    useGameStore.setState({ lastHarvest: Date.now() });
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

  if (!hasCooldownElapsed(lastHarvest)) {
    return null;
  }

  return <>{drawHarvestButton}</>;
};
