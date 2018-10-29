const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: process.env.ELASTICSEARCH_URL,
  log: process.env.ELASTICSEARCH_LOG_LEVEL,
});

module.exports = client;
