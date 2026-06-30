type User = {
  id: string;
  email: string;
  phone: string;
  name: string;
  password?: string;
  roles: string[];
  createdAt: string;
  credits?: number;
  creditHistory?: unknown[];
  profileImageUrl?: string;
};

export function mergeUsersForSave(existingUsers: User[], incomingUsers: User[]) {
  const existingById = new Map(existingUsers.map((user) => [user.id, user]));
  const incomingIds = new Set(incomingUsers.map((user) => user.id));

  const mergedIncoming = incomingUsers.map((incoming) => {
    const existing = existingById.get(incoming.id);
    if (!existing) return incoming;

    return {
      ...existing,
      ...incoming,
      password: incoming.password || existing.password,
      creditHistory: incoming.creditHistory ?? existing.creditHistory,
    };
  });

  const untouched = existingUsers.filter((user) => !incomingIds.has(user.id));
  return [...untouched, ...mergedIncoming];
}
