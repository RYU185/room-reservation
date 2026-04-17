import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import styled from 'styled-components'
import type { AxiosError } from 'axios'
import { useAuth } from '@/features/auth/context/AuthContext'
import { getErrorMessage } from '@/shared/utils/errorMessage'
import { Button } from '@/shared/components'
import type { ErrorResponse } from '@/shared/types'

const schema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
})

type FormValues = z.infer<typeof schema>

const SERVER_BASE = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const from = (location.state as { from?: string })?.from ?? '/'
  const oauthFailed = new URLSearchParams(location.search).get('error') === 'oauth'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await login(values.email, values.password)
      navigate(from, { replace: true })
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>
      if (axiosErr.response?.status === 401) {
        setServerError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        const code = axiosErr.response?.data?.code ?? 'INTERNAL_ERROR'
        setServerError(getErrorMessage(code))
      }
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${SERVER_BASE}/oauth2/authorization/google`
  }

  return (
    <Card>
      <Title>회의실 예약 시스템</Title>
      <Subtitle>계정에 로그인하세요</Subtitle>

      {oauthFailed && (
        <AlertBox>소셜 로그인에 실패했습니다. 다시 시도해 주세요.</AlertBox>
      )}

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@company.com"
            $error={!!errors.email}
            {...register('email')}
          />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>

        <Field>
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            $error={!!errors.password}
            {...register('password')}
          />
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </Field>

        {serverError && <AlertBox>{serverError}</AlertBox>}

        <Button type="submit" size="lg" loading={isSubmitting} style={{ width: '100%' }}>
          로그인
        </Button>
      </Form>

      <Divider><span>또는</span></Divider>

      <GoogleButton type="button" onClick={handleGoogleLogin}>
        <GoogleIcon aria-hidden="true" />
        Google로 로그인
      </GoogleButton>

      <SignUpLink>
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </SignUpLink>
    </Card>
  )
}

// ── Styled Components ─────────────────────────────────────────────────────────

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  padding: 40px 36px;
`

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  margin: 0 0 4px;
  letter-spacing: -0.3px;
`

const Subtitle = styled.p`
  font-size: 16px;
  color: #777777;
  margin: 0 0 28px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.label`
  font-size: 15px;
  font-weight: 500;
  color: #444444;
`

const Input = styled.input<{ $error?: boolean }>`
  padding: 9px 12px;
  border: 1px solid ${({ $error }) => ($error ? '#ef4444' : '#e5e5e5')};
  border-radius: 6px;
  font-size: 16px;
  color: #111111;
  outline: none;
  transition: border-color 0.1s;

  &::placeholder { color: #aaaaaa; }

  &:focus {
    border-color: ${({ $error }) => ($error ? '#ef4444' : '#111111')};
  }
`

const FieldError = styled.span`
  font-size: 14px;
  color: #e53e3e;
`

const AlertBox = styled.div`
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 15px;
  color: #dc2626;
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  color: #aaaaaa;
  font-size: 15px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e5e5;
  }
`

const GoogleButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 9px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  font-size: 16px;
  font-weight: 500;
  color: #444444;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;

  &:hover {
    background: #fafafa;
    border-color: #cccccc;
  }
`

const SignUpLink = styled.p`
  margin: 20px 0 0;
  text-align: center;
  font-size: 15px;
  color: #777777;

  a {
    color: #111111;
    font-weight: 500;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
