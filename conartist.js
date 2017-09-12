const { config, preset } = require('conartist');

module.exports = config(preset.babel({
  es: false,
  esnext: false
}), preset.base(), preset.jest());
