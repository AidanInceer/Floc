import { memo, useRef, type ComponentProps } from "react";
import { LogBox } from "react-native";

import PageDom from "@/components/notes/page-dom";

// Why: on mount Expo's wrapper injects props before the native web view is registered, and the rejection is never caught. The page has
// those props from its initial script (seen on the device: first mount only, content and relay intact), so only the dev toast is lost.
LogBox.ignoreLogs(["Unable to find the class expo.modules.webview.DomWebView view"]);

const Page = memo(PageDom);

type Props = ComponentProps<typeof PageDom> & { held: boolean };

/**
 * Why: a stack keeps a left screen mounted but detaches its native web view, and Expo's wrapper
 * sends props into it on every render, which is rejected. While held, the last props go in again
 * unchanged, so the memo skips the render and the page keeps its place and caret.
 */
export function HeldPage({ held, ...props }: Props) {
  const kept = useRef(props);
  if (!held) kept.current = props;
  return <Page {...kept.current} />;
}
