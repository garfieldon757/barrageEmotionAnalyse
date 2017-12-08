    var fs = require('fs'),
        rd = require('readline');
    

    //定义词典obj格式 -> 获取词典数据
    var dicObj = {
        posSentimentArr : [],
        negSentimentArr : [],
        posEvaluateArr  : [],
        negEvaluateArr  : [],
        denyArr  : [],
        levelHashmap : {}
    }; 

    //读取词典
    var lineReader_posSentiment = rd.createInterface({
        input : fs.createReadStream('./dic/正面情感词语（中文）.txt')
    });
    var lineReader_negSentiment = rd.createInterface({
        input : fs.createReadStream('./dic/负面情感词语（中文）.txt')
    });
    var lineReader_posEvaluate = rd.createInterface({
        input : fs.createReadStream('./dic/正面评价词语（中文）.txt')
    });
    var lineReader_negEvaluate = rd.createInterface({
        input : fs.createReadStream('./dic/负面评价词语（中文）.txt')
    });
    var lineReader_deny = rd.createInterface({
        input : fs.createReadStream('./dic/否定词语（中文）.txt')
    });
    var lineReader_level = rd.createInterface({
        input : fs.createReadStream('./dic/程度级别词语（中文）.txt')
    });

    lineReader_posSentiment.on('line', function(line){
        dicObj.posSentimentArr.push(line.trim());
    });
    lineReader_negSentiment.on('line', function(line){
        dicObj.negSentimentArr.push(line.trim());
    });
    lineReader_posEvaluate.on('line', function(line){
        dicObj.posEvaluateArr.push(line.trim());
    });
    lineReader_negEvaluate.on('line', function(line){
        dicObj.negEvaluateArr.push(line.trim());
    });
    lineReader_deny.on('line', function(line){
        dicObj.denyArr.push(line.trim());
    });
    //读取sentimentalLevel词典
    var flag = '';
    lineReader_level.on('line', function(line){
        
        var firstByte = line[0];
        var key       = line.trim();
        
        if(firstByte == '1' || flag == '1'){
            //1 -> 极其
            flag = '1';
            dicObj.levelHashmap[key] = 2.0;
        }
        if(firstByte == '2' || flag == '2'){
            //2 -> 很
            flag = '2';
            dicObj.levelHashmap[key] = 1.25;
        }
        if(firstByte == '3' || flag == '3'){
            //3 -> 较
            flag = '3';
            dicObj.levelHashmap[key] = 1.2;
        }
        if(firstByte == '4' || flag == '4'){
            //4 -> 稍
            flag = '4';
            dicObj.levelHashmap[key] = 0.8;
        }
        if(firstByte == '5' || flag == '5'){
            //5 -> 欠
            flag = '5';
            dicObj.levelHashmap[key] = 0.5;
        }
        if(firstByte == '6' || flag == '6'){
            //6 -> 超
            flag = '6';
            dicObj.levelHashmap[key] = 1.5;
        }
    });

    setTimeout(function(){
        //obj的格式存入sentDic.json文件中，供随后调用
        var dicJSON = JSON.stringify(dicObj);
        fs.writeFileSync('./sentDic.json', dicJSON);
    }, 1000);

