
/**
 * 
 * 1.弹幕预处理加上时间戳属性 done.
 * 2.使用弹幕高潮区间获取API done.
 * 3.提取特定弹幕高潮区间的主客观弹幕，构造对象合集 done.
 * 4.对主观弹幕用模型预测情感倾向；done.
 * 5.对客观弹幕做关键词提取；done.
 * 6.4和5进行映射，并写入到一个新建的未登录词情感词典中；50p
 * 
 */

var svm = require('node-svm');
var fs  = require('fs'),
    nodejieba = require("nodejieba");
var barrageProcessUtil = require('./util/barrageProcessUtil');

var barragePreProcessUtil = require('./util/barragePreProcessUtil');//弹幕预处理api库
var sentimentalAnalyseUtil = require('./util/sentimentalAnalyseUtil');//情感分析基础api库
var barrageProcessUtil = require('./util/barrageProcessUtil');
var featureExtractUtil = require('./util/featureExtractUtil');
var preProcess = barrageProcessUtil.preProcess;//弹幕文本预处理
var SubjSentenceRecognition = barrageProcessUtil.SubjSentenceRecognition;//主客观弹幕分类
var sentimentalAnalyse = barrageProcessUtil.sentimentalAnalyse;//对弹幕单句 做情感值计算



var sentimentalClassifierObj = {
    subjectiveBarrageArr : [],
    objectiveBarrageArr : []
};

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

//所有弹幕文件的弹幕密集区域obj统一存放在hotTimezone_sentimentalClassifierArr数组中
var hotTimezone_sentimentalClassifierArr = [];
var objectiveBarragesObj = {
    sentimentPosPhraseArr : [],
    sentimentNegPhraseArr : []
};
for(var k in barrageFileArr4Test){

    var testBarrageFilePath = barrageFileArr4Test[k];
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
            var sentencePosTagArr = nodejieba.tag( sentenceArr[j].content );
            sentenceArr[j].PosTagArr = sentencePosTagArr;
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
            SubjSentenceRecognition(hotTimezone_sentenceArr[j].content, hotTimezone_sentenceArr[j].timeStamp, hotTimezone_sentimentalClassifierObj, hotTimezone_sentenceArr[j].PosTagArr);
        }
        hotTimezone_sentimentalClassifierArr.push(hotTimezone_sentimentalClassifierObj);
    }
    
}

