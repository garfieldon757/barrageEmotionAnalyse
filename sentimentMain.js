var fs = require('fs'),
    path = require('path'),
    rd = require('readline'),
    xml2js = require('xml2js'),
    util = require('util');
    nodejieba = require("nodejieba");

var barragePreProcessUtil = {
    cutWords :  function(sentence){
                    var result = nodejieba.cut(sentence);
                    return result;
    },
    extractKeywords :   function(sentence, topN){
                            var result = nodejieba.extract(sentence, topN);
                            return result;
    },
    sortedByTimestamps : function(barrageArr){
        var barrageArr = barrageArr.sort(function(barrage1, barrage2){
                            return Number(barrage1.timeStamp) - Number(barrage2.timeStamp);
                        });
        return barrageArr;
    },
    sortedByfrequency : function(keywordsObj){

        //obj转换成数组
        /**
         * 格式: {10:1,6666:2,...}
         */
        var keywordsArr = [];
        
        for(var i in keywordsObj){
            var keywordObj = {};
            keywordObj.word = i;
            keywordObj.num  = keywordsObj[i];
            keywordsArr.push(keywordObj);
        }
        //排序
        /**
         * 格式 [{word:'10',num:1},{word:'6666',num:2}...]
         */
        keywordsArr = keywordsArr.sort(function(keyword1, keyword2){
            var key1,key2,value1,value2;
            for(var i in keyword1){
                key1 = i;
                value1 = keyword1[i];
            }
            for(var j in keyword2){
                key2 = j;
                value2 = keyword2[j];
            }
            return Number(value2) - Number(value1);
        });
        return keywordsArr;
    },
    recongnizeHotTimezone : function(barrageArr){

        //计算平均每秒弹幕数量
        var videoLen = Number.parseInt(barrageArr[barrageArr.length - 1].timeStamp);
        var avgBarrageNum = (barrageArr.length / videoLen)*3;
        //新建每秒弹幕数量arr
        var barrageNumArr = [];
        var numPerSecObj = {};
        function numPerSecInit(){
            return {
                timeStamp : 0,
                num : 0
            };
        };
        for(var i in barrageArr){
            if(i==0){
                numPerSecObj = new numPerSecInit();
                numPerSecObj.timeStamp = 0
                numPerSecObj.num += 1;
            }else{
                if( Number.parseInt(barrageArr[i].timeStamp)==Number.parseInt(barrageArr[i-1].timeStamp)){
                    numPerSecObj.num += 1;
                }else{
                    barrageNumArr.push( numPerSecObj );
                    
                    numPerSecObj = new numPerSecInit();
                    numPerSecObj.timeStamp = Number.parseInt(barrageArr[i].timeStamp);
                    numPerSecObj.num = 1;
                }
            }
            
        }
        //识别弹幕数量高于平均弹幕数的区间
        var hotTimezoneArr = [];
        function hotTimezoneInit(){
            return {
                startTimeStamp : 0,
                endTimeStamp : 0,
                num : 0
            };
        }
        var hotTimezone = {},
            newTimezoneFlag = false;
        for(var i in barrageNumArr){
            if(barrageNumArr[i].num>avgBarrageNum && !newTimezoneFlag){
                newTimezoneFlag = true;
                hotTimezone = new hotTimezoneInit();
                hotTimezone.startTimeStamp = Number.parseInt(i);
                hotTimezone.num += barrageNumArr[i].num;
            }else if(barrageNumArr[i].num>avgBarrageNum && newTimezoneFlag){
                hotTimezone.num += barrageNumArr[i].num;
            }else if(barrageNumArr[i].num<avgBarrageNum && newTimezoneFlag){
                newTimezoneFlag = false;
                hotTimezone.endTimeStamp = Number.parseInt(i);
                hotTimezoneArr.push(hotTimezone);
            }else if(barrageNumArr[i].num<avgBarrageNum && !newTimezoneFlag){
                //nothing
            }
        }

        return hotTimezoneArr;
    },
    unloggedWordRecognize : function(sentence){
    },
    traversalXmlInDir : function(dir, callback){
        fs.readdirSync(dir).forEach(function(file){
            if(file.indexOf('.xml')!=-1){
                var filePath = path.join(dir, file);
                callback(filePath);
            }
        });
    }
};

