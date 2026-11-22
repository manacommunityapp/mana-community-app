import { useCallback, useEffect, useRef, useState } from "react";
import type { ImgHTMLAttributes, ReactNode, SyntheticEvent } from "react";
import {
  deriveFileProxyPath,
  fetchAuthenticatedObjectUrl,
  requiresAuthenticatedFetch,
  resolveImageUrl,
} from "../../../utils/imageUrlUtils";

/**
 * Shared plumbing for images served by the backend file routes.
 *
 * GET /api/files/** and /api/media/** used to be `permitAll`, so a bare
 * `<img src="/api/files/...">` worked. They are authenticated now, so those
 * URLs have to be fetched with the api client's Authorization header and shown
 * as a `blob:` object URL instead.
 *
 * Behaviour preserved from the inline `onError` fallbacks this replaces: an
 * absolute (S3 / CDN) URL is still tried first in the browser, and only when it
 * fails is the proxied `/api/files/<key>` URL used — now authenticated.
 *
 * Object URLs are revoked when the source changes and on unmount.
 */
export interface UseAuthenticatedImageOptions {
  /** Used when the source resolves to nothing. */
  fallback?: string;
  /**
   * Derives the `/api/files/...` path to retry with from the URL that just
   * failed. Defaults to the shared S3-gallery-key rule.
   */
  deriveFallback?: (failedSrc: string) => string | null;
  /** Called once the original URL and the authenticated fallback have both failed. */
  onExhausted?: () => void;
}

export interface AuthenticatedImageState {
  /** Put this on the `<img>`; undefined while an authenticated read is in flight. */
  src: string | undefined;
  /** True once nothing is left to try. */
  failed: boolean;
  /** True while the authenticated read is in flight. */
  loading: boolean;
  /** Put this on the `<img>`. */
  onError: (event: SyntheticEvent<HTMLImageElement>) => void;
}

export function useAuthenticatedImage(
  rawSrc?: string | null,
  options: UseAuthenticatedImageOptions = {}
): AuthenticatedImageState {
  const { fallback = "", deriveFallback, onExhausted } = options;

  const resolved = resolveImageUrl(rawSrc, fallback);
  const needsAuth = requiresAuthenticatedFetch(resolved);

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const objectUrlRef = useRef<string | null>(null);
  const aliveRef = useRef(true);
  const inFlightRef = useRef<string | null>(null);

  // Keep the latest callbacks without making the effects re-run on every render.
  const deriveRef = useRef(deriveFallback);
  deriveRef.current = deriveFallback;
  const exhaustedRef = useRef(onExhausted);
  exhaustedRef.current = onExhausted;

  const release = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const adopt = useCallback(
    (next: string | null) => {
      release();
      objectUrlRef.current = next;
      setObjectUrl(next);
    },
    [release]
  );

  const giveUp = useCallback(() => {
    setLoading(false);
    setFailed(true);
    exhaustedRef.current?.();
  }, []);

  const loadAuthenticated = useCallback(
    async (path: string) => {
      if (inFlightRef.current === path) return;
      inFlightRef.current = path;
      setLoading(true);
      const blobUrl = await fetchAuthenticatedObjectUrl(path);
      if (!aliveRef.current) {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        return;
      }
      setLoading(false);
      if (blobUrl) adopt(blobUrl);
      else giveUp();
    },
    [adopt, giveUp]
  );

  // Reset on source change, and read straight away when the resolved URL is one
  // of the authenticated file routes (a bare <img> could only 401 on it).
  useEffect(() => {
    aliveRef.current = true;
    inFlightRef.current = null;
    adopt(null);
    setFailed(false);
    setLoading(false);
    if (needsAuth && resolved) {
      void loadAuthenticated(resolved);
    }
    return () => {
      aliveRef.current = false;
    };
  }, [resolved, needsAuth, adopt, loadAuthenticated]);

  // Revoke whatever is held when the component goes away.
  useEffect(() => release, [release]);

  const onError = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const failedSrc = event.currentTarget?.src || resolved;
      // The authenticated blob itself failed to decode — nothing left to try.
      if (objectUrlRef.current) {
        giveUp();
        return;
      }
      const derive = deriveRef.current ?? deriveFileProxyPath;
      const proxyPath = derive(failedSrc) ?? (needsAuth ? resolved : null);
      if (proxyPath) {
        void loadAuthenticated(proxyPath);
        return;
      }
      giveUp();
    },
    [resolved, needsAuth, giveUp, loadAuthenticated]
  );

  return {
    src: objectUrl ?? (needsAuth ? undefined : resolved || undefined),
    failed,
    loading,
    onError,
  };
}

export type AuthenticatedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> &
  UseAuthenticatedImageOptions & {
    src?: string | null;
    /** Rendered instead of the image once every source has failed. */
    renderFallback?: () => ReactNode;
  };

/**
 * Drop-in `<img>` replacement for files served by the authenticated file routes.
 */
export function AuthenticatedImage({
  src,
  fallback,
  deriveFallback,
  onExhausted,
  renderFallback,
  ...imgProps
}: AuthenticatedImageProps) {
  const image = useAuthenticatedImage(src, { fallback, deriveFallback, onExhausted });

  if (image.failed) {
    return renderFallback ? <>{renderFallback()}</> : null;
  }
  if (!image.src) {
    // Nothing to show yet (authenticated read in flight, or no source at all).
    return null;
  }

  return <img {...imgProps} src={image.src} onError={image.onError} />;
}
