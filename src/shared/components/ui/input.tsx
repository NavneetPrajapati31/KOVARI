"use client";

import * as React from "react";

import { cn } from "@/shared/utils/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, spellCheck = false, ...props }, forwardRef) => {
    // Use a local ref to directly manipulate the input element
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Sync the external ref with the internal ref
    React.useImperativeHandle(forwardRef, () => inputRef.current!);

    React.useEffect(() => {
      // This effect runs after render and manually sets the value if it's currently null or undefined
      // This is a workaround to prevent the controlled/uncontrolled input error
      if (
        inputRef.current &&
        (inputRef.current.value === null ||
          inputRef.current.value === undefined)
      ) {
        if (props.value !== undefined && props.value !== null) {
          inputRef.current.value = String(props.value);
        } else if (
          props.defaultValue !== undefined &&
          props.defaultValue !== null
        ) {
          inputRef.current.value = String(props.defaultValue);
        } else {
          inputRef.current.value = "";
        }
      }
    }, [props.value, props.defaultValue]); // Re-run if value or defaultValue changes

    return (
      <input
        type={type}
        data-slot="input"
        spellCheck={spellCheck}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-input focus-visible:ring-0",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        ref={inputRef} // Use the local ref
        // Do NOT pass the `value` or `defaultValue` props directly to the input
        // as we are managing it manually in the effect.
        {...props} // Spread other props like onChange, onBlur, name, etc.
        value={undefined} // Explicitly pass undefined or remove the prop to make it uncontrolled by React on the first render
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
