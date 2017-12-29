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

//利用中科院汉语词法分析系统ICTCLAS构建的新分词处理接口

#include "FreeICTCLAS.h"
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <fstream>
#include "Utility\\Utility.h"
//////////////////////////////////////////////////////////////////////
// Construction/Destruction
//////////////////////////////////////////////////////////////////////

CFreeICTCLAS::CFreeICTCLAS()
{
	//malloc buffer
	m_pResult=new PWORD_RESULT[MAX_SEGMENT_NUM];
	for(int i=0;i<MAX_SEGMENT_NUM;i++)
	{
		m_pResult[i]=new WORD_RESULT[MAX_WORDS];
	}

	m_dictCore.Load("data\\coreDict.dct");
	m_POSTagger.LoadContext("data\\lexical.ctx");


	m_POSTagger.SetTagType();

	m_uPerson.Configure("data\\nr",TT_PERSON);
	//Set the person recognition configure
	m_uPlace.Configure("data\\ns",TT_PLACE);
	//Set the place recognition configure
	m_uTransPerson.Configure("data\\tr",TT_TRANS_PERSON);
	//Set the transliteration person recognition configure

	m_dSmoothingPara=0.1;//Smoothing parameter
	m_dictBigram.Load("data\\BigramDict.dct");

	m_nResultCount = 0;

	//清空并回收当前特征链表
	m_mapFeature.clear();
	m_mapFeature.swap(map<string, int>());

	//读取停用词文件导入停用词表
	ifstream fin;
	string strStopWord;
	fin.open("data\\StopWords.txt");
	while (fin>>strStopWord)
	{
		m_vecStopWords.push_back(strStopWord);
	}
	fin.close();

}

CFreeICTCLAS::~CFreeICTCLAS()
{
	//free buffer
	for(int i=0;i<MAX_SEGMENT_NUM;i++)
	{
		delete [] m_pResult[i];
	}
	delete m_pResult;

}

//获取分词处理后原始文本特征
map<string, int> CFreeICTCLAS::GetParagraphFeature()
{
	return m_mapFeature;
}

void CFreeICTCLAS::AddFeature(bool bFirstWordIgnore)
{
	string strFeature;
	PWORD_RESULT pItem = m_pResult[0];
	int i = 0;
	vector<string>::iterator itorStop;
	map<string, int>::iterator itorFeature;
	if(bFirstWordIgnore)//Ignore first valid
	{
		i = 1;
	}
	while( pItem[i].sWord[0] != 0 && pItem[i].nHandle != CT_SENTENCE_END)//Not sentence ending flag
	{
		strFeature = pItem[i].sWord;

		//对特征词进行英文单词与数字检测，去除英语单词与数字，判断第一个字符是否为英语单词或数字即可
		if ((strFeature[0] >= 'a' && strFeature[0] <= 'z') || (strFeature[0] >= 'A' && strFeature[0] <= 'Z') || (strFeature[0] >= '0') && (strFeature[0] <= '9'))
		{
			//当前特征词为英语单词，去除
			i++;
			continue;
		}

		//对特征词进行停用词检测
		itorStop = find(m_vecStopWords.begin(), m_vecStopWords.end(), strFeature);
		if (itorStop == m_vecStopWords.end())//当前特征词不是停用词
		{
			//对于已经存在的特征，不保存
			itorFeature = m_mapFeature.find(strFeature);
			if (itorFeature == m_mapFeature.end())
			{
				m_mapFeature.insert(pair<string, int>(strFeature, 1));
			}
			else
			{
				itorFeature->second++;
			}
		}
		i++;
	}
}

