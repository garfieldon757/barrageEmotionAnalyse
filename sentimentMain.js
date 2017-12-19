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
        var avgBarrageNum = barrageArr.length / videoLen;
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
function SubjSentenceRecognition(sentence, resultObj){
    
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
    if(sentenceSentimentScore.score != 0){
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


//测试
// var testSentenceArr = {
//     s1 : "我一点儿也不喜欢吃饭了",
//     s2 : "我不太喜欢吃饭了",
//     s3 : "我极其不喜欢吃饭了",
//     s4 : "我不讨厌上课",
//     s5 : "我不爱上课",
//     s6 : "我既不爱上课，又不爱吃饭？更不爱哈哈",
//     s7 : "6666",
//     s8 : "火钳刘明",
//     s9 : "红黄蓝"
// };
// var barrageFileArr = ['./barrageFile/negSent.xml','./barrageFile/你可见过如此凶残的练习曲.xml',
//                     './barrageFile/辞去已无年少日，羁绊永结少年心！.xml','./barrageFile/德国骨科：这有个妹控搞事情，非要妹妹再哄他一次！.xml',
//                     './barrageFile/butterfly完美含泪重制版，2015年再见！！！！.xml','./barrageFile/假如鬼畜终将逝去.xml',
//                     './barrageFile/震撼心灵反思抑郁症短片《生为何故》.xml','./barrageFile/没有黄段子存在的无聊世界 01【独家正版】.xml',];
var barrageFileArr = [];
barragePreProcessUtil.traversalXmlInDir('./barragefile/', function(path){
    barrageFileArr.push(path);
});
var testSentenceArr = null;


//第一步：弹幕主客观分类，写入barrageClassifyResult.json
var sentimentalClassifierObj = {
    subjectiveBarrageArr : [],
    objectiveBarrageArr : []
};

for(var index in barrageFileArr){
    testSentenceArr = preProcess( barrageFileArr[index] );



    for(var i in testSentenceArr){
        SubjSentenceRecognition(testSentenceArr[i].content, sentimentalClassifierObj);
    }
    

}

//第二步：对主观弹幕做情感向量分析
    
var subjectiveBarrageArrLen = sentimentalClassifierObj.subjectiveBarrageArr.length;
// var totalSentimentalValue = 0;
for(var i in sentimentalClassifierObj.subjectiveBarrageArr){
    var sentimentalValue = 0;
    sentimentalValue = sentimentalAnalyse( sentimentalClassifierObj.subjectiveBarrageArr[i].content );
    sentimentalClassifierObj.subjectiveBarrageArr[i].sentScore = sentimentalValue;
    // totalSentimentalValue += sentimentalValue.score;
}
// var avgSentimentalValue = totalSentimentalValue/subjectiveBarrageArrLen;
var sentimentalClassifierJSON = JSON.stringify(sentimentalClassifierObj, null, 2);
fs.writeFileSync('./barrageClassifyResult.json', sentimentalClassifierJSON);


//第三步：对客观弹幕做高频词排名
// var objectiveBarrageArr = sentimentalClassifierObj.objectiveBarrageArr;
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