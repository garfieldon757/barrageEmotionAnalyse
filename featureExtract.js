/**
 * 
 * 特征提取
 * 
 * 
 */


var fs = require('fs');
var featureExtractUtil = require('./util/featureExtractUtil');

//引入情感词典
var dicFilePath = './sentimentalDic/sentDic.json';
var dicStr = fs.readFileSync(dicFilePath, 'utf8');
var dicObj = JSON.parse(dicStr);
var posSentimentArr = dicObj.posSentimentArr;
var negSentimentArr = dicObj.negSentimentArr;
var sentimentArr = posSentimentArr.concat(negSentimentArr);
var degreeHashmap = dicObj.levelHashmap;
var denyArr = dicObj.denyArr;
var punctuationArr = dicObj.punctuationArr;

//引入预处理的弹幕对象
var sourceDataStr4Train = fs.readFileSync('./tempData/barragePreProcess4Train.json', 'utf8');
var sourceDataObj4Train = JSON.parse(sourceDataStr4Train);
var subjectiveBarrageArr4Train = sourceDataObj4Train.subjectiveBarrageArr;
var sourceDataStr4Test = fs.readFileSync('./tempData/barragePreProcess4Test.json', 'utf8');
var sourceDataObj4Test = JSON.parse(sourceDataStr4Test);
var subjectiveBarrageArr4Test = sourceDataObj4Test.subjectiveBarrageArr;

//合并训练集、测试机，通过长度在向量提取结束之后将两者重新拆分
var subjectiveBarrageArr4TrainLength = subjectiveBarrageArr4Train.length;
var subjectiveBarrageArr = subjectiveBarrageArr4Train.concat(subjectiveBarrageArr4Test);



for(var i in subjectiveBarrageArr){
    
    var barrageObj = subjectiveBarrageArr[i];

    var featureExtractFunc = featureExtractUtil.featureExtract;
    var barrageFeatureObj = featureExtractFunc(barrageObj);
    //判断：分别将向量提取结果 放入train集和test集中
    barrageObj["sentWordObj"] = barrageFeatureObj.sentWordObj;
    barrageObj["degreeWordObj"] = barrageFeatureObj.degreeWordObj;
    barrageObj["denyWordObj"] = barrageFeatureObj.denyWordObj;
    barrageObj["punctuationObj"] = barrageFeatureObj.punctuationObj;
    barrageObj["ngram2"] = barrageFeatureObj.ngram2PosArr;
    barrageObj["ngram3"] = barrageFeatureObj.ngram3PosArr;

    // if( i < subjectiveBarrageArr4TrainLength){
    //     //4train

    //     subjectiveBarrageArr4Train[i]["sentWordObj"] = sentWordObj;
    //     subjectiveBarrageArr4Train[i]["degreeWordObj"] = degreeWordObj;
    //     subjectiveBarrageArr4Train[i]["denyWordObj"] = denyWordObj;
    //     subjectiveBarrageArr4Train[i]["punctuationObj"] = punctuationObj;
    //     //防止没有ngrm2造成ngram属性空
    //     if(!ngram2MatchFlag){
    //         ngram2PosArr.push(0);
    //         ngram2PosArr.push(0);
    //     }
    //     subjectiveBarrageArr4Train[i]["ngram2"] = ngram2PosArr;
    //     if(!ngram3MatchFlag){
    //         ngram3PosArr.push(0);
    //         ngram3PosArr.push(0);
    //         ngram3PosArr.push(0);
    //     }
    //     subjectiveBarrageArr4Train[i]["ngram3"] = ngram3PosArr;

    // }else{
    //     //4test

    //     subjectiveBarrageArr4Test[i]["sentWordObj"] = sentWordObj;
    //     subjectiveBarrageArr4Test[i]["degreeWordObj"] = degreeWordObj;
    //     subjectiveBarrageArr4Test[i]["denyWordObj"] = denyWordObj;
    //     subjectiveBarrageArr4Test[i]["punctuationObj"] = punctuationObj;
    //     //防止没有ngrm2造成ngram属性空
    //     if(!ngram2MatchFlag){
    //         ngram2PosArr.push(0);
    //         ngram2PosArr.push(0);
    //     }
    //     subjectiveBarrageArr4Test[i]["ngram2"] = ngram2PosArr;
    //     if(!ngram3MatchFlag){
    //         ngram3PosArr.push(0);
    //         ngram3PosArr.push(0);
    //         ngram3PosArr.push(0);
    //     }
    //     subjectiveBarrageArr4Test[i]["ngram3"] = ngram3PosArr;

    // }

    
}

//finally写入文件
var sourceDataObj = {
    subjectiveBarrageArr : []
}
sourceDataObj.subjectiveBarrageArr = subjectiveBarrageArr;
var sourceDataJSON = JSON.stringify(sourceDataObj, null, 2);
fs.writeFileSync('./tempData/barrageFeatureExtractResult.json', sourceDataJSON);

// sourceDataObj4Train.subjectiveBarrageArr = subjectiveBarrageArr4Train;
// var sourceDataJSON4Train = JSON.stringify(sourceDataObj4Train, null, 2);
// fs.writeFileSync('./barrageFeatureExtractResult4Train.json', sourceDataJSON4Train);

// sourceDataObj4Test.subjectiveBarrageArr = subjectiveBarrageArr4Test;
// var sourceDataJSON4Test = JSON.stringify(sourceDataObj4Test, null, 2);
// fs.writeFileSync('./barrageFeatureExtractResult4Test.json', sourceDataJSON4Test);





//格式转换
var dataInput4Train = [];
var dataInput4Test  = [];

for(var i in subjectiveBarrageArr){

    var newItem = [];
    var featureArr = [];
    var classResult = ''; //positive或negtive

    var barrage = subjectiveBarrageArr[i];

    featureArr.push(barrage.sentWordObj.polarity);
    featureArr.push(barrage.degreeWordObj.flag);
    featureArr.push(barrage.denyWordObj.flag);
    featureArr.push(barrage.punctuationObj.index);
    //2-ngram特征合并成一个数值
    var ngram2_1 = parseInt(barrage.ngram2[0]);
    var ngram2_2 = parseInt(barrage.ngram2[1]);
    featureArr.push(ngram2_1*100+ngram2_2);
    //3-ngram特征合并成一个数值
    var ngram3_1 = parseInt(barrage.ngram3[0]);
    var ngram3_2 = parseInt(barrage.ngram3[1]);
    var ngram3_3 = parseInt(barrage.ngram3[2]);
    featureArr.push(ngram3_1*10000+ngram3_2*100+ngram3_3);

    if(barrage.sentScore > 0)
        classResult = 1;//-1-'negtive'  1-'positive'
    else    
        classResult = -1;
    
    newItem.push(featureArr);
    newItem.push(classResult);

    if( i < subjectiveBarrageArr4TrainLength){
        //4train
        dataInput4Train.push(newItem);
    }else{
        //4Test
        dataInput4Test.push(newItem);
    }

}

//finally写入文件
    //4train
    var dataOutputJSON4Train = JSON.stringify(dataInput4Train, null, 2);
    fs.writeFileSync('./tempData/classifyData4Train.json', dataOutputJSON4Train);
    //4test
    var dataOutputJSON4Test = JSON.stringify(dataInput4Test, null, 2);
    fs.writeFileSync('./tempData/classifyData4Test.json', dataOutputJSON4Test);