bool CFreeICTCLAS::Processing(char *sSentence,unsigned int nCount)
{
	int nIndex;
#if _ICT_DEBUG
	char *sSegment;
	sSegment=new char[MAX_SENTENCE_LEN*2];
#endif
	//Unigram segment
	//m_Seg.Segment(sSentence,m_dictCore,nCount);
	//Bigram segment
	m_Seg.BiSegment(sSentence, m_dSmoothingPara,m_dictCore,m_dictBigram,nCount);
	
	m_nResultCount=m_Seg.m_nSegmentCount;
	//Record the number of result
	for(nIndex=0;nIndex<m_Seg.m_nSegmentCount;nIndex++)
	{
#if _ICT_DEBUG
			m_POSTagger.POSTagging(m_Seg.m_pWordSeg[nIndex],m_dictCore,m_dictCore);
			Output(m_Seg.m_pWordSeg[nIndex],sSegment);
			printf("POS Tag%d:%s\n",nIndex+1,sSegment);
#endif
		m_uPerson.Recognition(m_Seg.m_pWordSeg[nIndex],m_Seg.m_graphOptimum,m_Seg.m_graphSeg,m_dictCore);
		m_uTransPerson.Recognition(m_Seg.m_pWordSeg[nIndex],m_Seg.m_graphOptimum,m_Seg.m_graphSeg,m_dictCore);
		m_uPlace.Recognition(m_Seg.m_pWordSeg[nIndex],m_Seg.m_graphOptimum,m_Seg.m_graphSeg,m_dictCore);
	}		
	//m_uPerson.Recognition(m_Seg.m_WordSeg[0],m_Seg.m_graphOptimum,m_Seg.m_graphSeg,m_dictCore);
	//Person Recognition
#if _ICT_DEBUG
	printf("After person recognition.\n");
#endif
	//Unigram
	//m_Seg.OptimumSegmet(nCount);
	//Bigram
	m_Seg.BiOptimumSegment(nCount,m_dSmoothingPara,m_dictBigram,m_dictCore);

	for(nIndex=0;nIndex<m_Seg.m_nSegmentCount;nIndex++)
	{
		m_POSTagger.POSTagging(m_Seg.m_pWordSeg[nIndex],m_dictCore,m_dictCore);
#if _ICT_DEBUG
		Output(m_Seg.m_pWordSeg[nIndex],sSegment);
		printf("POS Tag%d:%s\n",nIndex+1,sSegment);
#endif
	}
#if _ICT_DEBUG
	printf("After Sorting.\n");
#endif
	Sort();//Sort the ending 
#if _ICT_DEBUG
	for(nIndex=0;nIndex<m_Seg.m_nSegmentCount;nIndex++)
	{
		Output(m_pResult[nIndex],sSegment);
		printf("POS Tag%d(P=Exp(%f)):%s\n",nIndex+1,m_dResultPossibility[nIndex],sSegment);
	}
	delete [] sSegment;
#endif
	return true;
}
//Sort the segmentation and POS result according its possibility
bool CFreeICTCLAS::Sort()
{
	ELEMENT_TYPE dPossibility[MAX_SEGMENT_NUM],dTemp;
	int nIndex[MAX_SEGMENT_NUM],nTemp;//Index

	memset(dPossibility,0,sizeof(dPossibility));
	//Init the possibility
	int i = 0;
	for(i=0;i<m_Seg.m_nSegmentCount;i++)
	{//Computing the possibility
		dPossibility[i]=ComputePossibility(m_Seg.m_pWordSeg[i]);
		nIndex[i]=i;//Record the index
	}
	
	//Sort with Bubble sort algorithm
	for(i=0;i<m_Seg.m_nSegmentCount;i++)
		for(int j=i+1;j<m_Seg.m_nSegmentCount;j++)
		{
			if(dPossibility[i]<dPossibility[j])
			{//Swap the possition and value
				nTemp=nIndex[i];
				dTemp=dPossibility[i];
				nIndex[i]=nIndex[j];
				dPossibility[i]=dPossibility[j];
				nIndex[j]=nTemp;
				dPossibility[j]=dTemp;
			}
		}
	
	for(i=0;i<m_Seg.m_nSegmentCount;i++)
	{//Adjust the segmentation and POS result and store them in the final result array
	 //Store them according their possibility ascendly
		Adjust(m_Seg.m_pWordSeg[nIndex[i]],m_pResult[i]);	
		m_dResultPossibility[i]=dPossibility[i];	
	}
	return true;
}
//Compute the possibility of current segmentation and POS result
ELEMENT_TYPE CFreeICTCLAS::ComputePossibility(PWORD_RESULT pItem)
{
	int i=0;
	ELEMENT_TYPE dResultPossibility=0;
	while(pItem[i].sWord[0]!=0)
	{
		dResultPossibility+=pItem[i].dValue;
		//Compute the possibility of logP(Wi|Ti)
		if(pItem[i+1].sWord[0]!=0)//Not the last one
		{//Compute the possibility of logP(Ti|Ti-1)
			dResultPossibility+=log((double)(m_POSTagger.m_context.GetContextPossibility(0,pItem[i].nHandle,pItem[i+1].nHandle)+1));
			dResultPossibility-=log((double)(m_POSTagger.m_context.GetFrequency(0,pItem[i].nHandle)+1));
		}
		i++;
	}
	return dResultPossibility;
}

