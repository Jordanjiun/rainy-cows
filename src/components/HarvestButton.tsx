import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useMemo, useState, useEffect } from 'react';
import { useCow, useMenu } from '../context/hooks';
import { gameUpgrades } from '../data/gameData';
import { useGameStore } from '../game/store';
import { formatTimerText } from '../game/utils';

extend({ Graphics, Sprite, Text });

const buttonSize = 50;

export const HarvestButton = ({ appHeight }: { appHeight: number }) => {
  const { lastHarvest } = useGameStore();
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();
  const [isHovered, setIsHovered] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(1);
  const [clickImage, setClickImage] = useState<Texture | null>(null);

  const cooldownMs = gameUpgrades.harvestCooldownMinutes * 6e4;
  const iconColor = isHovered ? 'yellow' : 'white';

  useEffect(() => {
    let mounted = true;
    async function loadClickImage() {
      const loaded = await Assets.load<Texture>('click');
      loaded.source.scaleMode = 'linear';
      if (mounted) setClickImage(loaded);
    }
    loadClickImage();
    return () => {
      mounted = false;
    };
  }, []);

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
    if (selectedCow) {
      setSelectedCow(null);
    }
    if (selectedMenu) {
      setSelectedMenu(null);
    }
    const timer = setTimeout(
      () => useGameStore.setState({ isHarvest: false }),
      gameUpgrades.harvestDurationSeconds * 1000,
    );
    return () => clearTimeout(timer);
  }

  const hasCooldownElapsed = (last: number | null) =>
    !last || Date.now() - last >= cooldownMs;

  const drawButtonBase = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.fill({ alpha: 0 });
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.stroke({ width: 2, color: isHovered ? 'yellow' : 'white' });
    };
  }, [isHovered]);

  const cooldownArcDraw = useMemo(() => {
    return (g: Graphics) => {
      const lineWidth = 4;
      const center = buttonSize / 2;
      const radius = center - lineWidth / 2;

      const start = -Math.PI / 2;
      const end = start + Math.PI * 2 * cooldownProgress;

      g.clear();
      g.arc(center, center, radius, start, end, true);
      g.stroke({ width: lineWidth, color: 'white' });
    };
  }, [cooldownProgress]);

  const cooldownText = useMemo(() => {
    const totalSeconds = Math.ceil(
      (1 - cooldownProgress) * gameUpgrades.harvestCooldownMinutes * 60,
    );
    return formatTimerText(totalSeconds);
  }, [cooldownProgress]);

  if (!clickImage) return null;

  return hasCooldownElapsed(lastHarvest) ? (
    <pixiContainer
      x={10}
      y={appHeight - buttonSize - 10}
      interactive={true}
      cursor="pointer"
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onPointerTap={handleClick}
    >
      <pixiGraphics draw={drawButtonBase} />
      <pixiSprite
        texture={clickImage}
        anchor={0.5}
        x={buttonSize / 2}
        y={buttonSize / 2}
        tint={iconColor}
      />
    </pixiContainer>
  ) : (
    <>
      <pixiText
        x={65}
        y={appHeight - buttonSize - 4}
        text={'Harvest\nCooldown'}
        style={{ fontSize: 16, fill: 'white', fontWeight: 'bold' }}
      />
      <pixiContainer x={10} y={appHeight - buttonSize - 10}>
        <pixiGraphics draw={cooldownArcDraw} />
        <pixiText
          x={buttonSize / 2}
          y={buttonSize / 2 - 1}
          text={cooldownText}
          anchor={0.5}
          style={{ fontSize: 14, fill: 'white', fontWeight: 'bold' }}
        />
      </pixiContainer>
    </>
  );
};
