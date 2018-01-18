
    var fs = require('fs');


    var readDicFromObj = function(filePath){
        var dicStr = fs.readFileSync(filePath, 'utf8');
        var dicObj = JSON.parse(dicStr);
        return dicObj;     
    };
    var sentimentScoreCalculate = function(dicObj, segWords){
 
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
                        
    };
    var printSentimentScore = function(score, sentence){
                console.log("---------------------");
                console.log("sententce内容： " + sentence);
                console.log("情感得分：" + score.score + "分");
                console.log("该弹幕含有单词数：" + score.wordsLen + "个");
    }

    module.exports = {
        readDicFromObj : readDicFromObj,
        sentimentScoreCalculate : sentimentScoreCalculate,
        printSentimentScore : printSentimentScore
    }