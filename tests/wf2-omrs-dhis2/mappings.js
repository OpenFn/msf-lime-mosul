export const isValidUUID = (id) => {
  if (!id || typeof id !== "string") return false;

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_PATTERN.test(id);
};
