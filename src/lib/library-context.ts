import { createContext } from 'react';

import type { Books } from './models';

export interface LibraryContextValue {
  books: Books[];
  favorites: Books[];
  toggleFavorite: (bookId: string) => void;
  clearFavorites: () => void;
  importBook: (book: Books, file: Blob) => Promise<Books>;
  removeImportedBook: (bookId: string) => Promise<void>;
}

export const LibraryContext = createContext<LibraryContextValue | null>(null);
