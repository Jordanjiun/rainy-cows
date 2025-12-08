import { createContext } from 'react';
import { Howl } from 'howler';
import type { Cow } from '../game/cowModel';

export type SceneKey = 'LoadScreen' | 'MainScene';
export type MooneyEffect = {
  x: number;
  y: number;
  alpha: number;
  vy: number;
  start: number;
  amount: number;
};
export type AudioAsset = {
  alias: string;
  src: string;
  volume: number;
};

export interface SceneContextType {
  currentScene: SceneKey;
  switchScene: (scene: SceneKey) => void;
}

export interface CowContextType {
  selectedCow: Cow | null;
  setSelectedCow: (cow: Cow | null) => void;
}

export interface FileInputContextType {
  openFilePicker: () => void;
  onFileSelected: (callback: (file: File) => void) => void;
}

export interface ToastContexType {
  showToast: (text: string, color?: string) => void;
}

export interface MenuContextType {
  selectedMenu: string | null;
  setSelectedMenu: (menuOpened: string | null) => void;
}

export interface MooneyContextType {
  moonies: MooneyEffect[];
  addMooneyEffect: (x: number, y: number, amount: number) => void;
}

export interface AudioContextType {
  audioMap: Record<string, Howl>;
  loadAudio: (audioManifest: AudioAsset[]) => Promise<Record<string, Howl>>;
}

export const SceneContext = createContext<SceneContextType | undefined>(
  undefined,
);
export const CowContext = createContext<CowContextType | undefined>(undefined);
export const FileInputContext = createContext<FileInputContextType | null>(
  null,
);
export const ToastContext = createContext<ToastContexType | null>(null);
export const MenuContext = createContext<MenuContextType | null>(null);
export const MooneyContext = createContext<MooneyContextType | null>(null);
export const AudioContext = createContext<AudioContextType | null>(null);
