const urlRegex = require('url-regex');

module.exports = {
  async paragraphReplies({ id }, _, { loaders }) {
    const result = await loaders.paragraphRepliesByReplyIdLoader.load(id);
    return result || [];
  },

  user({ userId }, _, { loaders }) {
    return loaders.auth0UserLoader.load(userId);
  },

  hyperlinks({ text }, _, { loaders }) {
    const urls = text.match(urlRegex()) || [];

    return loaders.latestUrlFetchRecordByUrlLoader.loadMany(urls);
  },
};
