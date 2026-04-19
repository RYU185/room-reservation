import styled, { css } from 'styled-components'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
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
  sm: css`padding: 6px 12px; font-size: 12px;`,
  md: css`padding: 8px 16px; font-size: 14px;`,
  lg: css`padding: 10px 20px; font-size: 16px;`,
}

const variantStyles = {
  primary: css`
    background: #ffffff;
    color: #2C5282;
    border: 1.5px solid #2C5282;
    &:hover:not(:disabled) {
      background: #2C5282;
      color: #ffffff;
    }
  `,
  secondary: css`
    background: #ffffff;
    color: #2C5282;
    border: 1.5px solid #2C5282;
    &:hover:not(:disabled) {
      background: #EBF8FF;
    }
  `,
  danger: css`
    background: #ffffff;
    color: #E53E3E;
    border: 1.5px solid #E53E3E;
    &:hover:not(:disabled) {
      background: #E53E3E;
      color: #ffffff;
    }
  `,
  ghost: css`
    background: transparent;
    color: #E53E3E;
    border: 1.5px solid #E53E3E;
    &:hover:not(:disabled) {
      background: #FED7D7;
    }
  `,
}

const StyledButton = styled.button<{ variant: Variant; size: Size }>`
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.5s ease;
  ${({ size }) => sizeStyles[size]}
  ${({ variant }) => variantStyles[variant]}
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
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
