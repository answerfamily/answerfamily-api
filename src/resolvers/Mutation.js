const {
  AuthenticationError,
  UserInputError,
  ForbiddenError,
  ApolloError,
} = require('apollo-server');

const esClient = require('../lib/esClient');
const mongoClient = require('../lib/mongoClient');
const generateId = require('../lib/hash');

function assertOwnership(entity, user) {
  if (!user || user.iss !== entity.userId)
    throw new ForbiddenError('Only author can perform such action');
}

function assertLoggedIn(user) {
  if (!user) throw new AuthenticationError('Must log in first');
}

/**
 * @param {string} paragraphId
 * @param {string[]} replyIds
 * @param {string} userId
 *
 * @return {promise} MongoDB insert result
 */
async function createParagraphReplies(paragraphId, replyIds, userId) {
  if (!paragraphId || replyIds.length === 0 || !userId) {
    throw new Error('cannot create paragraph replies');
  }
  const { db } = await mongoClient;
  return db.collection('paragraphReplies').insertMany(
    replyIds.map(replyId => ({
      paragraphId,
      replyId,
      createdAt: new Date(),
      userId,
    }))
  );
}

/**
 * Creates paragraphs and connects paragraph replies if any reply Ids are given.
 *
 * @param {string} articleId
 * @param {ParagraphInput[]} paragraphs
 * @param {string} userId
 * @return {Promise<string[]>} Promise that returns list of created paragraph IDs
 */
async function createParagraphs(articleId, paragraphs, userId) {
  const body = [];
  const now = new Date();

  paragraphs.forEach(paragraph => {
    body.push({ index: { _index: 'paragraphs', _type: '_doc' } });
    body.push({ text: paragraph.text, createdAt: now, userId, articleId });
  });

  const { items, errors } = await esClient.bulk({
    body,
    refresh: true,
  });

  if (errors) {
    throw new ApolloError(
      'Cannot create paragraphs',
      400,
      items.map(({ index: { error } }) => error)
    );
  }

  const paragraphIds = items.map(({ index: { _id } }) => _id);

  // create paragraph replies for all paragraphs, if given
  await Promise.all(
    paragraphIds.map((paragraphId, idx) => {
      const replyIds = paragraphs[idx].replyIds;

      return replyIds && replyIds.length > 0
        ? createParagraphReplies(paragraphId, replyIds, userId)
        : Promise.resolve();
    })
  );

  return paragraphIds;
}

const Mutation = {
  async createArticle(_, { article }, { userPromise }) {
    const user = await userPromise;
    assertLoggedIn(user);

    const text = article.text.trim();
    const articleId = generateId(text);

    // Create article
    const {
      get: { _source },
    } = await esClient.update({
      index: 'articles',
      type: '_doc',
      id: articleId,
      body: {
        upsert: {
          text,
          createdAt: new Date(),
          userId: user.iss,
        },
      },
    });

    if (article.paragraphs && article.paragraphs.length > 0) {
      await createParagraphs(articleId, article.paragraphs, user.iss);
    }

    return { ..._source, id: articleId };
  },

  async addParagraphToArticle(
    _,
    { articleId, paragraph },
    { userPromise, loaders }
  ) {
    const user = await userPromise;
    assertLoggedIn(user);

    await createParagraphs(articleId, [paragraph], user.iss);

    return loaders.docLoader.load({
      index: 'articles',
      id: articleId,
    });
  },

  async deleteParagraph(_, { paragraphId }, { userPromise, loaders }) {
    const user = await userPromise;
    assertLoggedIn(user);

    const paragraph = loaders.docLoader.load({
      index: 'paragraphs',
      id: paragraphId,
    });
    if (!paragraph) throw new UserInputError('paragraph not exist');
    assertOwnership(paragraph, user);
  },

  async connectReplyWithParagraph(
    _,
    { replyId, paragraphId },
    { userPromise, loaders }
  ) {
    const user = await userPromise;
    assertLoggedIn(user);

    await createParagraphReplies(paragraphId, [replyId], user.iss);
    return loaders.docLoader.load({
      index: 'paragraphs',
      id: paragraphId,
    });
  },

  async disconnectReplyAndParagraph(
    _,
    { replyId, paragraphId },
    { userPromise, loaders }
  ) {
    const user = await userPromise;
    assertLoggedIn(user);

    const { db } = await mongoClient;
    const paragraphReply = await db
      .collection('paragraphReplies')
      .findOne({ replyId, paragraphId });
    assertOwnership(paragraphReply, user);

    await db.collection('paragraphReplies').deleteOne({ replyId, paragraphId });

    return loaders.docLoader.load({
      index: 'paragraphs',
      id: paragraphId,
    });
  },

  async addReplyToParagraph(
    _,
    { paragraphId, reply },
    { userPromise, loaders }
  ) {
    const user = await userPromise;
    assertLoggedIn(user);

    const text = reply.text.trim();
    const replyId = generateId(text);

    // Create reply
    await esClient.update({
      index: 'replies',
      type: '_doc',
      id: replyId,
      body: {
        upsert: {
          text,
          note: reply.note,
          createdAt: new Date(),
          userId: user.iss,
        },
      },
    });

    await createParagraphReplies(paragraphId, [replyId], user.iss);

    return loaders.docLoader.load({
      index: 'paragraphs',
      id: paragraphId,
    });
  },
};

module.exports = Mutation;
