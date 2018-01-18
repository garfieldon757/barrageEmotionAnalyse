/**
 * 获取训练数据/测试数据
 * 第一步：弹幕主客观分类，写入barrageClassifyResult.json
 * 第二步：对主观弹幕做情感向量分析
 * 写入预处理json文件中
 * 
 */

var fs = require('fs');
var barragePreProcessUtil = require('./util/barragePreProcessUtil');
var barrageProcessUtil = require('./util/barrageProcessUtil');
var preProcess = barrageProcessUtil.preProcess;//弹幕文本预处理
var SubjSentenceRecognition = barrageProcessUtil.SubjSentenceRecognition;//主客观弹幕分类
var sentimentalAnalyse = barrageProcessUtil.sentimentalAnalyse;//对弹幕单句 做情感值计算


//训练数据
var barrageFileArr4Train = [];
barragePreProcessUtil.traversalXmlInDir('./barragefile/train/', function(path){
    barrageFileArr4Train.push(path);
});
//测试数据
var barrageFileArr4Test = [];
barragePreProcessUtil.traversalXmlInDir('./barragefile/test/', function(path){
    barrageFileArr4Test.push(path);
});

//第一步：弹幕主客观分类，写入barrageClassifyResult.json

    //4train
    var sentenceArr4Train = null;
    var sentimentalClassifierObj4Train = {
        subjectiveBarrageArr : [],
        objectiveBarrageArr : []
    };

    for(var index in barrageFileArr4Train){
        sentenceArr4Train = preProcess(barrageFileArr4Train[index]);
        for(var i in sentenceArr4Train){
            SubjSentenceRecognition(sentenceArr4Train[i].content, sentenceArr4Train[i].timeStamp, sentimentalClassifierObj4Train);
        }
    }
    console.log("1-1");
    
    //4test
    var sentenceArr4Test = null;
    var sentimentalClassifierObj4Test = {
        subjectiveBarrageArr : [],
        objectiveBarrageArr : []
    };

    for(var index in barrageFileArr4Test){
        sentenceArr4Test = preProcess(barrageFileArr4Test[index]);
        for(var i in sentenceArr4Test){
            SubjSentenceRecognition(sentenceArr4Test[i].content, sentenceArr4Test[i].timeStamp, sentimentalClassifierObj4Test);
        }
    }
    console.log("1-2");

//第二步：对主观弹幕做情感向量分析
    
    //4train
    for(var i in sentimentalClassifierObj4Train.subjectiveBarrageArr){

        var sentimentalValue = 0;
        var sentence = sentimentalClassifierObj4Train.subjectiveBarrageArr[i].content;
        var sentencePosTagArr = [];

        sentimentalValue = sentimentalAnalyse( sentence );
        sentimentalClassifierObj4Train.subjectiveBarrageArr[i].sentScore = sentimentalValue;
        sentencePosTagArr = nodejieba.tag( sentence );
        sentimentalClassifierObj4Train.subjectiveBarrageArr[i].PosTagArr = sentencePosTagArr;
    }
    console.log("2-1");
    //4test
    for(var i in sentimentalClassifierObj4Test.subjectiveBarrageArr){

        var sentimentalValue = 0;
        var sentence = sentimentalClassifierObj4Test.subjectiveBarrageArr[i].content;
        var sentencePosTagArr = [];

        sentimentalValue = sentimentalAnalyse( sentence );
        sentimentalClassifierObj4Test.subjectiveBarrageArr[i].sentScore = sentimentalValue;
        sentencePosTagArr = nodejieba.tag( sentence );
        sentimentalClassifierObj4Test.subjectiveBarrageArr[i].PosTagArr = sentencePosTagArr;
    }
    console.log("2-2");
//写入预处理json文件中

    //4train
    var sentimentalClassifierJSON4Train = JSON.stringify(sentimentalClassifierObj4Train, null, 2);
    fs.writeFileSync('./tempData/barragePreProcess4Train.json', sentimentalClassifierJSON4Train);
    //4test
    var sentimentalClassifierJSON4Test = JSON.stringify(sentimentalClassifierObj4Test, null, 2);
    fs.writeFileSync('./tempData/barragePreProcess4Test.json', sentimentalClassifierJSON4Test);
    console.log("3");




/**************返回数据变量************/
module.exports = {
    barrageFileArr4Train : barrageFileArr4Train,
    barrageFileArr4Test : barrageFileArr4Test
}