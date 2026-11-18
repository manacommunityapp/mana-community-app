import { describe, it, expect } from 'vitest';
import { isSportsNavItemVisible, sportsNav, type SportsNavFilterContext } from './SportsLayout';
import { VIEW_SPORTS_MAIN, VIEW_EVENT_REGISTRATIONS } from '../../../constants/permissions';

describe('SportsLayout Navigation Access Control', () => {
  const restrictedMenus = [
    'Messages',
    'Insurance',
    'Trainers',
    'Feed',
    'Badges',
    'Find Players',
  ];

  const createMockContext = (overrides?: Partial<SportsNavFilterContext>): SportsNavFilterContext => ({
    hasPermission: (perm: string) => perm === VIEW_SPORTS_MAIN || perm === VIEW_EVENT_REGISTRATIONS,
    hasAnyPermission: () => true,
    isAdmin: false,
    isSuperAdmin: false,
    isSportsAdmin: false,
    ...overrides,
  });

  describe('Regular user (non-superadmin)', () => {
    it('hides all 6 restricted sub-menus for normal users even if they have VIEW_SPORTS_MAIN permission', () => {
      const userCtx = createMockContext({
        isAdmin: false,
        isSuperAdmin: false,
        isSportsAdmin: false,
      });

      for (const menuLabel of restrictedMenus) {
        expect(
          isSportsNavItemVisible(menuLabel, userCtx)
        ).toBe(false);
      }
    });

    it('still shows Dashboard, Schedule, and My Teams to users with permissions', () => {
      const userCtx = createMockContext({
        isAdmin: false,
        isSuperAdmin: false,
        isSportsAdmin: false,
      });

      expect(isSportsNavItemVisible('Dashboard', userCtx)).toBe(true);
      expect(isSportsNavItemVisible('Schedule', userCtx)).toBe(true);
      expect(isSportsNavItemVisible('My Teams', userCtx)).toBe(true);
    });
  });

  describe('Admin / Sports Admin (non-superadmin)', () => {
    it('hides all 6 restricted sub-menus for Community Admin when isSuperAdmin is false', () => {
      const adminCtx = createMockContext({
        isAdmin: true,
        isSuperAdmin: false,
        isSportsAdmin: false,
      });

      for (const menuLabel of restrictedMenus) {
        expect(
          isSportsNavItemVisible(menuLabel, adminCtx)
        ).toBe(false);
      }
    });

    it('hides all 6 restricted sub-menus for Sports Admin when isSuperAdmin is false', () => {
      const sportsAdminCtx = createMockContext({
        isAdmin: false,
        isSuperAdmin: false,
        isSportsAdmin: true,
      });

      for (const menuLabel of restrictedMenus) {
        expect(
          isSportsNavItemVisible(menuLabel, sportsAdminCtx)
        ).toBe(false);
      }
    });
  });

  describe('Super Admin', () => {
    it('shows all 6 restricted sub-menus when isSuperAdmin is true', () => {
      const superAdminCtx = createMockContext({
        isAdmin: true,
        isSuperAdmin: true,
        isSportsAdmin: true,
      });

      for (const menuLabel of restrictedMenus) {
        expect(
          isSportsNavItemVisible(menuLabel, superAdminCtx)
        ).toBe(true);
      }
    });

    it('filters sportsNav array correctly for regular user vs super admin', () => {
      const userCtx = createMockContext({ isSuperAdmin: false });
      const superAdminCtx = createMockContext({ isSuperAdmin: true });

      const userVisibleLabels = sportsNav
        .filter((nav) => isSportsNavItemVisible(nav.label, userCtx))
        .map((nav) => nav.label);

      const superAdminVisibleLabels = sportsNav
        .filter((nav) => isSportsNavItemVisible(nav.label, superAdminCtx))
        .map((nav) => nav.label);

      for (const menuLabel of restrictedMenus) {
        expect(userVisibleLabels).not.toContain(menuLabel);
        expect(superAdminVisibleLabels).toContain(menuLabel);
      }
    });
  });
});
