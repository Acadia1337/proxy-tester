const httpAgent = require('socks5-http-client/lib/Agent');
const httpsAgent = require('socks5-https-client/lib/Agent');

const getAgent = (proxy, type, url) => {
  const options = {};
  let user = null;
  let pass = null;
  let host = null;
  let port = null;

  if (proxy.split('@').length > 1) {
    user = proxy.split('@')[0].split(':')[0];
    pass = proxy.split('@')[0].split(':')[1];
    host = proxy.split('@')[1].split(':')[0];
    port = proxy.split('@')[1].split(':')[1];
  } else {
    host = proxy.split(':')[0];
    port = proxy.split(':')[1];
  }

  if (type === 'socks') {
    if (url.substr(0, 5) === 'https') {
      options.agentClass = httpsAgent;
    } else {
      options.agentClass = httpAgent;
    }

    options.agentOptions = {
      socksHost: host,
      socksPort: port,
    };

    if (user) {
      options.agentOptions.socksUsername = user;
      options.agentOptions.socksPassword = pass;
    }
  }

  if (type === 'http') {
    if (url.substr(0, 5) === 'https') {
      options.proxy = `https://${proxy}`;
    } else {
      options.proxy = `http://${proxy}`;
    }
  }

  return options;
};

module.exports = {
  getAgent
};
