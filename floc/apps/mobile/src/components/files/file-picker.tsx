/**
 * Choosing a file and encoding it for the API (#239). Its own file so the Files screen never has
 * to know a phone has a filesystem.
 *
 * Why: base64, not multipart — there is no form to post from a phone and the cap is 8 MB either
 * way, so a rare third more on the wire beats a second upload endpoint with its own auth.
 * `File`, not `readAsStringAsync`: the old reader still typechecks but throws the moment it runs.
 */
import { DOCUMENT_ACCEPT } from "@floc/core/documents/documents";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

export type PickedFile = {
  name: string;
  mimeType: string;
  contentBase64: string;
};

// Why: null is cancelling, the ordinary way out of a picker — only an unreadable file throws,
// and the caller shows that as a sentence (rule 11).
export async function pickFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Why: the web input's own list — offering a type the server refuses refuses too late.
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
    // Why: a picker that cannot name the type still has to send one; the server refuses it.
    mimeType: asset.mimeType ?? "application/octet-stream",
    contentBase64,
  };
}
