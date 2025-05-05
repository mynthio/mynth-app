import { JSX } from 'solid-js'

type CardVariant = 'default' | 'ghost'

type CardProps = {
  children: JSX.Element
  variant?: CardVariant
  class?: string
}

export function Card(props: CardProps) {
  const variant = props.variant ?? 'default'

  return (
    <div
      class={[
        'px-32px py-12px rounded-22px max-w-full w-960px w-max',
        variant === 'default' && 'bg-elements-background',
        props.class,
      ].join(' ')}
    >
      {props.children}
    </div>
  )
}
