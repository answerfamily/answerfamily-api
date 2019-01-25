module.exports = {
  articleSources: async ({ url, canonical }, _, { loaders }) => {
    const [
      urlArticleSources,
      canonicalArticleSources,
    ] = await loaders.articleSourcesByUrlLoader.loadMany([url, canonical]);

    const articleSourceIdMap = {};
    const dedupedArticleSources = [];
    (urlArticleSources || [])
      .concat(canonicalArticleSources || [])
      .forEach(articleSource => {
        const id = articleSource._id.toString();
        if (!articleSourceIdMap[id]) {
          dedupedArticleSources.push(articleSource);
          articleSourceIdMap[id] = true;
        }
      });

    return dedupedArticleSources;
  },
};
