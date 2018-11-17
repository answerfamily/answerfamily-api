const DataLoader = require('dataloader');

module.exports = () =>
  new DataLoader(async userIds => {
    return userIds.map(id => ({
      id,
      picture: `Picture of ${id}`,
      name: `name of ${id}`,
    }));
  });
