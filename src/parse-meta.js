const { parse } = require("querystring");

function parsePart(part) {
  const parts = part.split("?");
  const query = parse(parts[1]);
  return { data: query, name: parts[0] };
}

module.exports = function parseMeta(file) {
  const parts = file.split("!").filter(Boolean);
  const pathPart = parts.pop();
  const metaPart = parts.map(parsePart);
  return { meta: metaPart, path: pathPart };
};
