const { fetchURL } = require('./low/formService');
const { verySafeFetchURL } = require('./high/formService');

async function fetchWithSecurity(url, level = 'low') {
  switch (level) {
    case 'high':
      return await verySafeFetchURL(url);
    case 'low':
    default:
      return await fetchURL(url);
  }
}

module.exports = {
  fetchWithSecurity,
  fetchURL,
  verySafeFetchURL
};
