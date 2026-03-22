// AuthContext가 로그인/로그아웃 시 이 저장소에 토큰을 쓴다.
// client.ts의 인터셉터는 여기서 토큰을 읽는다.
// localStorage 저장 금지 — 메모리에만 유지한다.

let _accessToken: string | null = null

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string | null): void => {
    _accessToken = token
  },
}
