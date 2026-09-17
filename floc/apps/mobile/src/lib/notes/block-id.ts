// Why not crypto.randomUUID: Hermes has no Web Crypto. A block id only has to be unique in one doc.
export function newBlockId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (slot) => {
    const nibble = Math.floor(Math.random() * 16); // NOSONAR: not a secret, see above
    return (slot === "x" ? nibble : (nibble & 0x3) | 0x8).toString(16);
  });
}
