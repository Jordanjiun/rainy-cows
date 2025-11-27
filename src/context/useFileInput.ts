import { useContext } from 'react';
import { FileInputContext } from './Contexts';

export function useFileInput() {
  const ctx = useContext(FileInputContext);
  if (!ctx) throw new Error('useFileInput must be inside a FileInputProvider');
  return ctx;
}
