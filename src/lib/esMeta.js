/**
 * Flatten result of Elasticsearch search result structure
 *
 * @param {object} entry - entry returned by eleasticsearch mget or search query
 * @returns {object} flattened result of { id, ...other fields }
 */
function processMeta({
  _id: id,
  _source: source,

  found, // for mget queries
  _score, // for search queries

  sort, // cursor when sorted
}) {
  if (found || _score !== undefined) {
    return { id, ...source, _cursor: sort, _score };
  }
  return null; // not found
}

module.exports = processMeta;
