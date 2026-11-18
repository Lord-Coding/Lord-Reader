import { IonAlert, IonButton, IonContent, IonIcon, IonPage, IonProgressBar, useIonRouter } from '@ionic/react';
import { arrowBack, serverOutline, trashOutline } from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLibrary } from '../hooks/useLibrary';
import { formatFileSize } from '../lib/bookImport';
import { getStorageEstimate, READER_DATA_UPDATED_EVENT } from '../lib/bookStorage';
import type { Books } from '../lib/models';
import '../styles/storage.css';

function formatBytes(bytes?: number): string {
  return bytes === undefined ? 'Indisponible' : formatFileSize(bytes);
}

const Storage: React.FC = () => {
  const router = useIonRouter();
  const { books, removeImportedBook } = useLibrary();
  const [estimate, setEstimate] = useState<StorageEstimate>();
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [selectedBook, setSelectedBook] = useState<Books | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<string>();
  const [deleteError, setDeleteError] = useState('');

  const refreshEstimate = useCallback(async () => {
    try {
      const currentEstimate = await getStorageEstimate();
      setEstimate(currentEstimate);
      setStorageError('');
    } catch (error) {
      console.error('Impossible de lire l’estimation du stockage navigateur.', error);
      setStorageError('L’estimation du stockage n’a pas pu être lue.');
    } finally {
      setIsLoadingEstimate(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getStorageEstimate()
      .then((currentEstimate) => {
        if (!active) return;
        setEstimate(currentEstimate);
        setStorageError('');
      })
      .catch((error: unknown) => {
        console.error('Impossible de lire l’estimation du stockage navigateur.', error);
        if (active) setStorageError('L’estimation du stockage n’a pas pu être lue.');
      })
      .finally(() => {
        if (active) setIsLoadingEstimate(false);
      });

    const handleDataUpdate = () => void refreshEstimate();
    window.addEventListener(READER_DATA_UPDATED_EVENT, handleDataUpdate);
    return () => {
      active = false;
      window.removeEventListener(READER_DATA_UPDATED_EVENT, handleDataUpdate);
    };
  }, [refreshEstimate]);

  const bookStorageBytes = useMemo(() => books.reduce((total, book) => total + (book.fileSize ?? 0), 0), [books]);
  const browserUsage = estimate?.usage;
  const quota = estimate?.quota;
  const usageRatio = browserUsage !== undefined && quota ? Math.min(1, browserUsage / quota) : 0;
  const remaining = browserUsage !== undefined && quota !== undefined ? Math.max(0, quota - browserUsage) : undefined;

  const deleteBook = async () => {
    if (!selectedBook) return;
    setDeletingBookId(selectedBook.id);
    setDeleteError('');
    try {
      await removeImportedBook(selectedBook.id);
      setSelectedBook(null);
      await refreshEstimate();
    } catch (error) {
      console.error('Impossible de supprimer le fichier depuis la page de stockage.', error);
      setDeleteError('Le fichier n’a pas pu être supprimé. L’espace disponible reste inchangé.');
    } finally {
      setDeletingBookId(undefined);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <div className="screen_shell storage_page">
          <IonButton fill="clear" className="back_action" onClick={() => router.goBack()}>
            <IonIcon icon={arrowBack} slot="start" /> Retour
          </IonButton>
          <header className="page_intro">
            <p className="eyebrow">DIAGNOSTIC DE L’APPAREIL</p>
            <h1>
              Espace de stockage<span>.</span>
            </h1>
            <p>Consultez les fichiers conservés par LordReader et l’estimation du quota navigateur.</p>
          </header>

          <section className="storage_summary" aria-label="Résumé du stockage">
            <div className="storage_summary_heading">
              <span className="settings_icon">
                <IonIcon icon={serverOutline} />
              </span>
              <div>
                <h2>Stockage navigateur</h2>
                <p>{isLoadingEstimate ? 'Lecture de l’estimation…' : 'Données de cette origine sur cet appareil'}</p>
              </div>
            </div>
            {estimate ? (
              <>
                <IonProgressBar value={usageRatio} aria-label="Utilisation estimée du quota" />
                <dl>
                  <div>
                    <dt>Utilisé par le navigateur</dt>
                    <dd>{formatBytes(browserUsage)}</dd>
                  </div>
                  <div>
                    <dt>Quota estimé</dt>
                    <dd>{formatBytes(quota)}</dd>
                  </div>
                  <div>
                    <dt>Disponible selon l’estimation</dt>
                    <dd>{formatBytes(remaining)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="storage_unavailable">
                {isLoadingEstimate
                  ? 'Interrogation du navigateur en cours.'
                  : 'Ce navigateur ne fournit pas d’estimation de quota exploitable.'}
              </p>
            )}
            {storageError && (
              <p className="storage_error" role="alert">
                {storageError}
              </p>
            )}
            <p className="storage_disclaimer">
              L’estimation navigateur couvre les données de l’origine LordReader. Le total des fichiers ci-dessous est
              calculé à partir de leurs tailles enregistrées lors de l’import.
            </p>
          </section>

          <section className="storage_files">
            <div className="storage_files_heading">
              <div>
                <p className="eyebrow">FICHIERS LORDREADER</p>
                <h2>{formatBytes(bookStorageBytes)} utilisés</h2>
              </div>
              <span>
                {books.length} fichier{books.length > 1 ? 's' : ''}
              </span>
            </div>

            {deleteError && (
              <p className="storage_error" role="alert">
                {deleteError}
              </p>
            )}

            {books.length ? (
              <div className="storage_file_list">
                {books.map((book) => (
                  <article className="storage_file" key={book.id}>
                    <div className="storage_file_info">
                      <strong>{book.title}</strong>
                      <span>
                        {book.sourceFileName || 'Fichier local'} · {formatBytes(book.fileSize)}
                      </span>
                    </div>
                    <IonButton
                      fill="clear"
                      color="danger"
                      aria-label={`Supprimer ${book.title} et libérer son stockage`}
                      disabled={deletingBookId === book.id}
                      onClick={() => setSelectedBook(book)}
                    >
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty_state storage_empty">
                <h2>Aucun fichier importé</h2>
                <p>Les fichiers ajoutés apparaîtront ici avec l’espace qu’ils occupent.</p>
                <IonButton onClick={() => router.push('/tabs/import', 'forward')}>Importer un livre</IonButton>
              </div>
            )}
          </section>
        </div>
        <IonAlert
          isOpen={selectedBook !== null}
          header="Supprimer ce livre ?"
          message={
            selectedBook
              ? `${selectedBook.title} (${formatBytes(selectedBook.fileSize)}), sa progression et ses sessions de lecture seront supprimées de cet appareil.`
              : ''
          }
          buttons={[
            { text: 'Annuler', role: 'cancel', handler: () => setSelectedBook(null) },
            { text: 'Supprimer', role: 'destructive', handler: () => void deleteBook() },
          ]}
          onDidDismiss={() => setSelectedBook(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Storage;
