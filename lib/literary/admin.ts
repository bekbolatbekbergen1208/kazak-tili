export function isCorpusAdmin(user: {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
}) {
  if (["admin", "corpus_editor"].includes(String(user.app_metadata?.role)))
    return true;
  const allowed = (process.env.QAZAQDOS_CORPUS_ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return !!user.email && allowed.includes(user.email.toLowerCase());
}
