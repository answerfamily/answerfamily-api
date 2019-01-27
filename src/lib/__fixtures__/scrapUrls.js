exports.MONGO_FIXTURES = {
  urlFetchRecords: [
    {
      url: 'http://example.com/article/1111-aaaaa-bbb-ccc',
      canonical: 'http://example.com/article/1111',
      title: 'Example title',
      summary: 'Extracted summary',
      fetchedAt: new Date('2017-01-01'),
      status: 200,
    },
    {
      url: 'http://example.com/article/1111-aaaaa-bbb-ccc',
      canonical: 'http://example.com/article/1111',
      title: 'Changed title',
      summary: 'Changed summary',
      fetchedAt: new Date('2017-02-01'),
      status: 200,
    },
  ],
};
