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
import type { Object } from './Obstacle';

extend({ Container, Graphics, Text });

const buttonSize = 50;
const minGap = 100;
const maxGap = 250;
const playerX = 20;
const cowScale = 2;
const startSpeed = 5;
const speedIncrement = 0.005;
const jumpInitialVelocity = 14;
const jumpHoldForce = 0.5;
const maxJumpHoldTime = 38;
const gravity = 0.9;
const assetNames = ['mooney', 'undo'];
const objects = [
  {
    name: 'plant',
    width: 45,
    height: 30,
  },
  {
    name: 'fence',
    width: 25,
    height: 100,
  },
  {
    name: 'totem',
    width: 40,
    height: 140,
  },
];

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
  const jumpHolding = useRef(false);
  const jumpHoldTimer = useRef(0);

  const spawnTimer = useRef(0);
  const distance = useRef(0);
  const speed = useRef(0);
  const nextSpawn = useRef(60 + Math.random() * 120);
  const obstacles = useRef<{ x: number; y: number; object: Object }[]>([]);

  const iconColor = isHovered ? 'yellow' : 'white';

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
    if (gameOver) return;

    if (!started) {
      setCowAnimation('walk');
      setTimeout(() => {
        speed.current = startSpeed;
        setStarted(true);
      }, animationsDef['idleToWalk'].length * cowConfig.msPerFrame);
      return;
    }

    if (playerY >= groundY) {
      audioMap.jump.play();
      velocity.current = -jumpInitialVelocity;
      jumpHolding.current = true;
      jumpHoldTimer.current = 0;
    }
  };

  const pointerUp = () => {
    jumpHolding.current = false;
  };

  const updateGame = (ticker: Ticker) => {
    if (!started || gameOver || selectedMenu == 'exitEarly') return;

    const delta = ticker.deltaTime;
    distance.current += speed.current * delta;
    speed.current += speedIncrement * delta;

    if (jumpHolding.current) {
      jumpHoldTimer.current += delta;
      if (jumpHoldTimer.current < maxJumpHoldTime) {
        velocity.current -= jumpHoldForce * delta;
      } else {
        jumpHolding.current = false;
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
        playerX < o.x + o.object.width &&
        playerX + playerSize > o.x &&
        playerY + velocity.current < o.y + o.object.height &&
        playerY + playerSize + velocity.current > o.y;

      if (collide) {
        audioMap.hit.play();
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
      const object = objects[Math.floor(Math.random() * objects.length)];

      obstacles.current.push({
        x: appWidth,
        y: groundY + playerSize - object.height,
        object: object,
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
        <Obstacle key={i} x={o.x} y={o.y} object={o.object} />
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
          text={`XP Gained: ${Math.floor(
            distance.current * scoreMultiplier,
          ).toLocaleString('en-US')}`}
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
