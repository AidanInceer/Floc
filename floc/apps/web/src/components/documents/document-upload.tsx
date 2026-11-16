"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { uploadDocument } from "@/app/trip/[id]/files/actions";
import { ActionForm, Sheet, SubmitButton, useSheetClose } from "@/components/system/client-ui";
import { UploadIcon } from "@/components/system/icons";
import { ErrorText, Segmented, Select, SheetFooter, cx, segmentClass } from "@/components/system/ui";
import {
  DOCUMENT_ACCEPT,
  DOC_CATEGORIES,
  DOC_CATEGORY_LABELS,
  formatBytes,
  kindLabel,
  rejectUpload,
  type DocCategory,
} from "@floc/core/documents/documents";

export function DocumentUpload({
  tripId,
  scope,
  className,
  dayEventId,
  dayId,
  category = "other",
  trigger = "Upload",
  title,
  bareTrigger,
  triggerVariant,
}: {
  tripId: number;
  scope: "shared" | "private";
  className?: string;
  dayEventId?: number;
  dayId?: number;
  category?: DocCategory;
  trigger?: ReactNode;
  title?: string;
  bareTrigger?: boolean;
  triggerVariant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Sheet
      trigger={trigger}
      title={title ?? (dayEventId ? "Add a file to this event" : "Add a file")}
      triggerClassName={className}
      triggerVariant={triggerVariant}
      bareTrigger={bareTrigger}
      body="flush"
      keepOpenOnSubmit
    >
      <UploadForm tripId={tripId} dayEventId={dayEventId} dayId={dayId}>
        <div className="mt-5 grid gap-4 min-[480px]:grid-cols-2 min-[480px]:items-end">
          <ScopeChoice initial={scope} />
          <CategoryChoice initial={category} />
        </div>
      </UploadForm>
    </Sheet>
  );
}

function UploadForm({ tripId, dayEventId, dayId, children }: { tripId: number; dayEventId?: number; dayId?: number; children: ReactNode }) {
  const close = useSheetClose();
  const upload = async (formData: FormData) => {
    const answer = await uploadDocument(tripId, formData);
    if (!answer?.error) close?.();
    return answer;
  };
  return (
    <ActionForm
      action={upload}
      keepAnswers
      errorClassName="px-5 pb-4"
      footer={
        <SheetFooter>
          <SubmitButton>Upload</SubmitButton>
        </SheetFooter>
      }
    >
      {dayEventId ? <input type="hidden" name="dayEventId" value={dayEventId} /> : null}
      {dayId ? <input type="hidden" name="dayId" value={dayId} /> : null}
      <div className="p-5">
        <FilePicker />
        {children}
      </div>
    </ActionForm>
  );
}

const LABEL = "block font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft";

function FilePicker() {
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  useEffect(() => {
    const form = input.current?.form;
    const clear = () => setRefusal(null);
    form?.addEventListener("submit", clear);
    return () => form?.removeEventListener("submit", clear);
  }, []);

  const take = (file: File | null) => {
    const problem = file ? rejectUpload(file.type, file.size) : null;
    setRefusal(problem);
    if (problem && input.current) input.current.value = "";
    setPicked(problem ? null : file);
    return !problem;
  };

  const accept = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !input.current || !take(file)) return;
    const one = new DataTransfer();
    one.items.add(file);
    input.current.files = one.files;
  };

  return (
    <div>
      <input
        ref={input}
        type="file"
        name="file"
        accept={DOCUMENT_ACCEPT}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => take(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files);
        }}
        className={cx(
          "flex min-h-[8.5rem] w-full flex-col items-center justify-center gap-1 rounded-sm border p-4 text-center",
          "transition-[background-color,border-color,transform] duration-[.22s] ease-[cubic-bezier(.2,.85,.3,1)]",
          "active:scale-[0.995] active:bg-pen-soft",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen",
          over || picked
            ? "border-solid border-pen bg-pen-soft"
            : "border-dashed border-rule-strong hover:border-pen hover:bg-pen-soft",
        )}
      >
        <UploadIcon size={18} className="mb-1 text-pen" />
        <span className="max-w-full break-words text-sm font-medium text-pen">
          {picked ? picked.name : over ? "Drop it here" : "Choose a file"}
        </span>
        <span className="nums text-xs text-ink-soft">
          {picked
            ? `${kindLabel(picked.type)} · ${formatBytes(picked.size)} · Change`
            : "PDF or image · up to 8 MB"}
        </span>
      </button>
      {refusal ? (
        <div className="mt-2">
          <ErrorText>{refusal}</ErrorText>
        </div>
      ) : null}
    </div>
  );
}

function ScopeChoice({ initial }: { initial: "shared" | "private" }) {
  const [scope, setScope] = useState(initial);

  return (
    <fieldset className="min-w-0">
      <legend className={cx(LABEL, "mb-1.5")}>Who can see it</legend>
      <Segmented>
        {(
          [
            ["shared", "Everyone"],
            ["private", "Just you"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={cx(segmentClass(scope === value), "flex-1 cursor-pointer py-1.5 text-center")}
          >
            <input
              type="radio"
              name="scope"
              value={value}
              checked={scope === value}
              onChange={() => setScope(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </Segmented>
    </fieldset>
  );
}

function CategoryChoice({ initial }: { initial: DocCategory }) {
  return (
    <label className="block">
      <span className={cx(LABEL, "mb-1.5")}>File under</span>
      <Select name="category" defaultValue={initial}>
        {DOC_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {DOC_CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>
    </label>
  );
}
