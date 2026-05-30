export interface StopItem {
  id: number;
  material: string;
  qty: number;
  done: boolean;
}

export interface ContractStop {
  id: number;
  type: 'PICKUP' | 'DELIVERY';
  station: string;
  position: number;
  items: StopItem[];
}

export interface FleetShip {
  id: number;
  name: string;
  model: string;
  pilot: string;
  scu: number;
}

export interface Contract {
  id: number;
  name: string;
  client: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  payout: number;
  createdAt: string;
  ships: FleetShip[];
  stops: ContractStop[];
}

export type StopInput = {
  type: string;
  station: string;
  position: number;
  items: { material: string; qty: number; done?: boolean }[];
};

export type ContractPatch = {
  name?: string;
  client?: string;
  payout?: number;
  status?: string;
  shipIds?: number[];
  stops?: StopInput[];
};
