import type { Books } from './models';

export type BookFormat = Books['type'];

export interface InspectedBookFile {
  format: BookFormat;
  title: string;
  author: string;
  synopsis: string;
  cover?: string;
}

export function getBookFormat(file: File): BookFormat | null {
  const name = file.name.toLocaleLowerCase();
  if (name.endsWith('.epub') || file.type === 'application/epub+zip') return 'EPUB';
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'PDF';
  return null;
}

function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.(epub|pdf)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

async function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('La couverture EPUB ne peut pas être convertie.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('La couverture EPUB ne peut pas être lue.'));
    reader.readAsDataURL(blob);
  });
}

export async function inspectBookFile(file: File): Promise<InspectedBookFile> {
  const format = getBookFormat(file);
  if (!format) throw new Error('Choisissez un fichier au format EPUB ou PDF.');

  if (format === 'EPUB') {
    const { default: createEpub } = await import('epubjs');
    const book = createEpub(await file.arrayBuffer());
    try {
      await book.opened;
      const metadata = await book.loaded.metadata;
      let cover: string | undefined;
      try {
        const coverUrl = await book.coverUrl();
        if (coverUrl) {
          const response = await fetch(coverUrl);
          if (response.ok) cover = await toDataUrl(await response.blob());
        }
      } catch (coverError) {
        console.warn('La couverture intégrée de cet EPUB n’a pas pu être extraite.', coverError);
      }
      return {
        format,
        title: metadata.title || titleFromFileName(file.name),
        author: metadata.creator || '',
        synopsis: metadata.description || '',
        cover,
      };
    } finally {
      book.destroy();
    }
  }

  const { closePdfDocument, openPdfDocument } = await import('./pdfDocument');
  const pdf = await openPdfDocument(file);
  try {
    const { info } = await pdf.getMetadata();
    const pdfInfo = info as Record<string, unknown>;
    return {
      format,
      title: (typeof pdfInfo.Title === 'string' && pdfInfo.Title) || titleFromFileName(file.name),
      author: (typeof pdfInfo.Author === 'string' && pdfInfo.Author) || '',
      synopsis: '',
    };
  } finally {
    await closePdfDocument(pdf);
  }
}

export function formatFileSize(size?: number): string {
  if (size === undefined || !Number.isFinite(size) || size < 0) return 'Non renseigné';
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(2)} Mo`;
}
