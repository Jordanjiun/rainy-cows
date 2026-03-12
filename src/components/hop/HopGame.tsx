import { extend, useTick } from '@pixi/react';
import { Assets, Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio, useScene } from '../../context/hooks';
import { useGameStore } from '../../game/store';
import { Obstacle } from './Obstacle';
import { Player } from './Player';
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
  const { switchScene } = useScene();

  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [isHovered, setIsHovered] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerY, setPlayerY] = useState(appHeight - footerHeight - playerSize);
  const [, setTick] = useState(0);

  const velocity = useRef(0);
  const chargePower = useRef(0);
  const spawnTimer = useRef(0);
  const distance = useRef(0);
  const nextSpawn = useRef(60 + Math.random() * 120);
  const speed = useRef(startSpeed);
  const charging = useRef(false);
  const obstacles = useRef<{ x: number; width: number; height: number }[]>([]);

  const iconColor = isHovered ? 'yellow' : 'white';
  const gravity = charging.current ? 0.45 : 0.9;
  const groundY = appHeight - footerHeight - playerSize;

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

  function handleClick() {
    audioMap.click.play();
    useGameStore.getState().reloadCows();
    switchScene('MainScene');
  }

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

  const resetGame = () => {
    obstacles.current = [];
    spawnTimer.current = 0;

    speed.current = startSpeed;
    distance.current = 0;
    velocity.current = 0;
    chargePower.current = 0;
    nextSpawn.current = 60 + Math.random() * 120;
    charging.current = false;

    setPlayerY(groundY);
    setGameOver(false);
    setStarted(true);
  };

  const pointerDown = () => {
    if (gameOver) {
      resetGame();
      return;
    }

    if (!started) {
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
    if (!started || gameOver) return;

    const delta = ticker.deltaTime;
    distance.current += speed.current * delta;
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

    for (const o of obstacles.current) {
      const playerTop = newY;
      const playerBottom = newY + playerSize;
      const playerLeft = playerX;
      const playerRight = playerX + playerSize;

      const obstacleTop = groundY - o.height;
      const obstacleBottom = groundY;
      const obstacleLeft = o.x;
      const obstacleRight = o.x + o.width;

      const collide =
        playerRight > obstacleLeft &&
        playerLeft < obstacleRight &&
        playerBottom > obstacleTop &&
        playerTop < obstacleBottom;

      if (collide) {
        newY = obstacleTop - playerSize;
        velocity.current = 0;
        setGameOver(true);
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

    obstacles.current.forEach((o) => {
      o.x -= speed.current * delta;
    });

    obstacles.current = obstacles.current.filter((o) => o.x > -100);

    for (const o of obstacles.current) {
      const collide =
        playerX < o.x + o.width &&
        playerX + playerSize > o.x &&
        playerY + playerSize > groundY - o.height;

      if (collide) {
        setGameOver(true);
      }
    }
  };

  useTick((ticker) => {
    updateGame(ticker);
    setTick((t) => t + 1);
  });

  if (!textures) return null;

  return (
    <>
      <pixiGraphics draw={drawDefaultBackground} />
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
            groundY={appHeight - footerHeight}
          />
        ))}

        <pixiText
          text={`Score: ${Math.floor(distance.current)}`}
          x={20}
          y={20}
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

        {gameOver && (
          <pixiText
            text={`Game Over\nScore: ${Math.floor(distance.current)}\nTap to restart`}
            x={appWidth / 2}
            y={appHeight / 2}
            anchor={0.5}
            style={{
              fill: 'red',
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
        onPointerTap={handleClick}
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
    </>
  );
};