//Adjust the result with some rules
bool CFreeICTCLAS::Adjust(PWORD_RESULT pItem,PWORD_RESULT pItemRet)
{
	int i=0,j=0;
	unsigned int nLen;
	char sSurName[10],sSurName2[10],sGivenName[10];
	bool bProcessed=false;//Have been processed
	while(pItem[i].sWord[0]!=0)
	{
		nLen=strlen(pItem[i].sWord);
		bProcessed=false;
		
		//Rule1: adjust person name
		if(pItem[i].nHandle==28274&&ChineseNameSplit(pItem[i].sWord,sSurName,sSurName2,sGivenName,m_uPerson.m_dict)&&strcmp(pItem[i].sWord,"叶利钦")!=0)//'nr'
		{//Divide name into surname and given name
			
			if(sSurName[0])
			{
				strcpy(pItemRet[j].sWord,sSurName);
				pItemRet[j++].nHandle=28274;
			}
			if(sSurName2[0])
			{
				strcpy(pItemRet[j].sWord,sSurName2);
				pItemRet[j++].nHandle=28274;
			}
			if(sGivenName[0])
			{
				strcpy(pItemRet[j].sWord,sGivenName);
				pItemRet[j++].nHandle=28274;
			}
			bProcessed=true;
		}
		//Rule2 for overlap words ABB 一段段、一片片
		else if(pItem[i].nHandle==27904&&strlen(pItem[i+1].sWord)==2&&strcmp(pItem[i+1].sWord,pItem[i+2].sWord)==0)
		{//(pItem[i+1].nHandle/256=='q'||pItem[i+1].nHandle/256=='a')&&
			strcpy(pItemRet[j].sWord,pItem[i].sWord);
			strcat(pItemRet[j].sWord,pItem[i+1].sWord);
			strcat(pItemRet[j].sWord,pItem[i+2].sWord);
			pItemRet[j].nHandle=27904;
			j+=1;
			i+=2;
			bProcessed=true;
		}
		//Rule3 for overlap words AA
		else if(nLen==2&&strcmp(pItem[i].sWord,pItem[i+1].sWord)==0)
		{
			strcpy(pItemRet[j].sWord,pItem[i].sWord);
			strcat(pItemRet[j].sWord,pItem[i+1].sWord);
		     //24832=='a'*256
			pItemRet[j].nHandle=24832;//a
			if(pItem[i].nHandle/256=='v'||pItem[i+1].nHandle/256=='v')//30208='v'8256
			{
				pItemRet[j].nHandle=30208;
			}
			if(pItem[i].nHandle/256=='n'||pItem[i+1].nHandle/256=='n')//30208='v'8256
			{
				pItemRet[j].nHandle='n'*256;
			}			
			i+=1;
			if(strlen(pItem[i+1].sWord)==2)
			{//AAB:洗/洗/脸、蒙蒙亮
				if((pItemRet[j].nHandle==30208&&pItem[i+1].nHandle/256=='n')||
				   (pItemRet[j].nHandle==24832&&pItem[i+1].nHandle/256=='a')
				   )
				{
					strcat(pItemRet[j].sWord,pItem[i+1].sWord);
					i+=1;
				}
			}
			j+=1;
			bProcessed=true;
		}

		//Rule 4: AAB 洗/洗澡
		else if(nLen==2&&strncmp(pItem[i].sWord,pItem[i+1].sWord,2)==0&&strlen(pItem[i+1].sWord)==4&&(pItem[i].nHandle/256=='v'||pItem[i].nHandle==24832))//v,a
		{
			strcpy(pItemRet[j].sWord,pItem[i].sWord);
			strcat(pItemRet[j].sWord,pItem[i+1].sWord);
		     //24832=='a'*256
			pItemRet[j].nHandle=24832;//'a'
			if(pItem[i].nHandle/256=='v'||pItem[i+1].nHandle/256=='v')//30208='v'8256
			{
				pItemRet[j].nHandle=30208;
			}

			i+=1;
			j+=1;
			bProcessed=true;
		}
		else if(pItem[i].nHandle/256=='u'&&pItem[i].nHandle%256)//uj,ud,uv,uz,ul,ug->u
			pItem[i].nHandle='u'*256;
		else if(nLen==2&&strncmp(pItem[i].sWord,pItem[i+1].sWord,2)==0&&strlen(pItem[i+1].sWord)==4&&strncmp(pItem[i+1].sWord+2,pItem[i+2].sWord,2)==0)
		{//AABB 朴朴素素 枝枝叶叶
				strcpy(pItemRet[j].sWord,pItem[i].sWord);
				strcat(pItemRet[j].sWord,pItem[i+1].sWord);
				strcat(pItemRet[j].sWord,pItem[i+2].sWord);
				pItemRet[j].nHandle=pItem[i+1].nHandle;
				i+=2;
				j+=1;
				bProcessed=true;
		}
		else if(pItem[i].nHandle==28275)//PostFix
		{
			if(m_uPlace.m_dict.IsExist(pItem[i+1].sWord,4))
			{
				strcpy(pItemRet[j].sWord,pItem[i].sWord);
				strcat(pItemRet[j].sWord,pItem[i+1].sWord);
				pItemRet[j].nHandle=28275;
				i+=1;
				j+=1;
				bProcessed=true;
			}
			else if(strlen(pItem[i+1].sWord)==2&&CC_Find("队",pItem[i+1].sWord))
			{
				strcpy(pItemRet[j].sWord,pItem[i].sWord);
				strcat(pItemRet[j].sWord,pItem[i+1].sWord);
				pItemRet[j].nHandle=28276;
				i+=1;
				j+=1;
				bProcessed=true;
			}
			else if(strlen(pItem[i+1].sWord)==2&&CC_Find("语文字杯",pItem[i+1].sWord))
			{
				strcpy(pItemRet[j].sWord,pItem[i].sWord);
				strcat(pItemRet[j].sWord,pItem[i+1].sWord);
				pItemRet[j].nHandle=28282;
				i+=1;
				j+=1;
				bProcessed=true;
			}
			else if(strlen(pItem[i+1].sWord)==2&&CC_Find("裔",pItem[i+1].sWord))
			{
				strcpy(pItemRet[j].sWord,pItem[i].sWord);
				strcat(pItemRet[j].sWord,pItem[i+1].sWord);
				pItemRet[j].nHandle=28160;
				i+=1;
				j+=1;
				bProcessed=true;
			}
		}
		else if(pItem[i].nHandle==30208||pItem[i].nHandle==28160)//v
		{
			if(strlen(pItem[i+1].sWord)==2&&CC_Find("员",pItem[i+1].sWord))
			{
				strcpy(pItemRet[j].sWord,pItem[i].sWord);
				strcat(pItemRet[j].sWord,pItem[i+1].sWord);
				pItemRet[j].nHandle=28160;
				i+=1;
				j+=1;
				bProcessed=true;
			}
		}
		else if(pItem[i].nHandle==28280)
		{//www/nx ./w sina/nx; ＥＩＭ/nx  -６０１/m 
			strcpy(pItemRet[j].sWord,pItem[i].sWord);
			pItemRet[j].nHandle=28280;
			while(pItem[i+1].nHandle==28280||strstr(".．",pItem[i+1].sWord)||(pItem[i+1].nHandle==27904&&IsAllNum((unsigned char *)pItem[i+1].sWord)))
			{
				strcat(pItemRet[j].sWord,pItem[i+1].sWord);
				i+=1;
			}
			j+=1;
			bProcessed=true;
		}

		if(!bProcessed)
		{//If not processed,that's mean: not need to adjust;
		 //just copy to the final result
			strcpy(pItemRet[j].sWord,pItem[i].sWord);
			pItemRet[j++].nHandle=pItem[i].nHandle;
		}
		i++;
	}
	pItemRet[j].sWord[0]=0;//Set ending
	return true;
}

