import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

/** Date → ISO 8601 UTC 문자열 (API 전송용) */
export function toApiFormat(date: Date): string {
  return date.toISOString()
}

/** ISO 8601 문자열 → Date 객체 */
export function fromApiFormat(isoStr: string): Date {
  return parseISO(isoStr)
}

/** ISO 8601 문자열 → 사용자 표시용 문자열 (예: 2026년 3월 20일 18:00) */
export function formatDisplay(isoStr: string): string {
  return format(parseISO(isoStr), 'yyyy년 M월 d일 HH:mm', { locale: ko })
}

/** ISO 8601 문자열 → 날짜만 표시 (예: 2026년 3월 20일) */
export function formatDate(isoStr: string): string {
  return format(parseISO(isoStr), 'yyyy년 M월 d일', { locale: ko })
}

/** ISO 8601 문자열 → 시간만 표시 (예: 18:00) */
export function formatTime(isoStr: string): string {
  return format(parseISO(isoStr), 'HH:mm')
}
