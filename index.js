const cp = require('child_process');
const fs = require('fs');
const colors = require('colors');
const rp = require('request-promise');
const prompt = require('prompt');

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

const threads = 10; // Change this to test more/fewer proxies simultaneously.
const proxies = {};
const rawProxies = fs.readFileSync('proxies.txt').toString().split('\n');

// Clear the current results.csv file.
fs.writeFile('./results.csv', '', (err, response) => {
  if (err) {
    console.log('Could not clear results.csv file...');
    process.exit();
  }
});

prompt.message = 'proxy-tester';
prompt.start();
let url = null;
let proxyType = null;

// Prompt for URL and proxy type.
prompt.get([
  {
    name: 'url',
    required: true,
    default: 'http://google.com',
    description: 'URL to test (include http://)'
  },
  {
    name: 'proxyType',
    required: true,
    default: 'socks',
    description: 'Proxy type (http/socks)'
  }
], (err, result) => {
  url = result.url;
  proxyType = result.proxyType;

  // Run initial tests.
  for (let i = 0; i < threads; i++) {
    const p = getProxy();
    testProxy(p);
  }
});

// Pulls a proxy off of rawProxies if available and returns it.
const getProxy = () => {
  if (rawProxies.length > 0) {
    const p = rawProxies.shift();

    // Make sure its not a blank line.
    if (p.length > 0) {
      return p;
    } else {
      return getProxy();
    }

    return false;
  }
}

// Creates new child process for testing individual proxy.
const testProxy = (p) => {
  const child = cp.fork(
    `${__dirname}/test-proxy.js`,
    [ JSON.stringify({
      url,
      proxyType,
      proxy: p
    }) ]
  );

  // Listen from response from child process.
  child.on('message', (m) => {
    let status = null;
    if (m.statusCode === 200) {
      status = colors.green(m.statusCode);
    } else {
      status = colors.red(m.statusCode.substring(0,3));
    }
    console.log(`[${status}] ${m.proxy}${m.time ? ' - ' + m.time + 's' : ''}`);
    // Write results to csv file.
    fs.appendFile('./results.csv', `${m.statusCode},${m.proxy},${m.time ? ' - ' + m.time + 's' : ''}\n`, (err, response) => {
      if (err) {
        console.log('Could not write results to file...');
      }
    });

    // Get another proxy and run it back.
    const next = getProxy();

    if (next) {
      testProxy(next);
    }
  });
}
