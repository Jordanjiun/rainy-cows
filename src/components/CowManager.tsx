import { useEffect, useState, useCallback } from 'react';
import { CowComponent } from './CowComponent';
import { createNewCow } from '../game/cowBuilder';

export const CowManager = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const [cows, setCows] = useState(() =>
    Array.from({ length: 1 }, () => createNewCow()),
  );

  const addCow = useCallback(() => {
    setCows((prev) => [...prev, createNewCow()]);
  }, []);

  useEffect(() => {
    const handleRightClick = (e: PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        addCow();
      }
    };

    document.addEventListener('contextmenu', handleRightClick);
    return () => document.removeEventListener('contextmenu', handleRightClick);
  }, [addCow]);

  return (
    <>
      {cows.map((cow) => (
        <CowComponent
          key={cow.id}
          cow={cow}
          appWidth={appWidth}
          appHeight={appHeight}
        />
      ))}
    </>
  );
};
