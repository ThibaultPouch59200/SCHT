import React, { useState } from 'react';
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
import { useFinanceStore } from '../store/useFinanceStore';
import { useMissionStore } from '../store/useMissionStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { parseAmount, fmtAuec, fmtShort } from '../utils/parseAmount';

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

export const Finance: React.FC = () => {
  const wallet = useFinanceStore((s) => s.wallet);
  const transactions = useFinanceStore((s) => s.transactions);
  const setWallet = useFinanceStore((s) => s.setWallet);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);

  const [walletInput, setWalletInput] = useState('');

  // KPI calculations
  const t30 = new Date();
  t30.setDate(t30.getDate() - 30);
  const txn30 = transactions.filter(
    (t) => t.type === 'mission' && new Date(t.date) >= t30
  );
  const earned30 = txn30.reduce((a, t) => a + t.amount, 0);
  const doneCount = completedIds.length;
  const pays = missions.filter((m) => m.pay > 0).map((m) => m.pay);
  const avgPay = pays.length
    ? Math.round(pays.reduce((a, v) => a + v, 0) / pays.length)
    : 0;

  // Chart data
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
  // last point always = current wallet
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

  const handleSetWallet = () => {
    const val = parseAmount(walletInput);
    if (val === 0 && walletInput.trim() !== '0') return;
    setWallet(val);
    setWalletInput('');
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
        {/* KPI Cards */}
        <div className="finance-grid">
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
            <div className="kpi-value kpi-blue">{doneCount}</div>
            <div className="kpi-sub">
              sur <span>{missions.length}</span> enregistrées
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Paiement moyen</div>
            <div className="kpi-value kpi-amber">{fmtShort(avgPay)}</div>
            <div className="kpi-sub">aUEC / mission</div>
          </div>
        </div>

        {/* Wallet Panel */}
        <div className="wallet-panel">
          <div className="wallet-title">// Gestion du wallet</div>
          <div className="wallet-row">
            <div className="wallet-current">
              <div className="wallet-current-label">Solde actuel</div>
              <div className="wallet-current-val">{fmtAuec(wallet)}</div>
            </div>
            <div className="wallet-sep" />
            <div className="wallet-input-group">
              <label>Définir / mettre à jour le solde</label>
              <div className="wallet-input-row">
                <input
                  className="wallet-input"
                  type="text"
                  placeholder="Ex: 2.5M · 500k · 2500000"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSetWallet()}
                />
                <button className="wallet-btn" onClick={handleSetWallet}>
                  Définir
                </button>
              </div>
              <div className="form-hint" style={{ marginTop: '2px' }}>
                Enregistre le solde actuel comme point de référence
              </div>
            </div>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="chart-panel">
          <div className="chart-title">
            <span>// Évolution du wallet — 30 derniers jours</span>
            <span style={{ color: 'var(--text-low)', fontSize: '9px', letterSpacing: '0.1em' }}>
              {chartRange}
            </span>
          </div>
          <div className="chart-wrap">
            <Line data={chartData} options={chartOptions as Parameters<typeof Line>[0]['options']} />
          </div>
        </div>

        {/* Transaction History */}
        <div className="txn-panel">
          <div className="txn-title">// Historique des transactions</div>
          {transactions.length === 0 ? (
            <div
              className="empty-state"
              style={{ border: 'none', padding: '1.5rem', margin: 0 }}
            >
              Aucune transaction.
            </div>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="txn-row">
                <div className="txn-date">{t.date}</div>
                <StatusBadge variant={t.type} />
                <div className="txn-desc">{t.desc}</div>
                <div className={`txn-amount${t.type === 'wallet' ? ' manual' : ''}`}>
                  {t.type === 'wallet' ? '= ' : '+ '}
                  {fmtAuec(t.amount)}
                </div>
                <button
                  className="txn-del"
                  onClick={() => deleteTransaction(t.id)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
