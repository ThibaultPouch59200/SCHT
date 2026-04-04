import { create } from 'zustand';
import { api } from '../lib/api';
import type { SerializedTransaction } from '../lib/api';
import type { Transaction } from '../types';

function toTransaction(t: SerializedTransaction): Transaction {
  return {
    id: t.id,
    date: t.date,
    desc: t.desc,
    amount: t.amount,
    type: t.type as 'mission' | 'wallet',
    missionId: t.missionId ?? undefined,
  };
}

interface FinanceStore {
  wallet: number;
  transactions: Transaction[];
  loading: boolean;
  fetch: () => Promise<void>;
  setWallet: (amount: number) => Promise<void>;
  recordMissionEarning: (missionId: number, origin: string, pay: number) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  // Legacy compat called by old mission store — now a no-op alias
  addMissionEarning: (mission: { id: number; origin: string; pay: number }) => void;
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  wallet: 0,
  transactions: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    const data = await api.finance.get();
    set({
      wallet: data.wallet,
      transactions: data.transactions.map(toTransaction),
      loading: false,
    });
  },

  setWallet: async (amount) => {
    const data = await api.finance.setWallet(amount);
    set({
      wallet: data.wallet,
      transactions: data.transactions.map(toTransaction),
    });
  },

  recordMissionEarning: async (missionId, origin, pay) => {
    const tx = await api.finance.addTransaction({
      amount: pay,
      desc: `Mission : ${origin} — livraison complète`,
      type: 'mission',
      missionId,
    });
    set((s) => ({
      wallet: s.wallet + pay,
      transactions: [toTransaction(tx), ...s.transactions],
    }));
  },

  deleteTransaction: async (id) => {
    await api.finance.deleteTransaction(id);
    set((s) => ({
      transactions: s.transactions.filter((t) => t.id !== id),
    }));
  },

  // Called by legacy useMissionStore — delegates to recordMissionEarning
  addMissionEarning: (mission) => {
    get().recordMissionEarning(mission.id, mission.origin, mission.pay);
  },
}));
