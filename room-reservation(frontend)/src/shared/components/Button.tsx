import styled, { css } from 'styled-components'

type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <StyledButton variant={variant} size={size} disabled={disabled || loading} {...props}>
      {loading ? <Spinner /> : children}
    </StyledButton>
  )
}

const sizeStyles = {
  sm: css`padding: 4px 12px; font-size: 13px;`,
  md: css`padding: 8px 16px; font-size: 14px;`,
  lg: css`padding: 12px 24px; font-size: 16px;`,
}

const variantStyles = {
  primary: css`background: #2563eb; color: #fff; &:hover:not(:disabled) { background: #1d4ed8; }`,
  secondary: css`background: #f1f5f9; color: #334155; &:hover:not(:disabled) { background: #e2e8f0; }`,
  danger: css`background: #dc2626; color: #fff; &:hover:not(:disabled) { background: #b91c1c; }`,
}

const StyledButton = styled.button<{ variant: Variant; size: Size }>`
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.15s;
  ${({ size }) => sizeStyles[size]}
  ${({ variant }) => variantStyles[variant]}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const Spinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`
