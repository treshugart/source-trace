function parsePart(part) {
  const [path, query = null] = part.split("?");
  return { path, query };
}

module.exports = function parseMeta(originalPath) {
  const parts = originalPath.split("!").filter(Boolean);
  const { path, query } = parsePart(parts.pop());
  const loaders = parts.map(parsePart);
  const suffix = path.split(".").pop();
  return { loaders, originalPath, path, query, suffix };
};
