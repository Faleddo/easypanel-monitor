export interface EasyPanelServer {
  id: string;
  hostname: string;
  token: string;
}

export interface ServerStats {
  cpu: {
    percent: number;
  };
  memory: {
    usage: number;
    percent: number;
  };
  network: {
    in: number;
    out: number;
  };
}

export interface MonitorData {
  id: string;
  stats: ServerStats;
  projectName: string;
  serviceName: string;
  containerName: string;
}

export interface ServerOverview {
  hostname: string;
  uptime?: number; // in days
  ramPercentage?: number;
  ramUsed?: number; // in MB
  ramTotal?: number; // in MB
  diskPercentage?: number;
  diskUsed?: string; // in GB
  diskTotal?: string; // in GB
  cpuPercentage?: number;
  tokenKey: string;
  status?: 'online' | 'offline' | 'error';
}

export interface SystemStatsResponse {
  result: {
    data: {
      json: {
        uptime: number;
        memInfo: {
          totalMemMb: number;
          usedMemMb: number;
          freeMemMb: number;
          usedMemPercentage: number;
          freeMemPercentage: number;
        };
        diskInfo: {
          totalGb: string;
          usedGb: string;
          freeGb: string;
          usedPercentage: string;
          freePercentage: string;
        };
        cpuInfo: {
          usedPercentage: number;
          count: number;
          loadavg: number[];
        };
        network: {
          inputMb: number;
          outputMb: number;
        };
      };
    };
  };
}

export type RefreshInterval = 1 | 5 | 10 | 15 | 30 | 60 | 'off';

export type ColorMode = 'system' | 'dark' | 'light';

export interface AppSettings {
  homePageRefreshTime: RefreshInterval;
  serviceRefreshTime: RefreshInterval;
  colorMode: ColorMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  homePageRefreshTime: 'off',
  serviceRefreshTime: 'off',
  colorMode: 'system',
};

export const REFRESH_OPTIONS: { value: RefreshInterval; label: string }[] = [
  { value: 1, label: '1 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
  { value: 'off', label: 'Off' },
];

export const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]; 