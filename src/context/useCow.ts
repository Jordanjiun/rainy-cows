import { useContext } from 'react';
import { CowContext } from './Contexts';

export function useCow() {
  const ctx = useContext(CowContext);
  if (!ctx) {
    throw new Error('useCow must be used inside a CowProvider');
  }
  return ctx;
}
