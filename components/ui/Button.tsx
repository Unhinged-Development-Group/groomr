import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-5 py-2 text-sm",
      md: "px-7 py-3 text-base",
      lg: "px-8 py-4 text-base",
    }[size];

    const variantClasses = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost:
        "bg-transparent text-pebble-grey hover:text-deep-slate transition-colors duration-300 font-nunito font-bold rounded-full focus-ring",
    }[variant];

    return (
      <button
        ref={ref}
        className={cn(variantClasses, sizeClasses, "font-nunito font-bold focus-ring", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
