import { createContext } from 'react';
import type { Cow } from '../models/cowModel';

export interface CowContextType {
  selectedCow: Cow | null;
  setSelectedCow: (cow: Cow | null) => void;
}

export interface FileInputContextType {
  openFilePicker: () => void;
  onFileSelected: (callback: (file: File) => void) => void;
}

export const CowContext = createContext<CowContextType | undefined>(undefined);
export const FileInputContext = createContext<FileInputContextType | null>(
  null,
);
