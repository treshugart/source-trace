module.exports = async function traverse(traced, call) {
  const stack = traced;
  while (stack.length) {
    const cur = stack.shift();
    const next = await call(cur);
    if (next === true) {
      stack.unshift(...(await cur.children));
    }
  }
};
