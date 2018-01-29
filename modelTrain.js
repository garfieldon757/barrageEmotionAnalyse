/**
 * 基于svm训练模型+测试数据情感分类
 */
var svm = require('node-svm');
var fs  = require('fs');
var so = require('stringify-object');

//载入预处理过的数据集
var classifyDataJSON4Train = fs.readFileSync('./tempData/classifyData4Train.json', 'utf8');
var classifyDataObj4Train = JSON.parse(classifyDataJSON4Train);
var classifyDataJSON4Test = fs.readFileSync('./tempData/classifyData4Test.json', 'utf8');
var classifyDataObj4Test = JSON.parse(classifyDataJSON4Test);


// initialize a new predictor
var clf = new svm.SVM({
      svmType: 'C_SVC',
      c: [0.03125, 0.125, 0.5, 2, 8], //c值是？？

      // kernels parameters
      kernelType: 'RBF',  
      gamma: [0.03125, 0.125, 0.5, 2, 8],//gamma是？？

      // training options
      kFold: 4,               
      normalize: true,        
      reduce: true,           
      retainedVariance: 0.99, 
      eps: 1e-3,              
      cacheSize: 200,               
      shrinking : true,     
      probability : false     
});

clf.train(classifyDataObj4Train)
    .progress(function(progress){
        console.log('training progress: %d%', Math.round(progress*100));
    })
    .spread(function (model, report) {

        //保存模型到tempData文件中
        var modelJSON = JSON.stringify(model);
        fs.writeFileSync('./tempData/modelJSON.json', modelJSON);

        console.log('training report: %s\nPredictions:', so(report));
        var correctNum = 0;
        var wrongNum = 0;
        var totalNum = 0;

        classifyDataObj4Test.forEach(function(ex){
          var prediction = clf.predictSync(ex[0]);
          if( ex[1] == prediction )
            correctNum++;
          else
            wrongNum++;
          totalNum++;
        });
        console.log("预测总数：%d", totalNum);
        console.log("预测正确个数: %d, 预测错误个数: %d", correctNum, wrongNum );
        console.log("预测准确率：%f", correctNum/totalNum);
    });