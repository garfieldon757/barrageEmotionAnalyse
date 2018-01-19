    var fs = require('fs'),
        path = require('path'),
        nodejieba = require('nodejieba');


    var cutWords = function(sentence){
                    var result = nodejieba.cut(sentence);
                    return result;
    };
    var extractKeywords = function(sentence, topN){
                            var result = nodejieba.extract(sentence, topN);
                            return result;
    };
    var sortedByTimestamps = function(barrageArr){
        var barrageArr = barrageArr.sort(function(barrage1, barrage2){
                            return Number(barrage1.timeStamp) - Number(barrage2.timeStamp);
                        });
        return barrageArr;
    };
    var sortedByfrequency = function(keywordsObj){

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
    };
    var recongnizeHotTimezone = function(barrageArr){

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
    };
    var unloggedWordRecognize = function(sentence){
    };
    var traversalXmlInDir = function(dir, callback){
        fs.readdirSync(dir).forEach(function(file){
            if(file.indexOf('.xml')!=-1){
                var filePath = path.join(dir, file);
                callback(filePath);
            }
        });
    }

    module.exports = {
        cutWords: cutWords,
        extractKeywords: extractKeywords,
        sortedByTimestamps : sortedByTimestamps,
        sortedByfrequency : sortedByfrequency,
        recongnizeHotTimezone : recongnizeHotTimezone,
        unloggedWordRecognize : unloggedWordRecognize,
        traversalXmlInDir : traversalXmlInDir
      }