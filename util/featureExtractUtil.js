/**
 * 封装提取特征的单元方法，方便调用
 * 
 */

function featureExtract(barrageObj){

    var fs = require('fs');

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


    //特征提取开始
    var posTagArr = barrageObj.PosTagArr;
    var sentWordObj = {};
    var denyWordObj = {};
    var degreeWordObj = {};
    var punctuationObj = {};
    var ngram2PosArr = [];
    var ngram3PosArr = [];


    //初始化5种特征的匹配标志位
    var sentwordMatchFlag = false;
    var sentwordPolarity = 0;        //特征1:情感词   -1-negtive 1-positive
    var degreewordMatchFlag = false; //特征2:程度词
    var denywordMatchFlag = false;   //特征3:否定词
    var punctuationMatchFlag = false;//特征4:标点符号
    var ngram2MatchFlag = false;     //特征5:n-gram（n取2)
    var ngram3MatchFlag = false;     //特征6:n-gram（n取3)                      

    for(var j in posTagArr){

        //特征1:情感词
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
        for(var k in degreeHashmap){
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
        var punctuationMap = {
            "！":1,"？":2,"，":3,"。":4,"：":5,
            "～":6,"@":7,"#":8,"$":9,"%":10,
            "^":11,"&":12,"*":13,"（":14,"）":15,
            "`":16,"¥":17
        };
        for(var k in punctuationArr){
            if( punctuationArr[k] == posTagArr[j].word ){
                punctuationMatchFlag = true;
                break;
            }
        }

        if( punctuationMatchFlag ){
            if(punctuationMap[posTagArr[j].word]){
                punctuationObj.word  = posTagArr[j].word;
                punctuationObj.index = punctuationMap[posTagArr[j].word];
            }else{
                punctuationObj.word  = "";
                punctuationObj.index = 0;
            }
        }else{
            punctuationObj.word  = "";
            punctuationObj.index = 0;
        }


        //特征5:n-gram（n取2)
        //情感词性map
        var posMap = {
           "Ag":1,"a":2,"ad":3,"an":4,"b":5,"c":6,"dg":7,"d":8,"e":9,"f":10,
           "g":11,"h":12,"i":13,"j":14,"k":15,"l":16,"m":17,"Ng":18,"n":19,"nr":20,
           "ns":21,"nt":22,"nz":23,"o":24,"p":25,"q":26,"r":27,"s":28,"tg":29,"t":30,
           "u":31,"vg":32,"v":33,"vd":34,"vn":35,"w":36,"x":37,"y":38,"z":39,"un":40
        };
        
        if(!ngram2MatchFlag){

            for(var k in sentimentArr){
                if( sentimentArr[k] == posTagArr[j].word ){
                    ngram2MatchFlag = true;
                    if( (j-1)>=0 ){
                        var pos_ngram2_1 = posMap[posTagArr[j-1].tag]!=null?posMap[posTagArr[j-1].tag]:0;
                        var pos_ngram2_2 =   posMap[posTagArr[j].tag]!=null?posMap[posTagArr[j].tag]:0;
                        ngram2PosArr.push( pos_ngram2_1 );
                        ngram2PosArr.push( pos_ngram2_2 );
                    }else{
                        ngram2PosArr.push(0);
                        ngram2PosArr.push(0);
                        ngram2PosArr.push(0);
                    }
                    break;
                }
            }
            
        }

        //特征6:n-gram（n取3)
        if(!ngram3MatchFlag){

            for(var k in sentimentArr){
                if( sentimentArr[k] == posTagArr[j].word ){
                    ngram3MatchFlag = true;
                    if( (j-2)>=0 ){
                        var pos_ngram3_1 = posMap[posTagArr[j-2].tag]!=null?posMap[posTagArr[j-2].tag]:0;
                        var pos_ngram3_2 = posMap[posTagArr[j-1].tag]!=null?posMap[posTagArr[j-1].tag]:0;
                        var pos_ngram3_3 =   posMap[posTagArr[j].tag]!=null?posMap[posTagArr[j].tag]:0;
                        ngram3PosArr.push( pos_ngram3_1 );
                        ngram3PosArr.push( pos_ngram3_2 );
                        ngram3PosArr.push( pos_ngram3_3 );
                    }else{
                        ngram3PosArr.push(0);
                        ngram3PosArr.push(0);
                        ngram3PosArr.push(0);
                    }
                    break;
                }
            }
            
        }
        
    }

    //防止没有ngrm2造成ngram属性空
    if(!ngram2MatchFlag){
        ngram2PosArr.push(0);
        ngram2PosArr.push(0);
    }
    //防止没有ngrm3造成ngram属性空
    if(!ngram3MatchFlag){
        ngram3PosArr.push(0);
        ngram3PosArr.push(0);
        ngram3PosArr.push(0);
    }

    var barrageFeatureObj = {
        "sentWordObj" : sentWordObj,
        "denyWordObj" : denyWordObj,
        "degreeWordObj" : degreeWordObj,
        "punctuationObj" : punctuationObj,
        "ngram2PosArr" : ngram2PosArr,
        "ngram3PosArr" : ngram3PosArr
    };
    return barrageFeatureObj;
    
}

module.exports = {
    featureExtract : featureExtract
};