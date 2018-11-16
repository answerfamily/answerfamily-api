require('dotenv').config();
require('./src/lib/catchUnhandledRejection');
const schema = require('./src/schema');
const DataLoaders = require('./src/dataloaders');
const { ApolloServer } = require('apollo-server');
const getUser = require('./src/lib/auth');

const PORT = process.env.PORT || 9000;

const server = new ApolloServer({
  schema,
  introspection: true, // Allow introspection in production as well
  context: ({ req }) => ({
    loaders: new DataLoaders(),
    userPromise: getUser(req.headers.cookie),
  }),
});
server
  .listen({
    port: PORT,
  })
  .then(({ url }) => {
    // eslint-disable-next-line no-console
    console.log(`🚀  Server ready at ${url}`);
  });
