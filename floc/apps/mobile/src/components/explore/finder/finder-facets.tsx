import { NIGHTS_SCALE, PRICE_SCALE, toggled, withNights, withPrice, withUnit, type Finder, type FinderCounts, type PriceUnit } from "@floc/core/trip/explore/finder/finder";
import { MONTH_SHORT, nightsWord, scaleWord } from "@floc/core/trip/explore/finder/finder-words";
import { MAIN_TAGS, MORE_TAGS } from "@floc/core/trip/explore/finder/tag-groups";
import { REGIONS } from "@floc/core/trip/explore/preset-trips";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FinderChip } from "./finder-chip";
import { RangeBars } from "./range-bars";
import { Figure, Segmented } from "../../system/ui";
import { TextLink } from "../../system/text-controls";
import { useTheme } from "../../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export type Facet = { finder: Finder; counts: FinderCounts; shown: number; onChange: (next: Finder) => void };

const trips = (n: number) => `${n} ${n === 1 ? "trip" : "trips"}`;
const wrap = { flexDirection: "row", flexWrap: "wrap", gap: space.sm } as const;

export function WhereFacet({ finder, counts, onChange }: Facet) {
  return (
    <View style={wrap}>
      <FinderChip label="Anywhere" on={!finder.regions.length} onPress={() => onChange({ ...finder, regions: [] })} />
      {REGIONS.map((r) => (
        <FinderChip key={r} label={r} on={finder.regions.includes(r)} count={counts.regions[r]} onPress={() => onChange({ ...finder, regions: toggled(finder.regions, r) })} />
      ))}
    </View>
  );
}

export function WhenFacet({ finder, counts, onChange }: Facet) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <View style={wrap}>
        {MONTH_SHORT.map((name, i) => {
          const on = finder.months.includes(i + 1);
          const none = !on && counts.months[i] === 0;
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${name}, ${trips(counts.months[i])}`}
              onPress={() => onChange({ ...finder, months: toggled(finder.months, i + 1) })}
              style={{
                width: "14.6%",
                flexGrow: 1,
                alignItems: "center",
                paddingVertical: space.xs + 2,
                borderRadius: radius.sm,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderStyle: none ? "dashed" : "solid",
                borderColor: on ? c.ink : c["rule-2"],
                backgroundColor: on ? c.ink : c.sheet,
              }}
            >
              <Text style={{ color: on ? c.paper : none ? c["ink-3"] : c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{name}</Text>
              <Text style={{ color: on ? c.paper : c["ink-3"], opacity: on ? 0.7 : 1, fontFamily: fonts.type, fontSize: size.label }}>{counts.months[i]}</Text>
            </Pressable>
          );
        })}
      </View>
      {finder.months.length ? <TextLink label="Any month" onPress={() => onChange({ ...finder, months: [] })} /> : null}
    </View>
  );
}

function Read({ left, right }: { left: string; right: string }) {
  return (
    <>
      <Figure>{left}</Figure>
      <Figure tone="ink-3">{right}</Figure>
    </>
  );
}

export function LengthFacet({ finder, counts, shown, onChange }: Facet) {
  const { min, max } = finder.nights ?? NIGHTS_SCALE;
  return (
    <RangeBars
      label="Nights"
      bars={counts.nights.map((count, i) => ({ count, on: NIGHTS_SCALE.min + i >= min && NIGHTS_SCALE.min + i <= max }))}
      bounds={{ ...NIGHTS_SCALE, step: 1 }}
      value={[min, max]}
      onChange={([a, b]) => onChange(withNights(finder, a, b))}
    >
      <Read left={nightsWord(finder.nights)} right={trips(shown)} />
    </RangeBars>
  );
}

export function PriceFacet({ finder, counts, shown, onChange }: Facet) {
  const { unit, min, max } = finder.price;
  const scale = PRICE_SCALE[unit];
  const band = scale.max / counts.price.length;
  return (
    <View style={{ gap: space.md }}>
      <Segmented<PriceUnit>
        options={[
          { value: "trip", label: "Whole trip" },
          { value: "night", label: "Per night" },
        ]}
        value={unit}
        onChange={(next) => onChange(withUnit(finder, next))}
      />
      <RangeBars
        label="Price"
        bars={counts.price.map((count, i) => ({ count, on: (min === null || (i + 1) * band > min) && (max === null || i * band <= max) }))}
        bounds={{ min: 0, max: scale.max, step: scale.step }}
        value={[min ?? 0, max ?? scale.max]}
        onChange={([a, b]) => onChange(withPrice(finder, a, b))}
      >
        <Read left={scaleWord(finder.price)} right={trips(shown)} />
      </RangeBars>
    </View>
  );
}

/** What you like: the web's one cloud of tags, the rest behind "See more". */
export function LikeCloud({ finder, onChange }: Pick<Facet, "finder" | "onChange">) {
  const [more, setMore] = useState(false);
  const extra = more ? MORE_TAGS : MORE_TAGS.filter((t) => finder.likes.includes(t));
  return (
    <View style={{ gap: space.sm }}>
      <View style={wrap}>
        {[...MAIN_TAGS, ...extra].map((tag) => (
          <FinderChip key={tag} label={tag} on={finder.likes.includes(tag)} onPress={() => onChange({ ...finder, likes: toggled(finder.likes, tag) })} />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TextLink label={more ? "See less" : "See more"} onPress={() => setMore(!more)} />
        {finder.likes.length ? <TextLink label="Clear" onPress={() => onChange({ ...finder, likes: [] })} /> : null}
      </View>
    </View>
  );
}
