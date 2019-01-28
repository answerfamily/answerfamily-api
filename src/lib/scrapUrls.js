// import rollbar from 'rollbarInstance';
const urlRegex = require('url-regex');
const DataLoader = require('dataloader');
const { request } = require('graphql-request');

/**
 * Extracts urls from a string.
 * Fetches the specified url data from cache or through scrapping.
 * Optionally writes the scrapped result to database.
 *
 * @param {string} text
 * @param {object} options
 * @param {object} options.cacheLoader - The dataloader that loads result from `urls`, given a URL.
 *                                       If not given, scrapUrls don't read `urls` cache.
 * @param {boolean} options.noFetch - If true, return null when cache does not hit. Default: false.
 * @param {object} options.client - mongo client instance used to write new UrlFetchRecord.
 *                                  If not given, scrapUrl don't write `urls` cache.
 * @param {number} options.scrapLimit - Limit the number of the new URLs scrapped from the text.
 *                                      Cached entries are not counted in limit.
 * @return {Promise<UrlFetchRecord[]>} - If cannot scrap, resolves to null
 */
async function scrapUrls(
  text,
  { cacheLoader, client, noFetch = false, scrapLimit = 5 } = {}
) {
  const urls = text.match(urlRegex()) || [];
  if (urls.length === 0) return [];

  const scrapLoader = new DataLoader(urls =>
    request(
      process.env.URL_RESOLVER_URL,
      `
        query($urls: [String]!) {
          resolvedUrls(urls: $urls) {
            url
            canonical
            title
            summary
            topImageUrl
            status
            error
          }
        }
      `,
      { urls }
    ).then(data => data.resolvedUrls)
  );

  const fetchRecords = await Promise.all(
    // 1st pass: resolve cache
    urls.map(async url => {
      if (cacheLoader) {
        const cachedFetchRecord = await cacheLoader.load(url);

        if (cachedFetchRecord)
          return {
            ...cachedFetchRecord,
            url, // Overwrite the URL from cache with the actual url in text, because cacheLoader may match canonical URLs
            fromUrlsCache: true,
          };
      }

      return url;
    })
  ).then(fetchRecordsOrUrls => {
    // 2nd pass: scrap when needed
    let scrappingCount = 0;

    return Promise.all(
      fetchRecordsOrUrls.map(async fetchRecordOrUrl => {
        if (typeof fetchRecordOrUrl !== 'string') {
          return fetchRecordOrUrl;
        }

        // fetchRecordOrUrl is an URL here

        if (noFetch || scrappingCount >= scrapLimit) return null;
        scrappingCount += 1;
        return scrapLoader.load(fetchRecordOrUrl);
      })
    );
  });

  if (!client) {
    // client not specified, don't to write to urls
    return fetchRecords;
  }

  const fetchedAt = new Date();
  const { db } = await client;

  // Filter out null, write to "urlFetchRecords" collection
  const fetchRecordsToWrite = fetchRecords
    .filter(r => r && !r.fromUrlsCache)
    .map(r => ({
      ...r,
      fetchedAt,
    }));
  if (fetchRecordsToWrite.length > 0) {
    db.collection('urlFetchRecords').insertMany(fetchRecordsToWrite);
  }

  return fetchRecords;
}

module.exports = scrapUrls;
