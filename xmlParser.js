var fs = require('fs'),
    rd = require('readline'),
    xml2js = require('xml2js'),
    util = require('util');
    nodejieba = require("nodejieba");

var barragePreProcessUtil = {
    preProcess : function(){
                    var barrageArr = [];
                    
                    var parser = new xml2js.Parser();
                    fs.readFile( './jinkela.xml', 'utf8', function(err, xml){
                            parser.parseString(xml ,function (err, result) {
                    
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
                    
                                //按时间排序输出
                                barrageArr = barragePreProcessUtil.sortedByTimestamps(barrageArr);
                                var hotTimezoneArr = barragePreProcessUtil.recongnizeHotTimezone(barrageArr);
                                console.log(util.inspect(hotTimezoneArr,false,null));
                            })
                        }
                    );
                },
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
    }
                    
};

var sentimentalAnalyseUtil = {
    readDic2Obj : function(dicObj, callback){
        
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
                            callback(dicObj);
                        }, 1000);
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
                                    
                                    //单个前缀  --暂时没用
                                    // if(index-1>=0 && index-2<0){
                                    //     if( dicObj.denyArr.indexOf(preWord) ){
                                    //         if( dicObj.posSentimentArr.indexOf(word) ){
                                    //             score -= 1;
                                    //         }else{
                                    //             score += 1;
                                    //         }
                                    //     }
                                    // }
                        
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

//对弹幕单句 做情感值计算
function sentimentalAnalyse(sentence){

    //定义词典obj格式 -> 获取词典数据
    var dicObj = {
        posSentimentArr : [],
        negSentimentArr : [],
        posEvaluateArr  : [],
        negEvaluateArr  : [],
        denyArr  : [],
        levelHashmap : {}
    }; 
    sentimentalAnalyseUtil.readDic2Obj(dicObj, function(result){
        
        dicObj = result;
        //对sentence分词
        var segWords = barragePreProcessUtil.cutWords(sentence);
        //根据词典计算情感值
        var sentenceSentimentScore = sentimentalAnalyseUtil.sentimentScoreCalculate(dicObj, segWords);
        //打印
        sentimentalAnalyseUtil.printSentimentScore(sentenceSentimentScore, sentence);
    
    });

    
}


//测试
// var testSentenceArr = {
//     s1 : "我一点儿也不喜欢吃饭了",
//     s2 : "我不太喜欢吃饭了",
//     s3 : "我极其不喜欢吃饭了",
//     s4 : "我不讨厌上课",
//     s5 : "我不爱上课",
//     s6 : "我既不爱上课，又不爱吃饭？更不爱哈哈"
// };

// for(var i in testSentenceArr){
//     sentimentalAnalyse(testSentenceArr[i]);
// }

barragePreProcessUtil.preProcess();
