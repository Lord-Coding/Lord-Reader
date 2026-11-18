import '../styles/empty-book-screen.css';
import { IonButton } from '@ionic/react';
import React from 'react';

interface Props {
  onImport: () => void;
}

const EmptyBookScreen: React.FC<Props> = ({ onImport }) => {
  return (
    <div className="empty_book_container">
      <div className="icon_container">
        <img src="/illustration/book_illustration.png" alt="" />
      </div>
      <h2>Votre bibliothèque commence ici.</h2>
      <p>Importez un fichier EPUB ou PDF pour retrouver vos livres et les lire même hors ligne.</p>
      <IonButton onClick={onImport}>Importer mon premier livre</IonButton>
    </div>
  );
};

export default EmptyBookScreen;
