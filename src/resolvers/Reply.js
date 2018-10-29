module.exports = {
  paragraphReplies({ id }, _, { loaders }) {
    return loaders.paragraphRepliesByReplyIdLoader.load(id);
  },
};
