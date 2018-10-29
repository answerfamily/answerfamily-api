require('../../src/lib/catchUnhandledRejection');

const mongoClient = require('../../src/lib/mongoClient');

const SCHEMA = {
  paragraphReplies: {
    bsonType: 'object',
    description: 'n-m join table of paragraphs and replies',

    required: ['paragraphId', 'replyId', 'createdAt'],
    properties: {
      paragraphId: {
        bsonType: 'string',
        description: 'Elasticsearch ID of connected paragraph',
      },
      replyId: {
        bsonType: 'string',
        description: 'Elasticsearch ID of connected reply',
      },
      createdAt: {
        bsonType: 'date',
      },
    },
  },
};

mongoClient.then(async ({ client, db }) => {
  await Promise.all(
    Object.keys(SCHEMA).map(indexName =>
      db.createCollection(indexName, {
        validator: { $jsonSchema: SCHEMA[indexName] },
      })
    )
  );

  client.close();
});
