const axios = require('axios');

// Insecure version
async function fetchURL(url) {
  const response = await axios.get(url);
  return response.data;
}

module.exports = { fetchURL };
