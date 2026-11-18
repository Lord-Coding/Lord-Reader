import { useState } from 'react';

import type { Books } from '../lib/models';

interface BookCoverProps {
  book: Books;
  className: string;
  loading?: 'eager' | 'lazy';
}

const BookCover: React.FC<BookCoverProps> = ({ book, className, loading = 'lazy' }) => {
  const [hasFailed, setHasFailed] = useState(false);

  if (!book.image || hasFailed) {
    return (
      <div className={`${className} book_cover_fallback`} role="img" aria-label={`Couverture de ${book.title}`}>
        <span className="book_cover_fallback_title">{book.title}</span>
        <span className="book_cover_fallback_author">{book.author}</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={book.image}
      alt={`Couverture de ${book.title}`}
      loading={loading}
      onError={() => setHasFailed(true)}
    />
  );
};

export default BookCover;
