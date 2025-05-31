import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

// Typography variants for different text types
const typographyVariants = cva("", {
  variants: {
    variant: {
      // Headers
      h1: "text-3xl font-bold tracking-tight text-gray-900",
      h2: "text-2xl font-semibold tracking-tight text-gray-900",
      h3: "text-xl font-semibold text-gray-900",
      h4: "text-lg font-semibold text-gray-900",
      h5: "text-base font-semibold text-gray-900",
      h6: "text-sm font-semibold text-gray-900",

      // Body text
      body: "text-sm text-gray-900",
      bodyLarge: "text-base text-gray-900",
      bodySmall: "text-xs text-gray-900",

      // Descriptions and muted text
      description: "text-sm text-gray-600",
      descriptionSmall: "text-xs text-gray-500",
      muted: "text-sm text-gray-500",
      mutedSmall: "text-xs text-gray-400",

      // Labels and captions
      label: "text-sm font-medium text-gray-700",
      labelSmall: "text-xs font-medium text-gray-600",
      caption: "text-xs text-gray-500",
      captionSmall: "text-xs text-gray-400",

      // Interactive text
      link: "text-sm text-blue-600 hover:text-blue-700 cursor-pointer",
      linkSmall: "text-xs text-blue-600 hover:text-blue-700 cursor-pointer",

      // Status and feedback text
      success: "text-sm text-green-700",
      error: "text-sm text-red-700",
      warning: "text-sm text-orange-700",
      info: "text-sm text-blue-700",
    },
  },
  defaultVariants: {
    variant: "body",
  },
})

export interface TypographyProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(({ className, variant, as, ...props }, ref) => {
  const Comp = as || getDefaultElement(variant)
  return <Comp className={cn(typographyVariants({ variant }), className)} ref={ref} {...props} />
})

Typography.displayName = "Typography"

// Helper function to get default HTML element based on variant
function getDefaultElement(variant: TypographyProps["variant"]) {
  switch (variant) {
    case "h1":
      return "h1"
    case "h2":
      return "h2"
    case "h3":
      return "h3"
    case "h4":
      return "h4"
    case "h5":
      return "h5"
    case "h6":
      return "h6"
    case "link":
    case "linkSmall":
      return "a"
    default:
      return "p"
  }
}

// Convenience components for common use cases
export const Heading1 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="h1" as="h1" ref={ref} {...props} />
))
Heading1.displayName = "Heading1"

export const Heading2 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="h2" as="h2" ref={ref} {...props} />
))
Heading2.displayName = "Heading2"

export const Heading3 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="h3" as="h3" ref={ref} {...props} />
))
Heading3.displayName = "Heading3"

export const Heading4 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="h4" as="h4" ref={ref} {...props} />
))
Heading4.displayName = "Heading4"

export const BodyText = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="body" as="p" ref={ref} {...props} />
))
BodyText.displayName = "BodyText"

export const BodyLarge = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="bodyLarge" as="p" ref={ref} {...props} />
))
BodyLarge.displayName = "BodyLarge"

export const BodySmall = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="bodySmall" as="p" ref={ref} {...props} />
))
BodySmall.displayName = "BodySmall"

export const Description = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="description" as="p" ref={ref} {...props} />
))
Description.displayName = "Description"

export const DescriptionSmall = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, "variant">>(
  (props, ref) => <Typography variant="descriptionSmall" as="p" ref={ref} {...props} />,
)
DescriptionSmall.displayName = "DescriptionSmall"

export const MutedText = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="muted" as="span" ref={ref} {...props} />
))
MutedText.displayName = "MutedText"

export const MutedSmall = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="mutedSmall" as="span" ref={ref} {...props} />
))
MutedSmall.displayName = "MutedSmall"

export const LabelText = React.forwardRef<HTMLLabelElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="label" as="label" ref={ref} {...props} />
))
LabelText.displayName = "LabelText"

export const LabelSmall = React.forwardRef<HTMLLabelElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="labelSmall" as="label" ref={ref} {...props} />
))
LabelSmall.displayName = "LabelSmall"

export const Caption = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="caption" as="span" ref={ref} {...props} />
))
Caption.displayName = "Caption"

export const CaptionSmall = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="captionSmall" as="span" ref={ref} {...props} />
))
CaptionSmall.displayName = "CaptionSmall"

export const LinkText = React.forwardRef<HTMLAnchorElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="link" as="a" ref={ref} {...props} />
))
LinkText.displayName = "LinkText"

export const LinkSmall = React.forwardRef<HTMLAnchorElement, Omit<TypographyProps, "variant">>((props, ref) => (
  <Typography variant="linkSmall" as="a" ref={ref} {...props} />
))
LinkSmall.displayName = "LinkSmall"

export { Typography, typographyVariants }
