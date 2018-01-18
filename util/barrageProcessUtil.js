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
function SubjSentenceRecognition(sentence, timeStamp, resultObj){
    
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

module.exports = {
    preProcess : preProcess,
    SubjSentenceRecognition : SubjSentenceRecognition,
    sentimentalAnalyse : sentimentalAnalyse
};