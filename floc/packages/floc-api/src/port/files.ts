/** The files half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { DocCategory } from "@floc/core/documents/documents";

/**
 * One file on a trip (#296). `ownerId` is the private/shared line: null is the whole trip, and a
 * set value is only ever the viewer's own — somebody else's private file is filtered out, not
 * returned flagged.
 */
export type TripFile = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  // ISO 8601 instant — a record of an upload, not an itinerary time, so rule 10 does not apply.
  uploadedAt: string;
  uploadedBy: string;
  uploaderName: string;
  ownerId: string | null;
  // Why: a soft-deleted event reads as null — an event that goes unattaches its files rather than
  // taking them with it (#320, #325).
  dayEventId: number | null;
  // The event's own name, so a row says what it is for without a second read.
  eventTitle: string | null;
  /** The day it sits on, directly or through its event — puts it on a stop (rule 3). */
  dayId: number | null;
  eventDayId: number | null;
};

/** A file on its way up from a phone (tickets 239, 296). */
export type FileUpload = {
  name: string;
  mimeType: string;
  /**
   * The bytes, base64. A phone has no multipart form to post, and the cap is
   * 8 MB either way — so the wire carries a third more than the file, once, on
   * a rare action, rather than growing a second upload endpoint beside this one.
   */
  contentBase64: string;
  category: DocCategory;
  /** True puts it in the trip's pile; false keeps it in your own (ticket 239). */
  shared: boolean;
  // The event it lands on, when added from that event's modal (#325). Absent or null is the
  // ordinary upload: on the trip, nowhere in the itinerary.
  dayEventId?: number | null;
  /** The day it lands on: a stop's first day, when a hotel booking is added from Dates. */
  dayId?: number | null;
};

export type FilesPort = {
  /** Newest first. Somebody else's private file is never in the result (ticket 296). */
  listFiles(viewerId: string, tripId: number): Promise<TripFile[]>;

  /**
   * An address that opens one file in a plain browser (#325 feedback). The
   * phone carries a bearer token a browser cannot replay, so the link is signed
   * and short-lived instead. Minted only after the ordinary trip check passed.
   */
  fileViewUrl(viewerId: string, tripId: number, fileId: number): Promise<string>;

  /**
   * Puts a file on the trip. Returns the refusal in the words a form shows, or
   * null when it landed — a full trip and a 20 MB video are ordinary mistakes,
   * not exceptions (the validation convention).
   */
  uploadFile(viewerId: string, tripId: number, input: FileUpload): Promise<string | null>;

  /**
   * Any member's to do, like a shared packing line. A private file is never
   * handed to anybody but its owner, so it is not addressable by the rest.
   */
  deleteFile(viewerId: string, tripId: number, fileId: number): Promise<void>;

  /** Every member's live files count, private ones too, so this is a total and never a list (#285). */
  fileUsage(viewerId: string, tripId: number): Promise<{ usedBytes: number; quotaBytes: number }>;

  /** Same reach as re-filing (#364). Only the label changes; null when it saved, else the refusal in words. */
  renameFile(viewerId: string, tripId: number, fileId: number, name: string): Promise<string | null>;

  /** Re-filing is any member's to do: nothing is lost, and the resolver already refused what they cannot see. */
  setFileCategory(
    viewerId: string,
    tripId: number,
    fileId: number,
    category: DocCategory,
  ): Promise<void>;

  /**
   * Parks a file on one of the trip's events, or takes it off again (ticket
   * 325). Filing, not ownership: any member who can see the row may, the way
   * any member may re-file it. Detaching leaves the file on the trip.
   */
  attachFileToEvent(
    viewerId: string,
    tripId: number,
    fileId: number,
    dayEventId: number,
  ): Promise<void>;

  detachFileFromEvent(viewerId: string, tripId: number, fileId: number): Promise<void>;

  /** False when no volume is mounted — the client hides the upload rather than offering one that throws (rule 11). */
  filesWritable(): boolean;

  /** Where a member forwards a booking (#328). Null when inbound mail or file storage is not set up (rule 11). */
  fileInboxAddress(viewerId: string, tripId: number): Promise<string | null>;
};
