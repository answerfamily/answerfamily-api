/**
 * Flatten result of Elasticsearch search result structure
 *
 * @param {object} entry - entry returned by eleasticsearch mget or search query
 * @returns {object} flattened result of { id, ...other fields }
 */
function processMeta({
  _id: id,
  _source: source,
  highlight, // search result highlighting. Should be {<fieldName>: '...'}

  found, // for mget queries
  _score, // for search queries

  sort, // cursor when sorted
}) {
  if (found || _score !== undefined) {
    return {
      id,
      ...source,
      _cursor: sort,
      _score,
      // Matches resolveSearchForIndex's highlight field settings
      _highlight: highlight && highlight.text && highlight.text[0],
    };
  }
  return null; // not found
}

module.exports = processMeta;
