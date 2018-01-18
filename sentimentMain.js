var fs = require('fs'),
    path = require('path'),
    rd = require('readline'),
    xml2js = require('xml2js'),
    util = require('util');
    nodejieba = require("nodejieba");

var barragePreProcessUtil = require('./util/barragePreProcessUtil');//弹幕预处理api库
var sentimentalAnalyseUtil = require('./util/sentimentalAnalyseUtil');//情感分析基础api库
var barrageProcessUtil = require('./util/barrageProcessUtil');
var preProcess = barrageProcessUtil.preProcess;//弹幕文本预处理
var SubjSentenceRecognition = barrageProcessUtil.SubjSentenceRecognition;//主客观弹幕分类
var sentimentalAnalyse = barrageProcessUtil.sentimentalAnalyse;//对弹幕单句 做情感值计算


/********************** stage1:主客观分类+主观数据情感分类计算 ***************************/
// var preStage = require('./readDic2Json');
var stage1 = require('./barragePreProcess');
var barrageFileArr4Train = stage1.barrageFileArr4Train;
var barrageFileArr4Test = stage1.barrageFileArr4Test;
/********************** stage2:特征提取 ***************************/
var stage2 = require('./featureExtract');
/********************** stage3:基于svm训练模型+测试数据情感分类 ***************************/
var stage3 = require('./modelTrain');


/*********************** 对客观弹幕做处理 ***************************/
