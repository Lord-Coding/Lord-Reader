import '../styles/empty-book-screen.css';
import { IonLabel, IonButton, IonIcon } from '@ionic/react';
import { addCircleSharp } from 'ionicons/icons';
import React from 'react';

const EmptyBookScreen: React.FC = () => {
  return (
    <div className="empty_book_container">
      <div className="icon_container">
        <img src="../../public/illustration/book_illustration.png" alt="book_icon_3D" />
      </div>
      <IonLabel>
        <h2>Téléverse tes livres favoris et commence ta journée!</h2>
        <p>Tu peux téléverser tes livres en format .EPUB et .PDF</p>
      </IonLabel>
      <IonButton>
        <IonIcon icon={addCircleSharp}></IonIcon>
        Add new book
      </IonButton>
    </div>
  );
};

export default EmptyBookScreen;
