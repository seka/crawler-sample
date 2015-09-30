var http = require('http');

var req = http.get('http://www.w3.org/TR/css-2010/', function(res) {
  res.setEncoding('utf8');
  res.on('data', function(str) {
    console.log(str);
  });
});

req.on('error', function(err) {
  console.log("Error: " + err.message);
});

