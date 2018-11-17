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
      userId: {
        bsonType: 'string',
        description: 'user id that created the paragraph-reply connection',
      },
    },
  },

  articleSources: {
    bsonType: 'object',
    description: 'where the article comes from',
    required: ['articleId', 'createdAt'],
    properties: {
      articleId: {
        bsonType: 'string',
        description: 'Elasticsearch ID of article',
      },
      note: {
        bsonType: 'string',
        description: 'describes relationship of the article and the URL',
      },
      url: {
        bsonType: 'string',
        description: 'URL to the source',
      },
      userId: {
        bsonType: 'string',
        description: 'user id that reported such reference',
      },
      createdAt: {
        bsonType: 'date',
      },
    },
  },
};

const INDICES = {
  paragraphReplies: [
    {
      name: 'paragraphId-replyId-unique',
      key: { paragraphId: 1, replyId: 1 },
      unique: true,
    },
    {
      name: 'createdAt-sort',
      key: { createdAt: -1 },
    },
  ],
  articleSources: [
    {
      name: 'articleId',
      key: { articleId: 1 },
    },
  ],
};

mongoClient.then(async ({ client, db }) => {
  await Promise.all(
    Object.keys(SCHEMA).map(collectionName =>
      db.createCollection(collectionName, {
        validator: { $jsonSchema: SCHEMA[collectionName] },
      })
    )
  ).then(
    Promise.all(
      Object.keys(INDICES).map(collectionName => {
        return db
          .collection(collectionName)
          .createIndexes(INDICES[collectionName]);
      })
    )
  );

  client.close();
});
