//////////////////////////////////////////////////////////////////////
//ICTCLAS简介：计算所汉语词法分析系统ICTCLAS(Institute of Computing Technology, Chinese Lexical Analysis System)，
//             功能有：中文分词；词性标注；未登录词识别。
//             分词正确率高达97.58%(973专家评测结果)，
//             未登录词识别召回率均高于90%，其中中国人名的识别召回率接近98%;
//             处理速度为31.5Kbytes/s。
//著作权：  Copyright?2002-2005中科院计算所 职务著作权人：张华平 刘群
//遵循协议：自然语言处理开放资源许可证1.0
//Email: zhanghp@software.ict.ac.cn
//Homepage:www.nlp.org.cn;mtgroup.ict.ac.cn
/****************************************************************************
 *
 * Copyright (c) 2000, 2001 
 *     Machine Group
 *     Software Research Lab.
 *     Institute of Computing Tech.
 *     Chinese Academy of Sciences
 *     All rights reserved.
 *
 * This file is the confidential and proprietary property of 
 * Institute of Computing Tech. and the posession or use of this file requires 
 * a written license from the author.
 * Filename: Utility.h
 * Abstract:
 *           Utility functions for Chinese Language Processing
 * Author:   Kevin Zhang 
 *          (zhanghp@software.ict.ac.cn)
 * Date:     2002-1-8
 *
 * Notes:
 *                
 * 
 ****************************************************************************/

//利用中科院汉语词法分析系统ICTCLAS构建新的分词处理接口

#pragma once

#include <iostream>
#include "Utility\\Dictionary.h"
#include "Segment\\Segment.h"
#include "Tag\\Span.h"
#include "Unknown\\UnknowWord.h"
#include <vector>
#include <map>
#include <algorithm>
#include <string>
#define _ICT_DEBUG 0

using namespace std;

class CFreeICTCLAS  
{
public:
	bool ParagraphProcessing(char *sParagraph);
	map<string, int> GetParagraphFeature();//获取分词处理后原始文本特征

	CFreeICTCLAS();
	virtual ~CFreeICTCLAS();
private:
	vector<string> m_vecStopWords;//停用词表
	map<string, int> m_mapFeature;//保存原始文本特征的链表,key为文本特征，value为词频
	double m_dSmoothingPara;
	PWORD_RESULT *m_pResult;
	//The buffer which store the segment and POS result
	//and They stored order by its possibility
	ELEMENT_TYPE m_dResultPossibility[MAX_SEGMENT_NUM];
	int m_nResultCount;
	CSegment m_Seg;//Seg class
	CDictionary m_dictCore,m_dictBigram;//Core dictionary,bigram dictionary
	CSpan m_POSTagger;//POS tagger
	CUnknowWord m_uPerson,m_uTransPerson,m_uPlace;//Person recognition
protected:
	bool Processing(char *sSentence,unsigned int nCount);
	bool ChineseNameSplit(char *sPersonName,char *sSurname, char *sSurname2,char *sGivenName,CDictionary &personDict);
	bool PKU2973POS(int nHandle,char *sPOS973);
	bool Adjust(PWORD_RESULT pItem,PWORD_RESULT pItemRet);
	ELEMENT_TYPE ComputePossibility(PWORD_RESULT pItem);
	bool Sort();

	void AddFeature(bool bFirstWordIgnore);//将当前分词结果保存到原始文本特征
};
