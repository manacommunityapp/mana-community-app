import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  synthesizeDobFromAge,
  checkCategoryEligibility,
  getEventCategories,
  findBestEligibleCategory,
} from './SportsMultiRegister';
import type { PlayerCategory } from '../../../services/sports/sportsEventService';

describe('SportsMultiRegister - Age Calculation & Synthesis', () => {
  it('calculates age correctly from DOB string', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 15;
    const dob = `${birthYear}-01-01`;
    expect(calculateAge(dob)).toBe(15);
  });

  it('falls back to explicitAge when DOB string is empty or missing', () => {
    expect(calculateAge('', 12)).toBe(12);
    expect(calculateAge(null, 14)).toBe(14);
    expect(calculateAge(undefined, 8)).toBe(8);
  });

  it('synthesizes a valid DOB from given age number and maintains consistent age', () => {
    const age = 11;
    const synthesizedDob = synthesizeDobFromAge(age);
    const calculated = calculateAge(synthesizedDob);
    expect(calculated).toBe(age);
  });
});

describe('SportsMultiRegister - Category Pool & Age Bracket Resolution', () => {
  const sampleCategories: PlayerCategory[] = [
    { id: 101, name: 'Kids U-14', minAge: 5, maxAge: 14, gender: 'ALL' },
    { id: 102, name: 'Youth U-18', minAge: 15, maxAge: 18, gender: 'ALL' },
    { id: 103, name: 'Men Open', minAge: 18, maxAge: 50, gender: 'MALE' },
    { id: 104, name: 'Women Open', minAge: 18, maxAge: 50, gender: 'FEMALE' },
    { id: 105, name: 'Veterans 50+', minAge: 50, maxAge: 99, gender: 'ALL' },
  ];

  it('returns all applicable categories for generic event rather than truncating to 1', () => {
    const pool = getEventCategories(sampleCategories, 'Badminton', 'Badminton Singles');
    expect(pool.length).toBeGreaterThan(1);
    expect(pool.map(c => c.name)).toContain('Kids U-14');
    expect(pool.map(c => c.name)).toContain('Men Open');
  });

  it('picks Kids U-14 for a 12-year-old boy in Badminton', () => {
    const best = findBestEligibleCategory(sampleCategories, 'Badminton', 12, 'MALE', 'Badminton Singles');
    expect(best).toBeDefined();
    expect(best?.name).toBe('Kids U-14');

    const elig = checkCategoryEligibility(best, 12, 'MALE');
    expect(elig.eligible).toBe(true);
  });

  it('picks Men Open for a 28-year-old male participant', () => {
    const best = findBestEligibleCategory(sampleCategories, 'Badminton', 28, 'MALE', 'Badminton Singles');
    expect(best).toBeDefined();
    expect(best?.name).toBe('Men Open');

    const elig = checkCategoryEligibility(best, 28, 'MALE');
    expect(elig.eligible).toBe(true);
  });

  it('picks Women Open for a 28-year-old female participant', () => {
    const best = findBestEligibleCategory(sampleCategories, 'Badminton', 28, 'FEMALE', 'Badminton Singles');
    expect(best).toBeDefined();
    expect(best?.name).toBe('Women Open');

    const elig = checkCategoryEligibility(best, 28, 'FEMALE');
    expect(elig.eligible).toBe(true);
  });

  it('accurately reports ineligibility when child attempts adult category', () => {
    const adultCat = sampleCategories.find(c => c.name === 'Men Open');
    const result = checkCategoryEligibility(adultCat, 12, 'MALE');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('below min required age');
  });
});
