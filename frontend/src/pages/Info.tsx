import React from 'react';

export const Info: React.FC = () => {
  return (
    <div
      className="page-anim"
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
    >
      <div className="content">
        <div className="section-head" style={{ marginBottom: '14px' }}>
          <h2>Guide d'utilisation</h2>
        </div>

        <div className="mission-form-panel" style={{ marginBottom: '14px' }}>
          <div className="settings-section-title">À quoi sert SCHT ?</div>
          <div className="info-text">
            SCHT (Star Citizen Hauling Tracker) te permet de suivre tes missions cargo,
            les quantités livrées en SCU et ton historique de runs.
          </div>
        </div>

        <div className="mission-form-panel" style={{ marginBottom: '14px' }}>
          <div className="settings-section-title">Démarrage rapide</div>
          <ol className="info-list">
            <li>Va dans <strong>Missions</strong> et crée une mission avec les cargos.</li>
            <li>Ouvre <strong>Opérations</strong> pour suivre les livraisons par station.</li>
            <li>Saisis les SCU livrés sur chaque ressource (ou confirme tout).</li>
            <li>Une fois la mission terminée, retrouve-la dans <strong>Historique</strong>.</li>
          </ol>
        </div>

        <div className="mission-form-panel" style={{ marginBottom: '14px' }}>
          <div className="settings-section-title">Pages principales</div>
          <ul className="info-list">
            <li><strong>Opérations</strong> : suivi opérationnel des stations et SCU.</li>
            <li><strong>Missions</strong> : création et duplication des missions.</li>
            <li><strong>Historique</strong> : missions terminées et archivées.</li>
            <li><strong>Réglages</strong> : gestion des listes (lieux, ressources, vaisseau).</li>
          </ul>
        </div>

        <div className="mission-form-panel">
          <div className="settings-section-title">Conseils</div>
          <div className="info-text">
            - Utilise des noms cohérents pour les destinations afin d'éviter les doublons.<br />
            - Filtre par système dans Opérations pour te concentrer sur la zone active.<br />
            - Tu peux copier une mission existante depuis la page Missions pour gagner du temps.
          </div>
        </div>
      </div>
    </div>
  );
};
