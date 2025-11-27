import { useContext } from 'react';
import { CowContext, FileInputContext, SceneContext } from './Contexts';

export function useCow() {
  const ctx = useContext(CowContext);
  if (!ctx) {
    throw new Error('useCow must be used inside a CowProvider');
  }
  return ctx;
}

export function useFileInput() {
  const ctx = useContext(FileInputContext);
  if (!ctx) throw new Error('useFileInput must be inside a FileInputProvider');
  return ctx;
}

export const useScene = () => {
  const context = useContext(SceneContext);
  if (!context) throw new Error('useScene must be used within a SceneProvider');
  return context;
};
