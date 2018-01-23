var fs = require('fs'),
    xml2js = require('xml2js');
var barragePreProcessUtil = require('./barragePreProcessUtil'),
    sentimentalAnalyseUtil = require('./sentimentalAnalyseUtil');

//弹幕文本预处理
function preProcess(barrageFilePath){

    var barrageArr = [];
    var parser = new xml2js.Parser();
    var xmlStr = fs.readFileSync(barrageFilePath, 'utf8');

    parser.parseString(xmlStr ,function (err, result) {
        
        var dTags = result.i.d;
        for(var i in dTags){
            var newBarrageObj = {};
            //内容
            newBarrageObj.content = dTags[i]._;
            //属性
            newBarrageObj.timeStamp = dTags[i].$.p.split(',')[0];
            //关键词
            var cuttedWords = barragePreProcessUtil.extractKeywords(newBarrageObj.content, 3);
            newBarrageObj.words = cuttedWords;
            
            barrageArr.push(newBarrageObj);
        }
        barrageArr = barragePreProcessUtil.sortedByTimestamps(barrageArr);
    })

    return barrageArr;
};

//主客观弹幕分类
function SubjSentenceRecognition(sentence, timeStamp, resultObj, PosTagArr){
    

    //定义词典obj格式 -> 获取词典数据
    var dicObj = {}; 
    dicObj = sentimentalAnalyseUtil.readDicFromObj('./sentimentalDic/sentDic.json');

    //对sentence分词
    var segWords = barragePreProcessUtil.cutWords(sentence);
    //根据词典计算情感值
    var sentenceSentimentScore = sentimentalAnalyseUtil.sentimentScoreCalculate(dicObj, segWords);
    //根据情感值对主客观弹幕分类
    var sentenceObj = {};
    sentenceObj.content = sentence;
    sentenceObj.timeStamp = timeStamp;
    sentenceObj.PosTagArr = PosTagArr;

    if( Math.abs(sentenceSentimentScore.score) >= 1){
        resultObj.subjectiveBarrageArr.push(sentenceObj);
    }else{
        resultObj.objectiveBarrageArr.push(sentenceObj);
    }
    
}

//对弹幕单句 做情感值计算
function sentimentalAnalyse(sentence){

    //定义词典obj格式 -> 获取词典数据
    var dicObj = {}; 
        dicObj = sentimentalAnalyseUtil.readDicFromObj('./sentimentalDic/sentDic.json');
    
    //对sentence分词
    var segWords = barragePreProcessUtil.cutWords(sentence);
    //根据词典计算情感值
    var sentenceSentimentScore = sentimentalAnalyseUtil.sentimentScoreCalculate(dicObj, segWords);
    //打印
    // sentimentalAnalyseUtil.printSentimentScore(sentenceSentimentScore, sentence);
    return sentenceSentimentScore.score;
}

//客观短语提取后，去除标点，重复出现部分
function objectiveSententceLikewiseTrim(sentence){
    //引入情感词典
    var dicFilePath = './sentimentalDic/sentDic.json';
    var dicStr = fs.readFileSync(dicFilePath, 'utf8');
    var dicObj = JSON.parse(dicStr);
    var punctuationArr = dicObj.punctuationArr;

    for(var i in punctuationArr){
        sentence = sentence.replace(punctuationArr[i], "");
    }

    //重复语句检测(利用后缀数组法来检测重复的子字符串)
    //1.生成后缀数组
    var suffixArr = [];
    for(var j in sentence){
        var tempArr = sentence.slice(j);
        suffixArr.push(tempArr);
    }
    //2.后缀数组排序
    // var suffixArr = ['金坷垃 ','坷垃 ','垃 ',' '];
    suffixArr = suffixArr.sort();
    //3.子字符串匹配
    var maxSubStr = '';
    for(var j=0; j<suffixArr.length; j++){

        if(suffixArr[j][0] != sentence[0])
            continue;

        var tempStr1 = suffixArr[j];
        var tempStrIndex = 0;

        while(tempStr1[tempStrIndex] == sentence[tempStrIndex] && (tempStrIndex<tempStr1.length) ){
            tempStrIndex++;
        }

        if( (maxSubStr.length!=0 && (tempStrIndex+1)<maxSubStr.length) || maxSubStr.length == 0 ){
            maxSubStr = tempStr1.slice(0, tempStrIndex+1);
        }
    }
    
    //输出最长字串
    return maxSubStr;

}

module.exports = {
    preProcess : preProcess,
    SubjSentenceRecognition : SubjSentenceRecognition,
    sentimentalAnalyse : sentimentalAnalyse,
    objectiveSententceLikewiseTrim : objectiveSententceLikewiseTrim
};