const { h64 } = require('xxhashjs');

/* Instantiate hash function */
const xxhash64 = h64();

/**
 * Generates short id from text.
 * Outputs identical ID when the given the same article text.
 *
 * Used for preventing identical articles sending in within a short amount of time,
 * i.e. while other articles are sending in.
 *
 * @param {string} text The text
 * @returns {string} generated id
 */
function generateId(text) {
  return xxhash64
    .update(text)
    .digest()
    .toString(36);
}

module.exports = generateId;
