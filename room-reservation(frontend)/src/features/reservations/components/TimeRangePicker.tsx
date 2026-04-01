import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'

interface Props {
  startTime: string
  endTime: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  errors?: { start?: string; end?: string }
}

function splitDatetime(value: string): { date: string; time: string } {
  const [date = '', time = ''] = value.split('T')
  return { date, time }
}

function generateTimeSlots(isPm: boolean): string[] {
  const slots: string[] = []
  const base = isPm ? 12 : 0
  for (let h = base; h < base + 12; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

function formatTimeDisplay(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const period = hour < 12 ? '오전' : '오후'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${period} ${display}:${m}`
}

function formatSlotLabel(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${m}`
}

interface TimePickerProps {
  value: string
  onChange: (v: string) => void
  error?: boolean
}

function CustomTimePicker({ value, onChange, error }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [isPm, setIsPm] = useState(() =>
    value ? parseInt(value.split(':')[0], 10) >= 12 : false
  )
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setIsPm(parseInt(value.split(':')[0], 10) >= 12)
  }, [value])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const slots = generateTimeSlots(isPm)

  return (
    <TimePickerRoot ref={ref}>
      <TimeDisplay $error={error} onClick={() => setOpen((o) => !o)}>
        <TimeText $empty={!value}>{value ? formatTimeDisplay(value) : '시간 선택'}</TimeText>
        <Chevron $open={open}>▾</Chevron>
      </TimeDisplay>
      {open && (
        <Dropdown>
          <PeriodRow>
            <PeriodBtn type="button" $active={!isPm} onClick={() => setIsPm(false)}>
              오전
            </PeriodBtn>
            <PeriodBtn type="button" $active={isPm} onClick={() => setIsPm(true)}>
              오후
            </PeriodBtn>
          </PeriodRow>
          <SlotGrid>
            {slots.map((slot) => (
              <SlotItem
                key={slot}
                type="button"
                $selected={slot === value}
                onClick={() => {
                  onChange(slot)
                  setOpen(false)
                }}
              >
                {formatSlotLabel(slot)}
              </SlotItem>
            ))}
          </SlotGrid>
        </Dropdown>
      )}
    </TimePickerRoot>
  )
}

export default function TimeRangePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  errors,
}: Props) {
  const [localStart, setLocalStart] = useState(() => splitDatetime(startTime))
  const [localEnd, setLocalEnd] = useState(() => splitDatetime(endTime))

  useEffect(() => {
    const parsed = splitDatetime(startTime)
    if (parsed.date && parsed.time) setLocalStart(parsed)
  }, [startTime])

  useEffect(() => {
    const parsed = splitDatetime(endTime)
    if (parsed.date && parsed.time) setLocalEnd(parsed)
  }, [endTime])

  function handleStart(patch: { date?: string; time?: string }) {
    const next = { ...localStart, ...patch }
    setLocalStart(next)
    onStartChange(next.date && next.time ? `${next.date}T${next.time}` : '')
  }

  function handleEnd(patch: { date?: string; time?: string }) {
    const next = { ...localEnd, ...patch }
    setLocalEnd(next)
    onEndChange(next.date && next.time ? `${next.date}T${next.time}` : '')
  }

  return (
    <Row>
      <Field>
        <Label>시작 시간</Label>
        <InputRow>
          <DateGroup $error={!!errors?.start}>
            <DateInput
              type="date"
              value={localStart.date}
              onChange={(e) => handleStart({ date: e.target.value })}
            />
          </DateGroup>
          <CustomTimePicker
            value={localStart.time}
            onChange={(t) => handleStart({ time: t })}
            error={!!errors?.start}
          />
        </InputRow>
        {errors?.start && <FieldError>{errors.start}</FieldError>}
      </Field>
      <Field>
        <Label>종료 시간</Label>
        <InputRow>
          <DateGroup $error={!!errors?.end}>
            <DateInput
              type="date"
              value={localEnd.date}
              min={localStart.date}
              onChange={(e) => handleEnd({ date: e.target.value })}
            />
          </DateGroup>
          <CustomTimePicker
            value={localEnd.time}
            onChange={(t) => handleEnd({ time: t })}
            error={!!errors?.end}
          />
        </InputRow>
        {errors?.end && <FieldError>{errors.end}</FieldError>}
      </Field>
    </Row>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 280px;
`

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  width: 57%;
`

const InputRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
`

const FieldError = styled.span`
  font-size: 12px;
  color: #ef4444;
`

// ─── DateGroup ────────────────────────────────────────────────────────────────

const DateGroup = styled.div<{ $error?: boolean }>`
  border: 1.5px solid ${({ $error }) => ($error ? '#ef4444' : '#e2e8f0')};
  border-radius: 8px;
  overflow: hidden;
  &:focus-within {
    border-color: ${({ $error }) => ($error ? '#ef4444' : '#2563eb')};
  }
  width:180px;
`

const DateInput = styled.input`
  padding: 8px 10px;
  font-size: 13px;
  color: #334155;
  border: none;
  outline: none;
  background: transparent;
  width: 90%;
`

// ─── CustomTimePicker ─────────────────────────────────────────────────────────

const TimePickerRoot = styled.div`
  position: relative;
`

const TimeDisplay = styled.div<{ $error?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1.5px solid ${({ $error }) => ($error ? '#ef4444' : '#e2e8f0')};
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  width: 180px;
  box-sizing: border-box;
  user-select: none;

  &:hover {
    border-color: ${({ $error }) => ($error ? '#ef4444' : '#94a3b8')};
    background: #f1f5f9;
  }
`

const TimeText = styled.span<{ $empty?: boolean }>`
  font-size: 13px;
  color: ${({ $empty }) => ($empty ? '#94a3b8' : '#334155')};
  flex: 1;
  white-space: nowrap;
`

const Chevron = styled.span<{ $open: boolean }>`
  font-size: 14px;
  color: #94a3b8;
  display: inline-block;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.15s;
  line-height: 1;
`

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 200;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 10px;
  min-width: 200px;
`

const PeriodRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
`

const PeriodBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 7px 0;
  border: 1.5px solid ${({ $active }) => ($active ? '#2563eb' : '#e2e8f0')};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#2563eb' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#64748b')};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s;

  &:hover {
    background: ${({ $active }) => ($active ? '#1d4ed8' : '#f8fafc')};
    border-color: ${({ $active }) => ($active ? '#1d4ed8' : '#94a3b8')};
  }
`

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
`

const SlotItem = styled.button<{ $selected: boolean }>`
  padding: 7px 2px;
  border: none;
  border-radius: 6px;
  background: ${({ $selected }) => ($selected ? '#eff6ff' : 'transparent')};
  color: ${({ $selected }) => ($selected ? '#2563eb' : '#334155')};
  font-size: 12px;
  font-weight: ${({ $selected }) => ($selected ? '600' : '400')};
  cursor: pointer;
  text-align: center;
  transition: background 0.1s;

  &:hover {
    background: ${({ $selected }) => ($selected ? '#dbeafe' : '#f1f5f9')};
  }
`
