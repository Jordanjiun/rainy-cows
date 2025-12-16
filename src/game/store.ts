import { openDB } from 'idb';
import { create } from 'zustand';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { useEffect } from 'react';
import { gameUpgrades } from '../data/gameData';
import { Cow } from './cowModel';

const dbName = String(import.meta.env.VITE_DB_NAME);
const storeName = String(import.meta.env.VITE_DB_STORE_NAME);

async function getDB() {
  return openDB(dbName, Number(import.meta.env.VITE_DB_VERSION), {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    },
  });
}

async function saveGameData(data: any) {
  const db = await getDB();
  await db.put(storeName, data, 'save');
}

async function loadGameData() {
  const db = await getDB();
  return await db.get(storeName, 'save');
}

async function cleaGameData() {
  const db = await getDB();
  await db.put(storeName, null, 'save');
}

export const purgeGameData = async () => {
  localStorage.removeItem(dbName);
  useGameStore.getState().reset();
  await cleaGameData();
};

export async function saveCompressedGameData<T>(obj: T) {
  const compressed = compressToUTF16(JSON.stringify(obj));
  await saveGameData(compressed);
}

function getSerializableState(state: GameState) {
  return {
    mooney: state.mooney,
    cows: state.cows,
    lastHarvest: state.lastHarvest,
    lastExportReminder: state.lastExportReminder,
    volume: state.volume,
    tutorial: state.tutorial,
    isHarvest: state.isHarvest,
    upgrades: state.upgrades,
    stats: state.stats,
  };
}

async function loadCompressedGameData<T>() {
  const compressed = await loadGameData();
  if (!compressed) return null;
  try {
    const parsed: T = JSON.parse(decompressFromUTF16(compressed));
    return parsed;
  } catch (e) {
    console.warn(
      `'Failed to decompress data: ${e}, clearing corrupted save...`,
    );
    await saveGameData(null);
    return null;
  }
}

function restoreCows(data: Partial<GameState>) {
  if (!data.cows) return [];
  return data.cows.map((c) => {
    const cow = Object.assign(new Cow(), c);
    cow.seed = Number.parseInt(
      crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      16,
    );
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const lastDecay = c.lastDecayCheck ? new Date(c.lastDecayCheck) : null;

    if (cow.lastPet) {
      const lastPetDate = new Date(cow.lastPet);
      const daysSincePet = Math.floor(
        (now.getTime() - lastPetDate.getTime()) / msPerDay,
      );
      const daysSinceDecay = lastDecay
        ? Math.floor((now.getTime() - lastDecay.getTime()) / msPerDay)
        : daysSincePet;
      const decayDays = Math.max(0, daysSincePet - 1);
      const newDecay = Math.min(decayDays, daysSinceDecay);

      if (newDecay > 0) {
        cow.hearts = Math.max(0, cow.hearts - newDecay);
        cow.lastDecayCheck = now.toISOString();
      }
    }
    return cow;
  });
}

interface GameState {
  mooney: number;
  cows: Cow[];
  lastHarvest: number | null;
  lastExportReminder: number;
  volume: number;
  tutorial: number;
  isHarvest: boolean;
  upgrades: Upgrades;
  stats: Stats;
  setVolume: (volume: number) => void;
  setTutorial: (scene: number) => void;
  setLastExportReminder: (datetime: number) => void;
  addMooney: (amount: number) => void;
  addCow: (cow: Cow) => void;
  addUpgrade: (key: keyof Upgrades) => void;
  addStats: (key: keyof Stats) => void;
  removeMooney: (amount: number) => void;
  removeCow: (cowId: string) => void;
  updateCowName: (cowId: string, newName: string) => void;
  loadData: (data: Partial<GameState>) => void;
  reset: () => void;
}

export interface Upgrades {
  clickLevel: number;
  farmLevel: number;
  harvestCooldownLevel: number;
  harvestDurationLevel: number;
  harvestMultiplierLevel: number;
}

export interface Stats {
  clicks: number;
  mooneyEarned: number;
  upgradesBought: number;
  cowsBought: number;
  cowsSold: number;
  cowsRenamed: number;
  cowsPet: number;
}

export const upgrades: Upgrades = {
  clickLevel: 1,
  farmLevel: 1,
  harvestCooldownLevel: 1,
  harvestDurationLevel: 1,
  harvestMultiplierLevel: 1,
};

export const stats: Stats = {
  clicks: 0,
  mooneyEarned: 0,
  upgradesBought: 0,
  cowsBought: 0,
  cowsSold: 0,
  cowsRenamed: 0,
  cowsPet: 0,
};

