import type { TournamentSponsor, SponsorTier } from './TournamentSponsorTypes';
import type { Sponsor } from '../../../../types/api';

/**
 * Maps database sponsor entities (sports_event_sponsor table) to the UI TournamentSponsor format.
 */
export function mapDbSponsorToTournamentSponsor(s: Sponsor | any, tournamentId?: number): TournamentSponsor {
  const categoryLower = (s.category || '').toLowerCase();
  let tier: SponsorTier = 'partner';
  if (categoryLower.includes('presenting') || categoryLower.includes('title')) {
    tier = 'presenting';
  } else if (categoryLower.includes('powered')) {
    tier = 'poweredBy';
  } else if (categoryLower.includes('gold')) {
    tier = 'gold';
  } else if (categoryLower.includes('silver')) {
    tier = 'silver';
  } else if (categoryLower.includes('bronze')) {
    tier = 'bronze';
  } else if (categoryLower.includes('associate')) {
    tier = 'associate';
  } else if (categoryLower.includes('beverage') || categoryLower.includes('hydration')) {
    tier = 'beverage';
  } else if (categoryLower.includes('mobility') || categoryLower.includes('travel') || categoryLower.includes('cab')) {
    tier = 'mobility';
  }

  return {
    id: s.id || `sp-${Math.random().toString(36).substring(2, 9)}`,
    tournamentId: tournamentId,
    name: s.name,
    category: s.category || 'Partner',
    tier,
    url: s.url,
    logoUrl: (s as any).logoUrl,
    tagline: (s as any).tagline,
  };
}

/**
 * Default tournament sponsors list.
 * Initialized to empty array so mock sponsors (e.g. Kotak) do not appear
 * unless real sponsors exist in the database.
 */
export const DEFAULT_TOURNAMENT_SPONSORS: TournamentSponsor[] = [];
