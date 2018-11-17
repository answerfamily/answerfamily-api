module.exports = {
  paragraphReplies({ id }, _, { loaders }) {
    return loaders.paragraphRepliesByReplyIdLoader.load(id);
  },

  user({ userId }, _, { loaders }) {
    return loaders.auth0UserLoader.load(userId);
  },
};
