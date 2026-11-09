import { permanentRedirect } from "next/navigation";

// Why: saved packing lists moved into Lists with saved trips (#467); old links and bookmarks still land.
export default function PackingListsMoved() {
  permanentRedirect("/lists/packing");
}
