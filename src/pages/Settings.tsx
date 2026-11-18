import { IonAlert, IonButton, IonContent, IonIcon, IonPage, IonToggle, useIonRouter } from '@ionic/react';
import { bookOutline, heart, moon, shieldCheckmarkOutline, sunny } from 'ionicons/icons';
import { useState } from 'react';

import { useLibrary } from '../hooks/useLibrary';
import { useTheme } from '../hooks/useTheme';
import '../styles/settings.css';

const Settings: React.FC = () => {
  const router = useIonRouter();
  const { theme, setTheme } = useTheme();
  const { books, favorites, clearFavorites } = useLibrary();
  const [showClearAlert, setShowClearAlert] = useState(false);
  const isDark = theme === 'dark';

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <div className="screen_shell settings_page">
          <header className="page_intro">
            <p className="eyebrow">VOTRE ESPACE, À VOTRE IMAGE</p>
            <h1>
              Réglages<span>.</span>
            </h1>
            <p>Quelques préférences pour savourer chaque page.</p>
          </header>

          <section className="settings_section">
            <p className="settings_section_label">APPARENCE</p>
            <div className="settings_card">
              <div className="settings_row">
                <span className={`settings_icon${isDark ? ' settings_icon--dark' : ''}`}>
                  <IonIcon icon={isDark ? moon : sunny} />
                </span>
                <div className="settings_copy">
                  <h2>Mode sombre</h2>
                  <p>{isDark ? 'Une ambiance feutrée pour lire le soir.' : 'Un papier clair, lumineux et doux.'}</p>
                </div>
                <IonToggle
                  checked={isDark}
                  aria-label="Activer le mode sombre"
                  onIonChange={(event) => setTheme(event.detail.checked ? 'dark' : 'light')}
                />
              </div>
            </div>
          </section>

          <section className="settings_section">
            <p className="settings_section_label">VOTRE BIBLIOTHÈQUE</p>
            <div className="settings_card settings_stats">
              <div className="settings_stat">
                <span className="settings_icon">
                  <IonIcon icon={bookOutline} />
                </span>
                <span>
                  <strong>{books.length}</strong>
                  <small>livres enregistrés</small>
                </span>
              </div>
              <div className="settings_stat">
                <span className="settings_icon settings_icon--heart">
                  <IonIcon icon={heart} />
                </span>
                <span>
                  <strong>{favorites.length}</strong>
                  <small>coups de cœur</small>
                </span>
              </div>
            </div>
          </section>

          <section className="settings_section">
            <p className="settings_section_label">GESTION DES DONNÉES</p>
            <div className="settings_card settings_row settings_reset">
              <div className="settings_copy">
                <h2>Effacer mes favoris</h2>
                <p>Vos livres resteront dans la bibliothèque.</p>
              </div>
              <IonButton
                fill="clear"
                color="danger"
                disabled={favorites.length === 0}
                onClick={() => setShowClearAlert(true)}
              >
                Effacer
              </IonButton>
            </div>
          </section>

          <section className="settings_section">
            <p className="settings_section_label">INFORMATIONS</p>
            <div className="settings_card settings_row">
              <span className="settings_icon">
                <IonIcon icon={shieldCheckmarkOutline} />
              </span>
              <div className="settings_copy">
                <h2>Confidentialité</h2>
                <p>Comprendre où vos livres et vos préférences sont stockés.</p>
              </div>
              <IonButton fill="clear" onClick={() => router.push('/privacy')}>
                Consulter
              </IonButton>
            </div>
          </section>

          <footer className="settings_footer">
            <span className="brand_mark">
              <IonIcon icon={bookOutline} />
            </span>
            <p>
              LordReader <span>· Un livre à la fois.</span>
            </p>
            <small>Vos préférences sont enregistrées sur cet appareil.</small>
          </footer>
        </div>
        <IonAlert
          isOpen={showClearAlert}
          header="Effacer les favoris ?"
          message="Cette action retirera tous les livres de votre liste de favoris."
          buttons={[
            { text: 'Annuler', role: 'cancel', handler: () => setShowClearAlert(false) },
            {
              text: 'Effacer',
              role: 'destructive',
              handler: () => {
                clearFavorites();
                setShowClearAlert(false);
              },
            },
          ]}
          onDidDismiss={() => setShowClearAlert(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;
