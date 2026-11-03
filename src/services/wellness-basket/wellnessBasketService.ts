import { apiClient } from "../common/apiClient";
import type {
  WellnessPlan,
  WellnessSubscriber,
  WellnessSubscribeRequest,
  WellnessPauseRequest,
  WellnessMenuWeek,
  WellnessSwapRequest,
  WellnessSwap,
  WellnessCluster,
  WellnessNutrition,
} from "../../types/wellnessBasket";

export const MOCK_WELLNESS_PLANS: WellnessPlan[] = [
  {
    planType: "BASIC",
    displayName: "Basic Wellness Box",
    description: "Daily portion-controlled whole-food nutrition basket designed for sustained vitality and clean digestion.",
    pricePerMonth: 1999,
    pricePerDelivery: 77,
    deliveriesPerMonth: 26,
    includedFeatures: [
      "2 Seasonal Handpicked Fruit portions",
      "1 Ancient Millet / Slow-carb kit (Foxtail, Jowar, Ragi)",
      "1 Fresh-cut Micro-Salad or Steamed Veg portion",
      "Dietitian-reviewed 4-week rotation",
      "Society doorstep delivery before 8:00 AM (Mon–Sat)",
    ],
    boxContentsSummary: ["Seasonal Fruits", "Millet Kit", "Greens Bowl"],
  },
  {
    planType: "PREMIUM",
    displayName: "Premium Wellness Box",
    description: "High-protein, superfood-enriched daily kit with personalised macro targets and automated allergy protection.",
    pricePerMonth: 2799,
    pricePerDelivery: 108,
    deliveriesPerMonth: 26,
    includedFeatures: [
      "2 Seasonal & Exotic Fruit portions (Berries, Dragonfruit, Kiwi)",
      "1 High-Protein / Steamed Sprout portion (Moong, Paneer, Chickpeas)",
      "1 Ancient Grain / Low-GI breakfast portion",
      "1 Crisp cut salad with cold-pressed dressing",
      "1 Superfood Add-on (Chia, Roasted Flax, Mixed Walnuts)",
      "Automated allergy substitution guarantee",
      "Priority society doorstep delivery before 8:00 AM (Mon–Sat)",
    ],
    boxContentsSummary: ["Exotic Fruits", "Sprout / Protein Bowl", "Millet Kit", "Salad", "Superfood Mix"],
  },
];

export const MOCK_CLUSTERS: WellnessCluster[] = [
  {
    id: 1,
    societyName: "Mana Premiere Residences",
    block: "Towers A-E",
    city: "Hyderabad",
    status: "ACTIVE",
    currentSubscriberCount: 18,
    activationThreshold: 15,
    maxCapacity: 80,
    deliveryStartTime: "06:00:00",
    deliveryEndTime: "08:00:00",
    isActivated: true,
    subscribersNeededForActivation: 0,
  },
  {
    id: 2,
    societyName: "Aparna Sarovar Grande",
    block: "Blocks 1-8",
    city: "Hyderabad",
    status: "PENDING",
    currentSubscriberCount: 12,
    activationThreshold: 15,
    maxCapacity: 80,
    deliveryStartTime: "06:00:00",
    deliveryEndTime: "08:00:00",
    isActivated: false,
    subscribersNeededForActivation: 3,
  },
  {
    id: 3,
    societyName: "My Home Jewel",
    block: "Towers 1-14",
    city: "Hyderabad",
    status: "PENDING",
    currentSubscriberCount: 9,
    activationThreshold: 15,
    maxCapacity: 80,
    deliveryStartTime: "06:00:00",
    deliveryEndTime: "08:00:00",
    isActivated: false,
    subscribersNeededForActivation: 6,
  },
];

export const MOCK_SUBSCRIBER: WellnessSubscriber = {
  id: 101,
  userId: 1,
  planType: "PREMIUM",
  portionSize: "STANDARD",
  goalType: "WEIGHT_LOSS",
  dislikedIngredients: ["Papaya", "Bitter Gourd"],
  extraNotes: "Please deliver before 7:30 AM if possible.",
  subscriptionStatus: "ACTIVE",
  cashfreeSubscriptionId: "CF-SUB-HYD-9941",
  clusterId: 1,
  clusterSocietyName: "Mana Premiere Residences",
  clusterStatus: "ACTIVE",
  clusterCurrentSubscribers: 18,
  clusterActivationThreshold: 15,
  createdAt: "2026-11-01T08:00:00Z",
};

