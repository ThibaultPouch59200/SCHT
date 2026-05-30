import { create } from 'zustand';
import type { Contract, ContractPatch } from '../types';
import { api } from '../lib/api';

interface ContractStore {
  contracts: Contract[];
  loading: boolean;
  loadContracts: () => Promise<void>;
  createContract: () => Promise<Contract>;
  saveContract: (id: number, patch: ContractPatch) => Promise<Contract>;
  deleteContract: (id: number) => Promise<void>;
  toggleItem: (contractId: number, stopId: number, itemId: number) => Promise<void>;
}

export const useContractStore = create<ContractStore>((set) => ({
  contracts: [],
  loading: false,

  loadContracts: async () => {
    set({ loading: true });
    const contracts = await api.contracts.list();
    set({ contracts, loading: false });
  },

  createContract: async () => {
    const contract = await api.contracts.create();
    set((s) => ({ contracts: [contract, ...s.contracts] }));
    return contract;
  },

  saveContract: async (id, patch) => {
    const updated = await api.contracts.update(id, patch);
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? updated : c)),
    }));
    return updated;
  },

  deleteContract: async (id) => {
    await api.contracts.delete(id);
    set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) }));
  },

  toggleItem: async (contractId, stopId, itemId) => {
    const updated = await api.contracts.toggleItem(contractId, stopId, itemId);
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === contractId ? updated : c)),
    }));
  },
}));