for(var i in hotTimezone_sentimentalClassifierArr){

    // 3.3 对主观弹幕用模型预测情感倾向；
    var subjectiveBarrageArr = hotTimezone_sentimentalClassifierArr[i].subjectiveBarrageArr;
    var dataInput4Predict = [];

    for(var j in subjectiveBarrageArr){

        //3.3.1 积极弹幕转向量；
        var barrageObj = subjectiveBarrageArr[j];
        var featureExtractFunc = featureExtractUtil.featureExtract;
        var barrageFeatureObj = featureExtractFunc(barrageObj);
        barrageObj["sentWordObj"] = barrageFeatureObj.sentWordObj;
        barrageObj["degreeWordObj"] = barrageFeatureObj.degreeWordObj;
        barrageObj["denyWordObj"] = barrageFeatureObj.denyWordObj;
        barrageObj["punctuationObj"] = barrageFeatureObj.punctuationObj;
        barrageObj["ngram2"] = barrageFeatureObj.ngram2PosArr;
        barrageObj["ngram3"] = barrageFeatureObj.ngram3PosArr;


        var newItem = [];
        var featureArr = [];
        featureArr.push(barrageObj.sentWordObj.polarity);
        featureArr.push(barrageObj.degreeWordObj.flag);
        featureArr.push(barrageObj.denyWordObj.flag);
        featureArr.push(barrageObj.punctuationObj.index);
        //2-ngram特征合并成一个数值
        var ngram2_1 = parseInt(barrageObj.ngram2[0]);
        var ngram2_2 = parseInt(barrageObj.ngram2[1]);
        featureArr.push(ngram2_1*100+ngram2_2);
        //3-ngram特征合并成一个数值
        var ngram3_1 = parseInt(barrageObj.ngram3[0]);
        var ngram3_2 = parseInt(barrageObj.ngram3[1]);
        var ngram3_3 = parseInt(barrageObj.ngram3[2]);
        featureArr.push(ngram3_1*10000+ngram3_2*100+ngram3_3);
        newItem.push(featureArr);
        newItem.push(0);//这个只是为了满足node-svm的输入数据格式

        dataInput4Predict.push(newItem);
        
    }

    //3.3.2 放入模型预测+计算整体平均情感倾向
    var sentimentalScore=0,
    dataInput4PredictLen = dataInput4Predict.length;
    //载入训练好的情感分类模型
    var modelJSON = fs.readFileSync('./tempData/modelJSON.json', 'utf8');
    var modelOBJ = JSON.parse(modelJSON);
    var newClf = svm.restore(modelOBJ);
    dataInput4Predict.forEach(function (ex) {
        var prediction = newClf.predictSync(ex[0]);
        sentimentalScore++;
        // console.log('标注分类：%d; 预测分类：%d ', ex[1], prediction);
    });
    var sentimentalResult = (sentimentalScore>0)?1:-1;
    // console.log("预测结果是：%d", sentimentalResult);


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
            continue;
        }else{
            if( objectiveBarrage_count > objectiveBarrage_maxCount){
                objectiveBarrage_maxCount_index = j-1;
                objectiveBarrage_maxCount = objectiveBarrage_count;
            }
            objectiveBarrage_count = 1;
        }
    }
    
    
    //3.5 客观词和主观预测结果映射，存入文件
    var objectiveBarrageObjPhrase = '';
    if(objectiveBarrage_maxCount_index != -1 && objectiveBarrage_maxCount >=3){
        objectiveBarrageObjPhrase = barrageProcessUtil.objectiveSententceLikewiseTrim(objectiveBarrageArr[objectiveBarrage_maxCount_index].content);
        console.log("第"+ i + "组的客观弹幕关键词是："+ objectiveBarrageArr[objectiveBarrage_maxCount_index].content + " ;处理后： " + objectiveBarrageObjPhrase + "。他的预测情感倾向是：" + sentimentalResult + "  区间出现次数：" + objectiveBarrage_maxCount + "次" );
    }

    //4 客观词短语和存入弹幕领域词库
    var objectiveBarrageObj = {
        phrase : objectiveBarrageObjPhrase,
        sentimentClass : sentimentalResult
    };
    var sentimentPosPhraseArr = objectiveBarragesObj.sentimentPosPhraseArr;
    var sentimentNegPhraseArr = objectiveBarragesObj.sentimentNegPhraseArr;
    var existFlag = false;
    if(objectiveBarrageObj.sentimentClass > 0){
        for(var i in sentimentPosPhraseArr){
            if(sentimentPosPhraseArr[i] == objectiveBarrageObj.phrase){
                existFlag = true;
                break;
            }
        }
        if(!existFlag){
            sentimentPosPhraseArr.push(objectiveBarrageObj.phrase);
        }
    }else{
        for(var i in sentimentNegPhraseArr){
            if(sentimentNegPhraseArr[i] == objectiveBarrageObj.phrase){
                existFlag = true;
                break;
            }
        }
        if(!existFlag){
            sentimentNegPhraseArr.push(objectiveBarrageObj.phrase);
        }
    }

}


var sentDic4Barrage = fs.readFileSync('./sentimentalDic/sentDic4Barrage.json', 'utf8');
var sentDic4BarrageObj = JSON.parse(sentDic4Barrage);

sentDic4BarrageObj.sentimentPosPhraseArr = sentDic4BarrageObj.sentimentPosPhraseArr.concat(objectiveBarragesObj.sentimentPosPhraseArr);
sentDic4BarrageObj.sentimentNegPhraseArr = sentDic4BarrageObj.sentimentNegPhraseArr.concat(objectiveBarragesObj.sentimentNegPhraseArr);
var sentDic4BarrageJSON = JSON.stringify(sentDic4BarrageObj);
fs.writeFileSync('./sentimentalDic/sentDic4Barrage.json', sentDic4BarrageJSON);


console.log("complete!");