import { openDB, type IDBPDatabase } from 'idb';

import type { Books } from './models';

interface StoredBookFile {
  id: string;
  book: Books;
  blob: Blob;
}

export type ReadingProgress =
  | { bookId: string; format: 'EPUB'; percentage: number; cfi?: string }
  | { bookId: string; format: 'PDF'; percentage: number; page: number };

interface ReaderDatabase {
  books: {
    key: string;
    value: StoredBookFile;
  };
  progress: {
    key: string;
    value: ReadingProgress;
  };
}

const DATABASE_NAME = 'elikia-reader';
const DATABASE_VERSION = 1;

let database: Promise<IDBPDatabase<ReaderDatabase>> | undefined;

function getDatabase(): Promise<IDBPDatabase<ReaderDatabase>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Le stockage local IndexedDB n’est pas disponible.'));
  }

  if (!database) {
    database = openDB<ReaderDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db) {
        db.createObjectStore('books', { keyPath: 'id' });
        db.createObjectStore('progress', { keyPath: 'bookId' });
      },
    }).catch((error: unknown) => {
      database = undefined;
      throw error;
    });
  }
  return database;
}

export async function saveBookFile(book: Books, file: Blob): Promise<Books> {
  const savedBook: Books = {
    ...book,
    sourceFileName: book.sourceFileName ?? 'livre',
    fileSize: file.size,
  };
  const db = await getDatabase();
  const transaction = db.transaction(['books', 'progress'], 'readwrite');
  await Promise.all([
    transaction.objectStore('books').put({ id: book.id, book: savedBook, blob: file }),
    transaction.objectStore('progress').delete(book.id),
    transaction.done,
  ]);
  return savedBook;
}

export async function deleteBookFile(bookId: string): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction(['books', 'progress'], 'readwrite');
  await Promise.all([
    transaction.objectStore('books').delete(bookId),
    transaction.objectStore('progress').delete(bookId),
    transaction.done,
  ]);
}

export async function getBookFile(bookId: string): Promise<Blob | undefined> {
  const db = await getDatabase();
  return (await db.get('books', bookId))?.blob;
}

export async function getStoredBooks(): Promise<Books[]> {
  const db = await getDatabase();
  return (await db.getAll('books')).map((record) => record.book);
}

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  const db = await getDatabase();
  await db.put('progress', progress);
}

export async function getReadingProgress(bookId: string): Promise<ReadingProgress | undefined> {
  const db = await getDatabase();
  return db.get('progress', bookId);
}

export async function getStorageEstimate(): Promise<StorageEstimate | undefined> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return undefined;
  return navigator.storage.estimate();
}
