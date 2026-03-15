import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useEffect, useMemo, useState } from 'react';
import { useAudio, useToast } from '../../context/hooks';
import { useGameStore } from '../../game/store';
import { measureText } from '../../game/utils';
import type { Cow } from '../../game/cowModel';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 28;
const costPerCow = 1000;

interface AutoPetProps {
  x: number;
  y: number;
  unPetCows: Cow[];
}

export const AutoPet = ({ x, y, unPetCows }: AutoPetProps) => {
  const { audioMap } = useAudio();
  const { showToast } = useToast();
  const { mooney, petCow, removeMooney } = useGameStore();

  const [isHovered, setIsHovered] = useState(false);
  const [mooneyImage, setMooneyImage] = useState<Texture | null>(null);

  const amount = useMemo(() => {
    return unPetCows.length * costPerCow;
  }, [unPetCows]);

  const textWidth = measureText(amount.toLocaleString('en-US'), {
    fontSize: baseFontSize,
    fontFamily: 'pixelFont',
  });

  useEffect(() => {
    let mounted = true;
    async function loadCoinImage() {
      const loaded = await Assets.load<Texture>('mooney');
      if (mounted) setMooneyImage(loaded);
    }
    loadCoinImage();
    return () => {
      mounted = false;
    };
  }, []);

  function handleClick() {
    if (mooney < amount) {
      audioMap.wrong.play();
      showToast('You do not have enough mooney to use auto-pet.', '#E28C80');
      return;
    }
    audioMap.coin.play();
    removeMooney(amount);
    unPetCows.forEach((cow) => {
      petCow(cow.id);
    });
    setIsHovered(false);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  if (!mooneyImage) return;

  return (
    <>
      <pixiText
        x={x}
        y={y}
        text={`Auto-pet ${unPetCows.length} ${unPetCows.length === 1 ? 'Cow' : 'Cows'}:`}
        style={{ fontSize: baseFontSize, fontFamily: 'pixelFont' }}
      />
      <pixiContainer
        x={x}
        y={y}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={handleClick}
      >
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.roundRect(0, 44, textWidth + 60, 45, 10);
            g.fill({ color: isHovered ? 'yellow' : 'white' });
            g.roundRect(0, 44, textWidth + 60, 45, 10);
            g.stroke({ width: 3, color: 'black' });
          }}
        />
        <pixiSprite texture={mooneyImage} x={10} y={50} />
        <pixiText
          x={50}
          y={49}
          text={`${amount.toLocaleString('en-US')}`}
          style={{ fontSize: baseFontSize, fontFamily: 'pixelFont' }}
        />
      </pixiContainer>
    </>
  );
};
