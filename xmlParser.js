var fs = require('fs'),
    rd = require('readline'),
    xml2js = require('xml2js'),
    util = require('util');
    nodejieba = require("nodejieba");




var barrageArr = [];

var parser = new xml2js.Parser();
// fs.readFile( './jinkela.xml', 'utf8', function(err, xml){
//         parser.parseString(xml ,function (err, result) {

//             var dTags = result.i.d;
//             for(var i in dTags){
//                 var newBarrageObj = {};
//                 //内容
//                 newBarrageObj.content = dTags[i]._;
//                 //属性
//                 newBarrageObj.timeStamp = dTags[i].$.p.split(',')[0];
//                 //关键词
//                 var cuttedWords = extractKeywords(newBarrageObj.content, 3);
//                 newBarrageObj[key]words = cuttedWords;
                
//                 barrageArr.push(newBarrageObj);
//             }

//             //按时间排序输出
//             barrageArr = sortedByTimestamps(barrageArr);
//             console.log(util.inspect(barrageArr,false,null));
//         })
//     }
// );

function cutWords(sentence){
    var result = nodejieba.cut(sentence);
    return result;
}

function extractKeywords(sentence, topN){
    var result = nodejieba.extract(sentence, topN);
    return result;
}

function sortedByTimestamps(barrageArr){
    var barrageArr = barrageArr.sort(function(barrage1, barrage2){
                        return Number(barrage1.timeStamp) - Number(barrage2.timeStamp);
                    });
    return barrageArr;
}

//对弹幕单句 做情感值计算
function calSentScore(sentence){

    //定义词典obj格式 -> 获取词典数据
    var dicObj = {
        posSentimentArr : [],
        negSentimentArr : [],
        posEvaluateArr  : [],
        negEvaluateArr  : [],
        denyArr  : [],
        levelHashmap : {}
    }; 
    readDic2Obj(dicObj, function(result){
        dicObj = result;
    });

    //对sentence分词
    var segWords = ["我","非常","不","喜欢","你",];//cutWords(sentence);

    //根据词典计算情感值
    var sentenceSentimentScore = sentimentCalculate(dicObj, segWords);

    //打印
    printScore(sentenceSentimentScore);
}

function readDic2Obj(dicObj, callback){
       
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
        dicObj.posSentimentArr.push(line);
    });
    lineReader_negSentiment.on('line', function(line){
        dicObj.negSentimentArr.push(line);
    });
    lineReader_posEvaluate.on('line', function(line){
        dicObj.posEvaluateArr.push(line);
    });
    lineReader_negEvaluate.on('line', function(line){
        dicObj.negEvaluateArr.push(line);
    });
    lineReader_deny.on('line', function(line){
        dicObj.denyArr.push(line);
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
        callback(dicObj);
    }, 1000);
}

function sentimentCalculate(dicObj, segWords){

    var posScore = 0,
        negScore = 0.
        wordsLen = segWords.length;

    for(index in segWords){
        var word = segWords[index],
            preWord = segWords[index-1],
            prePreWord = segWords[index-2];
        var levelArr = Object.keys(dicObj.levelHashmap);

        if(dicObj.posSentimentArr.indexof(word) != -1 
            && dicObj.negSentimentArr.indexof(word) != -1){
            
            //单个前缀
            if(i-1>=0 && i-2<0){
                if( dicObj.denyArr.indexof(preWord) ){
                    if( dicObj.posSentimentArr.indexof(word) ){
                        negScore += 1;
                    }else{
                        posScore += 1;
                    }
                }
            }

            //双前缀
            if(i-1>=0 && i-2>=0){
            
                // 双重否定
                if( dicObj.negSentimentArr.indexof(prePreWord) != -1  
                    && dicObj.negSentimentArr.indexof(preWord) != -1){
                        if( dicObj.posSentimentArr.indexof(word) != -1 ){
                            posScore += 1;
                        }else{
                            negScore += 1;
                        }
                }
    
                // 程度副词(-2) 否定词(-1)
                if( levelArr.indexof(prePreWord) != -1 
                    && dicObj.denyArr.indexof(preWord) != -1 ){
                    if( dicObj.posSentimentArr.indexof(word) != -1 ){
                        posScore += 1;
                    }else{
                        negScore += 1;
                    }
                }
    
                // 否定词(-2) 程度副词(-1)
                if( dicObj.denyArr.indexof(prePreWord) != -1 
                        && levelArr.indexof(preWord) != -1 ){
                    if( dicObj.posSentimentArr.indexof(word) != -1 ){
                        posScore += 1;
                    }else{
                        negScore += 1;
                    }
                }
    
            }


        }

    }

    var scoreObj = {};
    scoreObj.posScore = posScore;
    scoreObj.negScore = -negScore;
    scoreObj.wordsLen = wordsLen;

    return scoreObj;

}

function printScore(score){
    console.log("正面情感得分：" + score.posScore + "分");
    console.log("负面情感得分：" + score.negScore + "分");
    console.log("该弹幕含有单词数：" + socre.wordsLen + "个");
}

var s = "";
calSentScore(s);