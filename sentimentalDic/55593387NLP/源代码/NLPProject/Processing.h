#ifndef PROCESSING_H
#define PROCESSING_H

#include <io.h>
#include <iostream>
#include <fstream>
#include "FreeICTCLAS/FreeICTCLAS.h"
#include "Markup.h"
#include <math.h>
using namespace std;

class CCommentText;

//全局的数据定义

//原始文本特征
struct WordFeature
{
	string strWord;//文本特征数据

	//用于特征选取以及计算特征加权值的参数
	int nNumA;//包含本特征且属于褒义情感文档数目
	int nNumB;//包含本特征且属于贬义情感文档数目

	double dCHI;//卡方统计量值，用于特征选取
};

//全局处理函数

//判断数据字典文件是否存在
bool IsDctDataExists();


//解析XML文件，构建相应的评论文本数据
CCommentText** AnalyseXML(string strXMLFile);

//特征选择,训练阶段使用
void SelectFeature(CCommentText** pComArr, float fRatio);

//保存特征
void SaveFeature(string strFile);
//导入特征
void LoadFeature(string strFile);

//文本权值归一化处理
void NormalizedWeight(CCommentText** pCommentTextArr);

//按照libSVM特征格式保存特征权值到文件,用于利用libSVM工具自动选取最优参数
void SaveWeight(CCommentText** pCommArr, string strWeightFile);

//SVM训练，并保存模型到文件
void SVMTrain(CCommentText** pCommentTextArr, string strModelFile);

//SVM预测，并对文本标记结果
void SVMPredict(CCommentText** pCommentTextArr, string strModelFile);

//保存情感预测结果到文件
void SaveResult(CCommentText** pCommentTextArr, string strResultFile);

#endif