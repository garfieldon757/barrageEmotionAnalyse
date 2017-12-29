#ifndef COMMENTTEXT_H
#define COMMENTTEXT_H

#include <iostream>
#include <string>
#include "Processing.h"
#include "FreeICTCLAS/FreeICTCLAS.h"
#include <math.h>
using namespace std;

//评论文本类
class CCommentText
{
public:
	CCommentText(void);
	virtual ~CCommentText(void);
	void SetReviewID(string str);
	string GetReviewID();
	void SetSummary(string str);
	void SetPolarity(char cPolarity);
	char GetPolarity();
	void SetText(string str);
	void SetCategory(string str);
	string GetPolarityResult();

	void ExtractOFeature();//对文本进行分词处理，并提取特征
	void CalcFeatureWeight();//计算特征权重
	map<string, int> GetOFeature();//获取原始特征词与词频
	vector<string> GetOWordFeature();//获取原始特征词
	int GetOWordCount(string strWord);//获取原始特征词频
	bool IsHaveFeature(string strWord);//是否存在特征词
	vector<float> GetFeatureWeight();//获取特征权重
	void SetFeatureWeight(vector<float> vecWeight);

public:
	static CFreeICTCLAS* s_pICTCLAS; //分词处理类
	static map<string, int> s_mapFeature;//选取的特征词，key:特征词   value:出现特征词的文本个数
	static int s_nFeatureNum;//特征数量
	static int s_nTestNum;//测试文本集数量
	static int s_nTrainNum;//训练文本集数量

protected:
	string m_strReviewID;//编号
	string m_strSummary;//主题
	char m_cPolarity;//情感类别   N:贬义  P:褒义  O:不明确
	string m_strText;//文本内容
	string m_strCategory;//类别
	map<string, int> m_mapOFeature;//文本原始特征，key: 分词后提取特征词  value:特征词在文本中的词频
	int m_nNumOFeature;//原始特征总数
	vector<float> m_vecWeight;//特征权重
};

#endif