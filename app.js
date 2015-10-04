var Xray = require('x-ray');
var xray = Xray();

const url = 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference';

getItems(url)
  .then(getDefinitions)
  .then(function(results) {
    console.log('results: ', results);
  }).catch(function(err) {
    console.error('err >> ', err);
  });

function getItems(url) {
  return new Promise(function(resolve, reject) {
    xray(url, '.index a', [{
      type: 'code@text',
      link: '@href'
    }])(function(err, obj) {
      if (err) {
        return reject(err);
      }
      if (isEmptyObject(obj) || !obj) {}
      resolve(obj);
    });
  });
}

function getDefinitions(items) {
  return new Promise(function(resolve, reject) {
    var requests = [];
    items.forEach(function(item) {
      requests.push(getDefinition(item));
    });
    Promise.all(requests).then(function(results) {
      console.log('results: ', results);
      resolve(results);
    }).catch(function(err) {
      console.error('err getDefinitions >> ', err.stack);
    });
  });
}

function getDefinition(item) {
  if (!item.link) {
    return;
  }
  return new Promise(function(resolve, reject) {
    var result = {};
    result['type'] = item.type;
    xray(item.link, '#Values + dl > dt', ['code@text'])(function(err, definitions) {
      if (err) {
        return reject(err);
      }
      result['definitions'] = definitions;
      resolve(result);

      /*
      console.log(" ---------- ");
      console.log("link: ", item.link);
      console.log("definitions: ", result);
      */
    });
  });
}

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

