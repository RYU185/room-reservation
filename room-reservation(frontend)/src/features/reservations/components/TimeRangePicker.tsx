import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  startTime: string
  endTime: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  errors?: { start?: string; end?: string }
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

function splitDatetime(value: string): { date: string; time: string } {
  const [date = '', time = ''] = value.split('T')
  return { date, time }
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

// ─── Time Utilities ───────────────────────────────────────────────────────────

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

// ─── CustomDatePicker ─────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string
  onChange: (v: string) => void
  minDate?: string
  error?: boolean
}

function CustomDatePicker({ value, onChange, minDate, error }: DatePickerProps) {
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate())

  const getInitialView = () => {
    if (value) return { year: parseInt(value.split('-')[0]), month: parseInt(value.split('-')[1]) }
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  }

  const [open, setOpen] = useState(false)
  const [view, setView] = useState(getInitialView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      setView({ year: parseInt(value.split('-')[0]), month: parseInt(value.split('-')[1]) })
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function prevMonth() {
    setView(({ year, month }) =>
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    )
  }

  function nextMonth() {
    setView(({ year, month }) =>
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    )
  }

  const daysInMonth = getDaysInMonth(view.year, view.month)
  const firstDow = getFirstDayOfWeek(view.year, view.month)

  // empty leading cells + day cells
  const emptyCells = Array.from({ length: firstDow }, (_, i) => i)
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = toDateStr(view.year, view.month, day)
    return { day, dateStr }
  })

  return (
    <PickerRoot ref={ref}>
      <PickerTrigger $error={error} onClick={() => setOpen((o) => !o)}>
        <PickerText $empty={!value}>{value ? formatDateDisplay(value) : '날짜 선택'}</PickerText>
        <ChevronIcon $open={open}>▾</ChevronIcon>
      </PickerTrigger>

      {open && (
        <CalendarPanel>
          <CalHeader>
            <NavArrow type="button" onClick={prevMonth}>‹</NavArrow>
            <MonthLabel>{view.year}년 {MONTH_NAMES[view.month - 1]}</MonthLabel>
            <NavArrow type="button" onClick={nextMonth}>›</NavArrow>
          </CalHeader>

          <WeekRow>
            {WEEKDAYS.map((d) => (
              <WeekCell key={d} $sun={d === '일'} $sat={d === '토'}>
                {d}
              </WeekCell>
            ))}
          </WeekRow>

          <DayGrid>
            {emptyCells.map((i) => (
              <DayCell key={`e-${i}`} as="div" $empty />
            ))}
            {dayCells.map(({ day, dateStr }) => {
              const disabled = !!minDate && dateStr < minDate
              const selected = dateStr === value
              const isToday = dateStr === todayStr
              return (
                <DayCell
                  key={dateStr}
                  type="button"
                  $selected={selected}
                  $today={isToday}
                  $disabled={disabled}
                  $sun={(day + firstDow - 1) % 7 === 0}
                  $sat={(day + firstDow) % 7 === 0}
                  disabled={disabled}
                  onClick={() => {
                    onChange(dateStr)
                    setOpen(false)
                  }}
                >
                  {day}
                </DayCell>
              )
            })}
          </DayGrid>
        </CalendarPanel>
      )}
    </PickerRoot>
  )
}

// ─── CustomTimePicker ─────────────────────────────────────────────────────────

interface TimePickerProps {
  value: string
  onChange: (v: string) => void
  error?: boolean
  minTime?: string
}

function CustomTimePicker({ value, onChange, error, minTime }: TimePickerProps) {
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
    <PickerRoot ref={ref}>
      <PickerTrigger $error={error} onClick={() => setOpen((o) => !o)}>
        <PickerText $empty={!value}>{value ? formatTimeDisplay(value) : '시간 선택'}</PickerText>
        <ChevronIcon $open={open}>▾</ChevronIcon>
      </PickerTrigger>

      {open && (
        <TimePanel>
          <PeriodRow>
            <PeriodBtn type="button" $active={!isPm} onClick={() => setIsPm(false)}>
              오전
            </PeriodBtn>
            <PeriodBtn type="button" $active={isPm} onClick={() => setIsPm(true)}>
              오후
            </PeriodBtn>
          </PeriodRow>
          <SlotGrid>
            {slots.map((slot) => {
              const disabled = !!minTime && slot <= minTime
              return (
                <SlotItem
                  key={slot}
                  type="button"
                  $selected={slot === value}
                  $disabled={disabled}
                  disabled={disabled}
                  onClick={() => {
                    onChange(slot)
                    setOpen(false)
                  }}
                >
                  {formatSlotLabel(slot)}
                </SlotItem>
              )
            })}
          </SlotGrid>
        </TimePanel>
      )}
    </PickerRoot>
  )
}

