const docLoaderFactory = require('./docLoaderFactory');
const searchResultLoaderFactory = require('./searchResultLoaderFactory');
const queryLoaderFactory = require('./queryLoaderFactory');
const auth0UserLoaderFactory = require('./auth0UserLoaderFactory');
const latestUrlFetchRecordByUrlLoaderFactory = require('./latestUrlFetchRecordByUrlLoaderFactory');

module.exports = class DataLoaders {
  // List of data loaders
  //
  get docLoader() {
    return this._checkOrSetLoader('docLoader', docLoaderFactory);
  }

  get searchResultLoader() {
    return this._checkOrSetLoader(
      'searchResultLoader',
      searchResultLoaderFactory
    );
  }

  get paragraphRepliesByParagraphIdLoader() {
    return this._checkOrSetLoader(
      'paragraphRepliesByParagraphIdLoader',
      queryLoaderFactory,
      'paragraphReplies',
      'paragraphId'
    );
  }

  get paragraphRepliesByReplyIdLoader() {
    return this._checkOrSetLoader(
      'paragraphRepliesByReplyIdLoader',
      queryLoaderFactory,
      'paragraphReplies',
      'replyId'
    );
  }

  get articleSourcesLoader() {
    return this._checkOrSetLoader(
      'articleSourcesLoader',
      queryLoaderFactory,
      'articleSources',
      'articleId'
    );
  }

  get articleSourcesByUrlLoader() {
    return this._checkOrSetLoader(
      'articleSourcesByUrlLoader',
      queryLoaderFactory,
      'articleSources',
      'url'
    );
  }

  get latestUrlFetchRecordByUrlLoader() {
    return this._checkOrSetLoader(
      'latestUrlFetchRecordByUrlLoader',
      latestUrlFetchRecordByUrlLoaderFactory
    );
  }

  get auth0UserLoader() {
    return this._checkOrSetLoader('auth0UserLoader', auth0UserLoaderFactory);
  }

  // inner-workings
  //
  constructor() {
    this._loaders = {};
  }

  _checkOrSetLoader(name, factoryFn, ...args) {
    if (this._loaders[name]) return this._loaders[name];

    this._loaders[name] = factoryFn(this, ...args);
    return this._loaders[name];
  }
};
