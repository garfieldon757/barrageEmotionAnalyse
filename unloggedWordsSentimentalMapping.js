var fs = require('fs');

//引入情感词典
var dicFilePath = './sentDic.json';
var dicStr = fs.readFileSync(dicFilePath, 'utf8');
var dicObj = JSON.parse(dicStr);