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

//ȫ�ֵ����ݶ���

//ԭʼ�ı�����
struct WordFeature
{
	string strWord;//�ı���������

	//��������ѡȡ�Լ�����������Ȩֵ�Ĳ���
	int nNumA;//���������������ڰ�������ĵ���Ŀ
	int nNumB;//���������������ڱ�������ĵ���Ŀ

	double dCHI;//����ͳ����ֵ����������ѡȡ
};

//ȫ�ִ�����

//�ж������ֵ��ļ��Ƿ����
bool IsDctDataExists();


//����XML�ļ���������Ӧ�������ı�����
CCommentText** AnalyseXML(string strXMLFile);

//����ѡ��,ѵ���׶�ʹ��
void SelectFeature(CCommentText** pComArr, float fRatio);

//��������
void SaveFeature(string strFile);
//��������
void LoadFeature(string strFile);

//�ı�Ȩֵ��һ������
void NormalizedWeight(CCommentText** pCommentTextArr);

//����libSVM������ʽ��������Ȩֵ���ļ�,��������libSVM�����Զ�ѡȡ���Ų���
void SaveWeight(CCommentText** pCommArr, string strWeightFile);

//SVMѵ����������ģ�͵��ļ�
void SVMTrain(CCommentText** pCommentTextArr, string strModelFile);

//SVMԤ�⣬�����ı���ǽ��
void SVMPredict(CCommentText** pCommentTextArr, string strModelFile);

//�������Ԥ�������ļ�
void SaveResult(CCommentText** pCommentTextArr, string strResultFile);

#endif