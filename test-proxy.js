const rp = require('request-promise');

const { getAgent } = require('./lib/auto-proxy-agent');

const { url, proxy, proxyType } = JSON.parse(process.argv[2]);

const agent = getAgent(proxy, proxyType, url);
const requestHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36',
  'Cache-Control': 'max-age=0',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Upgrade-Inescure-Requests': '1',
  'Accept-Language': 'en-US,en;q=0.8',
  'X-Requested-With': 'XMLHttpRequest',
  'Connection': 'keep-alive',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
};

const testProxy = () => {
  try {
    rp(Object.assign({
      headers: requestHeaders,
      url,
      method: 'get',
      gzip: true,
      time: true,
      resolveWithFullResponse: true,
      timeout: 5000,
    }, agent))
    .then(res => {
      process.send({
        status: 'next',
        statusCode: res.statusCode,
        proxy,
        time: res.elapsedTime / 1000
      });
    })
    .catch(e => {
      if (e.cause.code === 'ETIMEDOUT') {
        process.send({
          status: 'next',
          statusCode: 'ETIMEDOUT',
          proxy,
          time: ''
        });
      } else {
        console.log('promise error', e);
      }
    })
  } catch (e) {
    console.log('try/catch error');
  }
}

testProxy();
