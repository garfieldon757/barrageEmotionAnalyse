var fs = require('fs');

//引入情感词典
var dicFilePath = './sentDic.json';
var dicStr = fs.readFileSync(dicFilePath, 'utf8');
var dicObj = JSON.parse(dicStr);
var posSentimentArr = dicObj.posSentimentArr;
var negSentimentArr = dicObj.negSentimentArr;
var denyArr = dicObj.denyArr;
var levelHashmap = dicObj.levelHashmap;
//引入预处理的弹幕对象
var sourceDataStr = fs.readFileSync('./barrageClassifyResult.json', 'utf8');
var sourceDataObj = JSON.parse(sourceDataStr);
var subjectiveBarrageArr = sourceDataObj.subjectiveBarrageArr;



for(var i in subjectiveBarrageArr){
    var posTagArr = subjectiveBarrageArr[i].PosTagArr;
    var sentWord = '';
    var denyWord = '';
    var degreeWord = '';
    var punctuationWord = '';
    var ngramPosArr = [];

    for(var j in posTagArr){

        //特征1:情感词
        var sentwordMatchFlag = false;
        for(var k in posSentimentArr){
            if( posSentimentArr[k] == posTagArr[j].word ){
                sentwordMatchFlag = true;
                break;
            }
        }
        for(var k in negSentimentArr){
            if( negSentimentArr[k] == posTagArr[j].word ){
                sentwordMatchFlag = true;
                break;
            }
        }
        if( sentwordMatchFlag )
            sentWord = posTagArr[j].word;


        //特征2:程度词
        var degreewordMatchFlag = false;
        for(var k in levelHashmap){
            if( k == posTagArr[j].word ){
                degreewordMatchFlag = true;
                break;
            }
        }
        if( degreewordMatchFlag )
            degreeWord = posTagArr[j].word;


        //特征3:否定词
        var denywordMatchFlag = false;
        for(var k in denyArr){
            if( denyArr[k] == posTagArr[j].word ){
                denywordMatchFlag = true;
                break;
            }
        }
        if( denywordMatchFlag )
            denyWord = posTagArr[j].word;

        //特征4:标点符号
        // var punctuationMatchFlag = false;
        // for(var k in punctuationArr)
        //     if( punctuationArr[k] == posTagArr[j].word )
        //         punctuationMatchFlag = true;
        // if( punctuationMatchFlag )
        //     punctuationWord = posTagArr[j].word;

        //特征5:n-gram（n取2做一个demo先)
        var ngramMatchFlag = false;
        for(var k in posSentimentArr){
            if( posSentimentArr[k] == posTagArr[j].word ){
                ngramMatchFlag = true;
                if( (j-1)>=0 ){
                    ngramPosArr.push(posTagArr[j-1].tag);
                    ngramPosArr.push(posTagArr[j].tag);
                }
                break;
            }
        }
        for(var k in negSentimentArr){
            if( negSentimentArr[k] == posTagArr[j].word ){
                ngramMatchFlag = true;
                if( (j-1)>=0 ){
                    ngramPosArr.push(posTagArr[j-1].tag);
                    ngramPosArr.push(posTagArr[j].tag);
                }
                break;
            }
        }

    }

    subjectiveBarrageArr[i]["sentWord"] = sentWord;
    subjectiveBarrageArr[i]["degreeWord"] = degreeWord;
    subjectiveBarrageArr[i]["denyWord"] = denyWord;
    // subjectiveBarrageArr[i]["punctuationWord"] = punctuationWord;
    // subjectiveBarrageArr[i]["ngram"] = ngramPosArr;
    
}

//finally写入文件
sourceDataObj.subjectiveBarrageArr = subjectiveBarrageArr;
var sourceDataJSON = JSON.stringify(sourceDataObj, null, 2);
fs.writeFileSync('./barrageFeatureExtractResult.json', sourceDataJSON);





//格式转换
var dataInput = [];

for(var i in subjectiveBarrageArr){

    var newItem = [];
    var featureArr = [];
    var classResult = ''; //positive或negtive

    var barrage = subjectiveBarrageArr[i];

    featureArr.push(barrage.sentWord);
    featureArr.push(barrage.degreeWord);
    featureArr.push(barrage.denyWord);
    // featureArr.push(barrage.ngram);

    if(barrage.sentScore > 0)
        classResult = 'positive';
    else    
        classResult = 'negtive';
    
    newItem.push(featureArr);
    newItem.push(classResult);

    dataInput.push(newItem);
}

//finally写入文件
var dataOutputJSON = JSON.stringify(dataInput, null, 2);
fs.writeFileSync('./classifyData.json', dataOutputJSON);

