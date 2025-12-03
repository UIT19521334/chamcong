const ip = require('ip');

function isPrivateIP(address) {
  if (address === '::1') return true;

  return (
    ip.isLoopback(address) ||
    ip.isPrivate(address)
  );
}

module.exports = { isPrivateIP };
