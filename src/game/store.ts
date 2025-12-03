import { openDB } from 'idb';
import { create } from 'zustand';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { useEffect } from 'react';
import { gameUpgrades } from '../data/gameData';
import { Cow } from '../models/cowModel';

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
    isHarvest: state.isHarvest,
    upgrades: state.upgrades,
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
  isHarvest: boolean;
  upgrades: Upgrades;
  addMooney: (amount: number) => void;
  addCow: (cow: Cow) => void;
  addUpgrade: (key: keyof Upgrades) => void;
  removeMooney: (amount: number) => void;
  removeCow: (cowId: string) => void;
  loadData: (data: Partial<GameState>) => void;
  reset: () => void;
}

export interface Upgrades {
  clickLevel: number;
  farmLevel: number;
  harvestCooldownLevel: number;
  harvestDurationLevel: number;
}

export const upgrades: Upgrades = {
  clickLevel: 1,
  farmLevel: 1,
  harvestCooldownLevel: 1,
  harvestDurationLevel: 1,
};

export const useGameStore = create<GameState>((set, get) => {
  const harvestDuration =
    gameUpgrades.harvestDurationSeconds * 1000 +
    gameUpgrades.harvetDurationIncreasePerUpgrade *
      1000 *
      (upgrades.harvestDurationLevel - 1);

  return {
    mooney: 100,
    cows: [],
    lastHarvest: null,
    isHarvest: false,
    upgrades: upgrades,

    addMooney: (amount) => set({ mooney: get().mooney + amount }),
    addCow: (cow) => set((state) => ({ cows: [...state.cows, cow] })),
    addUpgrade: (key: keyof Upgrades) =>
      set((state) => ({
        upgrades: {
          ...state.upgrades,
          [key]: (state.upgrades[key] || 0) + 1,
        },
      })),

    removeMooney: (amount) => set({ mooney: get().mooney - amount }),
    removeCow: (cowId: string) =>
      set((state) => ({
        cows: state.cows.filter((cow) => cow.id !== cowId),
      })),

    loadData: (data) =>
      set((state) => {
        let restoredCows = state.cows;

        if (data.cows) {
          restoredCows = restoreCows(data);
        }

        const now = Date.now();
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
          upgrades: data.upgrades ?? state.upgrades,
        };
      }),

    reset: () =>
      set({
        mooney: 100,
        cows: [],
        lastHarvest: null,
        isHarvest: false,
        upgrades: upgrades,
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

    const interval = setInterval(saveToDB, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = getSerializableState(useGameStore.getState());
      const compressed = compressToUTF16(JSON.stringify(data));
      localStorage.setItem(dbName, compressed);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
