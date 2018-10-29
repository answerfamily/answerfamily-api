/**
 * @param {object} data the data to traverse
 * @returns {(path, defaultValue) => *} nested data getter function for the object
 */
const getInFactory = data => (path, defaultValue) => {
  const result = (path || []).reduce((res, d) => {
    if (res !== null && typeof res === 'object') {
      return res[d];
    }
    return undefined;
  }, data);
  return result === undefined ? defaultValue : result;
};

module.exports = getInFactory;
