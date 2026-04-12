import { useCallback, useEffect, useState, useRef } from 'react';
import {
  AudioContext,
  CowContext,
  FileInputContext,
  MenuContext,
  MooneyContext,
  SceneContext,
  ToastContext,
  WeatherContext,
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

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [isRaining, setIsRaining] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloudflareEndpoint = String(import.meta.env.VITE_CLOUDFLARE_WORKER);

  const rainCodes = new Set([
    51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82,
  ]);

  const fetchWeather = async (lat: number, lon: number) => {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
    );
    const data = await res.json();
    const code = data.current_weather.weathercode;
    setIsRaining(rainCodes.has(code));
  };

  const fetchCoordsFromCloudflare = async () => {
    const res = await fetch(cloudflareEndpoint);
    const data = await res.json();
    const coords = await fetchCityCoords(data.city);
    return {
      city: data.city,
      lat: coords.lat,
      lon: coords.lon,
    };
  };

  const fetchCityCoords = async (city: string) => {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`,
    );
    const data = await res.json();
    if (!data.results?.length) {
      throw new Error('City not found');
    }
    return {
      lat: data.results[0].latitude,
      lon: data.results[0].longitude,
    };
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);

    const defaultCity = 'Melbourne';

    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            console.log(
              `Using navigator geolocation with ${pos.coords.latitude}, ${pos.coords.longitude}.`,
            );
            await fetchWeather(pos.coords.latitude, pos.coords.longitude);
            setLoading(false);
          },
          async () => {
            try {
              const location = await fetchCoordsFromCloudflare();
              if (location?.lat && location?.lon) {
                console.log(
                  `Using city ${location.city} with ${location.lat}, ${location.lon}.`,
                );
                await fetchWeather(location.lat, location.lon);
                setLoading(false);
                return;
              }
            } catch (err: any) {
              setError(`Could not detect city: ${err}. Using default city.`);
            }
            const { lat, lon } = await fetchCityCoords(defaultCity);
            console.log(
              `Using default city ${defaultCity} with ${lat}, ${lon}.`,
            );
            await fetchWeather(lat, lon);
            setLoading(false);
          },
        );
        return;
      }

      const { lat, lon } = await fetchCityCoords(defaultCity);
      await fetchWeather(lat, lon);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <WeatherContext.Provider
      value={{
        isRaining,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}
