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
    var sentWordObj = {};
    var denyWordObj = {};
    var degreeWordObj = {};
    // var punctuationWord = '';
    var ngramPosArr = [];

    for(var j in posTagArr){

        //特征1:情感词
        var sentwordMatchFlag = false;
        var sentwordPolarity = 0;//-1-negtive 1-positive
        for(var k in posSentimentArr){
            if( posSentimentArr[k] == posTagArr[j].word ){
                sentwordMatchFlag = true;
                sentwordPolarity = 1;
                break;
            }
        }
        for(var k in negSentimentArr){
            if( negSentimentArr[k] == posTagArr[j].word ){
                sentwordMatchFlag = true;
                sentwordPolarity = -1;
                break;
            }
        }
        if( sentwordMatchFlag ){
            sentWordObj.word = posTagArr[j].word;
            sentWordObj.polarity = sentwordPolarity;
        }else{
            sentWordObj.word = "";
            sentWordObj.polarity = 0;
        }


        //特征2:程度词
        var degreewordMatchFlag = false;
        for(var k in levelHashmap){
            if( k == posTagArr[j].word ){
                degreewordMatchFlag = true;
                break;
            }
        }

        if( degreewordMatchFlag ){
            degreeWordObj.word = posTagArr[j].word;
            degreeWordObj.flag = 1;//0-not exist 1-exist
        }else{
            degreeWordObj.word = "";
            degreeWordObj.flag = 0;
        }


        //特征3:否定词
        var denywordMatchFlag = false;
        for(var k in denyArr){
            if( denyArr[k] == posTagArr[j].word ){
                denywordMatchFlag = true;
                break;
            }
        }

        if( denywordMatchFlag ){
            denyWordObj.word = posTagArr[j].word;
            denyWordObj.flag = 1;
        }else{
            denyWordObj.word = "";
            denyWordObj.flag = 0;
        }

        //特征4:标点符号
        // var punctuationMatchFlag = false;
        // for(var k in punctuationArr)
        //     if( punctuationArr[k] == posTagArr[j].word )
        //         punctuationMatchFlag = true;
        // if( punctuationMatchFlag )
        //     punctuationWord = posTagArr[j].word;

        //特征5:n-gram（n取2做一个demo先)
        var posMap = {
           "Ag":1,"a":2,"ad":3,"an":4,"b":5,"c":6,"dg":7,"d":8,"e":9,"f":10,
           "g":11,"h":12,"i":13,"j":14,"k":15,"l":16,"m":17,"Ng":18,"n":19,"nr":20,
           "ns":21,"nt":22,"nz":23,"o":24,"p":25,"q":26,"r":27,"s":28,"tg":29,"t":30,
           "u":31,"vg":32,"v":33,"vd":34,"vn":35,"w":36,"x":37,"y":38,"z":39,"un":40
        };//情感词性map
        var ngramMatchFlag = false;
        for(var k in posSentimentArr){
            if( posSentimentArr[k] == posTagArr[j].word ){
                ngramMatchFlag = true;
                if( (j-1)>=0 ){
                    var pos_ngram_1 = posMap[posTagArr[j-1].tag]!=null?posMap[posTagArr[j-1].tag]:0;
                    var pos_ngram_2 =   posMap[posTagArr[j].tag]!=null?posMap[posTagArr[j].tag]:0;
                    ngramPosArr.push( pos_ngram_1 );
                    ngramPosArr.push( pos_ngram_2 );
                }else{
                    ngramPosArr.push(0);
                    ngramPosArr.push(0);
                }
                break;
            }
        }
        for(var k in negSentimentArr){
            if( negSentimentArr[k] == posTagArr[j].word ){
                ngramMatchFlag = true;
                if( (j-1)>=0 ){
                    var pos_ngram_1 = posMap[posTagArr[j-1].tag]!=null?posMap[posTagArr[j-1].tag]:0;
                    var pos_ngram_2 =   posMap[posTagArr[j].tag]!=null?posMap[posTagArr[j-1].tag]:0;
                    ngramPosArr.push( pos_ngram_1 );
                    ngramPosArr.push( pos_ngram_2 );
                }else{
                    ngramPosArr.push(0);
                    ngramPosArr.push(0);
                }
                break;
            }
        }

    }

    subjectiveBarrageArr[i]["sentWordObj"] = sentWordObj;
    subjectiveBarrageArr[i]["degreeWordObj"] = degreeWordObj;
    subjectiveBarrageArr[i]["denyWordObj"] = denyWordObj;
    // subjectiveBarrageArr[i]["punctuationWord"] = punctuationWord;
    subjectiveBarrageArr[i]["ngram"] = ngramPosArr;
    
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

    featureArr.push(barrage.sentWordObj.polarity);
    featureArr.push(barrage.degreeWordObj.flag);
    featureArr.push(barrage.denyWordObj.flag);
    featureArr.push(barrage.ngram);

    if(barrage.sentScore > 0)
        classResult = 1;//-1-'negtive'  1-'positive'
    else    
        classResult = -1;
    
    newItem.push(featureArr);
    newItem.push(classResult);

    dataInput.push(newItem);
}

//finally写入文件
var dataOutputJSON = JSON.stringify(dataInput, null, 2);
fs.writeFileSync('./classifyData.json', dataOutputJSON);

