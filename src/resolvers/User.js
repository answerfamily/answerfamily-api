module.exports = {
  id(user) {
    return user.sub; // https://auth0.com/docs/scopes/current/oidc-scopes
  },
};
