import { z } from "zod";

/**
 * Validation schema for scheduling a vacation pause on Daily Basket deliveries.
 */
export const vacationPauseSchema = z
  .object({
    vacationStartDate: z
      .string()
      .min(1, "Please select a vacation start date.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format."),
    vacationEndDate: z
      .string()
      .min(1, "Please select a vacation return date.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format."),
  })
  .refine(
    (data) => {
      const start = new Date(data.vacationStartDate);
      const end = new Date(data.vacationEndDate);
      return end >= start;
    },
    {
      message: "Vacation return date must be on or after start date.",
      path: ["vacationEndDate"],
    }
  );

export type VacationPauseFormData = z.infer<typeof vacationPauseSchema>;

/**
 * Validation schema for resident delivery preferences (flat number, delivery slot, instructions).
 */
export const deliveryPreferencesSchema = z.object({
  flatNumber: z
    .string()
    .trim()
    .min(1, "Flat/Unit number is required.")
    .max(50, "Flat number cannot exceed 50 characters."),
  blockOrTower: z
    .string()
    .trim()
    .max(50, "Block/Tower cannot exceed 50 characters.")
    .optional(),
  preferredSlot: z
    .string()
    .min(1, "Please select a preferred morning delivery slot."),
  specialInstructions: z
    .string()
    .trim()
    .max(250, "Special instructions cannot exceed 250 characters.")
    .optional(),
});

export type DeliveryPreferencesFormData = z.infer<typeof deliveryPreferencesSchema>;

/**
 * Validation schema for configuring a daily recurring item in a resident's basket.
 */
export const basketItemScheduleSchema = z.object({
  productId: z
    .number({ invalid_type_error: "Product is required." })
    .positive("Invalid product ID."),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(20, "Maximum 20 units per daily delivery."),
  daysOfWeek: z
    .array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]))
    .min(1, "Select at least one day of the week for recurring delivery."),
});

export type BasketItemScheduleFormData = z.infer<typeof basketItemScheduleSchema>;

/**
 * Validation schema for vendor batch production QA release.
 */
export const batchReleaseSchema = z.object({
  batchNumber: z
    .string()
    .trim()
    .min(3, "Batch number must be at least 3 characters.")
    .max(64, "Batch number cannot exceed 64 characters."),
  storageTemperatureCelsius: z
    .number({ invalid_type_error: "Storage temperature is required." })
    .min(-5, "Temperature cannot be below -5°C.")
    .max(25, "Temperature cannot exceed 25°C.")
    .refine((temp) => temp >= 2 && temp <= 4, {
      message: "FSSAI cold-chain compliance requires batter storage between 2°C and 4°C.",
    }),
  qaInspectorNotes: z
    .string()
    .trim()
    .min(5, "Inspection notes must be at least 5 characters.")
    .max(500, "Inspection notes cannot exceed 500 characters."),
});

export type BatchReleaseFormData = z.infer<typeof batchReleaseSchema>;
