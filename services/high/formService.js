const axios = require('axios');
const dns = require('dns').promises;
const { isPrivateIP } = require('../common/isPrivateIP');
const { BLACKLIST_REGEX } = require('../common/constants');

async function verySafeFetchURL(url) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();

  // 1️⃣ Block blacklisted domains
  for (const pattern of BLACKLIST_REGEX) {
    if (pattern.test(hostname)) {
      throw new Error(`Blocked by SSRF protection! Host blacklisted: ${hostname}`);
    }
  }

  // 2️⃣ Resolve IP
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (err) {
    throw new Error(`DNS resolution failed for ${hostname}`);
  }

  for (const addr of addresses) {
    if (isPrivateIP(addr.address)) {
      throw new Error(`Blocked by SSRF protection! Private IP: ${addr.address}`);
    }
  }

  // 3️⃣ Fetch allowed URL
  const response = await axios.get(url);
  return response.data;
}

module.exports = { verySafeFetchURL };
