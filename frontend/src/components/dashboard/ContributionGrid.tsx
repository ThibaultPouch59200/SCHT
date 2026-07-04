import React from 'react';
import type { Mission } from '../../types';
import { buildContributionGrid } from '../../lib/stats';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const ContributionGrid: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const grid = buildContributionGrid(missions);
  // Month labels: show the month of each column's first day when it changes.
  const labels = grid.map((col, i) => {
    const m = col[0].date.getMonth();
    const prev = i > 0 ? grid[i - 1][0].date.getMonth() : -1;
    return m !== prev ? MONTHS[m] : '';
  });
  return (
    <div className="ct-grid-wrap">
      <div className="ct-grid-months">
        {labels.map((lbl, i) => <span key={i}>{lbl}</span>)}
      </div>
      <div className="ct-grid">
        {grid.map((col, w) => (
          <div key={w} className="ct-col">
            {col.map((cell, d) => (
              <div
                key={d}
                className={`ct-cell${cell.level ? ' l' + cell.level : ''}`}
                title={`${cell.count} contrat${cell.count > 1 ? 's' : ''} · ${cell.date.toLocaleDateString('fr-FR')}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="ct-grid-legend">
        Moins
        <span className="ct-cell" /><span className="ct-cell l1" /><span className="ct-cell l2" /><span className="ct-cell l3" /><span className="ct-cell l4" />
        Plus
      </div>
    </div>
  );
};
