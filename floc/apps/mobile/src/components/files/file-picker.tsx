/**
 * Choosing a file and turning it into something the API can take (ticket 239).
 *
 * ITS OWN FILE BECAUSE IT IS THE ONLY NATIVE THING ON THE SCREEN. The Files
 * screen is a list and two mutations; this is a picker, a disk read and a
 * base64 encode. Keeping them apart means the screen never has to know that a
 * phone has a filesystem.
 *
 * BASE64, NOT MULTIPART. There is no form to post from a phone, and the cap is
 * 10 MB either way — the wire carries a third more than the file, on a rare
 * action, rather than growing a second upload endpoint with its own auth.
 *
 * CANCELLING IS NOT AN ERROR. Backing out of the picker is the ordinary way to
 * leave it, so it answers null and the screen says nothing.
 *
 * `File`, NOT `readAsStringAsync`. The old top-level reader is still exported
 * and still typechecks, but it is a deprecation shim that throws the moment it
 * runs — so the compiler is no help here and the import has to be the new one.
 */
import { DOCUMENT_ACCEPT } from "@floc/core/documents/documents";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

export type PickedFile = {
  name: string;
  mimeType: string;
  contentBase64: string;
};

/**
 * Null means the person backed out. A thrown error means the file could not be
 * read, which the caller shows as a sentence rather than a crash (rule 11).
 */
export async function pickFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // The same list the web's file input accepts, from one place — a phone
    // offering a type the server refuses is a refusal that arrives too late.
    type: DOCUMENT_ACCEPT.split(","),
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  const contentBase64 = await new File(asset.uri).base64();

  return {
    name: asset.name,
    // A picker that could not name the type still has to say something; the
    // server refuses an unknown type in the words the screen shows.
    mimeType: asset.mimeType ?? "application/octet-stream",
    contentBase64,
  };
}