//Paragraph Segment and POS Tagging
bool CFreeICTCLAS::ParagraphProcessing(char *sParagraph)
{
	//清空并回收当前特征链表
	m_mapFeature.clear();
	m_mapFeature.swap(map<string, int>());

	char *sSentence,sChar[3];
	char *sSentenceResult;
	unsigned int nLen=strlen(sParagraph)+13;
	sSentence=new char[nLen];//malloc buffer
	sSentenceResult=new char[nLen*3];//malloc buffer
	sSentence[0]=0;
	unsigned int nPosIndex=0,nParagraphLen=strlen(sParagraph),nSentenceIndex=0;
	sChar[2]=0;
	bool bFirstIgnore=true;
	strcpy(sSentence,SENTENCE_BEGIN);//Add a sentence begin flag
	while(nPosIndex<nParagraphLen)
	{//Find a whole sentence which separated by ! . \n \r
		sChar[0]=sParagraph[nPosIndex];//Get a char
		sChar[1]=0;
		if(sParagraph[nPosIndex]<0)
		{//double byte char
			nPosIndex+=1;
			sChar[1]=sParagraph[nPosIndex];
		}
		nPosIndex+=1;
/*
#define  SEPERATOR_C_SENTENCE "。！？：；…"
#define  SEPERATOR_C_SUB_SENTENCE "、，（）“”‘’"
#define  SEPERATOR_E_SENTENCE "!?:;"
#define  SEPERATOR_E_SUB_SENTENCE ",()\042'"
#define  SEPERATOR_LINK "\n\r 　"
*/
		if(CC_Find(SEPERATOR_C_SENTENCE,sChar)||CC_Find(SEPERATOR_C_SUB_SENTENCE,sChar)||strstr(SEPERATOR_E_SENTENCE,sChar)||strstr(SEPERATOR_E_SUB_SENTENCE,sChar)||strstr(SEPERATOR_LINK,sChar))
		{//Reach end of a sentence.Get a whole sentence
			if(!strstr(SEPERATOR_LINK,sChar))//Not link seperator
			{
				strcat(sSentence,sChar);
			}
			if(sSentence[0]!=0&&strcmp(sSentence,SENTENCE_BEGIN)!=0)
			{
				if(!strstr(SEPERATOR_C_SUB_SENTENCE,sChar)&&!strstr(SEPERATOR_E_SUB_SENTENCE,sChar))
					strcat(sSentence,SENTENCE_END);//Add sentence ending flag

				Processing(sSentence,1);//Processing and output the result of current sentence.

				AddFeature(bFirstIgnore);//将当前文本分词结果添加到特征链表
			}
			if(strstr(SEPERATOR_LINK,sChar))//Link the result with the SEPERATOR_LINK
			{
				strcpy(sSentence,SENTENCE_BEGIN);//Add a sentence begin flag
			}
			else if(strstr(SEPERATOR_C_SENTENCE,sChar)||strstr(SEPERATOR_E_SENTENCE,sChar))
			{
				strcpy(sSentence,SENTENCE_BEGIN);//Add a sentence begin flag
			}
			else
			{
				strcpy(sSentence,sChar);//reset current sentence, and add the previous end at begin position
			}
		}
		else //Other chars and store in the sentence buffer
			strcat(sSentence,sChar);
	}
	if(sSentence[0]!=0&&strcmp(sSentence,SENTENCE_BEGIN)!=0)
	{
		strcat(sSentence,SENTENCE_END);//Add sentence ending flag
		Processing(sSentence,1);//Processing and output the result of current sentence.

		AddFeature(bFirstIgnore);//将当前文本分词结果添加到特征链表
	}
	delete []  sSentence;//FREE sentence buffer 	
	delete []  sSentenceResult;//free buffer
	return true;
}

