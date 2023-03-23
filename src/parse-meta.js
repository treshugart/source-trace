const cache = {};

function parsePart(part) {
  const [file, query = null] = part.split("?");
  return { file, query };
}

module.exports = function parseMeta(spec) {
  if (cache[spec]) {
    return cache[spec];
  }
  const parts = spec.split("!").filter(Boolean);
  const { file, query } = parsePart(parts.pop());
  const loaders = parts.map(parsePart);
  return (cache[spec] = {
    loaders,
    file,
    query,
    spec,
    suffix: file.split(".").pop(),
  });
};
