import { Capacitor } from '@capacitor/core';
import { IonAlert, IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/react';
import { arrowBack, heart, heartOutline, readerOutline } from 'ionicons/icons';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import BookCover from '../components/BookCover';
import { useLibrary } from '../hooks/useLibrary';
import { formatFileSize, getBookFormat, inspectBookFile } from '../lib/bookImport';
import { pickLocalBookFile } from '../lib/localBookFile';
import '../styles/book_details.css';

const BookDetails: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useIonRouter();
  const { books, toggleFavorite, importBook, removeImportedBook } = useLibrary();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const book = books.find((item) => item.id === bookId);

  const attachFile = async (file?: File) => {
    if (!file || !book) return;
    setFileError('');

    const format = getBookFormat(file);
    if (format !== book.type) {
      setFileError(`Sélectionnez un fichier ${book.type} pour cette œuvre.`);
      return;
    }

    setIsImporting(true);
    try {
      const metadata = await inspectBookFile(file);
      await importBook(
        {
          ...book,
          image: metadata.cover ?? book.image,
          synopsis: book.synopsis || metadata.synopsis,
          sourceFileName: file.name,
        },
        file,
      );
    } catch (error) {
      console.error('Impossible d’importer le fichier du livre.', error);
      setFileError('Ce fichier ne peut pas être importé. Vérifiez qu’il est complet et au bon format.');
    } finally {
      setIsImporting(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const openFilePicker = async () => {
    if (!Capacitor.isNativePlatform()) {
      fileInput.current?.click();
      return;
    }
    try {
      const selectedFile = await pickLocalBookFile();
      if (selectedFile) await attachFile(selectedFile);
    } catch (pickerError) {
      console.error('Impossible de sélectionner un fichier sur cet appareil.', pickerError);
      setFileError(pickerError instanceof Error ? pickerError.message : 'Le fichier n’a pas pu être sélectionné.');
    }
  };

  const deleteImportedBook = async () => {
    if (!book) return;
    setIsDeleting(true);
    setFileError('');
    try {
      await removeImportedBook(book.id);
      setShowDeleteAlert(false);
      router.push('/tabs/library', 'back');
    } catch (deleteError) {
      console.error('Impossible de supprimer le fichier et sa progression.', deleteError);
      setFileError('Le fichier n’a pas pu être supprimé. Aucun espace n’a été libéré.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!book) {
    return (
      <IonPage>
        <IonContent fullscreen className="screen_content">
          <div className="screen_shell empty_state">
            <h1>Ce livre est introuvable.</h1>
            <IonButton onClick={() => router.push('/tabs/library')}>Retour à la bibliothèque</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <div className="screen_shell book_details_page">
          <IonButton fill="clear" className="back_action" onClick={() => router.goBack()}>
            <IonIcon icon={arrowBack} slot="start" /> Retour
          </IonButton>
          <section className="book_details_hero">
            <div className="book_details_cover">
              <BookCover book={book} className="book_details_cover_image" />
            </div>
            <div className="book_details_copy">
              <p className="eyebrow">{book.type} · DANS VOTRE BIBLIOTHÈQUE</p>
              <h1>{book.title}</h1>
              <p className="book_details_author">par {book.author}</p>
              <input
                ref={fileInput}
                className="visually_hidden_input"
                type="file"
                accept={book.type === 'EPUB' ? '.epub,application/epub+zip' : '.pdf,application/pdf'}
                aria-label={`Choisir le fichier ${book.type}`}
                onChange={(event) => void attachFile(event.target.files?.[0])}
              />
              <IonButton className="details_favorite_button" shape="round" onClick={() => toggleFavorite(book.id)}>
                <IonIcon icon={book.isFavorite ? heart : heartOutline} slot="start" />
                {book.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </IonButton>
              {book.sourceFileName ? (
                <IonButton
                  className="details_read_button"
                  shape="round"
                  onClick={() => router.push(`/reader/${book.id}`, 'forward')}
                >
                  <IonIcon icon={readerOutline} slot="start" />
                  Reprendre la lecture
                </IonButton>
              ) : (
                <IonButton
                  className="details_read_button"
                  shape="round"
                  disabled={isImporting}
                  onClick={() => void openFilePicker()}
                >
                  <IonIcon icon={readerOutline} slot="start" />
                  {isImporting ? 'Import en cours…' : `Importer le fichier ${book.type}`}
                </IonButton>
              )}
            </div>
          </section>
          {fileError && (
            <p className="details_error" role="alert">
              {fileError}
            </p>
          )}
          <section className="work_details">
            <div className="work_synopsis">
              <p className="eyebrow">À PROPOS DE L’ŒUVRE</p>
              <h2>Synopsis</h2>
              <p>
                {book.synopsis ||
                  'Aucun synopsis n’est renseigné pour cette œuvre. Vous pourrez le compléter lors de l’import de votre fichier.'}
              </p>
            </div>
            <div className="work_file_details">
              <p className="eyebrow">DANS VOTRE BIBLIOTHÈQUE</p>
              <h2>Détails du fichier</h2>
              <dl>
                <div>
                  <dt>Format</dt>
                  <dd>{book.type}</dd>
                </div>
                <div>
                  <dt>Nom du fichier</dt>
                  <dd>{book.sourceFileName || 'Fichier non importé'}</dd>
                </div>
                <div>
                  <dt>Stockage</dt>
                  <dd>{book.sourceFileName ? formatFileSize(book.fileSize) : '—'}</dd>
                </div>
              </dl>
              {book.sourceFileName && (
                <>
                  <IonButton fill="clear" className="replace_file_button" onClick={() => void openFilePicker()}>
                    Remplacer le fichier
                  </IonButton>
                  <IonButton fill="clear" color="danger" disabled={isDeleting} onClick={() => setShowDeleteAlert(true)}>
                    {isDeleting ? 'Suppression…' : 'Supprimer et libérer le stockage'}
                  </IonButton>
                </>
              )}
            </div>
          </section>
        </div>
        <IonAlert
          isOpen={showDeleteAlert}
          header="Supprimer ce fichier ?"
          message={`Le fichier ${book.sourceFileName} (${formatFileSize(book.fileSize)}), sa progression et son accès hors ligne seront supprimés de cet appareil.`}
          buttons={[
            { text: 'Annuler', role: 'cancel', handler: () => setShowDeleteAlert(false) },
            {
              text: 'Supprimer',
              role: 'destructive',
              handler: () => void deleteImportedBook(),
            },
          ]}
          onDidDismiss={() => setShowDeleteAlert(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default BookDetails;
