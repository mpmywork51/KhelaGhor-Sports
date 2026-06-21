export type SportCategory = 'cricket' | 'football' | 'others';

export interface Match {
  id: string;
  category: SportCategory;
  team1Name: string;
  team1Logo: string;
  team2Name: string;
  team2Logo: string;
  server1Url: string;
  server2Url: string;
  server3Url?: string;
  server4Url?: string;
  isLive: boolean;
  competition: string;
  createdAt: number;
  serial?: number;
}

export interface UpcomingMatch {
  id: string;
  category: SportCategory;
  team1Name: string;
  team1Logo: string;
  team2Name: string;
  team2Logo: string;
  server1Url: string;
  server2Url: string;
  server3Url?: string;
  server4Url?: string;
  competition: string;
  scheduledTime: number; // millisecond timestamp
  createdAt: number;
  serial?: number;
}

export interface Channel {
  id: string;
  name: string;
  logoUrl: string;
  streamUrl1: string;
  streamUrl2: string;
  category?: string;
  createdAt: number;
  serial?: number;
}

export interface GlobalSettings {
  bannerAdEnabled: boolean;
  bannerAdCode: string;
  popunderAdEnabled: boolean;
  popunderAdCode: string;
  welcomeTitle: string;
  welcomeMessage: string;
  telegramUrl: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  trafficSimulationEnabled?: boolean;
  simulatedBaselineTraffic?: number;
}

export enum NavigationTab {
  LIVE_MATCH = 'live',
  CATEGORIES = 'categories',
  UPCOMING = 'upcoming',
}
