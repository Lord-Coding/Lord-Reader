import { openDB, type IDBPDatabase } from 'idb';

import type { Books } from './models';

interface StoredBookFile {
  id: string;
  book: Books;
  blob: Blob;
}

export type ReadingProgress =
  | { bookId: string; format: 'EPUB'; percentage: number; cfi?: string; updatedAt?: number }
  | { bookId: string; format: 'PDF'; percentage: number; page: number; updatedAt?: number };

export interface ReadingSession {
  id: string;
  bookId: string;
  format: 'EPUB' | 'PDF';
  startedAt: number;
  endedAt?: number;
  durationMs: number;
  startPercentage: number;
  endPercentage: number;
}

interface ReaderDatabase {
  books: {
    key: string;
    value: StoredBookFile;
  };
  progress: {
    key: string;
    value: ReadingProgress;
  };
  sessions: {
    key: string;
    value: ReadingSession;
    indexes: { 'by-bookId': string };
  };
}

const DATABASE_NAME = 'elikia-reader';
const DATABASE_VERSION = 2;
export const READER_DATA_UPDATED_EVENT = 'lord-reader-data-updated';

let database: Promise<IDBPDatabase<ReaderDatabase>> | undefined;

function notifyReaderDataUpdated(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(READER_DATA_UPDATED_EVENT));
}

function getDatabase(): Promise<IDBPDatabase<ReaderDatabase>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Le stockage local IndexedDB n’est pas disponible.'));
  }

  if (!database) {
    database = openDB<ReaderDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('books', { keyPath: 'id' });
          db.createObjectStore('progress', { keyPath: 'bookId' });
        }
        if (oldVersion < 2) {
          const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('by-bookId', 'bookId');
        }
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
  const transaction = db.transaction(['books', 'progress', 'sessions'], 'readwrite');
  const sessionStore = transaction.objectStore('sessions');
  const sessionKeys = await sessionStore.index('by-bookId').getAllKeys(book.id);
  await Promise.all([
    transaction.objectStore('books').put({ id: book.id, book: savedBook, blob: file }),
    transaction.objectStore('progress').delete(book.id),
    ...sessionKeys.map((key) => sessionStore.delete(key)),
    transaction.done,
  ]);
  notifyReaderDataUpdated();
  return savedBook;
}

export async function deleteBookFile(bookId: string): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction(['books', 'progress', 'sessions'], 'readwrite');
  const sessionStore = transaction.objectStore('sessions');
  const sessionKeys = await sessionStore.index('by-bookId').getAllKeys(bookId);
  await Promise.all([
    transaction.objectStore('books').delete(bookId),
    transaction.objectStore('progress').delete(bookId),
    ...sessionKeys.map((key) => sessionStore.delete(key)),
    transaction.done,
  ]);
  notifyReaderDataUpdated();
}

export async function getBookFile(bookId: string): Promise<Blob | undefined> {
  const db = await getDatabase();
  return (await db.get('books', bookId))?.blob;
}

export async function getStoredBooks(): Promise<Books[]> {
  const db = await getDatabase();
  return (await db.getAll('books')).map((record) => record.book);
}

export async function updateBookMetadata(
  bookId: string,
  metadata: Pick<Books, 'title' | 'author' | 'synopsis'>,
): Promise<Books> {
  const db = await getDatabase();
  const transaction = db.transaction('books', 'readwrite');
  const store = transaction.objectStore('books');
  const record = await store.get(bookId);
  if (!record) throw new Error(`Le livre ${bookId} n’existe pas dans la bibliothèque locale.`);

  const updatedBook = { ...record.book, ...metadata };
  await store.put({ ...record, book: updatedBook });
  await transaction.done;
  notifyReaderDataUpdated();
  return updatedBook;
}

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  const db = await getDatabase();
  await db.put('progress', { ...progress, updatedAt: Date.now() });
  notifyReaderDataUpdated();
}

export async function getReadingProgress(bookId: string): Promise<ReadingProgress | undefined> {
  const db = await getDatabase();
  return db.get('progress', bookId);
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
  const db = await getDatabase();
  return db.getAll('progress');
}

export async function startReadingSession(
  bookId: string,
  format: ReadingSession['format'],
  percentage: number,
): Promise<string> {
  const db = await getDatabase();
  const id = `${bookId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const progress = Math.min(1, Math.max(0, percentage));
  await db.add('sessions', {
    id,
    bookId,
    format,
    startedAt: Date.now(),
    durationMs: 0,
    startPercentage: progress,
    endPercentage: progress,
  });
  notifyReaderDataUpdated();
  return id;
}

export async function updateReadingSession(
  sessionId: string,
  durationMs: number,
  percentage: number,
  endedAt?: number,
): Promise<void> {
  const db = await getDatabase();
  const session = await db.get('sessions', sessionId);
  if (!session) throw new Error(`La session de lecture ${sessionId} n’existe pas.`);

  await db.put('sessions', {
    ...session,
    durationMs: Math.max(0, durationMs),
    endPercentage: Math.min(1, Math.max(0, percentage)),
    ...(endedAt === undefined ? {} : { endedAt }),
  });
  notifyReaderDataUpdated();
}

export async function getReadingSessions(): Promise<ReadingSession[]> {
  const db = await getDatabase();
  return (await db.getAll('sessions')).sort((first, second) => second.startedAt - first.startedAt);
}

export async function getStorageEstimate(): Promise<StorageEstimate | undefined> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return undefined;
  return navigator.storage.estimate();
}
