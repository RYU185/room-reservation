// API 에러 코드 → 사용자 안내 메시지 매핑
// 인터셉터나 컴포넌트에서 code를 받아 이 함수로 메시지를 얻는다.

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: '입력값을 확인해 주세요.',
  INVALID_INPUT: '특수문자는 입력할 수 없습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  TOKEN_EXPIRED: '세션이 만료되었습니다.',
  INVALID_TOKEN: '인증 정보가 올바르지 않습니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  RESERVATION_CONFLICT: '해당 시간대에 이미 예약이 있습니다.',
  EMAIL_DUPLICATE: '이미 사용 중인 이메일입니다.',
  ROOM_INACTIVE: '사용할 수 없는 회의실입니다.',
  DB_ERROR: '서버 오류가 발생했습니다. 잠시 후 재시도해 주세요.',
  INTERNAL_ERROR: '서버 오류가 발생했습니다. 잠시 후 재시도해 주세요.',
}

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? '알 수 없는 오류가 발생했습니다.'
}
