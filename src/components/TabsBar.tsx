import { IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/react';
import { book, bookOutline, heart, heartOutline, home, homeOutline, settings, settingsOutline } from 'ionicons/icons';
import React from 'react';
import { useLocation } from 'react-router-dom';

const TabsBar: React.FC = () => {
  const location = useLocation();
  const is = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/tabs/home">
        <IonIcon icon={is('/tabs/home') ? home : homeOutline}></IonIcon>
        <IonLabel>Accueil</IonLabel>
      </IonTabButton>
      <IonTabButton tab="library" href="/tabs/library">
        <IonIcon icon={is('/tabs/library') ? book : bookOutline}></IonIcon>
        <IonLabel>Bibliothèque</IonLabel>
      </IonTabButton>
      <IonTabButton tab="favorites" href="/tabs/favorites">
        <IonIcon icon={is('/tabs/favorites') ? heart : heartOutline}></IonIcon>
        <IonLabel>Favoris</IonLabel>
      </IonTabButton>
      <IonTabButton tab="settings" href="/tabs/settings">
        <IonIcon icon={is('/tabs/settings') ? settings : settingsOutline}></IonIcon>
        <IonLabel>Réglages</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default TabsBar;
