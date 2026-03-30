import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import styled from 'styled-components'
import { Button } from '@/shared/components'
import TimeRangePicker from './TimeRangePicker'

const schema = z
  .object({
    title: z.string().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하이어야 합니다.'),
    description: z.string().max(500, '설명은 500자 이하이어야 합니다.').optional(),
    startTime: z.string().min(1, '시작 시간을 선택해 주세요.'),
    endTime: z.string().min(1, '종료 시간을 선택해 주세요.'),
  })
  .refine((data) => !data.startTime || !data.endTime || data.startTime < data.endTime, {
    message: '종료 시간은 시작 시간 이후여야 합니다.',
    path: ['endTime'],
  })

export type ReservationFormValues = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<ReservationFormValues>
  onSubmit: (values: ReservationFormValues) => Promise<void>
  loading: boolean
  serverError: string | null
  submitLabel?: string
}

export default function ReservationForm({
  defaultValues,
  onSubmit,
  loading,
  serverError,
  submitLabel = '저장',
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      ...defaultValues,
    },
  })

  const startTime = watch('startTime')
  const endTime = watch('endTime')

  useEffect(() => {
    if (defaultValues?.startTime) setValue('startTime', defaultValues.startTime)
    if (defaultValues?.endTime) setValue('endTime', defaultValues.endTime)
  }, [defaultValues?.startTime, defaultValues?.endTime, setValue])

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field>
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          type="text"
          placeholder="회의 제목을 입력해 주세요"
          $error={!!errors.title}
          {...register('title')}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>

      <Field>
        <Label>시간 선택</Label>
        <TimeRangePicker
          startTime={startTime}
          endTime={endTime}
          onStartChange={(v) => setValue('startTime', v, { shouldValidate: true })}
          onEndChange={(v) => setValue('endTime', v, { shouldValidate: true })}
          errors={{
            start: errors.startTime?.message,
            end: errors.endTime?.message,
          }}
        />
      </Field>

      <Field>
        <Label htmlFor="description">설명 (선택)</Label>
        <Textarea
          id="description"
          placeholder="회의 목적이나 안건을 입력해 주세요"
          rows={3}
          {...register('description')}
        />
        {errors.description && <FieldError>{errors.description.message}</FieldError>}
      </Field>

      {serverError && <AlertBox>{serverError}</AlertBox>}

      <Button type="submit" loading={loading || isSubmitting} style={{ alignSelf: 'flex-end' }}>
        {submitLabel}
      </Button>
    </Form>
  )
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`

const Input = styled.input<{ $error?: boolean }>`
  padding: 10px 12px;
  border: 1.5px solid ${({ $error }) => ($error ? '#ef4444' : '#e2e8f0')};
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: ${({ $error }) => ($error ? '#ef4444' : '#2563eb')};
  }
`

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.15s;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: #2563eb;
  }
`

const FieldError = styled.span`
  font-size: 12px;
  color: #ef4444;
`

const AlertBox = styled.div`
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 13px;
  color: #dc2626;
`
