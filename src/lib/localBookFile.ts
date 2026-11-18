import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';

import { getBookFormat } from './bookImport';

export async function pickLocalBookFile(): Promise<File | undefined> {
  let result: Awaited<ReturnType<typeof FilePicker.pickFiles>>;
  try {
    result = await FilePicker.pickFiles({
      types: ['application/epub+zip', 'application/pdf', 'application/octet-stream'],
      limit: 1,
    });
  } catch (error) {
    if (
      (error instanceof Error && /cancel/i.test(error.message)) ||
      (typeof error === 'string' && /cancel/i.test(error))
    ) {
      return undefined;
    }
    throw error;
  }
  const pickedFile = result.files[0];
  if (!pickedFile) return undefined;

  let blob = pickedFile.blob;
  if (!blob && pickedFile.path) {
    const url = Capacitor.convertFileSrc(pickedFile.path);
    try {
      const response = await fetch(url);
      if (response.ok) blob = await response.blob();
    } catch (error) {
      console.warn('Lecture directe du fichier sélectionné impossible, essai avec Filesystem.', error);
    }
    if (!blob) {
      const localFile = await Filesystem.readFile({ path: pickedFile.path });
      if (localFile.data instanceof Blob) {
        blob = localFile.data;
      } else {
        const binary = atob(localFile.data);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        blob = new Blob([bytes], { type: pickedFile.mimeType });
      }
    }
  }

  if (!blob) {
    throw new Error('Le fichier sélectionné ne peut pas être lu sur cet appareil.');
  }

  const file = new File([blob], pickedFile.name, {
    type: pickedFile.mimeType || blob.type,
    lastModified: pickedFile.modifiedAt,
  });
  if (!getBookFormat(file)) {
    throw new Error('Choisissez un fichier au format EPUB ou PDF.');
  }

  return file;
}
