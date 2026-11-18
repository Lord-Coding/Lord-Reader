import { IonButton, IonIcon, IonProgressBar } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import React from 'react';

import '../styles/book_card_header.css';
import type { Books } from '../lib/models';

import BookCover from './BookCover';

interface BookCardHeaderProps {
  book: Books;
  progress: number;
  onContinue: () => void;
}

const BookCardHeader: React.FC<BookCardHeaderProps> = ({ book, progress, onContinue }) => {
  return (
    <section className="reading_feature">
      <div className="reading_cover_wrapper">
        <BookCover book={book} className="reading_cover" loading="eager" />
      </div>
      <div className="reading_meta">
        <span className="reading_eyebrow">VOTRE LECTURE EN COURS</span>
        <h2>{book.title}</h2>
        <p>{book.author}</p>
        <div className="progress_container">
          <IonProgressBar value={progress} />
          <span>{Math.round(progress * 100)} %</span>
        </div>
        <IonButton className="reading_btn" shape="round" onClick={onContinue}>
          Reprendre ma lecture <IonIcon icon={arrowForward} slot="end" />
        </IonButton>
      </div>
      <div className="reading_decor" aria-hidden="true">
        “
      </div>
    </section>
  );
};

export default BookCardHeader;