bool CFreeICTCLAS::PKU2973POS(int nHandle, char *sPOS973)
{
	int nHandleSet[46]={24832,24932,24935,24942,25088,25344,25600,25703,25856,26112,26368,26624,26880,27136,27392,27648,27904,28160,28263,28274,28275,28276,28280,28282,28416,28672,28928,29184,29440,29696,29799,29952,30052,30055,30058,30060,30070,30074,30208,30308,30311,30318,30464,30720,30976,31232};
						//   "a", "ad","ag","an","b", "c", "d", "dg","e", "f","g", "h", "i", "j", "k", "l", "m", "n", "ng","nr","ns","nt","nx","nz","o", "p", "q", "r", "s", "t", "tg","u", "ud","ug","uj","ul","uv","uz","v", "vd","vg","vn","w", "x", "y", "z"
	char sPOSRelated[46][3]={"a", "ad","ga","an","f", "c", "d", "d", "e","nd","g", "h", "i", "j", "k", "l", "m", "n", "gn","nh","ns","ni","ws", "nz","o", "p", "q", "r", "nl","nt","gt","u", "ud","ug","uj","ul","uv","uz","v", "vd","gv","vn","w", "x", "u", "a"};
/* 
 "Bg","gf",
 "Rg","gr",
 "Mg","gm",
 "Yg","u",
 "Ug","u",
 "Qg","q",
*/

	int nIndex=BinarySearch(nHandle,nHandleSet,46);
	if(nIndex==-1)
		strcpy(sPOS973,"@");
	else
		strcpy(sPOS973,sPOSRelated[nIndex]);
	return true;
}

