require('./lib/catchUnhandledRejection');
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('apollo-server');

const schema = makeExecutableSchema({
  typeDefs: fs.readFileSync(path.join(__dirname, `./typeDefs.graphql`), {
    encoding: 'utf-8',
  }),
  resolvers: {
    Query: require('./resolvers/query'),
  },
});

module.exports = schema;
