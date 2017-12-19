var mysql      = require('mysql');
var fs         = require('fs');


var sourceDataStr = fs.readFileSync('./barrageClassifyResult.json', 'utf8');
var sourceDataObj = JSON.parse(sourceDataStr);
var subjectiveBarrageArr = sourceDataObj.subjectiveBarrageArr;


var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '907856',
  database : 'advideomanagement'
});

connection.connect();

for(var i in subjectiveBarrageArr){

    connection.query('insert into barrageData SET ?', 
        {
            bId : i,
            content : subjectiveBarrageArr[i].content,
            sentScore : subjectiveBarrageArr[i].sentScore
        }, 
        function(error, results, fields){
    });

    if( i % 100 == 0 )
        console.log("当前进度：第" + i + "条.");

}

console.log("数据迁移完成！");
connection.end();