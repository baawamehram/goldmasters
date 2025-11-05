import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 btn-touch",
          {
            "bg-primary text-primary-foreground shadow hover:bg-primary/90":
              variant === "default",
            "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground":
              variant === "outline",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90":
              variant === "destructive",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 px-3 text-xs": size === "sm",
            "h-11 px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
