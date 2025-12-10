import { useCallback, useEffect, useState, useRef } from 'react';
import {
  AudioContext,
  CowContext,
  FileInputContext,
  MenuContext,
  MooneyContext,
  SceneContext,
  ToastContext,
} from './Contexts';
import { Howl, Howler } from 'howler';
import { ToastOverlay } from '../components/others/Toast';
import { useGameStore } from '../game/store';
import type { ReactNode } from 'react';
import type { SceneKey, MooneyEffect, AudioAsset } from './Contexts';
import type { ToastMessage } from '../components/others/Toast';
import type { Cow } from '../game/cowModel';

const animationDuration = 1000;
const fadeInDuration = 200;
const fadeOutDuration = 300;

export const SceneProvider = ({ children }: { children: ReactNode }) => {
  const [currentScene, setCurrentScene] = useState<SceneKey>('LoadScreen');

  const switchScene = (scene: SceneKey) => setCurrentScene(scene);

  return (
    <SceneContext.Provider value={{ currentScene, switchScene }}>
      {children}
    </SceneContext.Provider>
  );
};

export function CowProvider({ children }: { children: ReactNode }) {
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);

  return (
    <CowContext.Provider value={{ selectedCow, setSelectedCow }}>
      {children}
    </CowContext.Provider>
  );
}

export function FileInputProvider({ children }: { children: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const callbackRef = useRef<((file: File) => void) | null>(null);

  function openFilePicker() {
    if (inputRef.current) inputRef.current.click();
  }

  function onFileSelected(callback: (file: File) => void) {
    callbackRef.current = callback;
  }

  return (
    <FileInputContext.Provider value={{ openFilePicker, onFileSelected }}>
      {children}

      <input
        ref={inputRef}
        type="file"
        accept=".txt,.json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && callbackRef.current) callbackRef.current(file);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </FileInputContext.Provider>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, color: string = 'white') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { text, color, id }]);
    setTimeout(() => setToasts((t) => t.filter((msg) => msg.id !== id)), 2500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastOverlay toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  return (
    <MenuContext.Provider value={{ selectedMenu, setSelectedMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export const MooneyProvider = ({ children }: { children: ReactNode }) => {
  const [moonies, setMoonies] = useState<MooneyEffect[]>([]);

  const addMooneyEffect = (x: number, y: number, amount: number) => {
    setMoonies((prev) => [
      ...prev,
      {
        x,
        y,
        alpha: 0,
        vy: -1,
        start: performance.now(),
        amount: amount,
      },
    ]);
  };

  useEffect(() => {
    let frame: number;

    const animate = () => {
      setMoonies((prev) =>
        prev
          .map((m) => {
            const elapsed = performance.now() - m.start;

            let alpha = 1;
            if (elapsed < fadeInDuration) alpha = elapsed / fadeInDuration;
            else if (elapsed > animationDuration - fadeOutDuration)
              alpha = (animationDuration - elapsed) / fadeOutDuration;

            return {
              ...m,
              y: m.y + m.vy,
              alpha: Math.max(0, Math.min(1, alpha)),
            };
          })
          .filter((m) => performance.now() - m.start < animationDuration),
      );
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <MooneyContext.Provider
      value={{
        moonies,
        addMooneyEffect,
      }}
    >
      {children}
    </MooneyContext.Provider>
  );
};

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const { volume: globalVolume, setVolume } = useGameStore();
  const [audioMap, setAudioMap] = useState<Record<string, Howl>>({});
  const [originalVolumes, setOriginalVolumes] = useState<
    Record<string, number>
  >({});

  const loadAudio = async (audioManifest: AudioAsset[]) => {
    const map: Record<string, Howl> = {};
    const volumes: Record<string, number> = {};

    for (const audio of audioManifest) {
      volumes[audio.alias] = audio.volume ?? 1;
      map[audio.alias] = new Howl({
        src: [audio.src],
        volume: (audio.volume ?? 1) * globalVolume,
      });
    }

    setAudioMap(map);
    setOriginalVolumes(volumes);
    return map;
  };

  const setGlobalVolume = useCallback(
    (volume: number) => {
      setVolume(volume);
      Object.entries(audioMap).forEach(([alias, howl]) => {
        const originalVolume = originalVolumes[alias] ?? 1;
        howl.volume(originalVolume * volume);
      });
    },
    [audioMap, originalVolumes],
  );

  useEffect(() => {
    const unlockAudio = () => {
      Howler.ctx?.resume();
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
  }, []);

  return (
    <AudioContext.Provider
      value={{ audioMap, globalVolume, loadAudio, setGlobalVolume }}
    >
      {children}
    </AudioContext.Provider>
  );
};
