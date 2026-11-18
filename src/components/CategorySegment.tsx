import { IonBadge, IonButton } from '@ionic/react';
import React from 'react';

import type { Books, CategorySegment as CategorySegmentType } from '../lib/models';
import '../styles/category_segment.css';

interface Props {
  activeSegment: CategorySegmentType;
  setActiveSegment: (value: CategorySegmentType) => void;
  searchValue: string;
  bookLibrary: Books[];
}

const getFavoriteCount = (books: Books[]): number => books.filter((book) => book.isFavorite).length;

const CategorySegment: React.FC<Props> = ({ activeSegment, setActiveSegment, searchValue, bookLibrary }) => {
  const query = searchValue.trim().toLocaleLowerCase();
  const searchedBooks = bookLibrary.filter((book) => {
    if (!query) return true;

    return book.title.toLocaleLowerCase().includes(query) || book.author.toLocaleLowerCase().includes(query);
  });

  const totalBooks = searchedBooks.length;
  const epubBooks = searchedBooks.filter((book) => book.type === 'EPUB').length;
  const pdfBooks = searchedBooks.filter((book) => book.type === 'PDF').length;
  const favoriteBooks = getFavoriteCount(bookLibrary);

  return (
    <section className="cat_segment_section">
      <IonButton
        className={activeSegment === 'tous' ? 'active' : ''}
        shape="round"
        onClick={() => setActiveSegment('tous')}
      >
        Tous <IonBadge className="cat_btn_badge">{totalBooks}</IonBadge>
      </IonButton>

      <IonButton
        className={activeSegment === 'EPUB' ? 'active' : ''}
        shape="round"
        onClick={() => setActiveSegment('EPUB')}
      >
        EPUB <IonBadge className="cat_btn_badge">{epubBooks}</IonBadge>
      </IonButton>

      <IonButton
        className={activeSegment === 'PDF' ? 'active' : ''}
        shape="round"
        onClick={() => setActiveSegment('PDF')}
      >
        PDF <IonBadge className="cat_btn_badge">{pdfBooks}</IonBadge>
      </IonButton>

      <IonButton
        className={activeSegment === 'Favoris' ? 'active' : ''}
        shape="round"
        onClick={() => setActiveSegment('Favoris')}
      >
        Favoris <IonBadge className="cat_btn_badge">{favoriteBooks}</IonBadge>
      </IonButton>
    </section>
  );
};

export default CategorySegment;
