/** Holds File objects picked while logged out so we can upload them after login. */

const pendingFiles = new Map<string, File>();

export function stashGuestFile(id: string, file: File) {
  pendingFiles.set(id, file);
}

export function takeGuestFile(id: string): File | undefined {
  const file = pendingFiles.get(id);
  pendingFiles.delete(id);
  return file;
}

export function dropGuestFile(id: string) {
  pendingFiles.delete(id);
}

export function readFileAsObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}
