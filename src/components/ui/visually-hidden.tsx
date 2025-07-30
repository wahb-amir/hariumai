"use client"

import * as React from "react"
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden"

const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
  React.ComponentProps<typeof VisuallyHiddenPrimitive.Root>
>((props, ref) => {
  return <VisuallyHiddenPrimitive.Root ref={ref} {...props} />
})
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
