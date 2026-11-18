import { IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/react';
import type { Book as EpubBook, Location as EpubLocation, Rendition } from 'epubjs';
import {
  add,
  arrowBack,
  bookOutline,
  chevronBack,
  chevronForward,
  documentTextOutline,
  optionsOutline,
  remove,
  searchOutline,
} from 'ionicons/icons';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useLibrary } from '../hooks/useLibrary';
import { formatFileSize } from '../lib/bookImport';
import { getBookFile, getReadingProgress, saveReadingProgress, type ReadingProgress } from '../lib/bookStorage';
import { closePdfDocument, openPdfDocument } from '../lib/pdfDocument';
import '../styles/book_reader.css';

type PageTheme = 'paper' | 'sepia' | 'night';
type ReaderFont = 'serif' | 'sans-serif' | 'monospace';
type ReaderMargin = 'narrow' | 'normal' | 'wide';

interface ReaderPreferences {
  font: ReaderFont;
  lineHeight: number;
  margin: ReaderMargin;
  theme: PageTheme;
}

interface SearchResult {
  page?: number;
  cfi?: string;
  excerpt: string;
}

interface EpubSearchMatch {
  cfi: string;
  excerpt: string;
}

function isEpubSearchMatch(value: unknown): value is EpubSearchMatch {
  return (
    typeof value === 'object' &&
    value !== null &&
    'cfi' in value &&
    typeof value.cfi === 'string' &&
    'excerpt' in value &&
    typeof value.excerpt === 'string'
  );
}

const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  font: 'serif',
  lineHeight: 1.75,
  margin: 'normal',
  theme: 'paper',
};

const READER_PREFERENCES_KEY = 'lord-reader-preferences';
const PAGE_THEMES: Record<PageTheme, { color: string; background: string }> = {
  paper: { color: '#26332c', background: '#fffefa' },
  sepia: { color: '#453a2c', background: '#f3ead7' },
  night: { color: '#e8e4f0', background: '#211d2b' },
};

function getReaderFont(font: ReaderFont): string {
  if (font === 'sans-serif') return 'Arial, sans-serif';
  if (font === 'monospace') return 'ui-monospace, monospace';
  return 'Georgia, "Times New Roman", serif';
}

function getReaderMargins(margin: ReaderMargin): string {
  if (margin === 'narrow') return '0 4%';
  if (margin === 'wide') return '0 14%';
  return '0 8%';
}

function readReaderPreferences(bookId: string): ReaderPreferences {
  try {
    const stored = localStorage.getItem(`${READER_PREFERENCES_KEY}:${bookId}`);
    if (!stored) return DEFAULT_READER_PREFERENCES;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_READER_PREFERENCES;
    const values = parsed as Partial<ReaderPreferences>;
    return {
      font: values.font === 'sans-serif' || values.font === 'monospace' ? values.font : 'serif',
      lineHeight: values.lineHeight === 1.45 || values.lineHeight === 2 ? values.lineHeight : 1.75,
      margin: values.margin === 'narrow' || values.margin === 'wide' ? values.margin : 'normal',
      theme: values.theme === 'sepia' || values.theme === 'night' ? values.theme : 'paper',
    };
  } catch (error) {
    console.error('Impossible de charger les préférences de lecture.', error);
    return DEFAULT_READER_PREFERENCES;
  }
}

