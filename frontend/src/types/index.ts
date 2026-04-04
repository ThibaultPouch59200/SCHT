export interface CargoLine {
  id?: number;  // present when fetched from API
  res: string;
  scu: number;
  dest: string;
  planet: string;
}

export interface Mission {
  id: number;
  origin: string;
  system: string;
  pay: number;
  cargos: CargoLine[];
  createdAt: string;
}

export interface Transaction {
  id: number;
  date: string;
  desc: string;
  amount: number;
  type: 'mission' | 'wallet';
  missionId?: number;
}
