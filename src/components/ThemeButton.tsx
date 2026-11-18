import { IonButton, IonIcon } from '@ionic/react';
import { moon, sunny } from 'ionicons/icons';

import type { ThemeMode } from '../contexts/ThemeContext';
import { useTheme } from '../hooks/useTheme';

const NEXT_ICON: Record<ThemeMode, string> = {
  light: moon,
  dark: sunny,
};

const NEXT_LABEL: Record<ThemeMode, string> = {
  light: 'Passer en mode sombre',
  dark: 'Passer en mode clair',
};

interface ThemeButtonProps {
  fill?: 'clear';
  className?: string;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({ fill = 'clear', className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <IonButton
      fill={fill}
      className={className}
      onClick={toggleTheme}
      aria-label={NEXT_LABEL[theme]}
      title={NEXT_LABEL[theme]}
    >
      <IonIcon icon={NEXT_ICON[theme]} slot="icon-only" />
    </IonButton>
  );
};

ThemeButton.displayName = 'ThemeButton';
export { ThemeButton };
