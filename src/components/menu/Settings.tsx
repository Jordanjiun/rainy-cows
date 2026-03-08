import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  useAudio,
  useCow,
  useFileInput,
  useMenu,
  useToast,
} from '../../context/hooks';
import { exportGameSave, importGameSave, useGameStore } from '../../game/store';
import { AudioBar } from './AudioBar';
import { Button } from './Button';
import { FinalWarning } from './FinalWarning';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Graphics, Sprite, Text });

const boxHeight = 350;
const boxWidth = 260;
const buttonWidth = 220;
const buttonHeight = 40;
const crossSize = 20;
const crossThickness = 4;
const padding = 20;
const buttonGap = 15;
const yOffset = 12;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

const boxColor = '#ebd9c0ff';
const greenColor = '#80E28C';
const redColor = '#E28C80';

export const Settings = ({
  appWidth,
  appHeight,
  buttonX,
  buttonY,
  buttonSize,
}: {
  appWidth: number;
  appHeight: number;
  buttonX: number;
  buttonY: number;
  buttonSize: number;
}) => {
  const { setLastExportReminder } = useGameStore();
  const { audioMap, setGlobalVolume } = useAudio();
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();
  const { openFilePicker, onFileSelected } = useFileInput();
  const { showToast } = useToast();

  const [isHovered, setIsHovered] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);
  const [menuImage, setMenuImage] = useState<Texture | null>(null);

  const iconColor = isHovered ? 'white' : 'black';

  onFileSelected((file) => handleImport(file));

  useEffect(() => {
    let mounted = true;
    async function loadMenuImage() {
      const loaded = await Assets.load<Texture>('settings');
      loaded.source.scaleMode = 'linear';
      if (mounted) setMenuImage(loaded);
    }
    loadMenuImage();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleImport(file: File) {
    const result = await importGameSave(file);
    if (result.success) {
      setGlobalVolume(useGameStore.getState().volume);
      audioMap.powerup.play();
      showToast('Save file imported successfully!', greenColor);
      setSelectedMenu(null);
    } else {
      audioMap.wrong.play();
      showToast('Error: File could not be imported.', redColor);
    }
  }

  function handleExport() {
    audioMap.type.play();
    setLastExportReminder(Date.now());
    exportGameSave();
    showToast('Save file exported.', greenColor);
  }

  function handleClick() {
    audioMap.click.play();
    if (selectedCow) {
      setSelectedCow(null);
    }
    if (selectedMenu != 'settings') {
      setSelectedMenu('settings');
    } else {
      setSelectedMenu(null);
    }
  }

  function handleDeleteButton() {
    audioMap.type.play();
    setSelectedMenu('warning');
    setIsWarning(true);
  }

  function closeMenu() {
    audioMap.click.play();
    setCloseHovered(false);
    setSelectedMenu(null);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  const drawButtonBase = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.fill({ alpha: 0 });
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.stroke({ width: 3, color: isHovered ? 'white' : 'black' });
    };
  }, [isHovered]);

  const drawBase = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.fill({ color: boxColor });
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.stroke({ width: 3, color: 'black' });
    },
    [boxWidth, boxHeight, boxColor],
  );

  const drawCloseButton = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.rect(-3, -3, crossSize + 6, crossSize + 6);
      g.fill({ alpha: 0 });
      const stroke = closeHovered ? 'red' : 'black';
      g.setStrokeStyle({ width: crossThickness, color: stroke });
      g.moveTo(0, 0);
      g.lineTo(crossSize, crossSize);
      g.moveTo(crossSize, 0);
      g.lineTo(0, crossSize);
      g.stroke();
    };
  }, [closeHovered]);

  if (!menuImage) return null;

  return (
    <>
      <pixiContainer
        x={buttonX}
        y={buttonY}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={handleClick}
      >
        <pixiGraphics draw={drawButtonBase} />
        <pixiSprite
          texture={menuImage}
          anchor={0.5}
          x={buttonSize / 2}
          y={buttonSize / 2}
          tint={iconColor}
        />
      </pixiContainer>

      {selectedMenu == 'settings' && (
        <>
          <pixiGraphics
            interactive={true}
            onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
            onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
            draw={(g) => {
              g.clear();
              g.rect(0, 0, appWidth, appHeight - footerHeight);
              g.fill({ alpha: 0 });
            }}
          />

          <pixiContainer
            x={(appWidth - boxWidth) / 2}
            y={(appHeight - boxHeight - footerHeight) / 2}
          >
            <pixiGraphics draw={drawBase} />

            <pixiContainer
              x={padding}
              y={padding}
              interactive={true}
              cursor="pointer"
              onPointerOver={() => setCloseHovered(true)}
              onPointerOut={() => setCloseHovered(false)}
              onPointerTap={closeMenu}
            >
              <pixiGraphics draw={drawCloseButton} />
            </pixiContainer>

            <pixiText
              x={boxWidth / 2}
              y={29}
              text={'Settings'}
              anchor={0.5}
              style={{ fontSize: 28, fontFamily: 'pixelFont' }}
            />

            <AudioBar
              x={(boxWidth - buttonWidth) / 2}
              y={50}
              width={buttonWidth}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - (buttonHeight + buttonGap) - yOffset}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Delete Save'}
              buttonColor={redColor}
              onClick={handleDeleteButton}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - (buttonHeight + buttonGap) * 2 - yOffset}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Export Save'}
              buttonColor={'white'}
              onClick={handleExport}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - (buttonHeight + buttonGap) * 3 - yOffset}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Import Save'}
              buttonColor={'white'}
              onClick={() => {
                audioMap.type.play();
                openFilePicker();
              }}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - (buttonHeight + buttonGap) * 4 - yOffset}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Return to Menu'}
              buttonColor={'white'}
              onClick={() => {
                audioMap.type.play();
                setSelectedMenu('menu');
              }}
            />
          </pixiContainer>
        </>
      )}

      {isWarning && (
        <FinalWarning
          appWidth={appWidth}
          appHeight={appHeight}
          onClick={() => setIsWarning(false)}
        />
      )}
    </>
  );
};
