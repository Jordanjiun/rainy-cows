import { extend } from '@pixi/react';
import { Assets, Sprite, Text, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useToast } from '../../context/hooks';
import { useGameStore } from '../../game/store';

extend({ Sprite, Text });

const offset = 10;
const assetNames = ['mooney', 'logo'];

export const FarmHud = () => {
  const { showToast } = useToast();
  const { cows, mooney, upgrades, lastExportReminder, setLastExportReminder } =
    useGameStore();
  const [textures, setTextures] = useState<Record<string, Texture>>({});

  const amount = mooney.toLocaleString('en-US');
  const ratio = `${cows.length}/${upgrades.farmLevel * 2}`;

  useEffect(() => {
    let mounted = true;
    async function loadTextures() {
      const loaded: Record<string, Texture> = await Assets.load(assetNames);
      if (mounted) setTextures(loaded);
    }
    loadTextures();

    const timeoutId = setTimeout(() => {
      const now = Date.now();
      const diff = now - lastExportReminder;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (diff > sevenDays) {
        showToast(
          `Don't forget to periodically export your save to avoid losing data!`,
        );
        setLastExportReminder(now);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!textures.mooney || !textures.logo) return null;

  return (
    <>
      <pixiSprite texture={textures.mooney} x={offset} y={offset} />
      <pixiText
        x={34 + 1.5 * offset}
        y={offset}
        text={amount}
        style={{ fontFamily: 'pixelFont' }}
      />
      <pixiSprite texture={textures.logo} x={offset} y={offset * 5} />
      <pixiText
        x={34 + 1.5 * offset}
        y={offset * 5 + 1}
        text={ratio}
        style={{ fontFamily: 'pixelFont' }}
      />
    </>
  );
};
