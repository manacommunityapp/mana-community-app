import type { TournamentSponsor } from './TournamentSponsorTypes';

export const DEFAULT_TOURNAMENT_SPONSORS: TournamentSponsor[] = [
  {
    id: 'sp-1',
    name: 'Kotak Mahindra Bank',
    category: 'Presenting Partner',
    tier: 'presenting',
    tagline: 'Empowering community champions and youth sports',
    url: 'https://www.kotak.com',
    featured: true,
  },
  {
    id: 'sp-2',
    name: 'The Aartah School',
    category: 'Proud Partner',
    tier: 'gold',
    tagline: 'Holistic education, sports & character development',
    url: 'https://theaartahschool.edu.in',
  },
  {
    id: 'sp-3',
    name: 'Palm Valley',
    category: 'Proud Partner',
    tier: 'gold',
    tagline: 'Wealth in every acre — Premium gated farmland & villa communities',
    url: 'https://palmvalley.in',
  },
  {
    id: 'sp-4',
    name: 'Viseshta Avenues',
    category: 'Associate Partner',
    tier: 'associate',
    tagline: 'Smart community infrastructure & urban living',
    url: 'https://viseshta.com',
  },
  {
    id: 'sp-5',
    name: 'Monin',
    category: 'Official Beverage Partner',
    tier: 'beverage',
    tagline: 'Hydration & refreshing gourmet flavors for athletes',
    url: 'https://www.monin.com',
  },
  {
    id: 'sp-6',
    name: 'GetMeCab',
    category: 'Official Mobility Partner',
    tier: 'mobility',
    tagline: 'Safe, punctual intercity & tournament transit',
    url: 'https://www.getmecab.com',
  },
];
