export interface Books {
  id: string;
  title: string;
  author: string;
  type: 'EPUB' | 'PDF';
  image: string;
  isFavorite?: boolean;
  synopsis?: string;
  sourceFileName?: string;
  fileSize?: number;
}

export type CategorySegment = 'tous' | 'EPUB' | 'PDF' | 'Favoris';
