import "server-only";

export function touch() {
  return { lastModifiedAt: new Date() };
}
