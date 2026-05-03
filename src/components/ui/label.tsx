import * as React from "react"
import { type VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        muted: "text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement> & VariantProps<typeof labelVariants>>(
  ({ className, variant, ...props }, ref) => {
    return <label ref={ref} data-slot="label" className={cn(labelVariants({ variant }), className)} {...props} />
  }
)
Label.displayName = "Label"

export { Label, labelVariants }