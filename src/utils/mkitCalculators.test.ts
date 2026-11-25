import { describe, it, expect } from 'vitest';
import {
  calculateEmi,
  calculateSip,
  calculateLumpsum,
  calculateFuelTrip,
  calculateMileage,
  calculateBillSplit,
  generatePassword,
  calculatePaintEstimator,
  calculateElectricityCost,
  calculateStaffSalary,
  convertArea,
} from './mkitCalculators';

describe('mkitCalculators', () => {
  describe('calculateEmi', () => {
    it('calculates standard loan EMI correctly', () => {
      // 10 Lakhs, 8.5% annual interest, 20 years (240 months)
      const res = calculateEmi(1000000, 8.5, 240);
      expect(res.monthlyEmi).toBe(8678);
      expect(res.totalPayment).toBe(2082776);
      expect(res.totalInterest).toBe(1082776);
      expect(res.yearlySchedule.length).toBe(20);
    });

    it('handles zero interest rate', () => {
      const res = calculateEmi(120000, 0, 12);
      expect(res.monthlyEmi).toBe(10000);
      expect(res.totalInterest).toBe(0);
      expect(res.totalPayment).toBe(120000);
    });
  });

  describe('calculateSip', () => {
    it('calculates monthly SIP maturity value accurately', () => {
      // ₹10,000 / month, 12% return, 10 years
      const res = calculateSip(10000, 12, 10);
      expect(res.investedAmount).toBe(1200000);
      // Expected formula: 10000 * ((1.01^120 - 1) / 0.01) * 1.01 ~= 2,323,391
      expect(res.totalMaturityValue).toBeGreaterThan(2300000);
      expect(res.totalMaturityValue).toBeLessThan(2350000);
      expect(res.estimatedReturns).toBe(res.totalMaturityValue - res.investedAmount);
      expect(res.yearlyBreakdown.length).toBe(10);
    });
  });

  describe('calculateLumpsum', () => {
    it('calculates lumpsum compounding returns', () => {
      // ₹1,00,000 at 10% for 5 years = 100000 * 1.1^5 = 161,051
      const res = calculateLumpsum(100000, 10, 5);
      expect(res.investedAmount).toBe(100000);
      expect(res.totalMaturityValue).toBe(161051);
      expect(res.estimatedReturns).toBe(61051);
    });
  });

  describe('calculateFuelTrip & calculateMileage', () => {
    it('calculates trip fuel cost and split per passenger', () => {
      // 300 km trip, 15 km/l mileage, ₹100 / liter, 4 people
      const res = calculateFuelTrip(300, 15, 100, 4);
      expect(res.fuelNeededLiters).toBe(20);
      expect(res.totalCost).toBe(2000);
      expect(res.costPerPerson).toBe(500);
      expect(res.costPerKm).toBe(6.67);
    });

    it('calculates mileage correctly', () => {
      expect(calculateMileage(450, 30)).toBe(15);
    });
  });

  describe('calculateBillSplit', () => {
    it('splits bill equally with tax and tip', () => {
      const res = calculateBillSplit({
        billAmount: 2000,
        tipPercent: 10, // 200
        taxPercent: 5,  // 100
        passengersOrPeopleCount: 4,
      });

      expect(res.baseAmount).toBe(2000);
      expect(res.tipAmount).toBe(200);
      expect(res.taxAmount).toBe(100);
      expect(res.grandTotal).toBe(2300);
      expect(res.equalSplitPerPerson).toBe(575);
      expect(res.members.length).toBe(4);
      expect(res.shareableSummary).toContain('ManaKit Bill Breakdown');
    });
  });

  describe('generatePassword', () => {
    it('generates secure password matching criteria', () => {
      const res = generatePassword({
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      });

      expect(res.password.length).toBe(20);
      expect(res.entropyBits).toBeGreaterThan(60);
      expect(['Strong', 'Very Strong']).toContain(res.strength);
    });
  });

  describe('calculatePaintEstimator', () => {
    it('estimates paint volume and costs for room', () => {
      // 12 x 10 room, 10 ft height, 1 door (21 sq ft), 1 window (12 sq ft)
      // Gross wall area = 2 * (12+10) * 10 = 440 sq ft
      // Deductions = 33 sq ft
      // Net = 407 sq ft * 2 coats = 814 sq ft
      // At 120 sq ft/L = 6.78 L -> rounds to 6.8 L
      const res = calculatePaintEstimator({
        lengthFeet: 12,
        widthFeet: 10,
        heightFeet: 10,
        doorsCount: 1,
        windowsCount: 1,
        coatsCount: 2,
        coverageSqFtPerLiter: 120,
        costPerLiter: 400,
      });

      expect(res.grossWallAreaSqFt).toBe(440);
      expect(res.deductionsSqFt).toBe(33);
      expect(res.netAreaSqFt).toBe(407);
      expect(res.totalPaintAreaSqFt).toBe(814);
      expect(res.litersRequired).toBe(6.8);
      expect(res.estimatedCost).toBe(2720);
    });
  });

  describe('calculateElectricityCost', () => {
    it('calculates daily, monthly and annual electricity cost', () => {
      const appliances = [
        { id: '1', name: 'AC', powerWatts: 1500, hoursPerDay: 8, quantity: 1 }, // 12 kWh/day
        { id: '2', name: 'Fan', powerWatts: 80, hoursPerDay: 10, quantity: 2 },  // 1.6 kWh/day
      ];
      // Total = 13.6 kWh/day
      // Monthly = 408 kWh
      // At ₹7/unit = ₹2,856
      const res = calculateElectricityCost(appliances, 7);
      expect(res.dailyUnitsKwh).toBe(13.6);
      expect(res.monthlyUnitsKwh).toBe(408);
      expect(res.monthlyBill).toBe(2856);
      expect(res.applianceBreakdown.length).toBe(2);
    });
  });

  describe('calculateStaffSalary', () => {
    it('computes pro-rata deductions and advances accurately', () => {
      // Monthly = 9,000, 30 days -> 300/day
      // 4 leaves taken with 2 allowed paid -> 2 unpaid leaves = 600 deduction
      // Advance = 1,000
      // Net = 9,000 - 600 - 1,000 = 7,400
      const res = calculateStaffSalary({
        staffName: 'Lakshmi',
        role: 'Cook',
        monthlySalary: 9000,
        totalDaysInMonth: 30,
        paidLeavesAllowed: 2,
        leavesTaken: 4,
        advancePaid: 1000,
      });

      expect(res.dailyWage).toBe(300);
      expect(res.unpaidLeaves).toBe(2);
      expect(res.leaveDeduction).toBe(600);
      expect(res.netPayable).toBe(7400);
      expect(res.shareableSalarySlip).toContain('ManaKit Staff Salary Slip');
    });
  });

  describe('convertArea', () => {
    it('accurately converts Indian land units across states', () => {
      // 1 Guntha = 1089 sq ft
      const res = convertArea(1, 'guntha');
      expect(res.sqft).toBe(1089);
      expect(res.guntha).toBe(1);
      // 1089 / 9 = 121 sq yards
      expect(res.sqyd).toBe(121);
      // 1089 / 435.6 = 2.5 cents
      expect(res.cent).toBe(2.5);
    });
  });
});
