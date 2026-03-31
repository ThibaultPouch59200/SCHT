import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mission, Transaction } from '../types';

interface FinanceStore {
  wallet: number;
  transactions: Transaction[];
  nextTxnId: number;
  setWallet: (amount: number) => void;
  addMissionEarning: (mission: Mission) => void;
  deleteTransaction: (id: number) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      wallet: 0,
      transactions: [],
      nextTxnId: 1,

      setWallet: (amount: number) => {
        set((state) => ({
          wallet: amount,
          transactions: [
            {
              id: state.nextTxnId,
              date: today(),
              desc: 'Mise à jour manuelle du wallet',
              amount,
              type: 'wallet' as const,
            },
            ...state.transactions,
          ],
          nextTxnId: state.nextTxnId + 1,
        }));
      },

      addMissionEarning: (mission: Mission) => {
        set((state) => ({
          wallet: state.wallet + mission.pay,
          transactions: [
            {
              id: state.nextTxnId,
              date: today(),
              desc: `Mission : ${mission.origin} — livraison complète`,
              amount: mission.pay,
              type: 'mission' as const,
              missionId: mission.id,
            },
            ...state.transactions,
          ],
          nextTxnId: state.nextTxnId + 1,
        }));
      },

      deleteTransaction: (id: number) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },
    }),
    {
      name: 'scht-finance',
    }
  )
);