// ─── TimeRangePicker ──────────────────────────────────────────────────────────

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

    // 같은 날짜일 때 종료 시간이 새 시작 시간 이하가 되면 초기화
    if (
      localEnd.date &&
      next.date === localEnd.date &&
      localEnd.time &&
      next.time &&
      localEnd.time <= next.time
    ) {
      setLocalEnd((prev) => ({ ...prev, time: '' }))
      onEndChange('')
    }
  }

  function handleEnd(patch: { date?: string; time?: string }) {
    const next = { ...localEnd, ...patch }

    // 날짜를 시작일과 동일하게 변경할 때 이미 선택된 종료 시간이 무효하면 초기화
    if (
      patch.date !== undefined &&
      next.date === localStart.date &&
      next.time &&
      next.time <= localStart.time
    ) {
      setLocalEnd({ ...next, time: '' })
      onEndChange('')
      return
    }

    setLocalEnd(next)
    onEndChange(next.date && next.time ? `${next.date}T${next.time}` : '')
  }

  const endMinTime =
    localStart.date && localEnd.date && localStart.date === localEnd.date
      ? localStart.time
      : undefined

  return (
    <RangeGrid>
      <RangeField>
        <FieldLabel>시작</FieldLabel>
        <PickerStack>
          <CustomDatePicker
            value={localStart.date}
            onChange={(d) => handleStart({ date: d })}
            error={!!errors?.start}
          />
          <CustomTimePicker
            value={localStart.time}
            onChange={(t) => handleStart({ time: t })}
            error={!!errors?.start}
          />
        </PickerStack>
        {errors?.start && <FieldError>{errors.start}</FieldError>}
      </RangeField>

      <Separator>→</Separator>

      <RangeField>
        <FieldLabel>종료</FieldLabel>
        <PickerStack>
          <CustomDatePicker
            value={localEnd.date}
            onChange={(d) => handleEnd({ date: d })}
            minDate={localStart.date}
            error={!!errors?.end}
          />
          <CustomTimePicker
            value={localEnd.time}
            onChange={(t) => handleEnd({ time: t })}
            error={!!errors?.end}
            minTime={endMinTime}
          />
        </PickerStack>
        {errors?.end && <FieldError>{errors.end}</FieldError>}
      </RangeField>
    </RangeGrid>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const RangeGrid = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`

const RangeField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 200px;
`

const FieldLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const PickerStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Separator = styled.span`
  font-size: 18px;
  color: #94a3b8;
  margin-top: 28px;
  flex-shrink: 0;
`

const FieldError = styled.span`
  font-size: 12px;
  color: #ef4444;
`

// ─── Shared Picker Trigger ────────────────────────────────────────────────────

const PickerRoot = styled.div`
  position: relative;
`

const PickerTrigger = styled.button<{ $error?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  background: #f8fafc;
  border: 1.5px solid ${({ $error }) => ($error ? '#ef4444' : '#e2e8f0')};
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: ${({ $error }) => ($error ? '#ef4444' : '#94a3b8')};
    background: #f1f5f9;
  }
`

const PickerText = styled.span<{ $empty?: boolean }>`
  font-size: 13px;
  color: ${({ $empty }) => ($empty ? '#94a3b8' : '#1e293b')};
  white-space: nowrap;
`

const ChevronIcon = styled.span<{ $open: boolean }>`
  font-size: 14px;
  color: #94a3b8;
  display: inline-block;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.15s;
  line-height: 1;
  flex-shrink: 0;
`

// ─── Calendar ─────────────────────────────────────────────────────────────────

const CalendarPanel = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 300;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 14px;
  min-width: 240px;
`

const CalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`

const NavArrow = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`

const MonthLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
`

const WeekCell = styled.span<{ $sun?: boolean; $sat?: boolean }>`
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $sun, $sat }) => ($sun ? '#ef4444' : $sat ? '#2563eb' : '#94a3b8')};
  padding: 4px 0;
`

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`

const DayCell = styled.button<{
  $selected?: boolean
  $today?: boolean
  $disabled?: boolean
  $sun?: boolean
  $sat?: boolean
  $empty?: boolean
}>`
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  font-weight: ${({ $today, $selected }) => ($today || $selected ? '700' : '400')};
  cursor: ${({ $disabled, $empty }) => ($disabled || $empty ? 'default' : 'pointer')};
  visibility: ${({ $empty }) => ($empty ? 'hidden' : 'visible')};
  background: ${({ $selected }) => ($selected ? '#2563eb' : 'transparent')};
  color: ${({ $selected, $disabled, $sun, $sat }) => {
    if ($selected) return '#fff'
    if ($disabled) return '#cbd5e1'
    if ($sun) return '#ef4444'
    if ($sat) return '#2563eb'
    return '#1e293b'
  }};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  outline: ${({ $today, $selected }) =>
    $today && !$selected ? '1.5px solid #2563eb' : 'none'};
  transition: background 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  &:hover {
    background: ${({ $selected, $disabled }) =>
      $selected ? '#1d4ed8' : $disabled ? 'transparent' : '#f1f5f9'};
  }
`

// ─── Time Panel ───────────────────────────────────────────────────────────────

const TimePanel = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 300;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 12px;
  min-width: 220px;
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

const SlotItem = styled.button<{ $selected: boolean; $disabled?: boolean }>`
  padding: 7px 2px;
  border: none;
  border-radius: 6px;
  background: ${({ $selected }) => ($selected ? '#eff6ff' : 'transparent')};
  color: ${({ $selected, $disabled }) =>
    $disabled ? '#cbd5e1' : $selected ? '#2563eb' : '#334155'};
  font-size: 12px;
  font-weight: ${({ $selected }) => ($selected ? '600' : '400')};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  text-align: center;
  transition: background 0.1s;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  &:hover {
    background: ${({ $selected, $disabled }) =>
      $disabled ? 'transparent' : $selected ? '#dbeafe' : '#f1f5f9'};
  }
`
