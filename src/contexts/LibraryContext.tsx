import { useCallback, useEffect, useMemo, useState } from 'react';

import { deleteBookFile, getStoredBooks, saveBookFile } from '../lib/bookStorage';
import { bookLibrary } from '../lib/data';
import { LibraryContext } from '../lib/library-context';
import type { Books } from '../lib/models';

const FAVORITES_STORAGE_KEY = 'lord-reader-favorites';

function getDefaultFavoriteIds(): string[] {
  return bookLibrary.filter((book) => book.isFavorite).map((book) => book.id);
}

function readFavoriteIds(): string[] {
  if (typeof window === 'undefined') return getDefaultFavoriteIds();

  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored === null) return getDefaultFavoriteIds();

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== 'string')) {
      throw new Error('Les favoris enregistrés ne sont pas valides.');
    }

    return parsed;
  } catch (error) {
    console.error('Impossible de charger les favoris enregistrés.', error);
    return getDefaultFavoriteIds();
  }
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavoriteIds);
  const [storedBooks, setStoredBooks] = useState<Books[]>([]);

  useEffect(() => {
    let active = true;
    getStoredBooks()
      .then((books) => {
        if (active) setStoredBooks(books);
      })
      .catch((error: unknown) => {
        console.error('Impossible de charger les livres importés.', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const books = useMemo(() => {
    const savedBooks = new Map(storedBooks.map((book) => [book.id, book]));
    const catalog = bookLibrary.map((book) => savedBooks.get(book.id) ?? book);
    const catalogIds = new Set(catalog.map((book) => book.id));
    const imported = storedBooks.filter((book) => !catalogIds.has(book.id));
    return [...catalog, ...imported].map((book) => ({
      ...book,
      isFavorite: favoriteIds.includes(book.id),
    }));
  }, [favoriteIds, storedBooks]);
  const favorites = useMemo(() => books.filter((book) => book.isFavorite), [books]);

  useEffect(() => {
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

  const value = useMemo(
    () => ({ books, favorites, toggleFavorite, clearFavorites, importBook, removeImportedBook }),
    [books, favorites, toggleFavorite, clearFavorites, importBook, removeImportedBook],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};
