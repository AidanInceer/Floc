/**
 * The gate on the dev sign-in door (#no-ticket).
 *
 * Both the route that opens the door and the login page that draws the button
 * ask this, so there is one answer to "is the door there". Production is never
 * a place it is open, whatever the variables say.
 */
export function devSignInEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return !!process.env.FLOC_DEV_USER_EMAIL && !!process.env.FLOC_DEV_USER_PASSWORD;
}
