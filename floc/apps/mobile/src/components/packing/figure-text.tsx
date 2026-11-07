import { Text, type TextStyle } from "react-native";

import { fonts } from "@/lib/theme";
import { splitFigures } from "@/lib/packing/row-words";

/** Why: figures are mono and words are sans everywhere on the phone; this keeps one pattern for counts that mix both. */
export function FigureText({ text, style }: { text: string; style: TextStyle }) {
  return (
    <Text style={style}>
      {splitFigures(text).map((part, i) =>
        part.figure ? (
          <Text key={i} style={{ fontFamily: fonts.type, fontVariant: ["tabular-nums"] }}>
            {part.text}
          </Text>
        ) : (
          part.text
        ),
      )}
    </Text>
  );
}
