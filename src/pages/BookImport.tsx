import { Capacitor } from '@capacitor/core';
import { IonAlert, IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/react';
import { arrowBack, bookOutline, cloudUpload } from 'ionicons/icons';
import { useRef, useState } from 'react';

import { useLibrary } from '../hooks/useLibrary';
import { formatFileSize, inspectBookFile, type InspectedBookFile } from '../lib/bookImport';
import { getStorageEstimate } from '../lib/bookStorage';
import { pickLocalBookFile } from '../lib/localBookFile';
import type { Books } from '../lib/models';
import '../styles/book_import.css';

function createBookId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `book-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const BookImport: React.FC = () => {
  const router = useIonRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { importBook } = useLibrary();
  const [file, setFile] = useState<File | null>(null);
  const [inspected, setInspected] = useState<InspectedBookFile | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [error, setError] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [largeFileMessage, setLargeFileMessage] = useState('');
  const [showLargeFileAlert, setShowLargeFileAlert] = useState(false);

  const chooseFile = async (selectedFile?: File) => {
    setError('');
    setInspected(null);
    setFile(null);
    if (!selectedFile) return;

    setIsInspecting(true);
    try {
      const metadata = await inspectBookFile(selectedFile);
      setInspected(metadata);
      setFile(selectedFile);
      setTitle(metadata.title);
      setAuthor(metadata.author);
      setSynopsis(metadata.synopsis);
    } catch (inspectionError) {
      console.error('Impossible de lire les informations du fichier sélectionné.', inspectionError);
      setError(
        inspectionError instanceof Error
          ? `Ce fichier ne peut pas être ouvert : ${inspectionError.message}`
          : 'Ce fichier ne peut pas être ouvert.',
      );
    } finally {
      setIsInspecting(false);
    }
  };

  const persistBook = async () => {
    if (!file || !inspected) return;
    setIsSaving(true);
    setError('');
    const book: Books = {
      id: createBookId(),
      title: title.trim(),
      author: author.trim() || 'Auteur inconnu',
      type: inspected.format,
      image: inspected.cover ?? '/illustration/book_illustration.png',
      synopsis: synopsis.trim(),
      sourceFileName: file.name,
    };

    try {
      const savedBook = await importBook(book, file);
      router.push(`/reader/${savedBook.id}`, 'forward');
    } catch (saveError) {
      console.error('Impossible d’enregistrer le livre importé.', saveError);
      setError('Le livre n’a pas pu être enregistré sur cet appareil. Vérifiez l’espace disponible et réessayez.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveBook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !inspected) {
      setError('Choisissez d’abord un fichier EPUB ou PDF valide.');
      return;
    }
    if (!title.trim()) {
      setError('Le titre du livre est obligatoire.');
      return;
    }

    const largeFileThreshold = 50 * 1024 * 1024;
    let availableBytes: number | undefined;
    try {
      const estimate = await getStorageEstimate();
      if (estimate?.quota !== undefined && estimate.usage !== undefined) {
        availableBytes = Math.max(0, estimate.quota - estimate.usage);
      }
    } catch (estimateError) {
      console.warn('L’espace de stockage disponible n’a pas pu être estimé.', estimateError);
    }

    if (file.size >= largeFileThreshold || (availableBytes !== undefined && file.size > availableBytes)) {
      const availableMessage =
        availableBytes === undefined
          ? 'L’espace restant sur cet appareil ne peut pas être estimé.'
          : `Espace estimé disponible : ${formatFileSize(availableBytes)}.`;
      setLargeFileMessage(
        `${file.name} occupe ${formatFileSize(file.size)}. ${availableMessage} L’import reste enregistré uniquement sur cet appareil.`,
      );
      setShowLargeFileAlert(true);
      return;
    }

    await persistBook();
  };

  const openFilePicker = async () => {
    if (!Capacitor.isNativePlatform()) {
      inputRef.current?.click();
      return;
    }
    try {
      const selectedFile = await pickLocalBookFile();
      if (selectedFile) await chooseFile(selectedFile);
    } catch (pickerError) {
      console.error('Impossible de sélectionner un fichier sur cet appareil.', pickerError);
      setError(pickerError instanceof Error ? pickerError.message : 'Le fichier n’a pas pu être sélectionné.');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <div className="screen_shell import_page">
          <IonButton fill="clear" className="back_action" onClick={() => router.goBack()}>
            <IonIcon icon={arrowBack} slot="start" /> Retour
          </IonButton>

          <header className="page_intro">
            <p className="eyebrow">
              <IonIcon icon={bookOutline} /> UNE NOUVELLE HISTOIRE
            </p>
            <h1>
              Importer un livre<span>.</span>
            </h1>
            <p>Ajoutez un fichier EPUB ou PDF pour le conserver et le lire sur cet appareil.</p>
          </header>

          <form className="import_form" onSubmit={saveBook}>
            <input
              ref={inputRef}
              className="visually_hidden_input"
              type="file"
              accept=".epub,.pdf,application/epub+zip,application/pdf"
              aria-label="Choisir un fichier EPUB ou PDF"
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
            <button
              className={`file_dropzone${file ? ' file_dropzone--selected' : ''}`}
              type="button"
              onClick={() => void openFilePicker()}
            >
              <span className="file_dropzone_icon">
                <IonIcon icon={cloudUpload} />
              </span>
              <strong>{file ? file.name : 'Choisir un fichier'}</strong>
              <span>
                {isInspecting
                  ? 'Lecture des informations…'
                  : file && inspected
                    ? `${inspected.format} · ${formatFileSize(file.size)}`
                    : 'Formats acceptés : EPUB et PDF'}
              </span>
            </button>

            {file && inspected && (
              <div className="import_metadata">
                <label>
                  Titre
                  <input value={title} onChange={(event) => setTitle(event.target.value)} required />
                </label>
                <label>
                  Auteur
                  <input
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    placeholder="Auteur inconnu"
                  />
                </label>
                <label>
                  Synopsis <span>(facultatif)</span>
                  <textarea
                    value={synopsis}
                    onChange={(event) => setSynopsis(event.target.value)}
                    rows={4}
                    placeholder="Ajoutez quelques lignes pour présenter l’œuvre."
                  />
                </label>
              </div>
            )}

            {error && (
              <p className="import_error" role="alert">
                {error}
              </p>
            )}

            <IonButton
              className="import_submit"
              type="submit"
              shape="round"
              disabled={!file || !inspected || isInspecting || isSaving}
            >
              {isSaving ? 'Enregistrement…' : 'Ajouter à ma bibliothèque'}
            </IonButton>
          </form>
        </div>
        <IonAlert
          isOpen={showLargeFileAlert}
          header="Fichier volumineux"
          message={largeFileMessage}
          buttons={[
            { text: 'Annuler', role: 'cancel', handler: () => setShowLargeFileAlert(false) },
            {
              text: 'Continuer',
              handler: () => {
                setShowLargeFileAlert(false);
                void persistBook();
              },
            },
          ]}
          onDidDismiss={() => setShowLargeFileAlert(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default BookImport;
