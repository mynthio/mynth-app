import { JSX, splitProps } from 'solid-js'

interface FieldRootProps {
  /** The layout direction of the field */
  layout?: 'horizontal' | 'vertical'
  /** Optional CSS class for the container */
  class?: string
  children: JSX.Element
}

export function Field(props: FieldRootProps) {
  const [local, others] = splitProps(props, ['layout', 'class', 'children'])
  const isHorizontal = () => local.layout === 'horizontal'

  return (
    <div
      class={`
        flex w-full
        ${
          isHorizontal()
            ? 'flex-row items-center justify-between gap-24px'
            : 'flex-col gap-8px'
        }
        ${local.class ?? ''}
      `}
      {...others}
    >
      {local.children}
    </div>
  )
}

interface FieldMetaProps {
  class?: string
  children: JSX.Element
}

export function FieldMeta(props: FieldMetaProps) {
  return (
    <div class={`flex flex-col gap-8px max-w-460px ${props.class ?? ''}`}>
      {props.children}
    </div>
  )
}

interface FieldTitleProps {
  class?: string
  children: JSX.Element
}

export function FieldTitle(props: FieldTitleProps) {
  return (
    <span class={`font-400 text-[#B9C4C0] text-ui ${props.class ?? ''}`}>
      {props.children}
    </span>
  )
}

interface FieldDescriptionProps {
  class?: string
  children: JSX.Element
}

export function FieldDescription(props: FieldDescriptionProps) {
  return (
    <span class={`text-ui text-[#9DA7A3] leading-tight ${props.class ?? ''}`}>
      {props.children}
    </span>
  )
}

interface FieldInputProps {
  class?: string
  children: JSX.Element
}

export function FieldInput(props: FieldInputProps) {
  return <div class={`${props.class ?? ''}`}>{props.children}</div>
}

interface FieldErrorProps {
  class?: string
  children: JSX.Element
}

function FieldError(props: FieldErrorProps) {
  return (
    <span class={`text-12px text-red-500 ${props.class ?? ''}`}>
      {props.children}
    </span>
  )
}
