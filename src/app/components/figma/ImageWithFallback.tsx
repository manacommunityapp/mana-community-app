import React, { useState, useCallback, useEffect } from 'react'
import { resolveImageUrl, isPresignedUrlExpired, refreshPresignedUrl } from '../../../utils/imageUrlUtils'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackElement?: React.ReactNode
}

export function ImageWithFallback({ fallbackElement, ...props }: ImageWithFallbackProps) {
  const [refreshedSrc, setRefreshedSrc] = useState<string | null>(null)
  const [didError, setDidError] = useState(false)
  const [refreshAttempted, setRefreshAttempted] = useState(false)

  const { src, alt, style, className, ...rest } = props
  const resolvedSrc = refreshedSrc ?? (src ? resolveImageUrl(src) : src)
  const isExpired = resolvedSrc ? isPresignedUrlExpired(resolvedSrc) : false

  useEffect(() => {
    setRefreshedSrc(null)
    setDidError(false)
    setRefreshAttempted(false)
  }, [src])

  useEffect(() => {
    if (!isExpired || refreshAttempted || !resolvedSrc) return
    setRefreshAttempted(true)
    refreshPresignedUrl(resolvedSrc).then((fresh) => {
      if (fresh) setRefreshedSrc(fresh)
      else setDidError(true)
    })
  }, [isExpired, refreshAttempted, resolvedSrc])

  const handleError = useCallback(() => {
    if (refreshAttempted || !resolvedSrc?.includes("X-Amz-Date")) {
      setDidError(true)
      return
    }
    setRefreshAttempted(true)
    refreshPresignedUrl(resolvedSrc).then((fresh) => {
      if (fresh) setRefreshedSrc(fresh)
      else setDidError(true)
    })
  }, [refreshAttempted, resolvedSrc])

  if (didError) {
    if (fallbackElement) return <>{fallbackElement}</>
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Image unavailable" {...rest} data-original-url={src} />
        </div>
      </div>
    )
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  )
}
