import { apiClient } from "../common/apiClient";

export interface CheckoutOptions {
  gatewayOptions: string[];
  manualPaymentEnabled: boolean;
  manualPaymentModes: string[];
  defaultGateway: string;
  paymentInstructions: string | null;
  convenienceFeePercent: number;
  maxTransactionAmount: number | null;
}

export interface PlatformPaymentConfig {
  id: number;
  cashfreeEnabled: boolean;
  razorpayEnabled: boolean;
  manaPayEnabled: boolean;
  bbpsEnabled: boolean;
  defaultGateway: string;
  convenienceFeePercent: number;
  maxTransactionAmount: number | null;
  updatedAt: string;
}

export interface UpdatePlatformPaymentConfigRequest {
  cashfreeEnabled?: boolean;
  razorpayEnabled?: boolean;
  manaPayEnabled?: boolean;
  bbpsEnabled?: boolean;
  defaultGateway?: string;
  convenienceFeePercent?: string;
  maxTransactionAmount?: string | null;
}

export interface CommunityPaymentSettings {
  allowedPaymentGateways: string[];
  manualPaymentEnabled: boolean;
  manualPaymentModes: string[];
  paymentInstructions: string | null;
  defaultGateway: string | null;
  cashierCanRecordPayment: boolean;
  fallbackGateway: string | null;
}

export interface UpdateCommunityPaymentSettingsRequest {
  allowedPaymentGateways?: string[];
  manualPaymentEnabled?: boolean;
  manualPaymentModes?: string[];
  paymentInstructions?: string | null;
  defaultGateway?: string | null;
  cashierCanRecordPayment?: boolean;
  fallbackGateway?: string | null;
}

export const paymentConfigService = {
  async getCheckoutOptions(): Promise<CheckoutOptions> {
    return apiClient.get<CheckoutOptions>("/payments/checkout-options");
  },

  async getPlatformConfig(): Promise<PlatformPaymentConfig> {
    return apiClient.get<PlatformPaymentConfig>("/admin/payment-config");
  },

  async updatePlatformConfig(
    config: UpdatePlatformPaymentConfigRequest
  ): Promise<PlatformPaymentConfig> {
    return apiClient.put<PlatformPaymentConfig>("/admin/payment-config", config);
  },

  async getCommunityPaymentSettings(): Promise<CommunityPaymentSettings> {
    return apiClient.get<CommunityPaymentSettings>("/community/payment-settings");
  },

  async updateCommunityPaymentSettings(
    settings: UpdateCommunityPaymentSettingsRequest
  ): Promise<CommunityPaymentSettings> {
    return apiClient.put<CommunityPaymentSettings>("/community/payment-settings", settings);
  },
};
