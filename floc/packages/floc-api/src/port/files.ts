import type { BookingDetails } from "@floc/core/documents/booking/booking-details";
import type { DocCategory } from "@floc/core/documents/documents";

export type TripFile = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  uploadedAt: string;
  uploadedBy: string;
  uploaderName: string;
  ownerId: string | null;
  dayEventId: number | null;
  eventTitle: string | null;
  dayId: number | null;
  eventDayId: number | null;
  booking: BookingDetails | null;
};

export type ArchivedTripFile = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  uploadedBy: string;
  uploaderName: string;
  ownerId: string | null;
  archivedAt: string;
};

export type FileUpload = {
  name: string;
  mimeType: string;
  contentBase64: string;
  category: DocCategory;
  shared: boolean;
  dayEventId?: number | null;
  dayId?: number | null;
};

export type FilesPort = {
  listFiles(viewerId: string, tripId: number): Promise<TripFile[]>;

  fileViewUrl(viewerId: string, tripId: number, fileId: number): Promise<string>;

  uploadFile(viewerId: string, tripId: number, input: FileUpload): Promise<string | null>;

  deleteFile(viewerId: string, tripId: number, fileId: number): Promise<void>;

  listArchivedFiles(viewerId: string, tripId: number): Promise<ArchivedTripFile[]>;

  restoreFile(viewerId: string, tripId: number, fileId: number): Promise<string | null>;

  fileUsage(viewerId: string, tripId: number): Promise<{ usedBytes: number; quotaBytes: number }>;

  renameFile(viewerId: string, tripId: number, fileId: number, name: string): Promise<string | null>;

  setFileCategory(
    viewerId: string,
    tripId: number,
    fileId: number,
    category: DocCategory,
  ): Promise<void>;

  attachFileToEvent(
    viewerId: string,
    tripId: number,
    fileId: number,
    dayEventId: number,
  ): Promise<void>;

  detachFileFromEvent(viewerId: string, tripId: number, fileId: number): Promise<void>;

  filesWritable(): boolean;

  fileInboxAddress(viewerId: string, tripId: number): Promise<string | null>;
};
