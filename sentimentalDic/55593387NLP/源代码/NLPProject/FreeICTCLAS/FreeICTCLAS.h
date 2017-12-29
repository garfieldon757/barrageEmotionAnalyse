//////////////////////////////////////////////////////////////////////
//ICTCLAS��飺����������ʷ�����ϵͳICTCLAS(Institute of Computing Technology, Chinese Lexical Analysis System)��
//             �����У����ķִʣ����Ա�ע��δ��¼��ʶ��
//             �ִ���ȷ�ʸߴ�97.58%(973ר��������)��
//             δ��¼��ʶ���ٻ��ʾ�����90%�������й�������ʶ���ٻ��ʽӽ�98%;
//             �����ٶ�Ϊ31.5Kbytes/s��
//����Ȩ��  Copyright?2002-2005�п�Ժ������ ְ������Ȩ�ˣ��Ż�ƽ ��Ⱥ
//��ѭЭ�飺��Ȼ���Դ�������Դ���֤1.0
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

//�����п�Ժ����ʷ�����ϵͳICTCLAS�����µķִʴ���ӿ�

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
	map<string, int> GetParagraphFeature();//��ȡ�ִʴ����ԭʼ�ı�����

	CFreeICTCLAS();
	virtual ~CFreeICTCLAS();
private:
	vector<string> m_vecStopWords;//ͣ�ôʱ�
	map<string, int> m_mapFeature;//����ԭʼ�ı�����������,keyΪ�ı�������valueΪ��Ƶ
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

	void AddFeature(bool bFirstWordIgnore);//����ǰ�ִʽ�����浽ԭʼ�ı�����
};
