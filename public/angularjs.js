var app = angular.module('myApp', ['ngMaterial','ngAnimate']);

app.controller('mainController', function($timeout, $q, $log, $http, $scope, $window) {
	this.querySearch = querySearch;
	//this.search = search;
	//this.clear = clear();

	$scope.symbol = "";
	$scope.graphData =[];
	$scope.graphUrl =[];
	$scope.newsTable =[];
	$scope.panelSwitch = false;

	$scope.activeStock = "active";  
 	$scope.activeChart = "";
 	$scope.activeNews = "";
 	$scope.stockSwitch = false;
	$scope.chartSwitch = true;
	$scope.newsSwitch = true;
	graphTableSwitch(0);
	stockTableSwitch(0);
	newsTableSwitch(0);
	chartsTableSwitch(0);

	var timer;

	//var toggle = angular.element( document.querySelector( '#autoRefresh' ) );
	//console.log(toggle.prop("checked"));

	$scope.autoRefreshOn = function(){
		console.log("autoRefreshOn");
		timer = $timeout(function() {$scope.autoRefreshOn()}, 5000);
	}

	$scope.autoRefreshOff = function(){
		console.log("autoRefreshOff");
		$timeout.cancel(timer);
	}

	$scope.sortBy = {
		options : [
		{id:"0",name:"Default",type:""},
        {id:"1",name:"Symbol",type:"symbol"},
        {id:"2",name:"Price",type:"price"},
        {id:"3",name:"Change",type:"change"},
        {id:"4",name:"Change Percent",type:"percent"},
        {id:"5",name:"Volume",type:"volume"}
		],
		model : {id:"0",name:"Default",type:""}
	};

	$scope.order = {
		options : [
		{id:"0",name:"Ascending",reverse:false},
        {id:"1",name:"Descending",reverse:true}
		],
		model : {id:"0",name:"Ascending",reverse:false}
	};


	updataFavoriteList();
	//$window.localStorage.clear();
	//console.log($window.localStorage);
	$scope.facebook = function(){
		var pic = "";
		if($scope.activeChart == "active"){
			pic = $scope.graphUrl["historicalCharts"];
		}else{
			pic = $scope.graphUrl[$scope.active];
		}
		 FB.ui({ 
	      app_id: "1613599472033352", 
	      method: 'feed', 
	      picture: pic
	    },function(response){
	      if(response && !response.error_message){ 
	        alert("Posted Successfully");
	      }else{
	        alert("Not Posted");
	      }
	    });
	}

	$scope.removeFavorite = function(symbol){
		if($window.localStorage[symbol]){
			$window.localStorage.removeItem(symbol);
			updataFavoriteList();
		}
	}

	$scope.clear = function clear(){
		$scope.newsTable = [];
		$scope.stockTable = [];
		$scope.historicalChartsData = null;
		$scope.graphData = [];
		graphTableSwitch(0);
		stockTableSwitch(0);
		newsTableSwitch(0);
		chartsTableSwitch(0);
		$scope.symbol = null;
		$scope.panelSwitch = false;
		$scope.ctrl.searchText = null;
	}

	$scope.clearAndSearch = function(symbol){
		$scope.clear;
		$scope.ctrl.searchText = symbol;
		$scope.search(symbol);
	}

	$scope.refresh = function(){
		console.log("refresh");
		for(var i in $window.localStorage){
			var data = angular.fromJson($window.localStorage[i]);
			var symbol = data["symbol"];
			requestJson(symbol,"refresh");
		}
		updataFavoriteList();
	}

	function updataFavoriteList(){
		$scope.favoriteList=[];
		for(var i in $window.localStorage){
			//console.log(angular.fromJson($window.localStorage[i]));
			$scope.favoriteList.push(angular.fromJson($window.localStorage[i]));
		}
	}

	$scope.favorite = function(){
		var myEl = angular.element( document.querySelector( '#star' ) );
		if(myEl.attr("class") == "glyphicon glyphicon-star-empty"){
			var change,percent;
			change = $scope.stockTable[2]["Value"].split(" ");
			percent = change[1].substring(1, change[1].indexOf("%"));
			change = parseFloat(change[0]);
			var value = {
				"symbol": $scope.symbol,
				"price" : parseFloat($scope.stockTable[1]["Value"]),
				"change" : change,
				"percent": parseFloat(percent),
				"volume" : parseFloat($scope.stockTable[7]["Value"]),
				"image" : $scope.stockTable[2]["Image"],
				"color" : $scope.stockTable[2]["Color"]
			};
			value = angular.toJson(value);
			$window.localStorage.setItem($scope.symbol,value);
			myEl.attr('class',"glyphicon glyphicon-star");
			myEl.attr('style',"color: #fdd445");
			//console.log($window.localStorage);
			updataFavoriteList()		
		}else{
			$window.localStorage.removeItem($scope.symbol);
			myEl.attr('class',"glyphicon glyphicon-star-empty");
			myEl.removeAttr('style');
			//console.log($window.localStorage);
			updataFavoriteList()
		}
	}

    $scope.search = function(what) {
    	$scope.symbol = what;
    	$scope.newsTable = [];
		$scope.stockTable = [];
		$scope.historicalChartsData = null;
		$scope.graphData = [];
    	$scope.panelSwitch = true;
    	if($window.localStorage[what]){
    		var myEl = angular.element( document.querySelector( '#star' ) );
			myEl.attr('class',"glyphicon glyphicon-star");
			myEl.attr('style',"color: #fdd445");
    	}else{
			var myEl = angular.element( document.querySelector( '#star' ) );
			myEl.attr('class',"glyphicon glyphicon-star-empty");
			myEl.removeAttr('style');
		}

    	stockTableSwitch(1);
    	graphTableSwitch(1);
    	chartsTableSwitch(1);
    	newsTableSwitch(1);
        activeStockTab();
		
        var data = {"symbol":$scope.symbol};
    	$http.get("/json",{params : data})
    	.success(
    		function (response) {
    			if(!response["Meta Data"]){
    				stockTableSwitch(2);
    				graphTableSwitch(2);
    				chartsTableSwitch(2);
    				if($scope.active == "Price"){
	    				$scope.graphError = "Price";
	    			}
    			}else{
    				getIndicators(); 
    				generateTable(response);
    				generatePriceData(response);
    				if($scope.active == "Price"){
    					drawGraph($scope.graphData["Price"]);
						graphTableSwitch(0);
    				}
					generateHistoricalCharts(response);
    			}
    		})
    	.error(
    		function(error){
    			stockTableSwitch(2);
    			graphTableSwitch(2);
    			chartsTableSwitch(2);
    			if($scope.active == "Price"){
    				$scope.graphError = "Price";
    			}  			
    	});   	
    };

    $scope.price = function(){
    	$scope.active = "Price";
    	if($scope.graphData["Price"]){
    		drawGraph($scope.graphData["Price"]);
    	}
    };
    $scope.sma = function(){
    	$scope.active = "SMA";
    	if($scope.graphData["SMA"]){
    		drawGraph($scope.graphData["SMA"]);
    	}else{
    		graphTableSwitch(1);
			requestJson($scope.symbol,"SMA");
    	}
    };
    $scope.ema = function(){
    	$scope.active = "EMA";
    	if($scope.graphData["EMA"]){
    		drawGraph($scope.graphData["EMA"]);
    	}else{
    		graphTableSwitch(1);
			requestJson($scope.symbol,"EMA");
    	}
    };
    $scope.stoch = function(){
    	$scope.active = "STOCH";
    	if($scope.graphData["STOCH"]){
    		drawGraph($scope.graphData["STOCH"]);
    	}else{
    		graphTableSwitch(1);
			requestJson($scope.symbol,"STOCH");
    	}
    };
    $scope.rsi = function(){
    	$scope.active = "RSI";
    	if($scope.graphData["RSI"]){
    		drawGraph($scope.graphData["RSI"]);
    	}else{
    		graphTableSwitch(1);
			requestJson($scope.symbol,"RSI");
    	}
    };
    $scope.adx = function(){
    	$scope.active = "ADX";
    	if($scope.graphData["ADX"]){
    		drawGraph($scope.graphData["ADX"]);
    	}else{
    		graphTableSwitch(1);
			requestJson($scope.symbol,"ADX");
    	}
    };
    $scope.cci = function(){
    	$scope.active = "CCI";
    	if($scope.graphData["CCI"]){
    		drawGraph($scope.graphData["CCI"]);
    	}else{
    		graphTableSwitch(1);
			requestJson($scope.symbol,"CCI");
    	}
    };
    $scope.bbands = function(){
    	$scope.active = "BBANDS";
    	if($scope.graphData["BBANDS"]){
    		drawGraph($scope.graphData["BBANDS"]);
    	}else{
    		graphTableSwitch(1);
			requestJson($scope.symbol,"BBANDS");
    	}
    };
    $scope.macd = function(){
    	$scope.active = "MACD";
    	if($scope.graphData["MACD"]){
    		drawGraph($scope.graphData["MACD"]);
    	}else{
    		graphTableSwitch(1);
			requestJson($scope.symbol,"MACD");
    	}
    };
    $scope.historicalChart = function(){
		activeChartsTab();
	}
	$scope.newsFeed = function(){
		activeNewsTab();
		if($scope.newsTable != []){
			newsTableSwitch(1);
			requestXML($scope.symbol);
		}
	}
	$scope.currentStock = function(){
		activeStockTab();
	}

	function generatePrice(response){
		var valuesArray = Object.values(response["Time Series (Daily)"]);
		var keysArray = Object.keys(response["Time Series (Daily)"]);
		var info = Object.values(response["Meta Data"]);
		var currentDate = info[2];
		var priceArray=[];
		var volumeArray=[];
		$scope.timeArray=[];		

		for(var i=0;i<121;i++){
			priceArray.push(round(Object.values(valuesArray[i])[3],2));
			volumeArray.push(round(Object.values(valuesArray[i])[4],2));
			//$date = new DateTime($keyArray[$i], new DateTimeZone("EDT"));
			$scope.timeArray.push(keysArray[i].split("-").slice(1).join("/"));
		}
		var minPrice = Math.min.apply(Math,priceArray);
		var maxPrice = Math.max.apply(Math,priceArray);
		var minVolume = Math.min.apply(Math,volumeArray);
		var maxVolume = Math.max.apply(Math,volumeArray);

		priceArray=priceArray.slice().reverse();
		volumeArray=volumeArray.slice().reverse();
		$scope.timeArray=$scope.timeArray.slice().reverse();

		var title = $scope.symbol+" Stock Price and Volume";
		var yAxis = [];
		yAxis.push({
			"title":{
				"text":"Stock Price"
			},
			"labels":{
				"format":"{value:,.2f}"
			},
			"min":0,
			"max":maxPrice
			//"tickInterval":5
		});
		yAxis.push({
			"title":{
				"text":"Volume"
			},
			"opposite":true,
			"max":maxVolume
		});

		var seriesArray=[];
		seriesArray.push({
			"type": "area",
			"name": "Price",
			"data": priceArray,
			"threshold":null,
			"yAxis":0,
			"tooltip": {
				"pointFormat":$scope.symbol+":{point.y:,..2f}"
			},
			"color":"blue",
			"fillColor":"#ccd9ff",
			"lineWidth": 2,
			"marker":{
				"enable":false
			}
		});
		seriesArray.push({
			"type": "column",
			"name": "Volume",
			"data": volumeArray,
			"yAxis":1,
			"color":"red"
		});
		$scope.PriceVolume = {
			"chart": {
				"zoomType": 'x'
			},
			"title":{
				"text": title
			},
			"subtitle":{
				"useHTML":true,
				"text":"<a class='indicator' target='_blank' href='https://www.alphavantage.co/'>Source: Alpha Vantage</a>"
			},
			"yAxis": yAxis,
			"xAxis":{
				"categories":$scope.timeArray,
				"tickInterval":5
			},
			"series": seriesArray
		};
		$scope.graphData["Price"] = $scope.PriceVolume;
    }

	function stockTableSwitch(on){
		$scope.tableDataSwitch = true;
		$scope.tableProgressSwitch = true;
		$scope.tableErrorSwitch = true;
		if(on == 0){
			$scope.tableDataSwitch = false;
		}else if(on == 1){
			$scope.tableProgressSwitch = false;
		}else{
			$scope.tableErrorSwitch = false;
		}
	}

	function graphTableSwitch(on){
		$scope.graphDataSwitch = true;
		$scope.graphProgressSwitch = true;
		$scope.graphErrorSwitch = true;
		if(on == 0){
			$scope.graphDataSwitch = false;
		}else if(on == 1){
			$scope.graphProgressSwitch = false;
		}else{
			$scope.graphErrorSwitch = false;
		}
	}

	function chartsTableSwitch(on){
		$scope.chartsDataSwitch = true;
		$scope.chartsProgressSwitch = true;
		$scope.chartsErrorSwitch = true;
		if(on == 0){
			$scope.chartsDataSwitch = false;
		}else if(on == 1){
			$scope.chartsProgressSwitch = false;
		}else{
			$scope.chartsErrorSwitch = false;
		}
	}

	function newsTableSwitch(on){
		$scope.newsDataSwitch = true;
		$scope.newsProgressSwitch = true;
		$scope.newsErrorSwitch = true;
		if(on == 0){
			$scope.newsDataSwitch = false;
		}else if(on == 1){
			$scope.newsProgressSwitch = false;
		}else{
			$scope.newsErrorSwitch = false;
		}
	}

	function generateHistoricalChartsGraph(data){
		var historicalChartsData = {
			"chart": {
				"zoomType": 'x'
			},
			"title":{
				"text": $scope.symbol + " Stock Value"
			},
			"tooltip": {
				"split":false
			},
			"subtitle":{
				"useHTML":true,
				"text":"<a class='indicator' target='_blank' href='https://www.alphavantage.co/'>Source: Alpha Vantage</a>"
			},
			"yAxis": {
				"title":{
					"text": "Stock Value"
				},
				"opposite":true
			},
			"rangeSelector": {
				"buttons": [{
					"type": 'week',
                	"count": 1,
                	"text": '1w'
                }, {
                	"type": 'month',
                	"count": 1,
                	"text": '1m'
            	}, {
                	"type": 'month',
                	"count": 3,
                	"text": '3m'
            	},{
                	"type": 'month',
                	"count": 6,
                	"text": '6m'
            	}, {
                	"type": 'ytd',
                	"text": 'YTD'
            	}, {
                	"type": 'year',
                	"count": 1,
                	"text": '1y'
            	}, {
                	"type": 'all',
                	"text": 'All'
            	}],
				"selected": 0
			},
			"series":[{
				"name":$scope.symbol,
				"data": data,
				"type":"area",
				"threshold":null,
				"tooltip":{
					"valueDecimals":2
				}
			}]
		};
		
		$scope.historicalChartsData = historicalChartsData;
		Highcharts.stockChart('historical-chart-container', $scope.historicalChartsData);
		chartsTableSwitch(0);
    }

    function generateHistoricalCharts(response){
    	var valuesArray = Object.values(response["Time Series (Daily)"]);
		var keysArray = Object.keys(response["Time Series (Daily)"]);
		var info = Object.values(response["Meta Data"]);
		var data = [];

		for(var i=0;i<keysArray.length;i++){
			if(i == 1000){break;}
			var time = new Date(keysArray[i]).getTime();
			var price = round(Object.values(valuesArray[i])[3],2);
			var temp =[];
			temp.push(time);
			temp.push(price);
			data.push(temp);
		}
		data = data.slice().reverse();
		generateHistoricalChartsGraph(data);
	}

	function generateIndicatorGraph(title,func,valueArray,keyArray,timeArray,symbol){
		colorArray = ["#3399ff", "black", "#7CFC00", "#191970"];
		seriesArray = [];
	
		if(keyArray.length == 1){
			var temp = {"name": symbol,"data": valueArray[0],"threshold":null,"color":"lightblue","lineWidth": 1};
			seriesArray.push(temp);
		}
		else{
			for(var i=0; i<keyArray.length; i++){
				var temp = {"name": symbol+" "+keyArray[i],"data": valueArray[i],"threshold":null,"color": colorArray[i], "lineWidth":1}; 1;
				seriesArray.push(temp);
			}
		}
		var data = {
			"chart": {
				"zoomType": 'x'
			},
			"title":{
				"text": title
			},
			"subtitle":{
				"useHTML":true,
				"text":"<a class='indicator' target='_blank' href='https://www.alphavantage.co/'>Source: Alpha Vantage</a>"
			},
			"yAxis": {
				"title": {
					"text": func
				}
			},
			"xAxis":{
				"categories":timeArray,
				"tickInterval":5
			},
			"series": seriesArray
		};
		$scope.graphData[func] = data;
		if($scope.active == func){
			drawGraph(data);
		}
		if(!$scope.graphUrl[func]){
			requestImage(JSON.stringify(data),func);
		}
	}

	function generateIndicatorData(response,func){

    	var values = Object.values(response);
		var title = Object.values(values[0])[1];
		var symbol = Object.values(values[0])[0];
		var timeArray=[];	
		var keys = Object.keys(values[1]);
		values = Object.values(values[1]);
		keyArray = Object.keys(values[0]);
		valueArray = new Array(keyArray.length);

		for(var i=0; i<keyArray.length; i++){
			valueArray[i] = new Array(121);
		}
		for(var i=0; i<121; i++){
			var d = keys[i].split("-").slice(1).join("/");
			timeArray.push(d);
			for(var j=0; j<keyArray.length; j++){
				valueArray[j][i]= round(Object.values(values[i])[j],2);
			}
		}
		timeArray = timeArray.slice().reverse();
		for(var i=0; i<keyArray.length; i++){
			valueArray[i] = valueArray[i].slice().reverse();
		}
		
		generateIndicatorGraph(title,func,valueArray,keyArray,timeArray,symbol);
    }

	function getIndicators(){
		funcs = ["SMA","EMA","STOCH","RSI","ADX","CCI","BBANDS","MACD"];
		for(var i in funcs){
			//console.log(funcs[i]);
			requestJson($scope.symbol,funcs[i]);
			sleep(500);
		}
    }

	function generatePriceGraph(priceArray,volumeArray,timeArray){
		var minPrice = Math.min.apply(Math,priceArray);
		var maxPrice = Math.max.apply(Math,priceArray);
		var minVolume = Math.min.apply(Math,volumeArray);
		var maxVolume = Math.max.apply(Math,volumeArray);

		var title = $scope.symbol+" Stock Price and Volume";
		var yAxis = [];
		yAxis.push({
			"title":{
				"text":"Stock Price"
			},
			"labels":{
				"format":"{value:,.2f}"
			},
			"min":0,
			"max":maxPrice
		});
		yAxis.push({
			"title":{
				"text":"Volume"
			},
			"opposite":true,
			"max":maxVolume
		});

		var seriesArray=[];
		seriesArray.push({
			"type": "area",
			"name": "Price",
			"data": priceArray,
			"threshold":null,
			"yAxis":0,
			"tooltip": {
				"pointFormat":$scope.symbol+":{point.y:,..2f}"
			},
			"color":"blue",
			"fillColor":"#ccd9ff",
			"lineWidth": 2,
			"marker":{
				"enable":false
			}
		});
		seriesArray.push({
			"type": "column",
			"name": "Volume",
			"data": volumeArray,
			"yAxis":1,
			"color":"red"
		});

		var PriceVolume = {
			"chart": {
				"zoomType": 'x'
			},
			"title":{
				"text": title
			},
			"subtitle":{
				"useHTML":true,
				"text":"<a class='indicator' target='_blank' href='https://www.alphavantage.co/'>Source: Alpha Vantage</a>"
			},
			"yAxis": yAxis,
			"xAxis":{
				"categories":timeArray,
				"tickInterval":5
			},
			"series": seriesArray
		};
		$scope.graphData["Price"] = PriceVolume;
		if($scope.active == "Price"){
			drawGraph($scope.graphData["Price"]);
		}
		requestImage(JSON.stringify($scope.graphData["Price"]),"Price");
	}

	function generatePriceData(response){
		var valuesArray = Object.values(response["Time Series (Daily)"]);
		var keysArray = Object.keys(response["Time Series (Daily)"]);
		var info = Object.values(response["Meta Data"]);
		var currentDate = info[2];
		var priceArray=[];
		var volumeArray=[];
		var timeArray=[];	
		for(var i=0;i<121;i++){
			priceArray.push(round(Object.values(valuesArray[i])[3],2));
			volumeArray.push(round(Object.values(valuesArray[i])[4],2));
			timeArray.push(keysArray[i].split("-").slice(1).join("/"));
		}
		
		priceArray=priceArray.slice().reverse();
		volumeArray=volumeArray.slice().reverse();
		timeArray=timeArray.slice().reverse();

		generatePriceGraph(priceArray,volumeArray,timeArray);
	}

	function generateTable(response){
    	$scope.stockTable = [];
		var valuesArray = Object.values(response["Time Series (Daily)"]);
		var keysArray = Object.keys(response["Time Series (Daily)"]);
		var info = Object.values(response["Meta Data"]);
		var day1 = Object.values(valuesArray[0]);
		var day2 = Object.values(valuesArray[1]);
		$scope.stockTable.push({"Image":"","Color":"","Key":"Stock Ticker Symbol","Value":info[1]});
		$scope.stockTable.push({"Image":"","Color":"","Key":"Last Price","Value":Number(day1[3]).toFixed(2)});
		var change = day1[3] - day2[3];
		var changeP = change.toFixed(2)+" ("+ (change/day2[3]*100).toFixed(2)+"%)";
		var color = '';
		var image = "";
		if(change>0){
			color = 'green';
			image = "http://cs-server.usc.edu:45678/hw/hw6/images/Green_Arrow_Up.png";
		}else{
			color = 'red';
			image = "http://cs-server.usc.edu:45678/hw/hw6/images/Red_Arrow_Down.png";
		}
		$scope.stockTable.push({"Image":image,"Color":color,"Key":"Change (Change Percent)","Value":changeP});
		var time = info[2];
		if(info[2].length == 10){
			time += " 16:00:00";
		}
		time+=" EDT";
		$scope.stockTable.push({"Image":"","Color":"","Key":"Timestamp","Value":time});
		$scope.stockTable.push({"Image":"","Color":"","Key":"Open","Value":Number(day1[0]).toFixed(2)});
		$scope.stockTable.push({"Image":"","Color":"","Key":"Previous Close","Value":Number(day2[3]).toFixed(2)});
		$scope.stockTable.push({"Image":"","Color":"","Key":"Day's Range","Value":Number(day1[2]).toFixed(2)+"-"+Number(day1[1]).toFixed(2)});
		$scope.stockTable.push({"Image":"","Color":"","Key":"Volume","Value":day1[4]});
		stockTableSwitch(0);
	}

	function generateRefresh(symbol,response){
		var valuesArray = Object.values(response["Time Series (Daily)"]);
		var day1 = Object.values(valuesArray[0]);
		var day2 = Object.values(valuesArray[1]);
		var change = day1[3] - day2[3];
		var color = '';
		var image = "";
		if(change>0){
			color = 'green';
			image = "http://cs-server.usc.edu:45678/hw/hw6/images/Green_Arrow_Up.png";
		}else{
			color = 'red';
			image = "http://cs-server.usc.edu:45678/hw/hw6/images/Red_Arrow_Down.png";
		}
		var value = {
			"symbol": symbol,
			"price" : round(day2[3],2),
			"change" : round(change,2),
			"percent": round(change/day2[3]*100,2),
			"volume" : Number(day1[4]),
			"image" : image,
			"color" : color
		};
		$window.localStorage.removeItem(symbol);
		value = angular.toJson(value);
		$window.localStorage.setItem(symbol,value);
	}

	function requestImage(object,func){
		var exportUrl = 'http://export.highcharts.com/';
		var obj = {};
		obj.options = object;
    	obj.type = 'image/png';
    	obj.async = true;
   
		$http.post(exportUrl, obj)
    	.success(
    		function (response) {
    			$scope.graphUrl[func]=exportUrl+response;		
    		})
    	.error(
    		function(error){
    			//console.log(error);
    		});	
	}

	function requestJson(symbol,func){
		return $http.get("/json",{params : {"symbol":symbol,"func":func}})
    	.success(
    		function (response) {
    			if(response["Meta Data"]){
	    			if(func == "refresh"){
	    				generateRefresh(symbol,response);
    				}else{
    					generateIndicatorData(response,func);
    				}
    			}else{
    				if($scope.active == func){
    					$scope.graphError = func;
    					graphTableSwitch(2);
    				}
    			}	
    		})
    	.error(
    		function(error){
    			if($scope.active == func){
					$scope.graphError = func;
					graphTableSwitch(2);
				}
    		});
	}

	function querySearch (query) {
		var result = [];
		if(query){
			result = $http.get("/markit",{params : {"symbol":query}})
	    	.then(
	    		function (response) {
		        	var data = response.data;
		        	var result = [];
		        	for(var key in data){
		        		var value = data[key]["Symbol"];
		        		var display = data[key]["Symbol"]+" - "+ data[key]["Name"]+" ("+data[key]["Exchange"]+")";
		        		result.push({"value":value, "display":display});
		        	}
		        	return result;
		        });
		}
		return result;
    }

	function requestXML(symbol){
		return $http.get("/xml",{params : {"symbol":symbol}})
    	.success(
    		function (response) {
    			if(!response["rss"]){
    				newsTableSwitch(2);
    			}else{
    				var items = response["rss"]["channel"][0]["item"];
	    			count = 5;
	    			$scope.newsTable = [];
	    			newsTableSwitch(0);
	    			for(var i in items){
	    				if(count == 0)break;
	    				var item = items[i];
	    				if(item["link"][0].indexOf("/article/") !== -1){
	    					var title = item["title"][0];
	    					var author = item["sa:author_name"][0];
	    					var pubDate = item["pubDate"][0].split(" ").slice(0,-1).join(" ")+" EDT";
	    					var link = item["link"][0];
	    					$scope.newsTable .push({"title":title,"author":author,"pubDate":pubDate,"link":link});
	    					count--;
	    				}
	    			}
    			}
    		})
    	.error(
    		function(error){newsTableSwitch(2);});
	}

	function activeNewsTab(){
		$scope.activeStock = "";  
     	$scope.activeChart = "";
     	$scope.activeNews = "active";
     	$scope.stockSwitch = true;
		$scope.chartSwitch = true;
		$scope.newsSwitch = false;
	}

	function activeChartsTab(){
		$scope.activeStock = "";  
     	$scope.activeChart = "active";
     	$scope.activeNews = "";
     	$scope.stockSwitch = true;
		$scope.chartSwitch = false;
		$scope.newsSwitch = true;
	}

	function activeStockTab(){
		$scope.activeStock = "active";  
     	$scope.activeChart = "";
     	$scope.activeNews = "";
     	$scope.stockSwitch = false;
		$scope.chartSwitch = true;
		$scope.newsSwitch = true;
	}

    function round(value, decimals){
		return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
	}

	function drawGraph(data){
		Highcharts.chart('chartContainer', data);
		graphTableSwitch(0);
	}

	function sleep(milliseconds) {
		var start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
			if ((new Date().getTime() - start) > milliseconds){
				break;
			}
		}
	}
});


$(document).ready(function(){
	$('#autoRefresh').change(function() {
		if($(this).prop('checked')){
			angular.element(document.getElementById("mainController")).scope().autoRefreshOn();
		}else{
			angular.element(document.getElementById("mainController")).scope().autoRefreshOff();
		}
	});
	//$("#autocomplete").addClass("form-control");
	//$("#input-0").addClass("form-control");
	//$("#input-0").attr("ng-class","{red: myForm.autocomplete.$touched && myForm.autocomplete.$invalid}");
});





