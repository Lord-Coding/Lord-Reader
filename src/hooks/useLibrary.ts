import { useContext } from 'react';

import { LibraryContext, type LibraryContextValue } from '../lib/library-context';

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary doit être utilisé dans <LibraryProvider>.');
  return context;
}
