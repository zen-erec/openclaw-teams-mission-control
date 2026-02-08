"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectTriggerElement = React.ReactElement<SelectTriggerProps>;
type SelectContentElement = React.ReactElement<SelectContentProps>;

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

// A lightweight, dependency-free Select that mimics shadcn/ui's API surface
// (Select + SelectTrigger + SelectContent + SelectItem) while rendering a native
// <select> for maximum compatibility in this repo's offline environment.
export function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: SelectProps) {
  const childArray = React.Children.toArray(children) as React.ReactNode[];
  const trigger = childArray.find(
    (c): c is SelectTriggerElement =>
      React.isValidElement(c) && c.type === SelectTrigger
  );
  const content = childArray.find(
    (c): c is SelectContentElement =>
      React.isValidElement(c) && c.type === SelectContent
  );

  const items = React.Children.toArray(content?.props.children).filter(
    (c): c is React.ReactElement<SelectItemProps> =>
      React.isValidElement(c) && c.type === SelectItem
  );

  return (
    <div className={cn("relative", trigger?.props.wrapperClassName)}>
      <select
        id={trigger?.props.id}
        name={trigger?.props.name}
        disabled={disabled ?? trigger?.props.disabled}
        {...(value !== undefined ? { value } : { defaultValue })}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          "flex h-9 w-full appearance-none items-center justify-between rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          trigger?.props.className
        )}
      >
        {items.map((item) => (
          <option
            key={item.props.value}
            value={item.props.value}
            disabled={item.props.disabled}
          >
            {item.props.children}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
    </div>
  );
}

export interface SelectTriggerProps {
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  // Optional wrapper div className (useful for responsive layout widths).
  wrapperClassName?: string;
  children?: React.ReactNode;
}

// Slot component (rendered by <Select />)
export function SelectTrigger(_props: SelectTriggerProps) {
  return null;
}

export interface SelectContentProps {
  children?: React.ReactNode;
}

// Slot component (rendered by <Select />)
export function SelectContent(_props: SelectContentProps) {
  return null;
}

export interface SelectItemProps {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}

// Slot component (rendered by <Select />)
export function SelectItem(_props: SelectItemProps) {
  return null;
}

// Present for API compatibility; unused in the native implementation.
export function SelectValue(_props: { placeholder?: string }) {
  return null;
}
