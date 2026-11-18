import { IonItem, useIonRouter } from '@ionic/react';
import React from 'react';
import '../styles/book_card_item.css';

import type { Books } from '../lib/models';

import BookCover from './BookCover';
import FavoriteButton from './FavoriteButton';

interface BookCardItemProps extends Books {
  onToggleFavorite: (bookId: string) => void;
}

const BookCardItem: React.FC<BookCardItemProps> = ({
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
    <IonItem
      className="card_item"
      lines="none"
      button={true}
      onClick={() => router.push(`/tabs/book/${id}`, 'forward')}
    >
      <div className="item_cover">
        <BookCover book={{ id, title, author, type, image }} className="item_book_cover" />
      </div>

      <div className="card_item_meta">
        <h2>
          <span className="book_title">{title}</span>
          <span className={`book_type_badge book_type_badge--${type.toLowerCase()}`}>{type}</span>
        </h2>
        <p>{author}</p>
        <span className="card_item_type">Dans votre bibliothèque · {type}</span>
      </div>
      <FavoriteButton bookId={id} isFavorite={isFavorite} onToggle={onToggleFavorite} />
    </IonItem>
  );
};

export default BookCardItem;
