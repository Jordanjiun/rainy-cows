import { createContext } from 'react';
import type { Cow } from '../models/cowModel';

export interface CowContextType {
  selectedCow: Cow | null;
  setSelectedCow: (cow: Cow | null) => void;
}

export const CowContext = createContext<CowContextType | undefined>(undefined);
