// Reference: https://auth0.com/blog/develop-modern-apps-with-react-graphql-apollo-and-add-authentication/
//

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header, cb) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      throw new Error('Cannot get signing key');
    }
    var signingKey = key.publicKey || key.rsaPublicKey;
    cb(null, signingKey);
  });
}

const options = {
  audience: process.env.AUTH0_CLINET_ID,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
};

/**
 *
 * @param {string} token - openid connect token string
 * @returns {Promise<user|null>}
 */
function getUser(token) {
  if (!token) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) {
        // If token is expired, it's the same as not logged in
        if (err.name === 'TokenExpiredError') return resolve(null);

        return reject(err);
      }
      resolve(decoded);
    });
  });
}

module.exports = getUser;
