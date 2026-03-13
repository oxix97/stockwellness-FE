import React, { useState } from 'react'

/** 이미지 로드 실패 시 표시할 기본 에러 SVG 이미지 (Base64) */
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

/**
 * 이미지 로드 실패 시 폴백 이미지를 보여주는 컴포넌트
 * @param props HTML 표준 img 태그의 속성들을 상속받음
 */
export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  /** 이미지 로드 에러 발생 여부 상태 */
  const [didError, setDidError] = useState(false)

  /** 이미지 로드 실패 시 호출되는 핸들러 */
  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  // 에러 발생 시 회색 배경과 에러 아이콘 표시
  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="이미지 로드 실패" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    // 정상 상태에서는 전달받은 src로 이미지 렌더링, 실패 시 onError 발생
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
