var express = require('express');
var path = require('path');
var index = require('./routes/index');
var users = require('./routes/users');
var app = express();
var port = process.env.PORT || 3000; 				// set the port
var https = require('https');
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

var urls = [];
var url1 = "https://www.alphavantage.co/query?function=";
var url2 = "&interval=daily&time_period=10&series_type=close&apikey=GCQW3YNQ6PC5VI33";
urls["SMA"] = [url1+"SMA&symbol=",url2]; 
urls["EMA"] = [url1+"EMA&symbol=",url2];
urls["STOCH"] = [url1+"STOCH&symbol=","&interval=daily&slowkmatype=1&slowdmatype=1&apikey=GCQW3YNQ6PC5VI33"];
urls["RSI"] = [url1+"RSI&symbol=",url2];
urls["ADX"] = [url1+"ADX&symbol=","&interval=daily&time_period=10&apikey=GCQW3YNQ6PC5VI33"];
urls["CCI"]=[url1+"CCI&symbol=","&interval=daily&time_period=10&apikey=GCQW3YNQ6PC5VI33"];
urls["BBANDS"]=[url1+"BBANDS&symbol=","&interval=daily&nbdevup=3&nbdevdn=3&time_period=5&series_type=close&apikey=GCQW3YNQ6PC5VI33"];
urls["MACD"] = [url1+"MACD&symbol=",url2];
urls["refresh"] =["https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=","&&apikey=GCQW3YNQ6PC5VI33"];

function indicatorUrl(symbol,func){
  var url = urls[func][0]+symbol+urls[func][1];
  return url;
}

app.get('/json', function(req, res) {
  var symbol = req.query.symbol;
  var func = req.query.func;
  var url = '';
  if(!func){
    url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol + "&outputsize=full&&apikey=GCQW3YNQ6PC5VI33";
    //console.log(url);
  }else{
    url = indicatorUrl(symbol,func);   
  }
  request({
      url: url,
      json: true
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        res.json(body);
      }
    });
});

app.get('/markit',function(req,res){
  var url = "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input="+req.query.symbol;
  request({
    url: url,
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      res.json(body);
    }
  });
});

app.get('/xml',function(req,response){
  var url = "https://seekingalpha.com/api/sa/combined/"+req.query.symbol+".xml";
  https.get(url, function(res) {
    var response_data = '';
    res.on('data', function(chunk) {
        response_data += chunk;
    });
    res.on('end', function() {
      parser.parseString(response_data, function(err, result) {
        if (err) {
          response.json(err.message);
        } else {
          response.json(result);
        }
      });
    });
    res.on('error', function(err) {
        response.json(err.message);
    });
  });
});

app.listen(port);
console.log("App listening on port http://127.0.0.1:" + port);
module.exports = app;
