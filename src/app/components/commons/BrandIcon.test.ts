import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { BrandIcon, UpiLogo, getBrandIconForText } from "./BrandIcon";

describe("BrandIcon Component (react-icons/fa6 & UPI on Web)", () => {
  it("renders authentic WhatsApp logo via FaWhatsapp", () => {
    const html = renderToString(React.createElement(BrandIcon, { brand: "whatsapp" }));
    expect(html).toContain("svg");
    expect(html).toContain("text-[#25D366]");
  });

  it("renders authentic Amazon logo via FaAmazon", () => {
    const html = renderToString(React.createElement(BrandIcon, { brand: "amazon" }));
    expect(html).toContain("svg");
    expect(html).toContain("text-[#FF9900]");
  });

  it("renders authentic UPI dual-arrow vector", () => {
    const html = renderToString(React.createElement(UpiLogo));
    expect(html).toContain("#097939"); // Green
    expect(html).toContain("#ED752E"); // Orange
  });

  it("detects brands from visitor name and returns matching icon", () => {
    const amazonEl = getBrandIconForText("Amazon Courier Delivery");
    expect(amazonEl).not.toBeNull();
    const amazonHtml = renderToString(amazonEl as React.ReactElement);
    expect(amazonHtml).toContain("text-[#FF9900]");

    const upiEl = getBrandIconForText("UPI QR Payment");
    expect(upiEl).not.toBeNull();
    const upiHtml = renderToString(upiEl as React.ReactElement);
    expect(upiHtml).toContain("#097939");

    const noneEl = getBrandIconForText("Personal Friend Visit");
    expect(noneEl).toBeNull();
  });
});
