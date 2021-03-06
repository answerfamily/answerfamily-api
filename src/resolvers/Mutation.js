const {
  AuthenticationError,
  UserInputError,
  ForbiddenError,
  ApolloError,
} = require('apollo-server');

const { ObjectId } = require('mongodb');
const esClient = require('../lib/esClient');
const scrapUrls = require('../lib/scrapUrls');
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
  const now = new Date();
  const { db } = await mongoClient;

  return db.collection('paragraphReplies').insertMany(
    replyIds.map(replyId => ({
      paragraphId,
      replyId,
      createdAt: now,
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

/**
 *
 * @param {string} articleId
 * @param {object[]} sources - instances of ArticleSourceInput
 * @param {string} userId
 * @param {Object} loaders
 */
async function createSources(articleId, sources, userId, loaders) {
  if (!articleId || sources.length === 0 || !userId) {
    throw new Error('cannot create article source');
  }
  const now = new Date();
  const { db } = await mongoClient;

  // Make sure each URL have its fetchRecord
  await Promise.all(
    sources.filter(({ url }) => !!url).map(({ url }) =>
      scrapUrls(url, {
        cacheLoader: loaders.latestUrlFetchRecordByUrlLoader,
        client: mongoClient,
        persist: true,
      })
    )
  );

  return db.collection('articleSources').insertMany(
    sources.map(({ note, url }) => ({
      articleId,
      note,
      url,
      userId,
      createdAt: now,
    }))
  );
}

const Mutation = {
  async createArticle(_, { article }, { userPromise, loaders }) {
    const user = await userPromise;
    assertLoggedIn(user);

    const text = article.text.trim();
    const articleId = generateId(text);

    // Make sure urlFetchRecords exist
    await scrapUrls(text, {
      cacheLoader: loaders.latestUrlFetchRecordByUrlLoader,
      client: mongoClient,
      persist: true,
    });

    // Create article
    const {
      get: { _source },
    } = await esClient.update({
      index: 'articles',
      type: '_doc',
      id: articleId,
      body: {
        // No-op, we just want to fetch existing / upsert new article new while getting the article
        // content in same request.
        script: { source: 'ctx._source' },
        upsert: {
          text,
          createdAt: new Date(),
          userId: user.iss,
        },
      },
      refresh: true,
      _source: true,
    });

    if (article.paragraphs && article.paragraphs.length > 0) {
      await createParagraphs(articleId, article.paragraphs, user.iss);
    }

    if (article.sources && article.sources.length > 0) {
      await createSources(articleId, article.sources, user.iss, loaders);
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

  async addSourceToArticle(_, { articleId, source }, { userPromise, loaders }) {
    const user = await userPromise;
    assertLoggedIn(user);

    await createSources(articleId, [source], user.iss, loaders);

    return loaders.docLoader.load({
      index: 'articles',
      id: articleId,
    });
  },

  async deleteParagraph(_, { paragraphId }, { userPromise, loaders }) {
    const user = await userPromise;
    assertLoggedIn(user);

    const targetParagraph = await loaders.docLoader.load({
      index: 'paragraphs',
      id: paragraphId,
    });
    if (!targetParagraph) throw new UserInputError('paragraph not exist');
    assertOwnership(targetParagraph, user);

    // Delete paragraph
    await esClient.delete({
      index: 'paragraphs',
      type: '_doc',
      id: paragraphId,
      refresh: true,
    });

    // Delete associated paragraphReplies;
    const { db } = await mongoClient;
    await db.collection('paragraphReplies').deleteMany({ paragraphId });

    return loaders.docLoader.load({
      index: 'articles',
      id: targetParagraph.articleId,
    });
  },

  async deleteArticle(_, { articleId }, { userPromise, loaders }) {
    const user = await userPromise;
    assertLoggedIn(user);

    const targetArticle = await loaders.docLoader.load({
      index: 'articles',
      id: articleId,
    });
    if (!targetArticle) throw new UserInputError('article not exist');
    assertOwnership(targetArticle, user);

    // Delete article
    await esClient.delete({
      index: 'articles',
      type: '_doc',
      id: articleId,
      refresh: true,
    });

    const paragraphByArticleIdBody = { query: { term: { articleId } } };

    const paragraphs = await loaders.searchResultLoader.load({
      index: 'paragraphs',
      body: paragraphByArticleIdBody,
    });

    // Delete associated paragraphs
    await esClient.deleteByQuery({
      index: 'paragraphs',
      type: '_doc',
      body: paragraphByArticleIdBody,
      refresh: true,
    });

    // Delete associated paragraphReplies;
    const { db } = await mongoClient;
    await db
      .collection('paragraphReplies')
      .deleteMany({ paragraphId: { $in: paragraphs.map(p => p.id) } });

    return true;
  },

  async deleteSource(_, { sourceId }, { userPromise, loaders }) {
    const user = await userPromise;
    assertLoggedIn(user);

    const { db } = await mongoClient;
    const source = await db
      .collection('articleSources')
      .findOne({ _id: ObjectId(sourceId) });
    assertOwnership(source, user);

    // Delete source
    await db
      .collection('articleSources')
      .deleteOne({ _id: ObjectId(sourceId) });

    return loaders.docLoader.load({
      index: 'articles',
      id: source.articleId,
    });
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
    const note = (reply.note || '').trim();
    const replyId = generateId(`${text}|${note}`);

    // Make sure urlFetchRecords exist.
    // Don't need to wait, we don't show URL previews.
    scrapUrls(text, {
      cacheLoader: loaders.latestUrlFetchRecordByUrlLoader,
      client: mongoClient,
      persist: true,
    });

    // Create reply
    await esClient.update({
      index: 'replies',
      type: '_doc',
      id: replyId,
      body: {
        // No-op for duplicated reply
        script: { source: 'ctx._source' },
        upsert: {
          text,
          note,
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