const BookReader: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useIonRouter();
  const { books } = useLibrary();
  const book = books.find((item) => item.id === bookId);
  const activeBookId = book?.id;
  const bookFormat = book?.type;
  const [file, setFile] = useState<Blob | null>(null);
  const [initialProgress, setInitialProgress] = useState<ReadingProgress>();
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [isFileMissing, setIsFileMissing] = useState(false);
  const [error, setError] = useState('');
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [isEpubReady, setIsEpubReady] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [zoom, setZoom] = useState(1.15);
  const [fontSize, setFontSize] = useState(100);
  const [percentage, setPercentage] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [preferences, setPreferences] = useState(() =>
    activeBookId ? readReaderPreferences(activeBookId) : DEFAULT_READER_PREFERENCES,
  );
  const [showReaderOptions, setShowReaderOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const epubContainer = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preferencesRef = useRef(preferences);
  const epubBookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const updateReaderPreferences = (update: Partial<ReaderPreferences>) => {
    const nextPreferences = { ...preferences, ...update };
    setPreferences(nextPreferences);
    preferencesRef.current = nextPreferences;
    if (!activeBookId) return;
    try {
      localStorage.setItem(`${READER_PREFERENCES_KEY}:${activeBookId}`, JSON.stringify(nextPreferences));
    } catch (preferencesError) {
      console.error('Impossible d’enregistrer les préférences de lecture.', preferencesError);
      setError('Les préférences de lecture n’ont pas pu être enregistrées.');
    }
  };

  useEffect(() => {
    if (!activeBookId) return;
    let active = true;

    Promise.all([getBookFile(activeBookId), getReadingProgress(activeBookId)])
      .then(([storedFile, progress]) => {
        if (!active) return;
        if (!storedFile) {
          setIsFileMissing(true);
          return;
        }
        setFile(storedFile);
        setInitialProgress(progress);
        setPercentage(progress?.percentage ?? 0);
        if (progress?.format === 'PDF') setPdfPage(progress.page);
      })
      .catch((loadError: unknown) => {
        console.error('Impossible de charger le fichier ou la progression du livre.', loadError);
        if (active) setError('Le fichier ou la progression de lecture n’a pas pu être chargé.');
      })
      .finally(() => {
        if (active) setIsLoadingFile(false);
      });

    return () => {
      active = false;
    };
  }, [activeBookId]);

  useEffect(() => {
    if (!file || !activeBookId || !bookFormat) return;
    let active = true;
    let epubBook: EpubBook | null = null;
    let rendition: Rendition | null = null;
    let pdfDocument: PDFDocumentProxy | null = null;

    const initializeReader = async () => {
      if (bookFormat === 'PDF') {
        const document = await openPdfDocument(file);
        pdfDocument = document;
        if (!active) {
          await closePdfDocument(document);
          return;
        }
        setPdfPageCount(document.numPages);
        setPdfPage((currentPage) => Math.min(Math.max(currentPage, 1), document.numPages));
        setPdfDocument(document);
        return;
      }

      const { default: createEpub } = await import('epubjs');
      epubBook = createEpub(await file.arrayBuffer());
      await epubBook.opened;
      if (!active || !epubContainer.current) return;
      epubBookRef.current = epubBook;

      rendition = epubBook.renderTo(epubContainer.current, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
        spread: 'none',
      });
      rendition.themes.default({
        body: {
          color: PAGE_THEMES.paper.color,
          'background-color': PAGE_THEMES.paper.background,
          'font-family': getReaderFont(DEFAULT_READER_PREFERENCES.font),
          'line-height': String(DEFAULT_READER_PREFERENCES.lineHeight),
          margin: getReaderMargins(DEFAULT_READER_PREFERENCES.margin),
        },
      });
      rendition.on('relocated', (location: EpubLocation) => {
        const nextPercentage = location.start.percentage;
        setPercentage(nextPercentage);
        void saveReadingProgress({
          bookId: activeBookId,
          format: 'EPUB',
          percentage: nextPercentage,
          cfi: location.start.cfi,
        }).catch((progressError: unknown) => {
          console.error('Impossible d’enregistrer la progression EPUB.', progressError);
          setError('La progression de lecture n’a pas pu être enregistrée.');
        });
      });
      await rendition.display(initialProgress?.format === 'EPUB' ? initialProgress.cfi : undefined);
      if (!active) return;
      renditionRef.current = rendition;
      setIsEpubReady(true);
      const currentPreferences = preferencesRef.current;
      const currentTheme = PAGE_THEMES[currentPreferences.theme];
      rendition.themes.default({
        body: {
          color: currentTheme.color,
          'background-color': currentTheme.background,
          'font-family': getReaderFont(currentPreferences.font),
          'line-height': String(currentPreferences.lineHeight),
          margin: getReaderMargins(currentPreferences.margin),
        },
      });
      rendition.themes.fontSize('100%');
      setPercentage(initialProgress?.percentage ?? 0);
    };

    initializeReader().catch((readerError: unknown) => {
      console.error(`Impossible d’ouvrir le fichier ${bookFormat}.`, readerError);
      if (active) setError(`Ce fichier ${bookFormat} est illisible ou endommagé.`);
    });

    return () => {
      active = false;
      renditionRef.current = null;
      epubBookRef.current = null;
      rendition?.destroy();
      epubBook?.destroy();
      if (pdfDocument) {
        void closePdfDocument(pdfDocument).catch((closeError: unknown) => {
          console.error('Impossible de fermer le document PDF.', closeError);
        });
      }
    };
  }, [activeBookId, bookFormat, file, initialProgress]);

  useEffect(() => {
    preferencesRef.current = preferences;
    const rendition = renditionRef.current;
    if (!rendition) return;
    const pageTheme = PAGE_THEMES[preferences.theme];
    rendition.themes.default({
      body: {
        color: pageTheme.color,
        'background-color': pageTheme.background,
        'font-family': getReaderFont(preferences.font),
        'line-height': String(preferences.lineHeight),
        margin: getReaderMargins(preferences.margin),
      },
    });
    rendition.themes.fontSize(`${fontSize}%`);
  }, [fontSize, preferences]);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;
    let active = true;
    let renderTask: RenderTask | undefined;

    const renderPage = async () => {
      setIsRendering(true);
      const page = await pdfDocument.getPage(pdfPage);
      if (!active || !canvasRef.current) return;

      const viewport = page.getViewport({ scale: zoom });
      const pixelRatio = window.devicePixelRatio || 1;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Le navigateur ne permet pas de dessiner cette page PDF.');

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      renderTask = page.render({ canvas, canvasContext: context, viewport });
      await renderTask.promise;
      if (active) {
        setPercentage(pdfPage / pdfDocument.numPages);
        setIsRendering(false);
      }
    };

    renderPage().catch((renderError: unknown) => {
      if (active) {
        setIsRendering(false);
        setError('Cette page PDF n’a pas pu être affichée.');
      }
      if (!(renderError instanceof Error && renderError.name === 'RenderingCancelledException')) {
        console.error('Erreur lors du rendu d’une page PDF.', renderError);
      }
    });

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [pdfDocument, pdfPage, zoom]);

  const moveEpub = useCallback(async (direction: 'previous' | 'next') => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    try {
      if (direction === 'previous') await rendition.prev();
      else await rendition.next();
    } catch (navigationError) {
      console.error('Impossible de tourner la page EPUB.', navigationError);
      setError('La page EPUB suivante n’a pas pu être affichée.');
    }
  }, []);

  const navigatePdfToPage = async (page: number) => {
    if (!activeBookId || !pdfDocument) return;
    const targetPage = Math.min(pdfDocument.numPages, Math.max(1, page));
    if (targetPage === pdfPage) return;

    try {
      await saveReadingProgress({
        bookId: activeBookId,
        format: 'PDF',
        page: targetPage,
        percentage: targetPage / pdfDocument.numPages,
      });
      setPdfPage(targetPage);
    } catch (progressError) {
      console.error('Impossible d’enregistrer la progression PDF.', progressError);
      setError('La progression de lecture n’a pas pu être enregistrée.');
    }
  };

  const movePdf = (direction: 'previous' | 'next') => {
    const nextPage = pdfPage + (direction === 'next' ? 1 : -1);
    void navigatePdfToPage(nextPage);
  };

  const showSearchResult = async (result: SearchResult) => {
    try {
      if (result.page) {
        await navigatePdfToPage(result.page);
      } else if (result.cfi && renditionRef.current) {
        await renditionRef.current.display(result.cfi);
      }
    } catch (navigationError) {
      console.error('Impossible d’afficher le résultat de recherche.', navigationError);
      setSearchError('Ce résultat n’a pas pu être ouvert.');
    }
  };

  const searchBook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchError('Saisissez un mot ou une expression à rechercher.');
      setSearchResults([]);
      setSearchIndex(-1);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);
    setSearchIndex(-1);
    try {
      const results: SearchResult[] = [];
      if (bookFormat === 'PDF' && pdfDocument) {
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          const text = (await page.getTextContent()).items
            .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
            .join(' ');
          const matchIndex = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
          if (matchIndex !== -1) {
            results.push({
              page: pageNumber,
              excerpt: text.slice(Math.max(0, matchIndex - 45), matchIndex + query.length + 75).trim(),
            });
          }
        }
      } else {
        const epubBook = epubBookRef.current;
        if (!epubBook) throw new Error('Le livre EPUB n’est pas encore prêt.');
        const spine = await epubBook.loaded.spine;
        for (let index = 0; index < spine.length; index += 1) {
          const section = epubBook.spine.get(index);
          await section.load(epubBook.load.bind(epubBook));
          try {
            const matches: unknown[] = section.find(query);
            for (const match of matches) {
              if (!isEpubSearchMatch(match)) continue;
              results.push({ cfi: match.cfi, excerpt: match.excerpt });
            }
          } finally {
            section.unload();
          }
        }
      }

      setSearchResults(results);
      if (results.length) {
        setSearchIndex(0);
        await showSearchResult(results[0]);
      } else {
        setSearchError(`Aucun résultat pour « ${query} ».`);
      }
    } catch (searchFailure) {
      console.error('La recherche dans le livre a échoué.', searchFailure);
      setSearchError('La recherche n’a pas pu être effectuée dans ce fichier.');
    } finally {
      setIsSearching(false);
    }
  };

  const moveSearchResult = (direction: -1 | 1) => {
    if (!searchResults.length) return;
    const nextIndex = (searchIndex + direction + searchResults.length) % searchResults.length;
    setSearchIndex(nextIndex);
    void showSearchResult(searchResults[nextIndex]);
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
    <IonPage className="reader_page">
      <IonContent fullscreen className="reader_content">
        <header className="reader_toolbar">
          <IonButton fill="clear" aria-label="Retour aux détails du livre" onClick={() => router.goBack()}>
            <IonIcon icon={arrowBack} slot="icon-only" />
          </IonButton>
          <div className="reader_book_heading">
            <strong>{book.title}</strong>
            <span>{book.author}</span>
          </div>
          <span className="reader_format_badge">{book.type}</span>
        </header>

        <div className="reader_tools">
          <form className="reader_search_form" onSubmit={(event) => void searchBook(event)}>
            <label className="reader_search_field">
              <IonIcon icon={searchOutline} />
              <input
                type="search"
                aria-label="Rechercher dans le livre"
                placeholder="Rechercher dans le livre"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <IonButton
              type="submit"
              fill="clear"
              disabled={isSearching || (book.type === 'PDF' ? !pdfDocument : !isEpubReady)}
            >
              {isSearching ? 'Recherche…' : 'Rechercher'}
            </IonButton>
          </form>
          <IonButton
            className="reader_options_toggle"
            fill="clear"
            aria-expanded={showReaderOptions}
            onClick={() => setShowReaderOptions((visible) => !visible)}
          >
            <IonIcon icon={optionsOutline} slot="start" />
            Affichage
          </IonButton>
        </div>
        {showReaderOptions && (
          <section className="reader_settings_panel" aria-label="Préférences de lecture">
            <label>
              Police
              <select
                value={preferences.font}
                onChange={(event) => updateReaderPreferences({ font: event.target.value as ReaderFont })}
              >
                <option value="serif">Avec empattements</option>
                <option value="sans-serif">Sans empattements</option>
                <option value="monospace">Monospace</option>
              </select>
            </label>
            <label>
              Interligne
              <select
                value={preferences.lineHeight}
                onChange={(event) => updateReaderPreferences({ lineHeight: Number(event.target.value) })}
              >
                <option value="1.45">Serré</option>
                <option value="1.75">Confortable</option>
                <option value="2">Aéré</option>
              </select>
            </label>
            <label>
              Marges
              <select
                value={preferences.margin}
                onChange={(event) => updateReaderPreferences({ margin: event.target.value as ReaderMargin })}
              >
                <option value="narrow">Étroites</option>
                <option value="normal">Normales</option>
                <option value="wide">Larges</option>
              </select>
            </label>
            <label>
              Thème de page
              <select
                value={preferences.theme}
                onChange={(event) => updateReaderPreferences({ theme: event.target.value as PageTheme })}
              >
                <option value="paper">Papier</option>
                <option value="sepia">Sépia</option>
                <option value="night">Nuit</option>
              </select>
            </label>
          </section>
        )}
        {(searchError || searchResults.length > 0) && (
          <div className="reader_search_status" aria-live="polite">
            {searchError ? (
              <p>{searchError}</p>
            ) : (
              <>
                <span>{searchResults[searchIndex]?.excerpt}</span>
                <div>
                  <IonButton fill="clear" aria-label="Résultat précédent" onClick={() => moveSearchResult(-1)}>
                    <IonIcon icon={chevronBack} slot="icon-only" />
                  </IonButton>
                  <small>
                    {searchIndex + 1} / {searchResults.length}
                  </small>
                  <IonButton fill="clear" aria-label="Résultat suivant" onClick={() => moveSearchResult(1)}>
                    <IonIcon icon={chevronForward} slot="icon-only" />
                  </IonButton>
                </div>
              </>
            )}
          </div>
        )}

        {isLoadingFile ? (
          <section className="reader_message" aria-live="polite">
            <p>Ouverture du livre…</p>
          </section>
        ) : isFileMissing ? (
          <section className="reader_message">
            <span className="reader_message_icon">
              <IonIcon icon={book.type === 'PDF' ? documentTextOutline : bookOutline} />
            </span>
            <h1>Ajoutez le fichier de lecture</h1>
            <p>
              Le livre est dans votre collection, mais son fichier {book.type} n’a pas encore été importé sur cet
              appareil.
            </p>
            <IonButton shape="round" onClick={() => router.push(`/tabs/book/${book.id}`)}>
              Ouvrir les détails du livre
            </IonButton>
          </section>
        ) : (
          <>
            <main
              className={`reader_viewer reader_viewer--${book.type.toLowerCase()}`}
              data-page-theme={preferences.theme}
              data-reader-margin={preferences.margin}
            >
              {book.type === 'PDF' ? (
                pdfDocument ? (
                  <div className="pdf_page_frame" aria-busy={isRendering}>
                    <canvas ref={canvasRef} aria-label={`Page ${pdfPage} du livre ${book.title}`} />
                  </div>
                ) : (
                  <section className="reader_message">
                    <p>Chargement du document PDF…</p>
                  </section>
                )
              ) : (
                <div ref={epubContainer} className="epub_viewer" aria-label={`Lecteur EPUB : ${book.title}`} />
              )}
            </main>

            {error && (
              <p className="reader_error" role="alert">
                {error}
              </p>
            )}

            <footer className="reader_controls">
              <div className="reader_progress">
                <div className="reader_progress_track">
                  <span style={{ width: `${Math.min(100, Math.max(0, percentage * 100))}%` }} />
                </div>
                <small>{Math.round(percentage * 100)} %</small>
              </div>
              <div className="reader_control_row">
                <IonButton
                  fill="clear"
                  aria-label="Page précédente"
                  disabled={book.type === 'PDF' ? pdfPage <= 1 : false}
                  onClick={() => {
                    if (book.type === 'PDF') void movePdf('previous');
                    else void moveEpub('previous');
                  }}
                >
                  <IonIcon icon={chevronBack} slot="icon-only" />
                </IonButton>
                <span className="reader_page_count">
                  {book.type === 'PDF' ? `Page ${pdfPage} sur ${pdfPageCount || '…'}` : 'Lecture EPUB'}
                </span>
                <IonButton
                  fill="clear"
                  aria-label="Page suivante"
                  disabled={book.type === 'PDF' ? pdfPage >= pdfPageCount : false}
                  onClick={() => {
                    if (book.type === 'PDF') void movePdf('next');
                    else void moveEpub('next');
                  }}
                >
                  <IonIcon icon={chevronForward} slot="icon-only" />
                </IonButton>
                <span className="reader_controls_divider" />
                <IonButton
                  fill="clear"
                  aria-label="Réduire le texte ou le zoom"
                  onClick={() => {
                    if (book.type === 'PDF') setZoom((value) => Math.max(0.7, value - 0.1));
                    else setFontSize((value) => Math.max(75, value - 10));
                  }}
                >
                  <IonIcon icon={remove} slot="icon-only" />
                </IonButton>
                <IonButton
                  fill="clear"
                  aria-label="Agrandir le texte ou le zoom"
                  onClick={() => {
                    if (book.type === 'PDF') setZoom((value) => Math.min(2.2, value + 0.1));
                    else setFontSize((value) => Math.min(160, value + 10));
                  }}
                >
                  <IonIcon icon={add} slot="icon-only" />
                </IonButton>
              </div>
              {book.sourceFileName && (
                <p className="reader_file_info">
                  {book.sourceFileName} · {formatFileSize(book.fileSize)}
                </p>
              )}
            </footer>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default BookReader;
