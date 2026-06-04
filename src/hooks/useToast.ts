import { useState, useEffect, useRef } from 'react'

/**
 * 일시적으로 표시되는 메시지(토스트)를 관리하는 훅.
 * setTimeout 중복 로직을 공통화합니다.
 *
 * @param duration 메시지가 표시될 시간(ms), 기본 2500ms
 *
 * @example
 * const { message, show } = useToast()
 * show('저장되었습니다.')   // duration 후 자동으로 null이 됨
 */
export function useToast(duration = 2500) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = (msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    timerRef.current = setTimeout(() => setMessage(null), duration)
  }

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(null)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { message, show, hide }
}
