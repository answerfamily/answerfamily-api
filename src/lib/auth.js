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
 * @param {string} cookie - cookie string containing idToken cookie
 * @returns {Promise<user|null>} Promise that resolves to id-token payload (https://auth0.com/docs/tokens/id-token#id-token-payload)
 */
function getUser(cookie = '') {
  const token = (
    cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('idToken=')) || ''
  ).replace(/^idToken=/, '');

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