var sentimentalAnalyseUtil = {
    readDicFromObj : function(filePath){
        var dicStr = fs.readFileSync(filePath, 'utf8');
        var dicObj = JSON.parse(dicStr);
        return dicObj;     
    },
    sentimentScoreCalculate : function(dicObj, segWords){
 
                            var score = 0,
                                wordsLen = segWords.length;
                        
                            for(index in segWords){
                                var word = segWords[index],
                                    preWord = segWords[index-1],
                                    prePreWord = segWords[index-2];
                                var levelArr = Object.keys(dicObj.levelHashmap);
                        
                                if(dicObj.posSentimentArr.indexOf(word) != -1 
                                    || dicObj.negSentimentArr.indexOf(word) != -1){
                                    
                                    // 单个前缀  --暂时没用
                                    if(index-1>=0 && index-2<0){
                                        if( dicObj.denyArr.indexOf(preWord) != -1){

                                            if( dicObj.posSentimentArr.indexOf(word) != -1 ){
                                                score -= 1;
                                            }else{
                                                score += 1;
                                            }

                                        }else{

                                            if( dicObj.posSentimentArr.indexOf(word) != -1 ){
                                                score += 1;
                                            }else{
                                                score -= 1;
                                            }

                                        }
                                    }
                        
                                    //双前缀
                                    if(index-1>=0 && index-2>=0){

                                        // 单重否定
                                        if( (dicObj.denyArr.indexOf(prePreWord) == -1 && dicObj.negSentimentArr.indexOf(prePreWord) == -1 && levelArr.indexOf(prePreWord) == -1) 
                                            && (dicObj.denyArr.indexOf(preWord) != -1 || dicObj.negSentimentArr.indexOf(preWord) != -1) ){
                                                
                                                if( dicObj.posSentimentArr.indexOf(word) != -1 ){
                                                    score -= 1;
                                                }else{
                                                    score += 1;
                                                }
                                                continue;
                                        }

                                        // 双重否定
                                        if( dicObj.negSentimentArr.indexOf(prePreWord) != -1  
                                            && dicObj.negSentimentArr.indexOf(preWord) != -1){

                                                if( dicObj.posSentimentArr.indexOf(word) != -1 ){
                                                    score += 1;
                                                }else{
                                                    score -= 1;
                                                }
                                                continue;
                                        }
                            
                                        // 程度副词(-2) 否定词(-1)
                                        if( levelArr.indexOf(prePreWord) != -1 
                                            && dicObj.denyArr.indexOf(preWord) != -1 ){

                                            if( dicObj.posSentimentArr.indexOf(word) != -1 ){
                                                score += (-1) * dicObj.levelHashmap[prePreWord] ;
                                            }else{
                                                score += (1) * dicObj.levelHashmap[prePreWord];
                                            }
                                            continue;
                                        }
                            
                                        // 否定词(-2) 程度副词(-1)
                                        if( dicObj.denyArr.indexOf(prePreWord) != -1 
                                                && levelArr.indexOf(preWord) != -1 ){

                                            if( dicObj.posSentimentArr.indexOf(word) != -1 ){
                                                score -= (0.5) * dicObj.levelHashmap[preWord];
                                            }else{
                                                score += (0.5) * dicObj.levelHashmap[preWord];
                                            }   
                                            continue;
                                        }

                                        //无否定
                                        if( dicObj.denyArr.indexOf(preWord) == -1 && dicObj.negSentimentArr.indexOf(preWord) == -1 ){
                                            
                                            if( dicObj.posSentimentArr.indexOf(word) != -1 ){
                                                score += 1;
                                            }else{
                                                score -= 1;
                                            }
                                            continue;
                                        }

                            
                                    }
                        
                        
                                }
                        
                            }
                        
                            var scoreObj = {};
                            scoreObj.score = score;
                            scoreObj.wordsLen = wordsLen;
                        
                            return scoreObj;
                        
    },
    printSentimentScore : function(score, sentence){
                console.log("---------------------");
                console.log("sententce内容： " + sentence);
                console.log("情感得分：" + score.score + "分");
                console.log("该弹幕含有单词数：" + score.wordsLen + "个");
    }
};

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
    dicObj = sentimentalAnalyseUtil.readDicFromObj('./sentDic.json');

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
        dicObj = sentimentalAnalyseUtil.readDicFromObj('./sentDic.json');
    
    //对sentence分词
    var segWords = barragePreProcessUtil.cutWords(sentence);
    //根据词典计算情感值
    var sentenceSentimentScore = sentimentalAnalyseUtil.sentimentScoreCalculate(dicObj, segWords);
    //打印
    // sentimentalAnalyseUtil.printSentimentScore(sentenceSentimentScore, sentence);
    return sentenceSentimentScore.score;
}


