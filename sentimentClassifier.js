var svm = require('node-svm');
var fs  = require('fs');


//载入预处理过的数据集
var classifyDataJSON = fs.readFileSync('./classifyData.json', 'utf8');
var classifyDataObj = JSON.parse(classifyDataJSON);


// initialize a new predictor
var clf = new svm.CSVC();

clf.train(classifyDataObj).done(function () {
    // predict things
    console.log("train succeed!");
    // classifyDataObj.forEach(function(ex){
    //     var prediction = clf.predictSync(ex[0]);
    //     console.log('%d %d %d %d => %d', ex[0][0], ex[0][1], ex[0][2], ex[0][3], prediction);
    // });
});