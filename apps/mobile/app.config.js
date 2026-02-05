const config = require('./app.json');

const apiUrl = process.env.API_URL || 'http://localhost:8000/api/v1';

module.exports = {
  ...config,
  expo: {
    ...config.expo,
    extra: {
      ...config.expo.extra,
      apiUrl,
    },
  },
};
