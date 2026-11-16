export function devSignInEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return !!process.env.FLOC_DEV_USER_EMAIL && !!process.env.FLOC_DEV_USER_PASSWORD;
}
