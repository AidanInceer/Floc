import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { PageTitle } from "@/components/system/ui";
import NotFound from "./not-found";

type WithChildren = ReactElement<{ children?: ReactNode }>;

const parts = (node: ReactNode): ReactNode[] => (Array.isArray(node) ? node : [node]);

describe("NotFound", () => {
  it("leads with its heading, with no line above it", () => {
    const [first] = parts((NotFound() as WithChildren).props.children);
    expect(isValidElement(first) && first.type).toBe(PageTitle);
  });
});
