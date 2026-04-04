import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useMissionStore } from '../store/useMissionStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { fmtAuec, fmtShort } from '../utils/parseAmount';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface DayEntry {
  key: string;
  label: string;
}

function getLast30Days(): DayEntry[] {
  const days: DayEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    days.push({ key, label });
  }
  return days;
}

export const Dashboard: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);
  const wallet = useFinanceStore((s) => s.wallet);
  const transactions = useFinanceStore((s) => s.transactions);

  const activeMissions = missions.filter((m) => !completedIds.includes(m.id));
  const totalScuActive = activeMissions.reduce(
    (acc, m) => acc + m.cargos.reduce((a, c) => a + c.scu, 0),
    0
  );

  const t30 = new Date();
  t30.setDate(t30.getDate() - 30);
  const earned30 = transactions
    .filter((t) => t.type === 'mission' && new Date(t.date) >= t30)
    .reduce((a, t) => a + t.amount, 0);

  const doneCount = completedIds.length;
  const pays = missions.filter((m) => m.pay > 0).map((m) => m.pay);
  const avgPay = pays.length
    ? Math.round(pays.reduce((a, v) => a + v, 0) / pays.length)
    : 0;

  const completionRate = missions.length
    ? Math.round((doneCount / missions.length) * 100)
    : 0;

  const completed = missions
    .filter((m) => completedIds.includes(m.id))
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const days = getLast30Days();
  const sortedTxns = [...transactions].reverse();

  let baseline = 0;
  sortedTxns.forEach((t) => {
    if (t.date < days[0].key) {
      if (t.type === 'wallet') baseline = t.amount;
      else baseline += t.amount;
    }
  });

  let w = baseline;
  const chartValues = days.map(({ key }) => {
    sortedTxns
      .filter((t) => t.date === key)
      .forEach((t) => {
        if (t.type === 'wallet') w = t.amount;
        else w += t.amount;
      });
    return w;
  });
  chartValues[chartValues.length - 1] = wallet;

  const chartData = {
    labels: days.map((d) => d.label),
    datasets: [
      {
        data: chartValues,
        borderColor: '#ffb347',
        backgroundColor: 'rgba(255,179,71,0.07)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#ffb347',
        pointBorderColor: '#050a0f',
        pointBorderWidth: 1.5,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0c1520',
        borderColor: 'rgba(0,180,255,0.3)',
        borderWidth: 1,
        titleColor: '#7aa8c4',
        bodyColor: '#e8f4ff',
        callbacks: {
          label: (ctx: { raw: unknown }) => ' ' + fmtAuec(ctx.raw as number),
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,180,255,0.07)' },
        ticks: {
          color: '#3d6680',
          font: { family: "'Share Tech Mono'", size: 10 },
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: { color: 'rgba(0,180,255,0.07)' },
        ticks: {
          color: '#3d6680',
          font: { family: "'Share Tech Mono'", size: 10 },
          callback: (value: string | number) => fmtShort(Number(value)),
        },
      },
    },
  };

  const chartRange =
    days.length > 0
      ? `${days[0].label} — ${days[days.length - 1].label}`
      : '';

  return (
    <div
      className="page-anim"
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
    >
      <div className="content">
        <div className="section-head" style={{ marginBottom: '14px' }}>
          <h2>Tableau de bord KPI</h2>
        </div>

        <div className="finance-grid dashboard-kpis">
          <div className="kpi-card">
            <div className="kpi-label">Missions actives</div>
            <div className="kpi-value kpi-blue">{activeMissions.length}</div>
            <div className="kpi-sub">en cours</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">SCU en transit</div>
            <div className="kpi-value kpi-amber">{totalScuActive}</div>
            <div className="kpi-sub">sur missions actives</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Wallet actuel</div>
            <div className="kpi-value kpi-amber">{fmtShort(wallet)}</div>
            <div className="kpi-sub">aUEC total</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Gains (30 jours)</div>
            <div className="kpi-value kpi-green">{fmtShort(earned30)}</div>
            <div className="kpi-sub">aUEC ce mois</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Missions livrées</div>
            <div className="kpi-value kpi-green">{doneCount}</div>
            <div className="kpi-sub">sur {missions.length} enregistrées</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Taux de complétion</div>
            <div className="kpi-value kpi-blue">{completionRate}%</div>
            <div className="kpi-sub">global</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Paiement moyen</div>
            <div className="kpi-value kpi-amber">{fmtShort(avgPay)}</div>
            <div className="kpi-sub">aUEC / mission</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Missions totales</div>
            <div className="kpi-value kpi-blue">{missions.length}</div>
            <div className="kpi-sub">historique inclus</div>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-title">
            <span>// Évolution du wallet — 30 derniers jours</span>
            <span style={{ color: 'var(--text-low)', fontSize: '10px', letterSpacing: '0.1em' }}>
              {chartRange}
            </span>
          </div>
          <div className="chart-wrap">
            <Line data={chartData} options={chartOptions as Parameters<typeof Line>[0]['options']} />
          </div>
        </div>

        <div className="txn-panel" style={{ marginBottom: 0 }}>
          <div className="txn-title">// Dernières missions livrées</div>
          {completed.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', padding: '1.5rem', margin: 0 }}>
              Aucune mission terminée pour le moment.
            </div>
          ) : (
            completed.map((m) => {
              const totalScu = m.cargos.reduce((a, c) => a + c.scu, 0);
              const completedAt = new Date(m.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              });

              return (
                <div key={m.id} className="txn-row">
                  <div className="txn-date">{completedAt}</div>
                  <div className="txn-desc">
                    {m.origin} → {m.cargos[0]?.dest ?? '—'}
                  </div>
                  <div className="dt-scu" style={{ marginLeft: 0 }}>{totalScu} SCU</div>
                  <div className="txn-amount manual">
                    {m.pay > 0 ? fmtAuec(m.pay) : '—'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
