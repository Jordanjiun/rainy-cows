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

interface GameState {
  mooney: number;
  cows: Cow[];
  lastHarvest: number | null;
  isHarvest: boolean;
  addMooney: (amount: number) => void;
  addCow: (cow: Cow) => void;
  loadData: (data: Partial<GameState>) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => {
  const harvestDuration = gameUpgrades.harvestDurationSeconds * 1000;

  return {
    mooney: 0,
    cows: [],
    lastHarvest: null,
    isHarvest: false,

    addMooney: (amount) => set({ mooney: get().mooney + amount }),
    addCow: (cow) => set((state) => ({ cows: [...state.cows, cow] })),

    loadData: (data) =>
      set((state) => {
        let restoredCows = state.cows;

        if (data.cows) {
          restoredCows = data.cows.map((c) => {
            const cow = Object.assign(new Cow(), c);
            cow.seed = Number.parseInt(
              crypto.randomUUID().replace(/-/g, '').slice(0, 12),
              16,
            );
            return cow;
          });
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
        };
      }),

    reset: () =>
      set({ mooney: 0, cows: [], lastHarvest: null, isHarvest: false }),
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
