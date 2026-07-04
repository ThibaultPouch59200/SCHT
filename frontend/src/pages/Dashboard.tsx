import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { KpiTiles } from '../components/dashboard/KpiTiles';
import { ContributionGrid } from '../components/dashboard/ContributionGrid';
import { InProgressList } from '../components/dashboard/InProgressList';
import { TopBreakdown } from '../components/dashboard/TopBreakdown';

export const Dashboard: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  return (
    <div className="ct-page">
      <div className="ct-content">
        <KpiTiles missions={missions} />
        <div className="ct-dash-sec">Activité — contrats terminés / jour · 13 dernières semaines</div>
        <ContributionGrid missions={missions} />
        <div className="ct-dash-two">
          <InProgressList missions={missions} />
          <TopBreakdown missions={missions} />
        </div>
      </div>
    </div>
  );
};
