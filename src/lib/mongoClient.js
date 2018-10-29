require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGODB_URL);

module.exports = client.connect().then(client => {
  // eslint-disable-next-line no-console
  console.log('Connected successfully to MongoDB');

  return {
    client,
    db: client.db(process.env.MONGODB_DBNAME),
  };
});
