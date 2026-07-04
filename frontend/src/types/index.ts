export interface Ship {
  id: number; name: string; manufacturer: string; scu: number; category: string;
}

export type CargoStatus = 'PENDING' | 'LOADED' | 'DELIVERED';

export interface CargoLine {
  id?: number;
  res: string;
  scu: number;
  origin: string;        // pickup station
  originPlanet: string;
  dest: string;          // delivery station
  planet: string;        // delivery planet
  status: CargoStatus;
}

export interface Mission {
  id: number;
  cargos: CargoLine[];
  createdAt: string;
  completedAt?: string | null;
}
