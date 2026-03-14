import { extend, useTick } from '@pixi/react';
import { Assets, Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio, useCow, useMenu } from '../../context/hooks';
import { cowConfig } from '../../data/cowData';
import { animationsDef } from '../../game/cowBuilder';
import { Sky } from '../farm/Sky';
import { Obstacle } from './Obstacle';
import { Player } from './Player';
import { Ground } from './Ground';
import { ExitMenu } from './ExitMenu';
import type { Texture, Ticker } from 'pixi.js';

extend({ Container, Graphics, Text });

const buttonSize = 50;
const maxCharge = 23;
const minJump = 10;
const minGap = 100;
const maxGap = 250;
const playerX = 20;
const cowScale = 2;
const startSpeed = 5;
const speedIncrement = 0.005;
const assetNames = ['mooney', 'undo'];
const objectHeights: number[] = [25, 55, 130];

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const HopGame = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { selectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();

  if (!selectedCow) return;

  const playerSize = cowConfig.frameSize * cowScale;
  const groundY = (appHeight - footerHeight) / 2 + 100;
  const scoreMultiplier = Math.pow(2, selectedCow.level - 1) / 50;

  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [isHovered, setIsHovered] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerY, setPlayerY] = useState(groundY);
  const [cowAnimation, setCowAnimation] = useState('idle');
  const [, setTick] = useState(0);

  const velocity = useRef(0);
  const chargePower = useRef(0);
  const spawnTimer = useRef(0);
  const distance = useRef(0);
  const speed = useRef(0);
  const nextSpawn = useRef(60 + Math.random() * 120);
  const charging = useRef(false);
  const obstacles = useRef<
    { x: number; y: number; width: number; height: number }[]
  >([]);

  const iconColor = isHovered ? 'yellow' : 'white';
  const gravity = charging.current ? 0.45 : 0.9;

  useEffect(() => {
    let mounted = true;
    async function loadTextures() {
      const loaded: Record<string, Texture> = await Assets.load(assetNames);
      if (mounted) setTextures(loaded);
    }
    loadTextures();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (started) return;
    setPlayerY(groundY);
  }, [appHeight]);

  const drawDefaultBackground = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, appWidth, appHeight);
      g.fill({ color: '#87CEEB' });
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

  const drawButtonBase = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.fill({ alpha: 0 });
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.stroke({ width: 3, color: isHovered ? 'yellow' : 'white' });
    };
  }, [isHovered]);

  const pointerDown = () => {
    if (gameOver) {
      return;
    }

    if (!started) {
      setCowAnimation('walk');
      setTimeout(() => {
        speed.current = startSpeed;
        setStarted(true);
      }, animationsDef['idleToWalk'].length * cowConfig.msPerFrame);
      return;
    }

    if (playerY >= groundY) {
      charging.current = true;
      chargePower.current = minJump;
    }
  };

  const pointerUp = () => {
    if (!charging.current) return;

    velocity.current = -chargePower.current;
    chargePower.current = 0;
    charging.current = false;
  };

  const updateGame = (ticker: Ticker) => {
    if (!started || gameOver || selectedMenu == 'exitEarly') return;

    const delta = ticker.deltaTime;
    distance.current += speed.current * delta;
    speed.current += speedIncrement * delta;

    if (charging.current) {
      chargePower.current = Math.min(
        maxCharge,
        chargePower.current + 1.2 * delta,
      );

      if (chargePower.current >= maxCharge) {
        velocity.current = -chargePower.current;
        chargePower.current = 0;
        charging.current = false;
      }
    }

    velocity.current += gravity * delta;
    let newY = playerY + velocity.current * delta;

    if (newY >= groundY) {
      newY = groundY;
      velocity.current = 0;
    }

    obstacles.current.forEach((o) => {
      o.x -= speed.current * delta;
    });

    for (const o of obstacles.current) {
      const collide =
        playerX < o.x + o.width &&
        playerX + playerSize > o.x &&
        playerY + velocity.current < o.y + o.height &&
        playerY + playerSize + velocity.current > o.y;

      if (collide) {
        velocity.current = 0;
        speed.current = 0;
        setGameOver(true);
        setSelectedMenu('exitGame');
      }
    }

    setPlayerY(newY);

    spawnTimer.current += delta;

    if (spawnTimer.current >= nextSpawn.current) {
      spawnTimer.current = 0;
      nextSpawn.current =
        (minGap + Math.random() * (maxGap - minGap)) / (speed.current * 0.18);
      const obstacleHeight =
        objectHeights[Math.floor(Math.random() * objectHeights.length)];
      let obstacleWidth = 25;
      if (obstacleHeight == 25) obstacleWidth = 45;
      if (obstacleHeight == 130) obstacleWidth = 40;
      obstacles.current.push({
        x: appWidth,
        y: groundY + playerSize - obstacleHeight,
        width: obstacleWidth,
        height: obstacleHeight,
      });
    }

    obstacles.current = obstacles.current.filter((o) => o.x > -100);
  };

  useTick((ticker) => {
    updateGame(ticker);
    setTick((t) => t + 1);
  });

  if (!textures) return null;

  return (
    <>
      <pixiGraphics draw={drawDefaultBackground} />
      <Sky appWidth={appWidth} appHeight={appHeight} landRatio={0.3} />

      {obstacles.current.map((o, i) => (
        <Obstacle key={i} x={o.x} y={o.y} width={o.width} height={o.height} />
      ))}

      <Ground
        appWidth={appWidth}
        appHeight={appHeight}
        grassY={groundY + playerSize}
        speed={speed.current}
      />
      <pixiGraphics draw={drawFooter} />

      <pixiContainer
        interactive
        cursor="pointer"
        onPointerDown={pointerDown}
        onPointerUp={pointerUp}
      >
        <Player
          x={playerX}
          y={playerY}
          size={playerSize}
          cowScale={cowScale}
          animation={cowAnimation}
          gameOver={gameOver}
        />

        <pixiText
          text={`Score: ${Math.floor(distance.current).toLocaleString('en-US')}`}
          x={15}
          y={10}
          style={{ fill: 'black', fontSize: 32, fontFamily: 'pixelFont' }}
        />

        <pixiText
          text={`XP Gained: ${Math.floor(distance.current * scoreMultiplier).toLocaleString('en-US')}`}
          x={15}
          y={45}
          style={{ fill: 'black', fontSize: 32, fontFamily: 'pixelFont' }}
        />

        {!started && (
          <pixiText
            text="Tap to Start"
            x={appWidth / 2}
            y={appHeight / 2 - 15}
            anchor={0.5}
            style={{
              fill: 'white',
              fontSize: 48,
              align: 'center',
              fontFamily: 'pixelFont',
            }}
          />
        )}

        <pixiGraphics
          interactive={true}
          draw={(g) => {
            g.clear();
            g.rect(0, 0, appWidth, appHeight);
            g.fill({ alpha: 0 });
          }}
        />
      </pixiContainer>

      <pixiContainer
        x={appWidth - buttonSize - 10}
        y={appHeight - buttonSize - 10}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={() => {
          audioMap.click.play();
          setSelectedMenu('exitEarly');
        }}
      >
        <pixiGraphics draw={drawButtonBase} />
        <pixiSprite
          texture={textures.undo}
          anchor={0.5}
          x={buttonSize / 2}
          y={buttonSize / 2}
          tint={iconColor}
        />
      </pixiContainer>

      <ExitMenu
        appWidth={appWidth}
        appHeight={appHeight}
        score={Math.floor(distance.current * scoreMultiplier)}
      />
    </>
  );
};
