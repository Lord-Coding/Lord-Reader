import { createContext } from 'react';

import type { ReadingProgress, ReadingSession } from './bookStorage';
import type { Books } from './models';

export interface LibraryContextValue {
  books: Books[];
  favorites: Books[];
  readingProgress: ReadingProgress[];
  readingSessions: ReadingSession[];
  toggleFavorite: (bookId: string) => void;
  clearFavorites: () => void;
  importBook: (book: Books, file: Blob) => Promise<Books>;
  removeImportedBook: (bookId: string) => Promise<void>;
  updateBookMetadata: (bookId: string, metadata: Pick<Books, 'title' | 'author' | 'synopsis'>) => Promise<Books>;
}

export const LibraryContext = createContext<LibraryContextValue | null>(null);
