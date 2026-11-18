import { IonCard, IonCardContent, useIonRouter } from '@ionic/react';
import React from 'react';
import '../styles/book_card.css';

import type { Books } from '../lib/models';

import BookCover from './BookCover';
import FavoriteButton from './FavoriteButton';

interface BookCardProps extends Books {
  onToggleFavorite: (bookId: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  author,
  type,
  image,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const router = useIonRouter();

  return (
    <IonCard className="book_card" button={true} onClick={() => router.push(`/tabs/book/${id}`, 'forward')}>
      <div className="book_card_image">
        <BookCover book={{ id, title, author, type, image }} className="book_card_cover" />
        <span className={`book_type_badge book_type_badge--${type.toLowerCase()}`}>{type}</span>
        <FavoriteButton bookId={id} isFavorite={isFavorite} onToggle={onToggleFavorite} />
      </div>
      <IonCardContent>
        <h3>{title}</h3>
        <p>{author}</p>
      </IonCardContent>
    </IonCard>
  );
};

export default BookCard;
