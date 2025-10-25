import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useScene } from '../context/useScene';
import { LoadingBar } from '../components/LoadingBar';

extend({ Container, Graphics, Text });

export const LoadScreen = () => {
  const [progress, setProgress] = useState(0);
  const { switchScene } = useScene();

  // Simulate fake loading process
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            switchScene('TestScene');
          }, 100);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [switchScene]);

  return <LoadingBar progress={progress} />;
};
