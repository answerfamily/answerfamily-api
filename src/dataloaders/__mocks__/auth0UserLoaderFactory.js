const DataLoader = require('dataloader');

module.exports = () =>
  new DataLoader(async userIds => {
    return userIds.map(id => ({
      id,
      picture: `[mock] Picture of ${id}`,
      name: `[mock] name of ${id}`,
    }));
  });
