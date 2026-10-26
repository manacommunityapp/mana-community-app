export type SponsorTier =
  | 'presenting'
  | 'title'
  | 'poweredBy'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'associate'
  | 'beverage'
  | 'mobility'
  | 'kit'
  | 'nutrition'
  | 'media'
  | 'partner';

export interface TournamentSponsor {
  id?: string | number;
  tournamentId?: number;
  name: string;
  category: string;
  tier?: SponsorTier;
  logoUrl?: string;
  bannerUrl?: string;
  tagline?: string;
  url?: string;
  featured?: boolean;
  order?: number;
}