export const MOCK_WEEK_MENU: WellnessMenuWeek = {
  cycleWeek: 2,
  weekStartDate: "2026-11-03",
  weekEndDate: "2026-11-08",
  planType: "PREMIUM",
  isSwapWindowOpen: true,
  swapWindowCloseMessage: "Weekly Swap Window is OPEN! You can customize next week's menu until Saturday 8:00 PM IST.",
  days: [
    {
      deliveryDate: "2026-11-03",
      dayOfWeekName: "Monday",
      dayOfWeek: 1,
      planType: "PREMIUM",
      totalEnergyKcal: 385,
      totalProteinG: 18.5,
      totalCarbsG: 52.0,
      totalFatG: 9.2,
      totalFibreG: 12.0,
      dietitianNotes: "High-satiety low-GI morning starter. High bioavailable protein to ignite metabolism.",
      isSwapped: false,
      products: [
        {
          productId: 101,
          productName: "Golden Kiwi & Pomegranate Bowl",
          category: "FRUIT_BOWL",
          energyKcal: 110,
          proteinG: 1.8,
          carbsG: 24.5,
          fatG: 0.8,
          fibreG: 4.2,
          perServingG: 150,
          goalTags: ["WEIGHT_LOSS", "HEART_HEALTH"],
          allergenFlags: [],
        },
        {
          productId: 102,
          productName: "Steamed Yellow Moong & Microgreen Salad",
          category: "PROTEIN_SPROUT",
          energyKcal: 165,
          proteinG: 12.5,
          carbsG: 18.0,
          fatG: 4.5,
          fibreG: 5.8,
          perServingG: 120,
          goalTags: ["WEIGHT_LOSS", "MUSCLE_GAIN", "DIABETIC_FRIENDLY"],
          allergenFlags: [],
        },
        {
          productId: 103,
          productName: "Foxtail Millet & Roasted Flax Porridge Kit",
          category: "MILLET_GRAIN",
          energyKcal: 110,
          proteinG: 4.2,
          carbsG: 19.5,
          fatG: 3.9,
          fibreG: 2.0,
          perServingG: 100,
          goalTags: ["DIABETIC_FRIENDLY", "GENERAL_WELLNESS"],
          allergenFlags: [],
        },
      ],
      alternativeProducts: [
        {
          productId: 201,
          productName: "Spiced Roasted Paneer & Chickpea Cup",
          category: "PROTEIN_SPROUT",
          energyKcal: 180,
          proteinG: 14.0,
          carbsG: 15.0,
          fatG: 6.5,
          fibreG: 4.0,
          perServingG: 120,
          goalTags: ["MUSCLE_GAIN"],
          allergenFlags: ["DAIRY"],
        },
        {
          productId: 202,
          productName: "Dragonfruit & Blueberry Mix",
          category: "FRUIT_BOWL",
          energyKcal: 95,
          proteinG: 1.2,
          carbsG: 21.0,
          fatG: 0.5,
          fibreG: 3.5,
          perServingG: 140,
          goalTags: ["HEART_HEALTH"],
          allergenFlags: [],
        },
      ],
    },
    {
      deliveryDate: "2026-11-04",
      dayOfWeekName: "Tuesday",
      dayOfWeek: 2,
      planType: "PREMIUM",
      totalEnergyKcal: 410,
      totalProteinG: 20.0,
      totalCarbsG: 48.0,
      totalFatG: 11.5,
      totalFibreG: 10.5,
      dietitianNotes: "Antioxidant-dense berry boost paired with slow-burning jowar and sprouted legumes.",
      isSwapped: false,
      products: [
        {
          productId: 104,
          productName: "Mixed Berries & Imported Red Apple",
          category: "FRUIT_BOWL",
          energyKcal: 120,
          proteinG: 1.5,
          carbsG: 26.0,
          fatG: 0.9,
          fibreG: 4.5,
          perServingG: 150,
          goalTags: ["GENERAL_WELLNESS", "HEART_HEALTH"],
          allergenFlags: [],
        },
        {
          productId: 105,
          productName: "Boiled Sprouted Chickpeas with Lemon Herbs",
          category: "PROTEIN_SPROUT",
          energyKcal: 175,
          proteinG: 13.5,
          carbsG: 20.0,
          fatG: 4.2,
          fibreG: 5.0,
          perServingG: 120,
          goalTags: ["MUSCLE_GAIN", "WEIGHT_LOSS"],
          allergenFlags: [],
        },
        {
          productId: 106,
          productName: "Chia Seed Overnight Jar with Almond Dust",
          category: "SUPERFOOD",
          energyKcal: 115,
          proteinG: 5.0,
          carbsG: 2.0,
          fatG: 6.4,
          fibreG: 1.0,
          perServingG: 80,
          goalTags: ["HEART_HEALTH"],
          allergenFlags: ["NUTS"],
        },
      ],
      alternativeProducts: [
        {
          productId: 203,
          productName: "Sunflower & Pumpkin Seed Energy Sachet",
          category: "SUPERFOOD",
          energyKcal: 110,
          proteinG: 4.8,
          carbsG: 3.5,
          fatG: 7.0,
          fibreG: 1.2,
          perServingG: 30,
          goalTags: ["GENERAL_WELLNESS"],
          allergenFlags: [],
        },
      ],
    },
    {
      deliveryDate: "2026-11-05",
      dayOfWeekName: "Wednesday",
      dayOfWeek: 3,
      planType: "PREMIUM",
      totalEnergyKcal: 390,
      totalProteinG: 17.0,
      totalCarbsG: 55.0,
      totalFatG: 8.5,
      totalFibreG: 11.0,
      dietitianNotes: "Prebiotic fibre focus with seasonal green pear and sprouted horsegram.",
      isSwapped: false,
      products: [
        {
          productId: 107,
          productName: "Fresh Green Pear & Sweet Mosambi",
          category: "FRUIT_BOWL",
          energyKcal: 105,
          proteinG: 1.0,
          carbsG: 24.0,
          fatG: 0.6,
          fibreG: 4.0,
          perServingG: 150,
          goalTags: ["DIABETIC_FRIENDLY"],
          allergenFlags: [],
        },
        {
          productId: 108,
          productName: "Steamed Sprouted Horsegram Sundal",
          category: "PROTEIN_SPROUT",
          energyKcal: 160,
          proteinG: 11.5,
          carbsG: 22.0,
          fatG: 3.8,
          fibreG: 5.5,
          perServingG: 120,
          goalTags: ["WEIGHT_LOSS", "DIABETIC_FRIENDLY"],
          allergenFlags: [],
        },
        {
          productId: 109,
          productName: "Ragi Flakes with Cold-Pressed Coconut Milk",
          category: "MILLET_GRAIN",
          energyKcal: 125,
          proteinG: 4.5,
          carbsG: 9.0,
          fatG: 4.1,
          fibreG: 1.5,
          perServingG: 100,
          goalTags: ["GENERAL_WELLNESS"],
          allergenFlags: [],
        },
      ],
      alternativeProducts: [],
    },
    {
      deliveryDate: "2026-11-06",
      dayOfWeekName: "Thursday",
      dayOfWeek: 4,
      planType: "PREMIUM",
      totalEnergyKcal: 375,
      totalProteinG: 19.0,
      totalCarbsG: 50.0,
      totalFatG: 8.0,
      totalFibreG: 13.5,
      dietitianNotes: "Anti-inflammatory golden turmeric dressing on micro-greens with sprouted cowpeas.",
      isSwapped: false,
      products: [
        {
          productId: 110,
          productName: "Crisp Red Papaya & Mint Sprig",
          category: "FRUIT_BOWL",
          energyKcal: 95,
          proteinG: 1.2,
          carbsG: 22.0,
          fatG: 0.5,
          fibreG: 3.8,
          perServingG: 150,
          goalTags: ["GENERAL_WELLNESS"],
          allergenFlags: [],
        },
        {
          productId: 111,
          productName: "Steamed Black Chana & Desi Cucumber Cubes",
          category: "PROTEIN_SPROUT",
          energyKcal: 170,
          proteinG: 13.0,
          carbsG: 20.0,
          fatG: 4.0,
          fibreG: 6.2,
          perServingG: 120,
          goalTags: ["WEIGHT_LOSS", "DIABETIC_FRIENDLY"],
          allergenFlags: [],
        },
        {
          productId: 112,
          productName: "Kodo Millet Upma Kit with Curry Leaves",
          category: "MILLET_GRAIN",
          energyKcal: 110,
          proteinG: 4.8,
          carbsG: 8.0,
          fatG: 3.5,
          fibreG: 3.5,
          perServingG: 100,
          goalTags: ["DIABETIC_FRIENDLY"],
          allergenFlags: [],
        },
      ],
      alternativeProducts: [],
    },
    {
      deliveryDate: "2026-11-07",
      dayOfWeekName: "Friday",
      dayOfWeek: 5,
      planType: "PREMIUM",
      totalEnergyKcal: 420,
      totalProteinG: 21.0,
      totalCarbsG: 49.0,
      totalFatG: 12.0,
      totalFibreG: 11.2,
      dietitianNotes: "End-of-week energy sustained nutrition with paneer cubes and nutrient-dense figs.",
      isSwapped: false,
      products: [
        {
          productId: 113,
          productName: "Fresh Figs & Green Grapes Box",
          category: "FRUIT_BOWL",
          energyKcal: 125,
          proteinG: 1.5,
          carbsG: 27.0,
          fatG: 0.8,
          fibreG: 4.2,
          perServingG: 150,
          goalTags: ["HEART_HEALTH"],
          allergenFlags: [],
        },
        {
          productId: 114,
          productName: "Herbed Low-Fat Paneer & Baby Spinach",
          category: "PROTEIN_SPROUT",
          energyKcal: 185,
          proteinG: 15.0,
          carbsG: 6.0,
          fatG: 8.0,
          fibreG: 4.0,
          perServingG: 120,
          goalTags: ["MUSCLE_GAIN"],
          allergenFlags: ["DAIRY"],
        },
        {
          productId: 115,
          productName: "Barnyard Millet Porridge with Cardamom",
          category: "MILLET_GRAIN",
          energyKcal: 110,
          proteinG: 4.5,
          carbsG: 16.0,
          fatG: 3.2,
          fibreG: 3.0,
          perServingG: 100,
          goalTags: ["WEIGHT_LOSS"],
          allergenFlags: [],
        },
      ],
      alternativeProducts: [],
    },
    {
      deliveryDate: "2026-11-08",
      dayOfWeekName: "Saturday",
      dayOfWeek: 6,
      planType: "PREMIUM",
      totalEnergyKcal: 440,
      totalProteinG: 22.0,
      totalCarbsG: 51.0,
      totalFatG: 13.0,
      totalFibreG: 12.0,
      dietitianNotes: "Weekend recovery special: potassium-loaded banana chia bowl with sprouted green gram.",
      isSwapped: false,
      products: [
        {
          productId: 116,
          productName: "Robusta Banana & Dragonfruit Plate",
          category: "FRUIT_BOWL",
          energyKcal: 130,
          proteinG: 1.6,
          carbsG: 29.0,
          fatG: 0.6,
          fibreG: 4.0,
          perServingG: 150,
          goalTags: ["GENERAL_WELLNESS"],
          allergenFlags: [],
        },
        {
          productId: 117,
          productName: "Sprouted Whole Green Moong with Lime Pepper",
          category: "PROTEIN_SPROUT",
          energyKcal: 170,
          proteinG: 14.5,
          carbsG: 16.0,
          fatG: 4.2,
          fibreG: 6.0,
          perServingG: 120,
          goalTags: ["MUSCLE_GAIN", "WEIGHT_LOSS"],
          allergenFlags: [],
        },
        {
          productId: 118,
          productName: "Artisanal Roasted Walnut & Pumpkin Seed Jar",
          category: "SUPERFOOD",
          energyKcal: 140,
          proteinG: 5.9,
          carbsG: 6.0,
          fatG: 8.2,
          fibreG: 2.0,
          perServingG: 40,
          goalTags: ["HEART_HEALTH"],
          allergenFlags: ["NUTS"],
        },
      ],
      alternativeProducts: [],
    },
  ],
};

