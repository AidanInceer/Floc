import { Text, type TextStyle } from "react-native";

import { fonts } from "@/lib/theme";
import { splitFigures } from "@/lib/packing/row-words";

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
