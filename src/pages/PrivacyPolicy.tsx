import { IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/react';
import { arrowBack, shieldCheckmarkOutline } from 'ionicons/icons';

import '../styles/privacy_policy.css';

const PrivacyPolicy: React.FC = () => {
  const router = useIonRouter();

  return (
    <IonPage>
      <IonContent fullscreen className="screen_content">
        <main className="screen_shell privacy_page">
          <IonButton fill="clear" className="back_action" onClick={() => router.goBack()}>
            <IonIcon icon={arrowBack} slot="start" /> Retour
          </IonButton>
          <header className="page_intro">
            <p className="eyebrow">
              <IonIcon icon={shieldCheckmarkOutline} /> VOS DOCUMENTS RESTENT SUR VOTRE APPAREIL
            </p>
            <h1>
              Confidentialité<span>.</span>
            </h1>
            <p>Politique de confidentialité de LordReader — version 1.0, 17 novembre 2026.</p>
          </header>
          <section className="privacy_card">
            <h2>Stockage local des livres</h2>
            <p>
              Les fichiers EPUB et PDF que vous choisissez sont enregistrés dans le stockage local de l’application
              (IndexedDB). Les métadonnées, la progression et les durées des sessions de lecture y sont conservées sur
              cet appareil. Les favoris et le thème sont enregistrés dans le stockage local du navigateur.
            </p>
            <p>
              LordReader n’envoie pas le contenu de vos livres à un serveur. En supprimant un livre importé depuis sa
              fiche ou la page de stockage, vous supprimez aussi le fichier local, sa progression et ses sessions. La
              désinstallation de l’application ou l’effacement des données du navigateur peut également supprimer ces
              documents.
            </p>
            <h2>Accès aux fichiers</h2>
            <p>
              Le sélecteur de fichiers natif ou celui du navigateur n’accède qu’aux fichiers que vous choisissez.
              L’application n’explore pas les autres documents de votre appareil.
            </p>
            <h2>Réseau et couvertures</h2>
            <p>
              Les couvertures intégrées à vos fichiers EPUB sont extraites et enregistrées localement. LordReader ne
              transmet ni ces couvertures, ni les documents importés, ni leur texte de lecture.
            </p>
            <h2>Vos choix</h2>
            <p>
              Vous pouvez supprimer les livres importés et effacer vos favoris depuis l’application. Pour toute question
              sur cette politique, contactez l’éditeur de l’application.
            </p>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPolicy;
