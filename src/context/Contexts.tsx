import { createContext } from 'react';
import type { Cow } from '../models/cowModel';

export type SceneKey = 'LoadScreen' | 'MainScene';

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

export const SceneContext = createContext<SceneContextType | undefined>(
  undefined,
);
export const CowContext = createContext<CowContextType | undefined>(undefined);
export const FileInputContext = createContext<FileInputContextType | null>(
  null,
);
export const ToastContext = createContext<ToastContexType | null>(null);
export const MenuContext = createContext<MenuContextType | null>(null);
