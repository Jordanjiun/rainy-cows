import { openDB } from 'idb';
import { create } from 'zustand';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { useEffect } from 'react';
import { Cow } from '../models/cowModel';

const storeName = String(import.meta.env.VITE_DB_STORE_NAME);

async function getDB() {
  return openDB(
    String(import.meta.env.VITE_DB_NAME),
    Number(import.meta.env.VITE_DB_VERSION),
    {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      },
    },
  );
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
  useGameStore.getState().reset();
  await cleaGameData();
};

export async function saveCompressedGameData<T>(obj: T) {
  const compressed = compressToUTF16(JSON.stringify(obj));
  await saveGameData(compressed);
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
  addMooney: (amount: number) => void;
  addCow: (cow: Cow) => void;
  loadData: (data: Partial<GameState>) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  mooney: 0,
  cows: [],

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

      return {
        ...state,
        mooney: data.mooney ?? state.mooney,
        cows: restoredCows,
      };
    }),
  reset: () => set({ mooney: 0, cows: [] }),
}));

export function useGamePersistence() {
  const gameState = useGameStore();

  useEffect(() => {
    let ignore = false;
    (async () => {
      const data = await loadCompressedGameData<Partial<GameState>>();
      if (!ignore && data) {
        gameState.loadData(data);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const save = async () => {
      const data = useGameStore.getState();
      await saveCompressedGameData(data);
    };

    const interval = setInterval(save, 10000);
    window.addEventListener('beforeunload', save);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', save);
    };
  }, []);
}
