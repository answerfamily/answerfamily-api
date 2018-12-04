module.exports = {
  async paragraphReplies({ id }, _, { loaders }) {
    const result = await loaders.paragraphRepliesByReplyIdLoader.load(id);
    return result || [];
  },

  user({ userId }, _, { loaders }) {
    return loaders.auth0UserLoader.load(userId);
  },
};
