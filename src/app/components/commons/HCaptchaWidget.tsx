import { useRef, useEffect } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

/**
 * hCaptcha widget for bot protection on registration and login.
 *
 * SETUP REQUIRED:
 *   1. Create a free hCaptcha account at https://www.hcaptcha.com
 *   2. Add your site key to VITE_HCAPTCHA_SITE_KEY in .env / .env.production
 *   3. Add your secret key to app.captcha.secret-key in application.properties
 *   4. Set app.captcha.enabled=true in production application.properties
 *   5. Run `npm install` after package.json was updated with @hcaptcha/react-hcaptcha
 *
 * [LEGAL REVIEW REQUIRED] Disclose hCaptcha data processing in Privacy Notice.
 * hCaptcha privacy policy: https://www.hcaptcha.com/privacy
 */
const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? "10000000-ffff-ffff-ffff-000000000001";
// ^^^ The default above is hCaptcha's built-in test key (always passes in dev).
// Replace with your real site key in .env.production.

export const HCaptchaWidget: React.FC<Props> = ({ onToken, onExpire, onError }) => {
  const ref = useRef<HCaptcha>(null);

  return (
    <HCaptcha
      ref={ref}
      sitekey={SITE_KEY}
      onVerify={onToken}
      onExpire={() => {
        onToken(""); // clear token on expiry
        onExpire?.();
      }}
      onError={() => {
        onToken("");
        onError?.();
      }}
      theme="light"
      size="normal"
    />
  );
};
