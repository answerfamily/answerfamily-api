const { graphql } = require('graphql');
const schema = require('../src/schema');
const DataLoaders = require('../src/dataloaders');

/**
 * Executes graphql query against the current GraphQL schema.
 *
 * Usage:
 * const result = await gql`query{...}`(variable)
 *
 * @returns {(variable: Object, context: Object) => Promise<GraphQLResult>}
 */
function gql(query, ...substitutes) {
  return (variables, context = {}) =>
    graphql(
      schema,
      String.raw(query, ...substitutes),
      null,
      { loaders: new DataLoaders(), ...context },
      variables
    );
}

module.exports = gql;
