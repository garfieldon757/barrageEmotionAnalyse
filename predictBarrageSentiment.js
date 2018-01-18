/**
 * 基于模型预测弹幕情感分类
 */
var svm = require('node-svm');
var fs  = require('fs');
var so = require('stringify-object');

//载入训练好的情感分类模型
var modelJSON = fs.readFileSync('./tempData/modelJSON.json', 'utf8');
var modelOBJ = JSON.parse(modelJSON);
// initialize a new predictor
var newClf = svm.restore(modelOBJ);

//载入测试数据
var testData = [
    [
        [
          -1
        ],
        -1
      ],
      [
        [
          1
        ],
        1
      ],
      [
        [
          1
        ],
        1
      ],
      [
        [
          0
        ],
        1
      ]
];

testData.forEach(function (ex) {
    var prediction = newClf.predictSync(ex[0]);
    console.log('标注分类：%d; 预测分类：%d ', ex[1], prediction);
});


//1.svm训练数据变量bug处理；done.
//2.svm训练好的模型存储 done.