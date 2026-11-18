import { IonButton, IonContent, IonIcon, IonPage, IonSearchbar, useIonRouter } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { useMemo, useState } from 'react';

import BookCard from '../components/BookCard';
import { useLibrary } from '../hooks/useLibrary';
import '../styles/library.css';

const Favorites: React.FC = () => {
  const router = useIonRouter();
  const { favorites, toggleFavorite } = useLibrary();
  const [searchText, setSearchText] = useState('');

  const visibleFavorites = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    return favorites.filter(
      (book) =>
        !query || book.title.toLocaleLowerCase().includes(query) || book.author.toLocaleLowerCase().includes(query),
    );
  }, [favorites, searchText]);

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <div className="screen_shell favorites_page">
          <header className="page_intro">
            <p className="eyebrow">
              <IonIcon icon={heart} /> VOTRE PETIT MUSÉE PERSONNEL
            </p>
            <h1>
              Les favoris<span>.</span>
            </h1>
            <p>Les histoires que l’on garde tout près de soi.</p>
          </header>

          <section className="favorites_note">
            <span className="favorites_note_icon">
              <IonIcon icon={heart} />
            </span>
            <p>
              <strong>{favorites.length}</strong> {favorites.length > 1 ? 'livres aimés' : 'livre aimé'} — votre
              collection de belles histoires.
            </p>
          </section>

          {favorites.length > 0 && (
            <IonSearchbar
              className="reader_searchbar"
              mode="ios"
              placeholder="Rechercher dans vos favoris"
              aria-label="Rechercher dans les favoris"
              value={searchText}
              onIonInput={(event) => setSearchText(event.detail.value ?? '')}
            />
          )}

          {visibleFavorites.length > 0 ? (
            <div className="book_grid favorites_grid">
              {visibleFavorites.map((book) => (
                <BookCard key={book.id} {...book} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <section className="empty_state">
              <h2>Aucun favori ne correspond</h2>
              <p>Essayez avec un autre titre ou un autre auteur.</p>
            </section>
          ) : (
            <section className="empty_state favorites_empty">
              <span className="empty_state_mark">
                <IonIcon icon={heartOutline} />
              </span>
              <h2>Un coup de cœur ? Gardez-le ici.</h2>
              <p>Appuyez sur le cœur d’un livre pour le retrouver facilement.</p>
              <IonButton shape="round" onClick={() => router.push('/tabs/library')}>
                Explorer ma bibliothèque
              </IonButton>
            </section>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Favorites;
