export function removeLinks(data) {
  if (Array.isArray(data)) {
    return data.map(removeLinks);
  }

  if (typeof data === "object" && data !== null) {
    const { links, ...rest } = data;
    return Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, removeLinks(value)])
    );
  }

  return data;
}
export function removeNulls(data) {
  if (Array.isArray(data)) {
    return data.filter((item) => item !== null).map(removeNulls);
  }

  if (typeof data === "object" && data !== null) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) {
        result[key] = removeNulls(value);
      }
    }
    return result;
  }

  return data;
}
