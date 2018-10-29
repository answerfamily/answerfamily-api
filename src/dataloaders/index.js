const docLoaderFactory = require('./docLoaderFactory');
const searchResultLoaderFactory = require('./searchResultLoaderFactory');
const queryLoaderFactory = require('./queryLoaderFactory');

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
      'queryLoader',
      queryLoaderFactory,
      'paragraphReplies',
      'paragraphId'
    );
  }

  get paragraphRepliesByReplyIdLoader() {
    return this._checkOrSetLoader(
      'queryLoader',
      queryLoaderFactory,
      'paragraphReplies',
      'replyId'
    );
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
