module.exports = async function print(
  ln,
  { depth, nextSibling = null, children = [] }
) {
  const connector = (await nextSibling) || (await children).length ? "├" : "└";
  const tree = depth ? `${"│".repeat(depth - 1)}${connector}─` : "";
  console.log(`${tree} ${ln}`.trim());
};
