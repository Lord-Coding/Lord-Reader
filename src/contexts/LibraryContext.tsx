import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteBookFile,
  getAllReadingProgress,
  getReadingSessions,
  getStoredBooks,
  READER_DATA_UPDATED_EVENT,
  saveBookFile,
  updateBookMetadata as persistBookMetadata,
} from '../lib/bookStorage';
import { LibraryContext, type LibraryContextValue } from '../lib/library-context';
import type { Books } from '../lib/models';

const FAVORITES_STORAGE_KEY = 'lord-reader-favorites';

function readFavoriteIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored === null) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== 'string')) {
      throw new Error('Les favoris enregistrés ne sont pas valides.');
    }

    return parsed;
  } catch (error) {
    console.error('Impossible de charger les favoris enregistrés.', error);
    return [];
  }
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavoriteIds);
  const [storedBooks, setStoredBooks] = useState<Books[]>([]);
  const [readingProgress, setReadingProgress] = useState<LibraryContextValue['readingProgress']>([]);
  const [readingSessions, setReadingSessions] = useState<LibraryContextValue['readingSessions']>([]);

  useEffect(() => {
    let active = true;
    const refreshLocalData = () => {
      Promise.all([getStoredBooks(), getAllReadingProgress(), getReadingSessions()])
        .then(([books, progress, sessions]) => {
          if (!active) return;
          setStoredBooks(books);
          setReadingProgress(progress);
          setReadingSessions(sessions);
          setFavoriteIds((currentIds) => currentIds.filter((id) => books.some((book) => book.id === id)));
        })
        .catch((error: unknown) => {
          console.error('Impossible de charger les données locales de la bibliothèque.', error);
        });
    };

    refreshLocalData();
    window.addEventListener(READER_DATA_UPDATED_EVENT, refreshLocalData);

    return () => {
      active = false;
      window.removeEventListener(READER_DATA_UPDATED_EVENT, refreshLocalData);
    };
  }, []);

  const books = useMemo(() => {
    return storedBooks.map((book) => ({
      ...book,
      isFavorite: favoriteIds.includes(book.id),
    }));
  }, [favoriteIds, storedBooks]);
  const favorites = useMemo(() => books.filter((book) => book.isFavorite), [books]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Impossible d’enregistrer les favoris.', error);
    }
  }, [favoriteIds]);

  const toggleFavorite = useCallback((bookId: string) => {
    setFavoriteIds((currentIds) =>
      currentIds.includes(bookId) ? currentIds.filter((id) => id !== bookId) : [...currentIds, bookId],
    );
  }, []);

  const clearFavorites = useCallback(() => setFavoriteIds([]), []);

  const importBook = useCallback(async (book: Books, file: Blob) => {
    const savedBook = await saveBookFile(book, file);
    setStoredBooks((currentBooks) => [
      ...currentBooks.filter((currentBook) => currentBook.id !== savedBook.id),
      savedBook,
    ]);
    return savedBook;
  }, []);

  const removeImportedBook = useCallback(async (bookId: string) => {
    await deleteBookFile(bookId);
    setStoredBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId));
    setFavoriteIds((currentIds) => currentIds.filter((id) => id !== bookId));
  }, []);

  const updateBookMetadata = useCallback(
    async (bookId: string, metadata: Pick<Books, 'title' | 'author' | 'synopsis'>) => {
      const updatedBook = await persistBookMetadata(bookId, metadata);
      setStoredBooks((currentBooks) => currentBooks.map((book) => (book.id === updatedBook.id ? updatedBook : book)));
      return updatedBook;
    },
    [],
  );

  const value = useMemo(
    () => ({
      books,
      favorites,
      readingProgress,
      readingSessions,
      toggleFavorite,
      clearFavorites,
      importBook,
      removeImportedBook,
      updateBookMetadata,
    }),
    [
      books,
      favorites,
      readingProgress,
      readingSessions,
      toggleFavorite,
      clearFavorites,
      importBook,
      removeImportedBook,
      updateBookMetadata,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};
