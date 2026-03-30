import styled from 'styled-components'

interface Props {
  startTime: string
  endTime: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  errors?: { start?: string; end?: string }
}

export default function TimeRangePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  errors,
}: Props) {
  return (
    <Row>
      <Field>
        <Label htmlFor="startTime">시작 시간</Label>
        <Input
          id="startTime"
          type="datetime-local"
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
          $error={!!errors?.start}
        />
        {errors?.start && <FieldError>{errors.start}</FieldError>}
      </Field>
      <Separator>~</Separator>
      <Field>
        <Label htmlFor="endTime">종료 시간</Label>
        <Input
          id="endTime"
          type="datetime-local"
          value={endTime}
          min={startTime}
          onChange={(e) => onEndChange(e.target.value)}
          $error={!!errors?.end}
        />
        {errors?.end && <FieldError>{errors.end}</FieldError>}
      </Field>
    </Row>
  )
}

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 200px;
`

const Separator = styled.span`
  font-size: 14px;
  color: #64748b;
  padding-top: 30px;
`

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`

const Input = styled.input<{ $error?: boolean }>`
  padding: 8px 10px;
  border: 1.5px solid ${({ $error }) => ($error ? '#ef4444' : '#e2e8f0')};
  border-radius: 8px;
  font-size: 13px;
  color: #334155;
  outline: none;

  &:focus {
    border-color: ${({ $error }) => ($error ? '#ef4444' : '#2563eb')};
  }
`

const FieldError = styled.span`
  font-size: 12px;
  color: #ef4444;
`
