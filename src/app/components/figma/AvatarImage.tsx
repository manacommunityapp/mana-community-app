import React, { useState, useCallback } from 'react'
import { resolveImageUrl, isPresignedUrlExpired } from '../../../utils/imageUrlUtils'

interface AvatarImageProps {
  src?: string | null
  alt?: string
  initials: string
  className?: string
  size?: string
}

export function AvatarImage({ src, alt = "", initials, className = "h-8 w-8", size = "text-xs" }: AvatarImageProps) {
  const [imgFailed, setImgFailed] = useState(false)

  const handleError = useCallback(() => setImgFailed(true), [])

  const resolvedSrc = src ? resolveImageUrl(src) : null
  const showImg = resolvedSrc && !imgFailed && !isPresignedUrlExpired(resolvedSrc)

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
