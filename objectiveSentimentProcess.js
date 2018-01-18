
/**
 * 
 * 1.弹幕预处理加上时间戳属性 done.
 * 2.使用弹幕高潮区间获取API done.
 * 3.提取特定弹幕高潮区间的主客观弹幕，构造对象合集 done.
 * 4.对主观弹幕用模型预测情感倾向；
 * 5.对客观弹幕做关键词提取；done.
 * 6.4和5进行映射，并写入到一个新建的未登录词情感词典中；
 * 
 */


var barragePreProcessUtil = require('./util/barragePreProcessUtil');//弹幕预处理api库
var sentimentalAnalyseUtil = require('./util/sentimentalAnalyseUtil');//情感分析基础api库
var barrageProcessUtil = require('./util/barrageProcessUtil');
var preProcess = barrageProcessUtil.preProcess;//弹幕文本预处理
var SubjSentenceRecognition = barrageProcessUtil.SubjSentenceRecognition;//主客观弹幕分类
var sentimentalAnalyse = barrageProcessUtil.sentimentalAnalyse;//对弹幕单句 做情感值计算



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
    var objectiveBarrageArr = hotTimezone_sentimentalClassifierArr[i].objectiveBarrageArr;
    var objectiveBarrage_count = 0,
        objectiveBarrage_maxCount = 1, objectiveBarrage_maxCount_index = -1;
    function compare(property){
        return function(a,b){
            var value1 = a[property];
            var value2 = b[property];
            return value1 > value2;
        }
    }
    objectiveBarrageArr = objectiveBarrageArr.sort(compare('content'));
    for(var j in objectiveBarrageArr){
        if(j==0){
            objectiveBarrage_count++;
            objectiveBarrage_maxCount_index = j;
            continue;
        }else if(objectiveBarrageArr[j].content == objectiveBarrageArr[j-1].content){
            objectiveBarrage_count++;
            objectiveBarrage_maxCount_index = j;
            continue;
        }else{
            if( objectiveBarrage_count > objectiveBarrage_maxCount){
                objectiveBarrage_maxCount_index = j-1;
                objectiveBarrage_maxCount = objectiveBarrage_count;
                objectiveBarrage_count = 1;
            }
        }
    }
    if(objectiveBarrage_maxCount_index != -1 && objectiveBarrage_maxCount >=3)
        console.log("第"+ i + "组的客观弹幕关键词是："+ objectiveBarrageArr[objectiveBarrage_maxCount_index].content + "。 共出现了" + objectiveBarrage_maxCount + "次。");
    
}