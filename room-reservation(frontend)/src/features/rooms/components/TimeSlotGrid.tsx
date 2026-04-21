import styled from 'styled-components'

export const ALL_SLOTS: string[] = (() => {
  const slots: string[] = []
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})()

type SlotStatus = 'free' | 'selected' | 'booked' | 'mine'

interface Props {
  bookedSlots: string[]
  mySlots: string[]
  selectedSlots: string[]
  onToggle: (slot: string) => void
}

export default function TimeSlotGrid({ bookedSlots, mySlots, selectedSlots, onToggle }: Props) {
  return (
    <Wrapper>
      <Grid>
        {ALL_SLOTS.map((slot) => {
          const isBooked = bookedSlots.includes(slot)
          const isMine = mySlots.includes(slot)
          const isSelected = selectedSlots.includes(slot)

          let status: SlotStatus = 'free'
          if (isBooked) status = 'booked'
          else if (isMine) status = 'mine'
          else if (isSelected) status = 'selected'

          return (
            <Slot
              key={slot}
              $status={status}
              onClick={() => !isBooked && !isMine && onToggle(slot)}
            >
              {slot}
            </Slot>
          )
        })}
      </Grid>

      <Legend>
        {([
          ['예약됨', 'booked'],
          ['가능', 'free'],
          ['선택됨', 'selected'],
          ['내 예약', 'mine'],
        ] as [string, SlotStatus][]).map(([label, status]) => (
          <LegendItem key={label}>
            <LegendDot $status={status} />
            {label}
          </LegendItem>
        ))}
      </Legend>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
`

const Slot = styled.div<{ $status: SlotStatus }>`
  padding: 8px 4px;
  border-radius: 6px;
  text-align: center;
  font-size: 11px;
  font-family: 'Fira Code', monospace;
  user-select: none;
  transition: all 120ms ease;
  border: 1.5px solid transparent;

  ${({ $status }) => {
    switch ($status) {
      case 'booked':
        return `
          background: #EDF2F7;
          color: #A0AEC0;
          border-color: #E2E8F0;
          cursor: not-allowed;
        `
      case 'mine':
        return `
          background: #EBF8FF;
          color: #2B6CB0;
          border-color: #BEE3F8;
          font-weight: 600;
          cursor: default;
        `
      case 'selected':
        return `
          background: #2C5282;
          color: white;
          border-color: #2C5282;
          cursor: pointer;
        `
      default:
        return `
          background: white;
          color: #2C5282;
          border-color: #E2E8F0;
          cursor: pointer;
          &:hover {
            background: #EBF8FF;
            border-color: #BEE3F8;
          }
        `
    }
  }}
`

const Legend = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #718096;
`

const LegendDot = styled.div<{ $status: SlotStatus }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;

  ${({ $status }) => {
    switch ($status) {
      case 'booked':
        return 'background: #EDF2F7; border: 1px solid #E2E8F0;'
      case 'mine':
        return 'background: #EBF8FF; border: 1px solid #BEE3F8;'
      case 'selected':
        return 'background: #2C5282;'
      default:
        return 'background: white; border: 1px solid #E2E8F0;'
    }
  }}
`
