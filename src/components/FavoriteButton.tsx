import { IonButton, IonIcon } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';

interface FavoriteButtonProps {
  bookId: string;
  isFavorite: boolean;
  onToggle: (bookId: string) => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ bookId, isFavorite, onToggle }) => (
  <IonButton
    className={`favorite_button${isFavorite ? ' is_favorite' : ''}`}
    fill="clear"
    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    aria-pressed={isFavorite}
    onClick={(event) => {
      event.stopPropagation();
      onToggle(bookId);
    }}
  >
    <IonIcon icon={isFavorite ? heart : heartOutline} slot="icon-only" />
  </IonButton>
);

export default FavoriteButton;
