import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import styled from 'styled-components'
import { createRoom, updateRoom } from '@/features/rooms/api/rooms.api'
import type { Room } from '@/features/rooms/types'
import type { AxiosError } from 'axios'
import type { ErrorResponse } from '@/shared/types'
import { getErrorMessage } from '@/shared/utils/errorMessage'

const schema = z.object({
  name: z.string().min(1, '회의실 이름을 입력해 주세요.').max(100),
  location: z.string().min(1, '위치를 입력해 주세요.').max(255),
  capacity: z
    .string()
    .min(1, '수용 인원을 입력해 주세요.')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: '최소 1명 이상의 정수를 입력해 주세요.',
    }),
  description: z.string().max(1000).optional(),
  amenities: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  mode: 'create' | 'edit'
  room?: Room
  onSuccess: (room: Room) => void
  onClose: () => void
}

export default function RoomFormModal({ mode, room, onSuccess, onClose }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (mode === 'edit' && room) {
      reset({
        name: room.name,
        location: room.location,
        capacity: String(room.capacity),
        description: room.description ?? '',
        amenities: room.amenities.join(', '),
      })
    }
  }, [mode, room, reset])

  async function onSubmit(values: FormValues) {
    const amenities = values.amenities
      ? values.amenities.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const payload = {
      name: values.name,
      location: values.location,
      capacity: Number(values.capacity),
      description: values.description || undefined,
      amenities,
    }

    try {
      const result =
        mode === 'create' ? await createRoom(payload) : await updateRoom(room!.id, payload)
      onSuccess(result)
    } catch (err) {
      const code = (err as AxiosError<ErrorResponse>).response?.data?.code ?? 'INTERNAL_ERROR'
      setError('root', { message: getErrorMessage(code) })
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{mode === 'create' ? '회의실 추가' : '회의실 수정'}</ModalTitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Field>
            <Label>이름 *</Label>
            <Input {...register('name')} placeholder="예: 1층 소회의실" />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          <Field>
            <Label>위치 *</Label>
            <Input {...register('location')} placeholder="예: 본관 1층" />
            {errors.location && <FieldError>{errors.location.message}</FieldError>}
          </Field>

          <Field>
            <Label>수용 인원 *</Label>
            <Input type="number" min={1} {...register('capacity')} placeholder="예: 10" />
            {errors.capacity && <FieldError>{errors.capacity.message}</FieldError>}
          </Field>

          <Field>
            <Label>설명</Label>
            <Textarea {...register('description')} rows={3} placeholder="부가 설명 (선택)" />
            {errors.description && <FieldError>{errors.description.message}</FieldError>}
          </Field>

          <Field>
            <Label>시설 (콤마로 구분)</Label>
            <Input {...register('amenities')} placeholder="예: 프로젝터, 화이트보드, 에어컨" />
          </Field>

          {errors.root && <ServerError>{errors.root.message}</ServerError>}

          <ModalActions>
            <CancelButton type="button" onClick={onClose}>
              취소
            </CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : mode === 'create' ? '추가' : '저장'}
            </SubmitButton>
          </ModalActions>
        </Form>
      </Modal>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`

const Modal = styled.div`
  background: #fff;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
`

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  line-height: 1;

  &:hover {
    color: #334155;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px 24px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #334155;
`

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #334155;
  outline: none;

  &:focus {
    border-color: #2563eb;
  }
`

const Textarea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #334155;
  outline: none;
  resize: vertical;
  font-family: inherit;

  &:focus {
    border-color: #2563eb;
  }
`

const FieldError = styled.span`
  font-size: 12px;
  color: #dc2626;
`

const ServerError = styled.p`
  margin: 0;
  font-size: 13px;
  color: #dc2626;
  padding: 10px 12px;
  background: #fef2f2;
  border-radius: 6px;
`

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
`

const CancelButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;

  &:hover {
    background: #f1f5f9;
  }
`

const SubmitButton = styled.button`
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`
