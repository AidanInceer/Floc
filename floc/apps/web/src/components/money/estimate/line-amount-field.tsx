"use client";

import { useEffect, useRef } from "react";

import { busyMark, cx, Input } from "@/components/system/ui";
import { currencySymbol, type Currency } from "@floc/core/money/currency";

export function LineAmountField({ words, currency, initial, state, onSave, onCancel }: {
  words: string;
  currency: Currency;
  initial: string;
  state: { focus: boolean; busy: boolean };
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const symbol = currencySymbol(currency);

  useEffect(() => {
    if (!state.focus) return;
    input.current?.focus();
    input.current?.select();
  }, [state.focus]);

  const commit = (value: string) => {
    if (state.busy) return;
    if (value.trim() === initial) onCancel();
    else onSave(value);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      event.currentTarget.value = initial;
      onCancel();
    }
  };

  return (
    <label className="grid justify-items-end gap-1 max-sm:flex max-sm:w-full max-sm:items-center max-sm:justify-end max-sm:gap-2">
      <span className="typed">{symbol ? words : `${words}, ${currency}`}{busyMark(state.busy)}</span>
      <span className="relative block w-[120px]">
        {symbol ? <span aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-ink-soft">{symbol}</span> : null}
        <Input
          ref={input}
          inputMode="decimal"
          autoComplete="off"
          readOnly={state.busy}
          aria-busy={state.busy || undefined}
          defaultValue={initial}
          onBlur={(event) => commit(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          className={cx("h-[31px] w-full py-0 font-mono text-[13px]", symbol && "pl-6")}
        />
      </span>
    </label>
  );
}
