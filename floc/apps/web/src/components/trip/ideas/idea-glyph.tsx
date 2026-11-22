import { CategoryIcon } from "@/components/system/icons/category";
import { EventGlyph } from "@/components/system/icons/days";
import { ideaEventType } from "@floc/core/trip/idea-categories";

export function IdeaGlyph({ category }: { category: string }) {
  if (category === "drinks") return <CategoryIcon category="drinks" />;
  const type = ideaEventType(category);
  return <EventGlyph type={type} transportType={type === "transport" ? "train" : null} size={13} />;
}
