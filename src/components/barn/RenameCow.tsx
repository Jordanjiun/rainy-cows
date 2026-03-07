import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio, useCow, useMenu } from '../../context/hooks';
import { useGameStore } from '../../game/store';
import { Button } from '../menu/Button';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 24;
const boxHeight = 150;
const boxWidth = 260;
const buttonWidth = 110;
const buttonHeight = 35;
const buttonOffset = 14;
const buttonY = boxHeight - buttonHeight - 15;
const renameSize = 230;
const maxNameLength = 12;
const allowedCharRegex = /^[a-zA-Z0-9 ]$/;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const RenameCow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();
  const { updateCowName } = useGameStore();

  const [cursorVisible, setCursorVisible] = useState(true);
  const [tempName, setTempName] = useState('');

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const renameTextRef = useRef<any>(null);

  useEffect(() => {
    setCursorVisible(true);
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMenu !== 'renameCow') return;
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = maxNameLength;
    input.value = tempName;
    input.style.position = 'absolute';
    input.style.fontSize = `20px`;
    input.style.width = `${renameSize}px`;
    input.style.left = `${(appWidth - renameSize) / 2}px`;
    input.style.top = `${appHeight / 2 - 16}px`;
    input.style.height = '25px';
    input.style.zIndex = '1000';
    input.style.opacity = '0.5';
    input.style.fontFamily = 'pixelFont';
    input.style.background = '#808080';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.color = '#00000001';
    input.style.caretColor = 'transparent';
    input.style.pointerEvents = 'auto';
    input.style.appearance = 'none';
    input.style.borderRadius = '0';
    input.style.padding = '0';
    input.style.margin = '0';
    input.spellcheck = false;

    document.body.appendChild(input);
    input.focus({ preventScroll: true });

    const onInput = () => {
      const filtered = [...input.value]
        .filter((ch) => allowedCharRegex.test(ch))
        .slice(0, maxNameLength)
        .join('');
      if (filtered !== input.value) {
        input.value = filtered;
      }
      setTempName(filtered);
    };
    input.addEventListener('input', onInput);
    hiddenInputRef.current = input;

    return () => {
      input.removeEventListener('input', onInput);
      if (input.parentNode) input.parentNode.removeChild(input);
    };
  }, [selectedMenu, appWidth, appHeight]);

  useEffect(() => {
    if (selectedMenu !== 'renameCow') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleClick(true);
      if (e.key === 'Escape') handleClick(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [selectedMenu, tempName, selectedCow]);

  const drawBase = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.fill({ color: '#ebd9c0ff' });
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.stroke({ width: 3, color: 'black' });
    },
    [boxWidth, boxHeight],
  );

  function handleClick(isConfirm: boolean = false) {
    audioMap.type.play();
    if (isConfirm && selectedCow) {
      updateCowName(selectedCow.id, tempName.trim() || selectedCow.name);
    }
    if (hiddenInputRef.current) {
      hiddenInputRef.current.remove();
      hiddenInputRef.current = null;
    }
    setTempName('');
    setSelectedCow(null);
    setSelectedMenu(null);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  if (!selectedCow) return null;

  return (
    <>
      {selectedMenu == 'renameCow' && (
        <>
          <pixiGraphics
            interactive={true}
            onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
            onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
            draw={(g) => {
              g.clear();
              g.rect(0, 0, appWidth, appHeight);
              g.fill({ color: 'black', alpha: 0.5 });
            }}
          />

          <pixiContainer
            x={(appWidth - boxWidth) / 2}
            y={(appHeight - boxHeight - footerHeight) / 2}
          >
            <pixiGraphics draw={drawBase} />
            <pixiText
              x={boxWidth / 2}
              y={30}
              text={'Input new name:'}
              anchor={0.5}
              style={{ fill: 'black', fontSize: 24, fontFamily: 'pixelFont' }}
            />
            <pixiContainer x={boxWidth / 2} y={0} interactive={true}>
              <pixiContainer y={69.5}>
                <pixiText
                  ref={renameTextRef}
                  text={tempName}
                  anchor={{ x: 0.5, y: 0.5 }}
                  style={{
                    fontSize: baseFontSize,
                    fontFamily: 'pixelFont',
                  }}
                />
                {cursorVisible && (
                  <pixiGraphics
                    draw={(g) => {
                      g.clear();
                      const h = baseFontSize - 4;
                      g.setStrokeStyle({ width: 2, color: 'black' });
                      g.moveTo(
                        renameTextRef.current?.width / 2 + 1 || 0,
                        -h / 2,
                      );
                      g.lineTo(
                        renameTextRef.current?.width / 2 + 1 || 0,
                        h / 2,
                      );
                      g.stroke();
                    }}
                  />
                )}
              </pixiContainer>
            </pixiContainer>
            <Button
              x={boxWidth - buttonWidth - buttonOffset}
              y={buttonY}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Cancel'}
              fontsize={24}
              buttonColor={'#E28C80'}
              onClick={() => handleClick(false)}
            />
            <Button
              x={buttonOffset}
              y={buttonY}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Confirm'}
              fontsize={24}
              buttonColor={'#80E28C'}
              onClick={() => handleClick(true)}
            />
          </pixiContainer>
        </>
      )}
    </>
  );
};
