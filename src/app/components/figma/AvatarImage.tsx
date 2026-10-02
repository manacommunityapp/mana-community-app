import React, { useState, useCallback, useEffect } from 'react'
import { resolveImageUrl, isPresignedUrlExpired, refreshPresignedUrl } from '../../../utils/imageUrlUtils'

interface AvatarImageProps {
  src?: string | null
  alt?: string
  initials: string
  className?: string
  size?: string
}

export function AvatarImage({ src, alt = "", initials, className = "h-8 w-8", size = "text-xs" }: AvatarImageProps) {
  const [refreshedSrc, setRefreshedSrc] = useState<string | null>(null)
  const [imgFailed, setImgFailed] = useState(false)
  const [refreshAttempted, setRefreshAttempted] = useState(false)

  const resolvedSrc = refreshedSrc ?? (src ? resolveImageUrl(src) : null)
  const isExpired = resolvedSrc ? isPresignedUrlExpired(resolvedSrc) : false

  useEffect(() => {
    setRefreshedSrc(null)
    setImgFailed(false)
    setRefreshAttempted(false)
  }, [src])

  useEffect(() => {
    if (!isExpired || refreshAttempted || !resolvedSrc) return
    setRefreshAttempted(true)
    refreshPresignedUrl(resolvedSrc).then((fresh) => {
      if (fresh) setRefreshedSrc(fresh)
      else setImgFailed(true)
    })
  }, [isExpired, refreshAttempted, resolvedSrc])

  const handleError = useCallback(() => {
    if (refreshAttempted || !resolvedSrc?.includes("X-Amz-Date")) {
      setImgFailed(true)
      return
    }
    setRefreshAttempted(true)
    refreshPresignedUrl(resolvedSrc).then((fresh) => {
      if (fresh) setRefreshedSrc(fresh)
      else setImgFailed(true)
    })
  }, [refreshAttempted, resolvedSrc])

  const showImg = resolvedSrc && !imgFailed && !isExpired

  return (
    <div className={`${className} rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-bold ${size} border border-slate-200 overflow-hidden shrink-0`}>
      {showImg ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        initials
      )}
    </div>
  )
}
