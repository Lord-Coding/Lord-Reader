import { IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/react';
import { bookOutline, heart, sparkles } from 'ionicons/icons';

import '../styles/home.css';

import BookCard from '../components/BookCard';
import BookCardHeader from '../components/BookCardHeader';
import { ThemeButton } from '../components/ThemeButton';
import { useLibrary } from '../hooks/useLibrary';

const Home: React.FC = () => {
  const router = useIonRouter();
  const { books, favorites, toggleFavorite } = useLibrary();
  const currentBook = books.find((book) => book.id === '1') ?? books[0];
  const latestBooks = [...books].reverse().slice(0, 6);

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <div className="screen_shell home_page">
          <header className="app_masthead">
            <div className="brand_lockup">
              <span className="brand_mark">
                <IonIcon icon={bookOutline} />
              </span>
              <span className="brand_name">
                LordReader<span> · votre bibliothèque</span>
              </span>
            </div>
            <ThemeButton className="masthead_theme_button" />
          </header>

          <section className="home_intro">
            <p className="eyebrow">
              <IonIcon icon={sparkles} /> VOTRE RENDEZ-VOUS LITTÉRAIRE
            </p>
            <h1>
              Bonjour, Lord.
              <br />
              <span>On reprend le fil ?</span>
            </h1>
            <p className="intro_copy">Un instant de calme, une belle histoire et vous voilà ailleurs.</p>
          </section>

          {currentBook ? (
            <BookCardHeader
              book={currentBook}
              progress={0.64}
              onContinue={() =>
                router.push(
                  currentBook.sourceFileName ? `/reader/${currentBook.id}` : `/tabs/book/${currentBook.id}`,
                  'forward',
                )
              }
            />
          ) : (
            <section className="home_empty_reading">
              <h2>Votre prochaine histoire vous attend.</h2>
              <IonButton onClick={() => router.push('/tabs/library')}>Découvrir la bibliothèque</IonButton>
            </section>
          )}

          <section className="home_stats" aria-label="Résumé de votre bibliothèque">
            <div className="home_stat">
              <span className="home_stat_icon">
                <IonIcon icon={bookOutline} />
              </span>
              <span>
                <strong>{books.length}</strong>
                <small>livres à lire</small>
              </span>
            </div>
            <div className="home_stat">
              <span className="home_stat_icon home_stat_icon--heart">
                <IonIcon icon={heart} />
              </span>
              <span>
                <strong>{favorites.length}</strong>
                <small>coups de cœur</small>
              </span>
            </div>
          </section>

          <section className="home_shelf">
            <div className="shelf_heading">
              <div>
                <p className="eyebrow">À DÉCOUVRIR</p>
                <h2>Votre prochaine lecture</h2>
              </div>
              <IonButton fill="clear" className="text_action" onClick={() => router.push('/tabs/library')}>
                Toute la bibliothèque
              </IonButton>
            </div>
            {latestBooks.length > 0 ? (
              <div className="book_caroussel">
                {latestBooks.map((book) => (
                  <BookCard key={book.id} {...book} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            ) : (
              <p className="empty_note">Vos livres apparaîtront ici.</p>
            )}
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
