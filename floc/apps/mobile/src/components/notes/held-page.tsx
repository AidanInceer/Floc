import { memo, useRef, type ComponentProps } from "react";
import { LogBox } from "react-native";

import PageDom from "@/components/notes/page-dom";

LogBox.ignoreLogs(["Unable to find the class expo.modules.webview.DomWebView view"]);

const Page = memo(PageDom);

type Props = ComponentProps<typeof PageDom> & { held: boolean };

export function HeldPage({ held, ...props }: Props) {
  const kept = useRef(props);
  if (!held) kept.current = props;
  return <Page {...kept.current} />;
}