bool CFreeICTCLAS::ChineseNameSplit(char *sPersonName, char *sSurname, char *sSurname2, char *sGivenName, CDictionary &personDict)
{
	int nSurNameLen=4,nLen=strlen(sPersonName),nFreq,i=0,nCharType,nFreqGiven;
	char sTemp[3];
	if(nLen<3||nLen>8)//Not a traditional Chinese person name
		return false;
	while(i<nLen)//No Including non-CHinese char
	{
		nCharType=charType((unsigned char*)sPersonName+i);
		if(nCharType!=CT_CHINESE&&nCharType!=CT_OTHER)
			return false;
		i+=2;
	}
	sSurname2[0]=0;//init 
	strncpy(sSurname,sPersonName,nSurNameLen);	
	sSurname[nSurNameLen]=0;
	if(!personDict.IsExist(sSurname,1))
	{
		nSurNameLen=2;
		sSurname[nSurNameLen]=0;
		if(!personDict.IsExist(sSurname,1))
		{
			nSurNameLen=0;
			sSurname[nSurNameLen]=0;
		}
	}
	strcpy(sGivenName,sPersonName+nSurNameLen);
	if(nLen>6)
	{
		strncpy(sTemp,sPersonName+nSurNameLen,2);
		sTemp[2]=0;//Get the second possible surname
		if(personDict.IsExist(sTemp,1))
		{//Hongkong women's name: Surname+surname+given name
			strcpy(sSurname2,sTemp);
			strcpy(sGivenName,sPersonName+nSurNameLen+2);
		}
	}
	nFreq=personDict.GetFrequency(sSurname,1);
	strncpy(sTemp,sGivenName,2);
	sTemp[2]=0;
	nFreqGiven=personDict.GetFrequency(sTemp,2);
	if(nSurNameLen!=4&&((nSurNameLen==0&&nLen>4)||strlen(sGivenName)>4||(GetForeignCharCount(sPersonName)>=3&&nFreq<personDict.GetFrequency("张",1)/40&&nFreqGiven<personDict.GetFrequency("华",2)/20)||(nFreq<10&&GetForeignCharCount(sGivenName)==(nLen-nSurNameLen)/2)))
		return false;
	if(nLen==4&&m_uPerson.IsGivenName(sPersonName))
	{//Single Surname+given name
		return false;
	}
	return true;
}

