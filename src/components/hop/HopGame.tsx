import { extend, useTick } from '@pixi/react';
import { Assets, Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio, useMenu } from '../../context/hooks';
import { Obstacle } from './Obstacle';
import { Player } from './Player';
import { Ground } from './Ground';
import { ExitMenu } from './ExitMenu';
import type { Texture, Ticker } from 'pixi.js';

extend({ Container, Graphics, Text });

const buttonSize = 50;
const maxCharge = 22;
const minJump = 10;
const minGap = 100;
const maxGap = 300;
const playerX = 50;
const playerSize = 40;
const startSpeed = 5;
const speedIncrement = 0.005;
const scoreMultiplier = 0.1;
const assetNames = ['mooney', 'undo'];

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const HopGame = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { selectedMenu, setSelectedMenu } = useMenu();

  const groundY = (appHeight - footerHeight) / 2 + 100 - playerSize;

  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [isHovered, setIsHovered] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerY, setPlayerY] = useState(groundY);
  const [, setTick] = useState(0);

  const velocity = useRef(0);
  const chargePower = useRef(0);
  const spawnTimer = useRef(0);
  const distance = useRef(0);
  const speed = useRef(0);
  const nextSpawn = useRef(60 + Math.random() * 120);
  const charging = useRef(false);
  const obstacles = useRef<{ x: number; width: number; height: number }[]>([]);

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
      speed.current = startSpeed;
      setStarted(true);
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
    distance.current += speed.current * delta * scoreMultiplier;
    speed.current += speedIncrement * delta;

    if (charging.current) {
      chargePower.current = Math.min(
        maxCharge,
        chargePower.current + 1.4 * delta,
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
      const nextTop = newY;
      const nextBottom = newY + playerSize;
      const nextLeft = playerX;
      const nextRight = playerX + playerSize;

      const obstacleTop = groundY - o.height;
      const obstacleBottom = groundY;
      const obstacleLeft = o.x;
      const obstacleRight = o.x + o.width;

      const collide =
        nextRight >= obstacleLeft &&
        nextLeft <= obstacleRight &&
        nextBottom >= obstacleTop &&
        nextTop <= obstacleBottom;

      if (collide) {
        velocity.current = 0;
        speed.current = 0;
        setGameOver(true);
        setSelectedMenu('exitGame');
        break;
      }
    }

    setPlayerY(newY);

    spawnTimer.current += delta;

    if (spawnTimer.current >= nextSpawn.current) {
      spawnTimer.current = 0;
      nextSpawn.current =
        (minGap + Math.random() * (maxGap - minGap)) / (speed.current * 0.18);

      obstacles.current.push({
        x: appWidth,
        width: 30 + Math.random() * 20,
        height: 40 + Math.random() * 30,
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
        <Player x={playerX} y={playerY} size={playerSize} />

        {obstacles.current.map((o, i) => (
          <Obstacle
            key={i}
            x={o.x}
            width={o.width}
            height={o.height}
            groundY={groundY + playerSize}
          />
        ))}

        <pixiText
          text={`Score: ${Math.floor(distance.current)}`}
          x={appWidth / 2}
          y={20}
          anchor={{ x: 0.5, y: 0 }}
          style={{ fill: 'black', fontSize: 32, fontFamily: 'pixelFont' }}
        />

        {!started && (
          <pixiText
            text="Tap to Start"
            x={appWidth / 2}
            y={appHeight / 2}
            anchor={0.5}
            style={{
              fill: 'white',
              fontSize: 32,
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
        score={Math.floor(distance.current)}
      />
    </>
  );
};
