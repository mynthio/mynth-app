import { ark } from '@ark-ui/solid/factory'
import { JSX } from 'solid-js/jsx-runtime'

import { createMemo } from 'solid-js'

type ButtonVariant = 'default' | 'ghost'

const buttonVariants: Record<ButtonVariant, string> = {
  default: 'bg-[#262828] text-body',
  ghost: 'bg-transparent text-muted',
}

export interface ButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button(props: ButtonProps) {
  const variant = createMemo(() => buttonVariants[props.variant ?? 'default'])

  return (
    <ark.button
      {...props}
      class={`${variant()} text-14px h-42px px-28px rounded-9px cursor-default`}
    />
  )
}