export const useGameStore = create<GameState>((set, get) => {
  const getHarvestDuration = () => {
    const level = get().upgrades.harvestDurationLevel || 1;
    return (
      gameUpgrades.harvestDurationSeconds * 1000 +
      gameUpgrades.harvetDurationIncreasePerUpgrade * 1000 * (level - 1)
    );
  };

  return {
    mooney: 100,
    cows: [],
    lastHarvest: null,
    isHarvest: false,
    upgrades: upgrades,
    stats: stats,
    lastExportReminder: Date.now(),
    volume: 1,
    tutorial: 1,

    setVolume: (newVolume: number) => set({ volume: newVolume }),
    setTutorial: (scene: number) => set({ tutorial: scene }),
    setLastExportReminder: (datetime: number) =>
      set({ lastExportReminder: datetime }),

    addMooney: (amount: number) =>
      set((state) => ({
        mooney: state.mooney + amount,
        stats: {
          ...state.stats,
          mooneyEarned: state.stats.mooneyEarned + amount,
        },
      })),
    removeMooney: (amount) => set({ mooney: get().mooney - amount }),

    addCow: (cow) =>
      set((state) => ({
        cows: [...state.cows, cow],
        stats: {
          ...state.stats,
          cowsBought: state.stats.cowsBought + 1,
        },
      })),
    removeCow: (cowId: string) =>
      set((state) => ({
        cows: state.cows.filter((cow) => cow.id !== cowId),
        stats: {
          ...state.stats,
          cowsSold: state.stats.cowsSold + 1,
        },
      })),
    updateCowName: (cowId: string, newName: string) =>
      set((state) => {
        const cow = state.cows.find((c) => c.id === cowId);
        if (!cow || cow.name === newName) return state;
        cow.name = newName;
        return {
          stats: {
            ...state.stats,
            cowsRenamed: state.stats.cowsRenamed + 1,
          },
        };
      }),

    addUpgrade: (key: keyof Upgrades) =>
      set((state) => ({
        upgrades: {
          ...state.upgrades,
          [key]: (state.upgrades[key] || 0) + 1,
        },
        stats: {
          ...state.stats,
          upgradesBought: state.stats.upgradesBought + 1,
        },
      })),
    addStats: (key: keyof Stats) =>
      set((state) => ({
        stats: {
          ...state.stats,
          [key]: (state.stats[key] || 0) + 1,
        },
      })),

    loadData: (data) =>
      set((state) => {
        let restoredCows = state.cows;
        if (data.cows) {
          restoredCows = restoreCows(data);
        }

        const now = Date.now();
        const harvestDuration = getHarvestDuration();
        let lastHarvest =
          typeof data.lastHarvest === 'number'
            ? data.lastHarvest
            : state.lastHarvest;
        let isHarvest = data.isHarvest ?? state.isHarvest;

        if (lastHarvest && lastHarvest + harvestDuration < now) {
          isHarvest = false;
        }

        return {
          ...state,
          mooney: data.mooney ?? state.mooney,
          cows: restoredCows,
          lastHarvest,
          isHarvest,
          upgrades: {
            ...upgrades,
            ...(data.upgrades ?? {}),
          },
          stats: {
            ...stats,
            ...(data.stats ?? {}),
          },
          lastExportReminder:
            data.lastExportReminder ?? state.lastExportReminder,
          volume: data.volume ?? state.volume,
          tutorial: data.tutorial ?? state.tutorial,
        };
      }),

    reset: () =>
      set({
        mooney: 100,
        cows: [],
        lastHarvest: null,
        isHarvest: false,
        upgrades: upgrades,
        stats: stats,
        lastExportReminder: Date.now(),
        volume: 1,
        tutorial: 1,
      }),
  };
});

export function useGamePersistence() {
  const gameState = useGameStore();

  useEffect(() => {
    let ignore = false;

    (async () => {
      const localData = localStorage.getItem(dbName);
      if (localData) {
        try {
          const parsed = JSON.parse(decompressFromUTF16(localData));
          if (!ignore) gameState.loadData(parsed);
          return;
        } catch (e) {
          console.warn('LocalStorage corrupted, removing it', e);
          localStorage.removeItem(dbName);
        }
      }

      const dbData = await loadCompressedGameData<Partial<typeof gameState>>();
      if (!ignore && dbData) {
        gameState.loadData(dbData);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const saveToDB = async () => {
      const data = getSerializableState(useGameStore.getState());
      await saveCompressedGameData(data);
    };

    const interval = setInterval(saveToDB, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saveState = () => {
      const data = getSerializableState(useGameStore.getState());
      const compressed = compressToUTF16(JSON.stringify(data));
      localStorage.setItem(dbName, compressed);
      saveCompressedGameData(data);
    };

    window.addEventListener('pagehide', saveState);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', saveState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

export async function exportGameSave() {
  const state = getSerializableState(useGameStore.getState());
  const compressed = compressToUTF16(JSON.stringify(state));
  const blob = new Blob([compressed], { type: 'text/plain;charset=utf-16' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `rainycows-save-${timestamp}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importGameSave(file: File) {
  const text = await file.text();

  try {
    const jsonString = decompressFromUTF16(text);
    if (!jsonString) throw new Error('Decompression failed');
    const parsed: Partial<GameState> = JSON.parse(jsonString);
    useGameStore.getState().loadData(parsed);
    await saveCompressedGameData(getSerializableState(useGameStore.getState()));

    return { success: true };
  } catch (err) {
    console.error('Failed to import save:', err);
    return { success: false, error: err };
  }
}
