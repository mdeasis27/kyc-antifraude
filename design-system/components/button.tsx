// design-system/components/button.tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/design-system/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-accent text-[#ffffff] hover:bg-accent/90",
        outline: "bg-background hover:bg-muted/40 text-foreground shadow-[var(--shadow-border-light)] hover:shadow-[var(--shadow-border)]",
        ghost: "text-foreground hover:bg-muted/40",
        link: "text-accent underline-offset-4 hover:underline h-auto p-0",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[0.8rem]",
        lg: "h-10 px-5 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
