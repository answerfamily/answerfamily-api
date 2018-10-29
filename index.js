const schema = require('./src/schema');
const DataLoaders = require('./src/dataloaders');
const { ApolloServer } = require('apollo-server');
const PORT = process.env.PORT || 9000;

const server = new ApolloServer({
  schema,
  context: () => ({ loaders: new DataLoaders() }),
});
server
  .listen({
    port: PORT,
  })
  .then(({ url }) => {
    // eslint-disable-next-line no-console
    console.log(`🚀  Server ready at ${url}`);
  });
