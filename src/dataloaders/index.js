const docLoaderFactory = require('./docLoaderFactory');
const searchResultLoaderFactory = require('./searchResultLoaderFactory');

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

  // inner-workings
  //
  constructor() {
    this._loaders = {};
  }

  _checkOrSetLoader(name, factoryFn) {
    if (this._loaders[name]) return this._loaders[name];

    this._loaders[name] = factoryFn(this);
    return this._loaders[name];
  }
};
