import { IonButton } from '@ionic/react';
import React from 'react';
import '../styles/header_section.css';

interface Props {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const HeaderSection: React.FC<Props> = ({ title, actionLabel, onActionPress }) => {
  return (
    <div className="header_title_row">
      <h2>{title}</h2>

      {actionLabel ? (
        <IonButton shape="round" fill="clear" onClick={onActionPress}>
          {actionLabel}
        </IonButton>
      ) : null}
    </div>
  );
};

export default HeaderSection;
