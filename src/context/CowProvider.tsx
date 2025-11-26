import { useState } from 'react';
import { CowContext } from './CowContext';
import type { ReactNode } from 'react';
import type { Cow } from '../models/cowModel';

export function CowProvider({ children }: { children: ReactNode }) {
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);

  return (
    <CowContext.Provider value={{ selectedCow, setSelectedCow }}>
      {children}
    </CowContext.Provider>
  );
}
