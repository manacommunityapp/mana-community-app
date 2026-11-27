import React from "react";
import {
  FaWhatsapp,
  FaAmazon,
  FaGooglePay,
  FaApplePay,
  FaFedex,
  FaUps,
  FaDhl,
} from "react-icons/fa6";

export type SupportedBrand =
  | "whatsapp"
  | "amazon"
  | "upi"
  | "googlepay"
  | "applepay"
  | "fedex"
  | "ups"
  | "dhl";

export interface BrandIconProps {
  brand: SupportedBrand;
  className?: string;
  size?: number | string;
  title?: string;
}

/**
 * Authentic UPI (Unified Payments Interface) vector icon.
 */
export const UpiLogo: React.FC<{ className?: string; title?: string }> = ({
  className = "w-4 h-4",
  title = "UPI - Unified Payments Interface",
}) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
  >
    <title>{title}</title>
    {/* UPI Dual Arrows (Green & Orange) */}
    <path d="M10 36L24 12H30L16 36H10Z" fill="#097939" />
    <path d="M22 36L36 12H39L25 36H22Z" fill="#ED752E" />
  </svg>
);

/**
 * Brand & third-party logo component using react-icons/fa6 on demand.
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  brand,
  className = "w-4 h-4",
  title,
}) => {
  switch (brand) {
    case "whatsapp":
      return (
        <FaWhatsapp
          className={`text-[#25D366] shrink-0 ${className}`}
          title={title || "WhatsApp"}
          aria-label={title || "WhatsApp"}
        />
      );
    case "amazon":
      return (
        <FaAmazon
          className={`text-[#FF9900] shrink-0 ${className}`}
          title={title || "Amazon"}
          aria-label={title || "Amazon"}
        />
      );
    case "upi":
      return <UpiLogo className={`shrink-0 ${className}`} title={title} />;
    case "googlepay":
      return (
        <FaGooglePay
          className={`shrink-0 ${className}`}
          title={title || "Google Pay"}
          aria-label={title || "Google Pay"}
        />
      );
    case "applepay":
      return (
        <FaApplePay
          className={`shrink-0 ${className}`}
          title={title || "Apple Pay"}
          aria-label={title || "Apple Pay"}
        />
      );
    case "fedex":
      return (
        <FaFedex
          className={`text-[#4D148C] shrink-0 ${className}`}
          title={title || "FedEx"}
          aria-label={title || "FedEx"}
        />
      );
    case "ups":
      return (
        <FaUps
          className={`text-[#351C15] shrink-0 ${className}`}
          title={title || "UPS"}
          aria-label={title || "UPS"}
        />
      );
    case "dhl":
      return (
        <FaDhl
          className={`text-[#D40511] shrink-0 ${className}`}
          title={title || "DHL"}
          aria-label={title || "DHL"}
        />
      );
    default:
      return null;
  }
};

/**
 * Helper to match brand name from courier, visitor name or purpose string
 */
export function getBrandIconForText(
  text?: string,
  className = "w-3.5 h-3.5"
): React.ReactNode | null {
  if (!text) return null;
  const s = text.toLowerCase();
  if (s.includes("amazon") || s.includes("amzn")) {
    return <BrandIcon brand="amazon" className={className} />;
  }
  if (s.includes("whatsapp") || s.includes("wa.me")) {
    return <BrandIcon brand="whatsapp" className={className} />;
  }
  if (s.includes("upi") || s.includes("bhim") || s.includes("phonepe") || s.includes("paytm")) {
    return <BrandIcon brand="upi" className={className} />;
  }
  if (s.includes("google pay") || s.includes("gpay")) {
    return <BrandIcon brand="googlepay" className={className} />;
  }
  if (s.includes("apple pay")) {
    return <BrandIcon brand="applepay" className={className} />;
  }
  if (s.includes("fedex")) {
    return <BrandIcon brand="fedex" className={className} />;
  }
  if (s.includes("ups")) {
    return <BrandIcon brand="ups" className={className} />;
  }
  if (s.includes("dhl")) {
    return <BrandIcon brand="dhl" className={className} />;
  }
  return null;
}
