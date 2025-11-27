import { useState, useRef } from 'react';
import {
  CowContext,
  FileInputContext,
  SceneContext,
  ToastContext,
} from './Contexts';
import { ToastOverlay } from '../components/Toast';
import type { ReactNode } from 'react';
import type { SceneKey } from './Contexts';
import type { ToastMessage } from '../components/Toast';
import type { Cow } from '../models/cowModel';

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
