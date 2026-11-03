export type Feeder = {
  id: string; name: string; closed: boolean; fault: boolean; energized: boolean;
  vm_pu: number; p_mw: number; q_mvar: number; i_ka: number; loading_percent: number;
};
export type Telemetry = {
  session_id: string; revision: number; status: 'normal' | 'alarm' | 'collapse';
  feeders: Feeder[]; alarms: string[]; bus_vm_pu: number; p_mw: number; q_mvar: number;
  transformer_loading_percent: number; served_percent: number; load_factor: number;
  scenario: string; elapsed_seconds: number; actions: number; mistakes: number;
  score: number; completed_seconds: number | null;
  logs: {id: number; timestamp: string; level: string; message: string}[];
};
export type Scenario = {id: string; name: string; description: string};
