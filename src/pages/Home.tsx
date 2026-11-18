import { IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/react';
import { bookOutline, heart, sparkles, timeOutline } from 'ionicons/icons';

import '../styles/home.css';

import BookCard from '../components/BookCard';
import BookCardHeader from '../components/BookCardHeader';
import EmptyBookScreen from '../components/EmptyBookScreen';
import { ThemeButton } from '../components/ThemeButton';
import { useLibrary } from '../hooks/useLibrary';

function formatReadingTime(durationMs: number): string {
  const totalMinutes = Math.floor(durationMs / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

const Home: React.FC = () => {
  const router = useIonRouter();
  const { books, favorites, readingProgress, readingSessions, toggleFavorite } = useLibrary();
  const currentProgress = [...readingProgress]
    .filter((progress) => progress.percentage > 0 && progress.percentage < 0.95)
    .sort((first, second) => (second.updatedAt ?? 0) - (first.updatedAt ?? 0))[0];
  const currentBook = books.find((book) => book.id === currentProgress?.bookId);
  const currentPercentage = currentProgress?.percentage ?? 0;
  const latestBooks = [...books].reverse().slice(0, 6);
  const completedBooks = readingProgress.filter((progress) => progress.percentage >= 0.95).length;
  const totalReadingTime = readingSessions.reduce((total, session) => total + session.durationMs, 0);

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <div className="screen_shell home_page">
          <header className="app_masthead">
            <div className="brand_lockup">
              <span className="brand_mark">
                <img className="app_logo_image" src="/logo/logo.svg" alt="" />
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

          {books.length === 0 ? (
            <EmptyBookScreen onImport={() => router.push('/tabs/import', 'forward')} />
          ) : (
            <>
              {currentBook ? (
                <BookCardHeader
                  book={currentBook}
                  progress={currentPercentage}
                  onContinue={() =>
                    router.push(
                      currentBook.sourceFileName ? `/reader/${currentBook.id}` : `/tabs/book/${currentBook.id}`,
                      'forward',
                    )
                  }
                />
              ) : (
                <section className="home_empty_reading">
                  <h2>Aucune lecture en cours.</h2>
                  <IonButton onClick={() => router.push('/tabs/library')}>Choisir un livre</IonButton>
                </section>
              )}

              <section className="home_stats" aria-label="Résumé de votre bibliothèque et de vos lectures">
                <div className="home_stat">
                  <span className="home_stat_icon">
                    <IonIcon icon={bookOutline} />
                  </span>
                  <span>
                    <strong>{books.length}</strong>
                    <small>livres</small>
                  </span>
                </div>
                <div className="home_stat">
                  <span className="home_stat_icon home_stat_icon--heart">
                    <IonIcon icon={heart} />
                  </span>
                  <span>
                    <strong>{favorites.length}</strong>
                    <small>favoris</small>
                  </span>
                </div>
                <div className="home_stat">
                  <span className="home_stat_icon">
                    <IonIcon icon={timeOutline} />
                  </span>
                  <span>
                    <strong>{formatReadingTime(totalReadingTime)}</strong>
                    <small>temps de lecture</small>
                  </span>
                </div>
                <div className="home_stat">
                  <span className="home_stat_icon">
                    <IonIcon icon={bookOutline} />
                  </span>
                  <span>
                    <strong>{completedBooks}</strong>
                    <small>livres terminés</small>
                  </span>
                </div>
                <div className="home_stat">
                  <span className="home_stat_icon">
                    <IonIcon icon={sparkles} />
                  </span>
                  <span>
                    <strong>{readingSessions.length}</strong>
                    <small>sessions de lecture</small>
                  </span>
                </div>
              </section>

              <section className="home_shelf">
                <div className="shelf_heading">
                  <div>
                    <p className="eyebrow">VOTRE COLLECTION</p>
                    <h2>Vos prochaines lectures</h2>
                  </div>
                  <IonButton fill="clear" className="text_action" onClick={() => router.push('/tabs/library')}>
                    Toute la bibliothèque
                  </IonButton>
                </div>
                <div className="book_caroussel">
                  {latestBooks.map((book) => (
                    <BookCard key={book.id} {...book} onToggleFavorite={toggleFavorite} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
