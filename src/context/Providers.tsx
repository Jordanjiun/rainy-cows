import { useState, useRef } from 'react';
import { CowContext, FileInputContext } from './Contexts';
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

export function FileInputProvider({ children }: { children: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  let callbackRef: ((file: File) => void) | null = null;

  function openFilePicker() {
    inputRef.current?.click();
  }

  function onFileSelected(callback: (file: File) => void) {
    callbackRef = callback;
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
          if (file && callbackRef) callbackRef(file);
        }}
      />
    </FileInputContext.Provider>
  );
}
