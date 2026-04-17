import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import styled from 'styled-components'
import type { AxiosError } from 'axios'
import { useAuth } from '@/features/auth/context/AuthContext'
import { getErrorMessage } from '@/shared/utils/errorMessage'
import { Button } from '@/shared/components'
import type { ErrorResponse } from '@/shared/types'

const schema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(100, '이름은 100자 이하이어야 합니다.'),
  email: z.string().email('올바른 이메일 형식을 입력해 주세요.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(100, '비밀번호는 100자 이하이어야 합니다.'),
})

type FormValues = z.infer<typeof schema>

export default function SignUpPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await signUp(values.email, values.password, values.name)
      navigate('/', { replace: true })
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>
      const code = axiosErr.response?.data?.code ?? 'INTERNAL_ERROR'
      if (code === 'EMAIL_DUPLICATE') {
        setServerError('이미 사용 중인 이메일입니다.')
      } else {
        setServerError(getErrorMessage(code))
      }
    }
  }

  return (
    <Card>
      <Title>회의실 예약 시스템</Title>
      <Subtitle>새 계정을 만드세요</Subtitle>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field>
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            placeholder="홍길동"
            $error={!!errors.name}
            {...register('name')}
          />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

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
            placeholder="8자 이상 입력하세요"
            $error={!!errors.password}
            {...register('password')}
          />
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </Field>

        {serverError && <AlertBox>{serverError}</AlertBox>}

        <Button type="submit" size="lg" loading={isSubmitting} style={{ width: '100%' }}>
          회원가입
        </Button>
      </Form>

      <LoginLink>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </LoginLink>
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

const LoginLink = styled.p`
  margin: 24px 0 0;
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
