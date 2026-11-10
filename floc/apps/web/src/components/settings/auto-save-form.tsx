"use client";

/**
 * Why: no Save button, a change is the write, as on the phone. Posts through
 * `startTransition`, not a form action: React resets a form after its action,
 * so the switch you just moved would jump back. "Saved" sits on the row's
 * header line, so the body does not move.
 */
import { createContext, startTransition, useActionState, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";

import { CheckIcon } from "@/components/system/icons";
import { ErrorText } from "@/components/system/ui";

type Outcome = { error?: string; saved?: number };

const SaveContext = createContext<() => void>(() => {});

export function AutoSaveForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  children: ReactNode;
  className?: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [state, post, pending] = useActionState(async (_previous: Outcome, data: FormData): Promise<Outcome> => {
    const result = await action(data);
    return result?.error ? { error: result.error } : { saved: Date.now() };
  }, {});

  const save = useCallback(() => {
    if (!form.current) return;
    const data = new FormData(form.current);
    startTransition(() => post(data));
  }, [post]);

  return (
    <form ref={form} onChange={save} onSubmit={(e) => { e.preventDefault(); save(); }} className={className}>
      <SaveContext.Provider value={save}>{children}</SaveContext.Provider>
      <span aria-live="polite" className="absolute right-11 top-[18px] text-xs">
        {state.saved && !pending ? (
          <span key={state.saved} className="inline-flex items-center gap-1 text-green">
            <CheckIcon size={12} />
            Saved
          </span>
        ) : null}
      </span>
      {state.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}

/** For a control that is not a form input (a chip): saves once its new value has rendered into the hidden inputs. */
export function useSaveWhenChanged(value: unknown) {
  const save = useContext(SaveContext);
  const last = useRef(value);
  useEffect(() => {
    if (last.current === value) return;
    last.current = value;
    save();
  }, [value, save]);
}
