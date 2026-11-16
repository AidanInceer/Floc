import { DOCUMENT_ACCEPT } from "@floc/core/documents/documents";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

export type PickedFile = {
  name: string;
  mimeType: string;
  contentBase64: string;
};

export async function pickFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
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
    mimeType: asset.mimeType ?? "application/octet-stream",
    contentBase64,
  };
}
