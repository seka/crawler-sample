'use strict';

const fs = require('fs');
const util = require('util');
const xray = require('x-ray')();
const url = 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference';
const NOT_FOUND = '';
const fd = './output.json';

getItems(url)
  .then(getDefinitions)
  .then(formatResults)
  .then((results) => {
    console.log('Crawling is succeeded!');
    fs.writeFile(fd, JSON.stringify(results), 'utf8', (err) => {
      if (err) {
        throw err;
      }
      console.log('Building an output file: ' + fd);
    });
  }).catch((err) => {
    console.error('err >> ', err);
  });

/**
 * getItems
 * 引数として受け取ったurlにアクセスし、
 * aタグの情報をオブジェクトにまとめる
 *
 * @param url
 * @return {Promise}
 */
function getItems(url) {
  return new Promise((resolve, reject) => {
    xray(url, '.index a', [{
      type: 'code@text',
      link: '@href'
    }])((err, obj) => {
      if (err) {
        return reject(err);
      }
      if (isEmptyObject(obj) || !obj) {}
      resolve(obj);
    });
  });
}

/**
 * getDefinitions
 * itemsに格納されたlink情報を元に5件ずつクローリングを行う
 * TODO: クローリングを指定する文字列を引数に追加する
 *
 * @param items {type: 'string', link: 'string'} を格納した配列
 * @return {Promise}
 */
function getDefinitions(items) {
  const limit = 5;
  let results = [];
  let completed = 0;

  let request = () => {
    let process = [];
    let offset = 0;
    while (offset < limit) {
      if (completed + offset > items.length) {
        break;
      }
      let promise = getDefinition(items[completed + offset]);
      if (promise) {
        process.push(promise);
      }
      offset++;
    }
    completed += offset;
    return Promise.all(process).then((res) => {
      results = results.concat(res);
      // promiseが空振ってしまう？
      if (completed < 120) {
        return request();
      }
      return Promise.resolve(results);
    });
  };

  return request();
}

/**
 * getDefinition
 * itemに格納されたlinkを元にクローリングを行う
 * TODO: クローリングを指定する文字列を引数に追加する
 *
 * @param item {type: 'string', link: 'string'} を格納した配列
 * @return {Promise} || {} linkが存在しない場合は何も行わない
 */
function getDefinition(item) {
  if (!item.link) {
    return;
  }
  return new Promise((resolve, reject) => {
    let result = {};
    xray(item.link, '#Values + dl', ['code@text'])((err, definitions) => {
      if (err) {
        console.log(err);
      }
      if (!definitions) {
        definitions = [NOT_FOUND];
      }
      result.type = item.type;
      result.definitions = definitions;
      resolve(result);
    });
  });
}

/**
 * formatResults
 * クローリングされたdefinitionsから<, >, ', /といった文字列を取り除く
 *
 * @param results
 * @return {Promise} || {} 引数がArrayではない場合、なにもしない
 */
function formatResults(results) {
  if (!util.isArray(results)) {
    return;
  }
  return new Promise((resolve, reject) => {
    results = results.filter((result) => {
      if (result.definitions.length < 1) {
        return null;
      }
      let formatted = result.definitions.join(', ');
      formatted = formatted.trim();
      formatted = formatted.replace(/<|\/|>|'/g, '');
      result.definitions = formatted;
      return result;
    });
    resolve(results);
  });
}

/**
 * isEmptyObject
 * 空のオブジェクトを判定する
 *
 * @param obj
 * @return {Bool}
 */
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}
