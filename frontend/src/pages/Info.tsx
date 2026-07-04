import React from 'react';

export const Info: React.FC = () => {
  return (
    <div className="ct-page">
      <div className="ct-content">
        <div className="ct-h">Guide d'utilisation</div>
        <div className="ct-sub">Repères rapides pour naviguer dans HAUL//OPS.</div>

        <div className="ct-info-card">
          <div className="ct-info-card-title">À quoi sert HAUL//OPS ?</div>
          <div className="ct-info-text">
            HAUL//OPS te permet de suivre tes missions cargo, les quantités livrées
            en SCU et ton historique de runs.
          </div>
        </div>

        <div className="ct-info-card">
          <div className="ct-info-card-title">Démarrage rapide</div>
          <ol className="ct-info-list">
            <li>Va dans <strong>Missions</strong> et crée une mission avec les cargos.</li>
            <li>Ouvre <strong>Route</strong> pour suivre les livraisons par station.</li>
            <li>Confirme les SCU livrés à chaque escale.</li>
            <li>Une fois la mission terminée, retrouve-la dans <strong>Journal</strong>.</li>
          </ol>
        </div>

        <div className="ct-info-card">
          <div className="ct-info-card-title">Pages principales</div>
          <ul className="ct-info-list">
            <li><strong>Route</strong> : suivi opérationnel des stations et SCU.</li>
            <li><strong>Missions</strong> : création et duplication des missions.</li>
            <li><strong>Journal</strong> : missions terminées et archivées.</li>
            <li><strong>Réglages</strong> : gestion des listes (lieux, ressources, vaisseau).</li>
          </ul>
        </div>

        <div className="ct-info-card">
          <div className="ct-info-card-title">Conseils</div>
          <div className="ct-info-text">
            - Utilise des noms cohérents pour les destinations afin d'éviter les doublons.<br />
            - Réordonne tes arrêts sur la page Route pour optimiser ta tournée.<br />
            - Tu peux copier une mission existante depuis la page Missions pour gagner du temps.
          </div>
        </div>
      </div>
    </div>
  );
};