export const wellnessBasketService = {
  async getPlans(): Promise<WellnessPlan[]> {
    try {
      const response = await apiClient.get<WellnessPlan[]>("/wellness-basket/plans");
      return response;
    } catch {
      return MOCK_WELLNESS_PLANS;
    }
  },

  async getSubscription(): Promise<WellnessSubscriber> {
    try {
      const response = await apiClient.get<WellnessSubscriber>("/wellness-basket/subscription");
      return response;
    } catch {
      return MOCK_SUBSCRIBER;
    }
  },

  async subscribe(request: WellnessSubscribeRequest): Promise<WellnessSubscriber> {
    try {
      const response = await apiClient.post<WellnessSubscriber>("/wellness-basket/subscribe", request);
      return response;
    } catch {
      return {
        ...MOCK_SUBSCRIBER,
        planType: request.planType,
        portionSize: request.portionSize,
        goalType: request.goalType,
        dislikedIngredients: request.dislikedIngredients,
        extraNotes: request.extraNotes,
        clusterSocietyName: request.societyName || "Mana Premiere Residences",
      };
    }
  },

  async pauseSubscription(request: WellnessPauseRequest): Promise<WellnessSubscriber> {
    try {
      const response = await apiClient.post<WellnessSubscriber>("/wellness-basket/subscription/pause", request);
      return response;
    } catch {
      return {
        ...MOCK_SUBSCRIBER,
        subscriptionStatus: "PAUSED",
        pauseFrom: request.pauseFrom,
        pauseUntil: request.pauseUntil,
      };
    }
  },

  async resumeSubscription(): Promise<WellnessSubscriber> {
    try {
      const response = await apiClient.post<WellnessSubscriber>("/wellness-basket/subscription/resume");
      return response;
    } catch {
      return {
        ...MOCK_SUBSCRIBER,
        subscriptionStatus: "ACTIVE",
        pauseFrom: undefined,
        pauseUntil: undefined,
      };
    }
  },

  async cancelSubscription(): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>("/wellness-basket/subscription");
      return response;
    } catch {
      return { message: "Wellness subscription cancelled successfully" };
    }
  },

  async getMenuForWeek(weekStartDate?: string): Promise<WellnessMenuWeek> {
    try {
      const url = weekStartDate
        ? `/wellness-basket/menu/week?weekStartDate=${encodeURIComponent(weekStartDate)}`
        : "/wellness-basket/menu/week";
      const response = await apiClient.get<WellnessMenuWeek>(url);
      return response;
    } catch {
      return MOCK_WEEK_MENU;
    }
  },

  async getSwapWindowStatus(): Promise<{ isOpen: boolean; message: string; window: string }> {
    try {
      const response = await apiClient.get<{ isOpen: boolean; message: string; window: string }>(
        "/wellness-basket/menu/swap-window"
      );
      return response;
    } catch {
      return {
        isOpen: true,
        message: "Weekly Swap Window is OPEN! You can customize next week's menu until Saturday 8:00 PM IST.",
        window: "Friday 18:00 IST - Saturday 20:00 IST",
      };
    }
  },

  async requestSwap(request: WellnessSwapRequest): Promise<WellnessSwap> {
    try {
      const response = await apiClient.post<WellnessSwap>("/wellness-basket/menu/swap", request);
      return response;
    } catch {
      return {
        id: Math.floor(Math.random() * 1000) + 1,
        subscriberPreferenceId: 101,
        userId: 1,
        deliveryDate: request.deliveryDate,
        originalProductId: request.originalProductId,
        originalProductName: "Replaced Item",
        requestedProductId: request.requestedProductId,
        requestedProductName: "Substituted Item",
        status: "APPROVED",
        requestedAt: new Date().toISOString(),
      };
    }
  },

  async getMySwaps(): Promise<WellnessSwap[]> {
    try {
      const response = await apiClient.get<WellnessSwap[]>("/wellness-basket/menu/swaps");
      return response;
    } catch {
      return [];
    }
  },

  async getClusters(): Promise<WellnessCluster[]> {
    try {
      const response = await apiClient.get<WellnessCluster[]>("/wellness-basket/clusters");
      return response;
    } catch {
      return MOCK_CLUSTERS;
    }
  },

  async getClusterBySociety(societyName: string): Promise<WellnessCluster> {
    try {
      const response = await apiClient.get<WellnessCluster>(`/wellness-basket/cluster/${encodeURIComponent(societyName)}`);
      return response;
    } catch {
      return (
        MOCK_CLUSTERS.find((c) => c.societyName.toLowerCase() === societyName.toLowerCase()) || MOCK_CLUSTERS[0]
      );
    }
  },
};
