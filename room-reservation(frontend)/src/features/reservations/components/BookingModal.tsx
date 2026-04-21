import { useState } from 'react'
import styled from 'styled-components'
import { X } from 'lucide-react'
import type { Room } from '@/features/rooms/types'

interface Props {
  room: Room
  date: string
  selectedSlots: string[]
  loading: boolean
  error: string | null
  onClose: () => void
  onConfirm: (title: string, description: string) => void
}

function addThirtyMin(time: string): string {
  const [h, m] = time.split(':').map(Number)
  if (m === 30) return `${String(h + 1).padStart(2, '0')}:00`
  return `${String(h).padStart(2, '0')}:30`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${mo}.${d} (${days[date.getDay()]})`
}

export default function BookingModal({
  room,
  date,
  selectedSlots,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const sorted = [...selectedSlots].sort()
  const startLabel = sorted[0] ?? ''
  const endLabel = sorted.length > 0 ? addThirtyMin(sorted[sorted.length - 1]) : ''
  const duration = sorted.length * 0.5

  const summaryRows = [
    ['날짜', formatDate(date)],
    ['시간', `${startLabel} – ${endLabel}`],
    ['장소', `${room.name} (${room.location})`],
    ['수용 인원', `최대 ${room.capacity}인`],
  ]

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <div>
            <ModalTitle>예약 확인</ModalTitle>
            <ModalSubtitle>{room.name} · {room.location}</ModalSubtitle>
          </div>
          <CloseButton onClick={onClose}>
            <X size={20} color="#CBD5E0" strokeWidth={1.8} />
          </CloseButton>
        </ModalHeader>

        <SummaryBox>
          {summaryRows.map(([label, value]) => (
            <SummaryRow key={label}>
              <SummaryLabel>{label}</SummaryLabel>
              <SummaryValue $mono={label === '시간'}>{value}</SummaryValue>
            </SummaryRow>
          ))}
        </SummaryBox>

        <FormField>
          <FieldLabel>예약 제목 *</FieldLabel>
          <FieldInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 주간 팀 미팅"
            autoFocus
          />
        </FormField>

        <FormField>
          <FieldLabel>메모 (선택)</FieldLabel>
          <FieldInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="참석자, 안건 등"
          />
        </FormField>

        {error && <ErrorText>{error}</ErrorText>}

        <ButtonRow>
          <CancelButton onClick={onClose} disabled={loading}>
            취소
          </CancelButton>
          <ConfirmButton
            onClick={() => title.trim() && onConfirm(title.trim(), description.trim())}
            disabled={!title.trim() || loading}
          >
            {loading ? '예약 중...' : `${duration}시간 예약하기`}
          </ConfirmButton>
        </ButtonRow>
      </Modal>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 440px;
  max-width: calc(100vw - 32px);
  padding: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const ModalTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1A202C;
`

const ModalSubtitle = styled.div`
  font-size: 13px;
  color: #A0AEC0;
  margin-top: 2px;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
`

const SummaryBox = styled.div`
  background: #F7FAFC;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
`

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #E2E8F0;

  &:last-child {
    border-bottom: none;
  }
`

const SummaryLabel = styled.span`
  font-size: 13px;
  color: #718096;
`

const SummaryValue = styled.span<{ $mono?: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: #2D3748;
  font-family: ${({ $mono }) => ($mono ? "'Fira Code', monospace" : 'inherit')};
`

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const FieldLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #4A5568;
`

const FieldInput = styled.input`
  width: 100%;
  padding: 9px 12px;
  border-radius: 6px;
  border: 1px solid #CBD5E0;
  font-size: 13px;
  font-family: inherit;
  color: #2D3748;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder {
    color: #A0AEC0;
  }

  &:focus {
    border-color: #4299E1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
`

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #E53E3E;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`

const CancelButton = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  border: 1.5px solid #2C5282;
  background: white;
  color: #2C5282;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.5s ease;

  &:hover:not(:disabled) {
    background: #EBF8FF;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const ConfirmButton = styled.button`
  flex: 2;
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #2C5282;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.5s ease;

  &:hover:not(:disabled) {
    background: #23407A;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`
