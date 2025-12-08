import { useContext } from 'react';
import {
  AudioContext,
  CowContext,
  FileInputContext,
  MenuContext,
  MooneyContext,
  SceneContext,
  ToastContext,
} from './Contexts';

export function useCow() {
  const ctx = useContext(CowContext);
  if (!ctx) throw new Error('useCow must be used inside a CowProvider');
  return ctx;
}

export function useFileInput() {
  const ctx = useContext(FileInputContext);
  if (!ctx)
    throw new Error('useFileInput must be used inside a FileInputProvider');
  return ctx;
}

export const useScene = () => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used inside a SceneProvider');
  return ctx;
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider');
  return ctx;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('useMenu must be used inside a MenuProvider');
  }
  return ctx;
}

export function useMooney() {
  const ctx = useContext(MooneyContext);
  if (!ctx) throw new Error('useMooney must be used inside a MooneyProvider');
  return ctx;
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used inside a AudioProvider');
  return ctx;
}
