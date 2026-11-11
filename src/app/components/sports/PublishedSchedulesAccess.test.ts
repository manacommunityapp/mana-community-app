import { describe, it, expect } from 'vitest';

export function resolveScheduleTab(
  tabParam: string | null,
  isSportsAdminOnly: boolean,
  isAdmin: boolean,
  hasEventId: boolean
): string {
  if ((tabParam === 'published' || tabParam === 'schedule' || tabParam === 'fixtures') && isSportsAdminOnly) {
    return 'Published Schedules';
  }
  if (tabParam === 'setup' && isAdmin) return 'Setup Schedule';
  if (tabParam === 'config' && isAdmin) return 'Config';
  if (tabParam === 'manual' && isAdmin) return 'Manual';
  if (hasEventId && isAdmin) return 'Setup Schedule';
  return 'Overview';
}

export function isSportsAdminRole(userRoleSet: Set<string>): boolean {
  return (
    userRoleSet.has('SPORTS_ADMIN') ||
    userRoleSet.has('SUPER_ADMIN') ||
    userRoleSet.has('SUPERADMIN') ||
    userRoleSet.has('SUPER_ADMINISTRATOR') ||
    userRoleSet.has('ADMIN') ||
    userRoleSet.has('COMMUNITY_ADMIN') ||
    userRoleSet.has('COMMUNITYADMIN') ||
    userRoleSet.has('COMMUNITY_ADMINISTRATOR')
  );
}

describe('Published Schedules Access Control', () => {
  it('allows Admin and Sports Admin to resolve Published Schedules from tabParam', () => {
    expect(resolveScheduleTab('published', true, true, false)).toBe('Published Schedules');
    expect(resolveScheduleTab('schedule', true, true, false)).toBe('Published Schedules');
    expect(resolveScheduleTab('fixtures', true, true, false)).toBe('Published Schedules');
  });

  it('prevents regular users/residents from resolving Published Schedules from tabParam', () => {
    expect(resolveScheduleTab('published', false, false, false)).toBe('Overview');
    expect(resolveScheduleTab('schedule', false, false, false)).toBe('Overview');
    expect(resolveScheduleTab('fixtures', false, false, false)).toBe('Overview');
  });

  it('identifies Admin and Sports Admin roles correctly', () => {
    expect(isSportsAdminRole(new Set(['SPORTS_ADMIN']))).toBe(true);
    expect(isSportsAdminRole(new Set(['COMMUNITY_ADMIN']))).toBe(true);
    expect(isSportsAdminRole(new Set(['ADMIN']))).toBe(true);
    expect(isSportsAdminRole(new Set(['SUPER_ADMIN']))).toBe(true);
    expect(isSportsAdminRole(new Set(['RESIDENT']))).toBe(false);
    expect(isSportsAdminRole(new Set(['MEMBER']))).toBe(false);
    expect(isSportsAdminRole(new Set(['USER']))).toBe(false);
  });
});

export function getEligibleConfigActions(status: string): { canEdit: boolean; canPublish: boolean; canDelete: boolean } {
  const isDraft = status.toUpperCase() === 'DRAFT';
  return {
    canEdit: true,
    canPublish: isDraft,
    canDelete: isDraft,
  };
}

export interface TestMatchFixture {
  matchId: number;
  configId: number;
  configStatus: string;
  status: string;
}

export function filterFixturesForViewer(fixtures: TestMatchFixture[], isAdmin: boolean): TestMatchFixture[] {
  if (isAdmin) return fixtures;
  return fixtures.filter(f => f.configStatus.toUpperCase() !== 'DRAFT' && f.status.toUpperCase() !== 'DRAFT');
}

export function filterConfigsForViewer<T extends { status: string }>(configs: T[], isAdmin: boolean): T[] {
  if (isAdmin) return configs;
  return configs.filter(c => c.status.toUpperCase() !== 'DRAFT');
}

describe('Tournament Configuration Draft Lifecycle & Action Permissions', () => {
  it('allows Publish and Delete ONLY for DRAFT tournament configurations', () => {
    const draftActions = getEligibleConfigActions('DRAFT');
    expect(draftActions.canEdit).toBe(true);
    expect(draftActions.canPublish).toBe(true);
    expect(draftActions.canDelete).toBe(true);
  });

  it('disallows Publish and Delete for ACTIVE, LIVE, and COMPLETED configurations', () => {
    for (const status of ['ACTIVE', 'LIVE', 'COMPLETED', 'CANCELLED']) {
      const actions = getEligibleConfigActions(status);
      expect(actions.canEdit).toBe(true);
      expect(actions.canPublish).toBe(false);
      expect(actions.canDelete).toBe(false);
    }
  });
});

describe('Player Match Fixture Visibility Restrictions', () => {
  const sampleConfigs = [
    { id: 1, name: 'Box Cricket Cup', status: 'DRAFT' },
    { id: 2, name: 'Badminton League', status: 'ACTIVE' },
    { id: 3, name: 'Table Tennis Open', status: 'COMPLETED' },
  ];

  const sampleFixtures: TestMatchFixture[] = [
    { matchId: 101, configId: 1, configStatus: 'DRAFT', status: 'DRAFT' },
    { matchId: 102, configId: 1, configStatus: 'DRAFT', status: 'SCHEDULED' },
    { matchId: 201, configId: 2, configStatus: 'ACTIVE', status: 'PUBLISHED' },
    { matchId: 202, configId: 2, configStatus: 'ACTIVE', status: 'DRAFT' },
    { matchId: 301, configId: 3, configStatus: 'COMPLETED', status: 'COMPLETED' },
  ];

  it('hides all draft configs from non-admin players and residents', () => {
    const playerConfigs = filterConfigsForViewer(sampleConfigs, false);
    expect(playerConfigs.map(c => c.id)).toEqual([2, 3]);
    expect(playerConfigs.some(c => c.status === 'DRAFT')).toBe(false);
  });

  it('allows admins to view draft configs for configuration management', () => {
    const adminConfigs = filterConfigsForViewer(sampleConfigs, true);
    expect(adminConfigs.map(c => c.id)).toEqual([1, 2, 3]);
  });

  it('hides match fixtures from draft configurations or with draft status from players', () => {
    const playerFixtures = filterFixturesForViewer(sampleFixtures, false);
    expect(playerFixtures.map(f => f.matchId)).toEqual([201, 301]);
    expect(playerFixtures.every(f => f.configStatus !== 'DRAFT' && f.status !== 'DRAFT')).toBe(true);
  });

  it('retains all fixtures for organizers and admins', () => {
    const adminFixtures = filterFixturesForViewer(sampleFixtures, true);
    expect(adminFixtures.length).toBe(5);
  });
});

