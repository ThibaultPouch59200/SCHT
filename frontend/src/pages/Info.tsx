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

        <div className="wallet-panel" style={{ marginBottom: '14px' }}>
          <div className="wallet-title">// À quoi sert SCHT ?</div>
          <div className="info-text">
            SCHT (Star Citizen Hauling Tracker) te permet de suivre tes missions cargo,
            les quantités livrées en SCU, ton historique, et ton wallet aUEC.
          </div>
        </div>

        <div className="wallet-panel" style={{ marginBottom: '14px' }}>
          <div className="wallet-title">// Démarrage rapide</div>
          <ol className="info-list">
            <li>Va dans <strong>Missions</strong> et crée une mission avec les cargos.</li>
            <li>Ouvre <strong>Operations</strong> pour suivre les livraisons par station.</li>
            <li>Saisis les SCU livrés sur chaque ressource (ou confirme tout).</li>
            <li>Une fois la mission terminée, retrouve-la dans <strong>Historique</strong>.</li>
            <li>Gère ton solde dans <strong>Finance</strong>.</li>
          </ol>
        </div>

        <div className="wallet-panel" style={{ marginBottom: '14px' }}>
          <div className="wallet-title">// Pages principales</div>
          <ul className="info-list">
            <li><strong>Dashboard</strong> : tous les KPI en un coup d'œil.</li>
            <li><strong>Operations</strong> : suivi opérationnel des stations et SCU.</li>
            <li><strong>Missions</strong> : création et duplication des missions.</li>
            <li><strong>Historique</strong> : missions terminées et archivées.</li>
            <li><strong>Finance</strong> : wallet, gains 30 jours, transactions.</li>
            <li><strong>Réglages</strong> : gestion des listes (lieux, ressources, etc.).</li>
          </ul>
        </div>

        <div className="wallet-panel">
          <div className="wallet-title">// Conseils</div>
          <div className="info-text info-tips">
            - Utilise des noms cohérents pour les destinations afin d'éviter les doublons.<br />
            - Mets ton wallet à jour dans Finance pour garder des KPI fiables.<br />
            - Filtre par système dans Operations pour te concentrer sur la zone active.
          </div>
        </div>
      </div>
    </div>
  );
};
