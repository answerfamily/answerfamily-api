require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGODB_URL);

// Use connect method to connect to the Server
client.connect(function(err) {
  if (err) {
    // eslint-disable-next-line no-console
    console.error('Cannot connect to MongoDB:', err);
  } else {
    // eslint-disable-next-line no-console
    console.log('Connected successfully to MongoDB');
  }
});
