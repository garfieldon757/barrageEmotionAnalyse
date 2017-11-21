var fs = require('fs'),
    xml2js = require('xml2js');
    util = require('util');
    nodejieba = require("nodejieba");

var parser = new xml2js.Parser();
fs.readFile( './jinkela.xml', 'utf8', function(err, xml){
        parser.parseString(xml ,function (err, result) {
            // console.log(util.inspect(result, false, null));
            var dTags = result.i.d;
            // console.log(util.inspect(dTags,false,null));
            var barrageArr = [];
            for(var i in dTags){
                var newBarrageObj = {};
                //内容
                newBarrageObj.content = dTags[i]._;
                //属性
                newBarrageObj.timeStamp = dTags[i].$.p.split(',')[0];
                //关键词
                var cuttedWords = extractKeywords(newBarrageObj.content, 2);
                newBarrageObj.keywords = cuttedWords;
                
                barrageArr.push(newBarrageObj);
            }

            //按时间排序输出
            barrageArr = sortedByTimestamps(barrageArr);
            console.log(util.inspect(barrageArr,false,null));
        })
    }
);

function cutWords(sentence){
    var result = nodejieba.cut(sentence);
    return result;
}

function extractKeywords(sentence, topN){
    var result = nodejieba.extract(sentence, topN);
    return result;
}

function sortedByTimestamps(barrageArr){
    var barrageArr = barrageArr.sort(function(barrage1, barrage2){
                        return Number(barrage1.timeStamp) - Number(barrage2.timeStamp);
                    });
    return barrageArr;
}
