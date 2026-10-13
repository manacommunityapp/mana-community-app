import { describe, it, expect } from 'vitest';
import { offersApi } from './offersApi';

describe('OffersApiService Comprehensive Lifecycle Tests', () => {
  it('fetches categories and offers successfully', async () => {
    const categories = await offersApi.getCategories();
    expect(categories.length).toBeGreaterThan(0);

    const offers = await offersApi.getOffers('comm-mana-residency');
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0]).toHaveProperty('id');
    expect(offers[0]).toHaveProperty('title');
  });

  it('validates and applies coupons with limits and rules', async () => {
    const coupons = await offersApi.getCoupons();
    expect(coupons.length).toBeGreaterThan(0);

    // Below min order
    const belowMin = await offersApi.validateCoupon({
      code: 'MANA20',
      orderAmount: 200,
      residentUserId: 'user-sandeep',
    });
    expect(belowMin.valid).toBe(false);
    expect(belowMin.message).toContain('Minimum order');

    // Valid order
    const valid = await offersApi.validateCoupon({
      code: 'MANA20',
      orderAmount: 500,
      residentUserId: 'user-sandeep',
    });
    expect(valid.valid).toBe(true);
    // 20% of 500 = 100
    expect(valid.calculatedDiscount).toBe(100);
    expect(valid.finalPayableAmount).toBe(400);

    // Flat discount
    const flat = await offersApi.validateCoupon({
      code: 'FESTIVE100',
      orderAmount: 600,
      residentUserId: 'user-sandeep',
    });
    expect(flat.valid).toBe(true);
    expect(flat.calculatedDiscount).toBe(100);
    expect(flat.finalPayableAmount).toBe(500);
  });

  it('verifies QR voucher status before and after redemption', async () => {
    // Verify valid unredeemed voucher
    const qrResult = await offersApi.verifyQr('MANA-8F29K');
    expect(qrResult.valid).toBe(true);
    expect(qrResult.alreadyRedeemed).toBe(false);
    expect(qrResult.residentUserId).toBe('user-sandeep');

    // Verify already redeemed voucher
    const redeemedQr = await offersApi.verifyQr('MANA-4Q71P');
    expect(redeemedQr.valid).toBe(false);
    expect(redeemedQr.alreadyRedeemed).toBe(true);
  });

  it('supports merchant verification and KYC submission', async () => {
    const kyc = await offersApi.submitMerchantKyc('biz-dental', {
      registeredEntityName: 'ABC Healthcare Pvt Ltd',
      gstin: '36AABCU9603R1ZM',
      bankAccountNumber: '91998877665501',
      bankIfscCode: 'HDFC0001234',
    });
    expect(kyc.verificationStatus).toBe('PENDING');

    const verified = await offersApi.verifyMerchant('biz-dental', {
      status: 'VERIFIED',
      partnershipTier: 'PLATINUM_PARTNER',
    });
    expect(verified.verificationStatus).toBe('VERIFIED');
    expect(verified.partnershipTier).toBe('PLATINUM_PARTNER');
  });

  it('calculates campaign analytics and settlements', async () => {
    const analytics = await offersApi.getDealAnalytics('deal-dental-consult');
    expect(analytics.offerId).toBe('deal-dental-consult');
    expect(analytics.totalSalesGmv).toBeGreaterThan(0);
    expect(analytics.platformCommissionEarned).toBeGreaterThan(0);

    const settlements = await offersApi.getSettlements('biz-dental');
    expect(settlements.length).toBeGreaterThan(0);
    expect(settlements[0].netPayoutAmount).toBeGreaterThan(0);
    expect(settlements[0].status).toBe('SETTLED');

    const commissions = await offersApi.getCommissions('biz-dental');
    expect(commissions.length).toBeGreaterThan(0);
    expect(commissions[0].commissionAmount).toBe(30);
  });
});