/**********************测试***************************/

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
    fs.writeFileSync('./barragePreProcess4Train.json', sentimentalClassifierJSON4Train);
    //4test
    var sentimentalClassifierJSON4Test = JSON.stringify(sentimentalClassifierObj4Test, null, 2);
    fs.writeFileSync('./barragePreProcess4Test.json', sentimentalClassifierJSON4Test);
    console.log("3");


/*********************** 对客观弹幕做处理 ***************************/

// 1.弹幕预处理加上时间戳属性 done.
// 2.使用弹幕高潮区间获取API done.
// 3.提取特定弹幕高潮区间的主客观弹幕，构造对象合集 done.
// 4.对主观弹幕用模型预测情感倾向；
// 5.对客观弹幕做关键词提取；
// 6.4和5进行映射，并写入到一个新建的未登录词情感词典中；



var sentimentalClassifierObj = {
    subjectiveBarrageArr : [],
    objectiveBarrageArr : []
};

//所有弹幕文件的弹幕密集区域obj统一存放在hotTimezone_sentimentalClassifierArr数组中
var hotTimezone_sentimentalClassifierArr = [];
for(var k in barrageFileArr4Train){

    var testBarrageFilePath = barrageFileArr4Train[k];
    var sentenceArr = preProcess(testBarrageFilePath);


    //3.1 使用弹幕高潮区间获取API
    var hotTimezoneArr = barragePreProcessUtil.recongnizeHotTimezone(sentenceArr);

    //3.2 提取特定弹幕高潮区间的主客观弹幕，构造对象合集 
    var hotTimezoneBarragesArr = [];
    for(var i=0; i<hotTimezoneArr.length; i++){
        //根据热点区域下标获取一个时间段内的弹幕 
        var startTimeStamp = hotTimezoneArr[i].startTimeStamp;
        var endTimeStamp   = hotTimezoneArr[i].endTimeStamp;
        var hotTimezoneBarrages = [];
        for(var j=0; j<sentenceArr.length; j++){
            if( Number.parseFloat(sentenceArr[j].timeStamp) > startTimeStamp &&
                Number.parseFloat(sentenceArr[j].timeStamp) < endTimeStamp  ){
                    hotTimezoneBarrages.push(sentenceArr[j]);
            }
        }
        hotTimezoneBarragesArr.push(hotTimezoneBarrages);
    }

    
    for(var i in hotTimezoneBarragesArr){
        var hotTimezone_sentenceArr = hotTimezoneBarragesArr[i];
        var hotTimezone_sentimentalClassifierObj = {
            subjectiveBarrageArr : [],
            objectiveBarrageArr : []
        }
        for(var j in hotTimezone_sentenceArr){
            SubjSentenceRecognition(hotTimezone_sentenceArr[j].content, hotTimezone_sentenceArr[j].timeStamp, hotTimezone_sentimentalClassifierObj);
        }
        hotTimezone_sentimentalClassifierArr.push(hotTimezone_sentimentalClassifierObj);
    }
    console.log("..");
}

for(var i in hotTimezone_sentimentalClassifierArr){

    // 3.3 对主观弹幕用模型预测情感倾向；
    // var subjectiveBarrageArr = 

    // 3.4 对客观弹幕做关键词提取；

}




// var objectiveBarrageArr = sentimentalClassifierObj4Train.objectiveBarrageArr;
// var objectiveKeywordsArr = {};
// for(var i in objectiveBarrageArr){
//     var keywords = barragePreProcessUtil.extractKeywords(objectiveBarrageArr[i],3);
//     for(var j in keywords){
//         if(objectiveKeywordsArr[ keywords[j].word ])
//             objectiveKeywordsArr[ keywords[j].word ] += 1;
//         else
//             objectiveKeywordsArr[ keywords[j].word ] = 1;
//     }
// }
// objectiveKeywordsArr = barragePreProcessUtil.sortedByfrequency(objectiveKeywordsArr);
// var objectiveKeywordsJSON = JSON.stringify(objectiveKeywordsArr, null, 2);
// fs.writeFileSync('./keywordsExtractResult.json', objectiveKeywordsJSON);

//主观弹幕情感值和客观为登陆次映射
// console.log(objectiveKeywordsArr[0].word + " 的情感值为：" +  avgSentimentalValue);