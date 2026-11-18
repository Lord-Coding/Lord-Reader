import { IonButton, IonContent, IonIcon, IonPage, IonSearchbar, useIonRouter } from '@ionic/react';
import { add, optionsOutline } from 'ionicons/icons';
import { useMemo, useState } from 'react';
import '../styles/library.css';

import BookCard from '../components/BookCard';
import CategorySegment from '../components/CategorySegment';
import { useLibrary } from '../hooks/useLibrary';
import type { CategorySegment as CategorySegmentType } from '../lib/models';

const Library: React.FC = () => {
  const { books, toggleFavorite } = useLibrary();
  const router = useIonRouter();
  const [searchText, setSearchText] = useState('');
  const [activeSegment, setActiveSegment] = useState<CategorySegmentType>('tous');
  const [sortAscending, setSortAscending] = useState(true);

  const visibleBooks = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    return books
      .filter((book) => {
        const matchesSearch =
          !query || book.title.toLocaleLowerCase().includes(query) || book.author.toLocaleLowerCase().includes(query);
        const matchesCategory =
          activeSegment === 'tous' || (activeSegment === 'Favoris' ? book.isFavorite : book.type === activeSegment);
        return matchesSearch && matchesCategory;
      })
      .sort(
        (first, second) =>
          first.title.localeCompare(second.title, 'fr', { sensitivity: 'base' }) * (sortAscending ? 1 : -1),
      );
  }, [books, searchText, activeSegment, sortAscending]);

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <div className="screen_shell library_page">
          <header className="page_intro">
            <p className="eyebrow">VOTRE COLLECTION</p>
            <h1>
              Bibliothèque<span>.</span>
            </h1>
            <p>Chaque livre est une porte. Laquelle ouvre-t-on aujourd’hui ?</p>
            <IonButton
              className="library_import_button"
              shape="round"
              onClick={() => router.push('/tabs/import', 'forward')}
            >
              <IonIcon icon={add} slot="start" />
              Importer un livre
            </IonButton>
          </header>

          <section className="library_controls" aria-label="Rechercher et filtrer les livres">
            <div className="search_row">
              <IonSearchbar
                className="reader_searchbar"
                mode="ios"
                placeholder="Un titre, un auteur…"
                aria-label="Rechercher un livre"
                value={searchText}
                onIonInput={(event) => setSearchText(event.detail.value ?? '')}
              />
              <IonButton
                className={`sort_button${sortAscending ? '' : ' sort_button--descending'}`}
                fill="clear"
                aria-label={sortAscending ? 'Trier de Z à A' : 'Trier de A à Z'}
                title={sortAscending ? 'Trier de Z à A' : 'Trier de A à Z'}
                onClick={() => setSortAscending((current) => !current)}
              >
                <IonIcon icon={optionsOutline} slot="icon-only" />
              </IonButton>
            </div>
            <CategorySegment
              activeSegment={activeSegment}
              setActiveSegment={setActiveSegment}
              searchValue={searchText}
              bookLibrary={books}
            />
          </section>

          <div className="results_heading">
            <h2>{activeSegment === 'Favoris' ? 'Vos coups de cœur' : 'Tous vos livres'}</h2>
            <span>
              {visibleBooks.length} {visibleBooks.length > 1 ? 'livres' : 'livre'}
            </span>
          </div>

          {visibleBooks.length > 0 ? (
            <div className="book_grid">
              {visibleBooks.map((book) => (
                <BookCard key={book.id} {...book} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          ) : (
            <section className="empty_state">
              <span className="empty_state_mark">
                <IonIcon icon={optionsOutline} />
              </span>
              <h2>Aucun résultat cette fois</h2>
              <p>Essayez un autre titre ou choisissez une catégorie différente.</p>
              <IonButton
                fill="clear"
                onClick={() => {
                  setSearchText('');
                  setActiveSegment('tous');
                }}
              >
                Effacer les filtres
              </IonButton>
            </section>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Library;
