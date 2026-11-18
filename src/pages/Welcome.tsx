import { IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/react';
import { arrowForward, bookOutline, cloudOfflineOutline, heartOutline, shieldCheckmarkOutline } from 'ionicons/icons';

import '../styles/welcome.css';

const Welcome: React.FC = () => {
  const router = useIonRouter();

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <main className="welcome_page">
          <header className="welcome_header">
            <a className="welcome_brand" href="/welcome" aria-label="LordReader, accueil">
              <span className="welcome_brand_mark">
                <IonIcon icon={bookOutline} />
              </span>
              <strong>LordReader</strong>
            </a>
            <IonButton fill="clear" onClick={() => router.push('/privacy')}>
              Confidentialité
            </IonButton>
          </header>

          <section className="welcome_hero">
            <div className="welcome_copy">
              <p className="eyebrow">VOTRE BIBLIOTHÈQUE, PARTOUT AVEC VOUS</p>
              <h1>
                Un peu de calme.
                <br />
                Beaucoup d’histoires<span>.</span>
              </h1>
              <p>
                Retrouvez vos livres au même endroit et lisez EPUB ou PDF, même hors ligne. Vos fichiers restent sur
                votre appareil.
              </p>
              <div className="welcome_actions">
                <IonButton shape="round" onClick={() => router.push('/tabs/home')}>
                  Ouvrir ma bibliothèque <IonIcon icon={arrowForward} slot="end" />
                </IonButton>
                <IonButton fill="clear" onClick={() => router.push('/tabs/import')}>
                  Importer un livre
                </IonButton>
              </div>
              <div className="welcome_trust">
                <span>
                  <IonIcon icon={cloudOfflineOutline} /> Lecture hors ligne
                </span>
                <span>
                  <IonIcon icon={shieldCheckmarkOutline} /> Fichiers conservés localement
                </span>
              </div>
            </div>
            <div className="welcome_art" aria-hidden="true">
              <div className="welcome_orbit welcome_orbit--one" />
              <div className="welcome_orbit welcome_orbit--two" />
              <img src="/illustration/book_illustration.png" alt="" />
              <span className="welcome_art_note">Une page à la fois.</span>
            </div>
          </section>

          <section className="welcome_features" aria-label="Fonctionnalités principales">
            <article>
              <span className="welcome_feature_icon">
                <IonIcon icon={bookOutline} />
              </span>
              <h2>Vos formats préférés</h2>
              <p>Importez et lisez vos fichiers EPUB et PDF directement dans l’application.</p>
            </article>
            <article>
              <span className="welcome_feature_icon">
                <IonIcon icon={heartOutline} />
              </span>
              <h2>Votre collection</h2>
              <p>Gardez vos favoris et retrouvez les œuvres que vous avez ajoutées.</p>
            </article>
            <article>
              <span className="welcome_feature_icon">
                <IonIcon icon={cloudOfflineOutline} />
              </span>
              <h2>À votre rythme</h2>
              <p>La progression de lecture est mémorisée sur cet appareil.</p>
            </article>
          </section>
          <footer className="welcome_footer">
            <span>LordReader · votre espace de lecture local</span>
            <button type="button" onClick={() => router.push('/privacy')}>
              Lire la politique de confidentialité
            </button>
          </footer>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
