export function isValidEmail(email: string): boolean {
  const value = email.trim();
  if (/\s/.test(value)) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && domain.slice(1, -1).includes(".");
}

export function passwordWeakness(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-zA-Z]/.test(password)) return "Include at least one letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return null;
}
