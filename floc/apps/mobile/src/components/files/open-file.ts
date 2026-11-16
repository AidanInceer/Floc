import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

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
