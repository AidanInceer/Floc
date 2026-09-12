/**
 * Opening one file in whatever the phone uses to read it (#325 feedback).
 *
 * NOT A BROWSER. A boarding pass belongs in the phone's own PDF reader, next
 * to the Wallet, not in a tab inside the trip planner. The browser was also the
 * long way round: it has no session, so it needed a signed link to see bytes
 * this app was already allowed to read.
 *
 * CACHE, NOT DOCUMENTS. The copy is a convenience for the viewer that opens
 * next; the file itself lives on the trip. The system may bin it whenever it
 * wants to, which is exactly right.
 *
 * A NAME THAT COLLIDES IS OVERWRITTEN, ON PURPOSE. Two trips with a
 * `tickets.pdf` should not leave `tickets (1).pdf` lying about the cache; the
 * newest download is the one being opened.
 */
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Pulls the bytes down and hands them to the system. Throws when the download
 * fails; the caller says so in words.
 */
export async function openFileNatively(
  url: string,
  name: string,
  mimeType: string,
): Promise<void> {
  const folder = new Directory(Paths.cache, "files");
  folder.create({ idempotent: true, intermediates: true });

  const landed = new File(folder, name);
  if (landed.exists) landed.delete();

  const file = await File.downloadFileAsync(url, landed);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

/** Whether this phone can hand a file to another app at all. */
export function canOpenFiles(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}
