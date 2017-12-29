#ifndef COMMENTTEXT_H
#define COMMENTTEXT_H

#include <iostream>
#include <string>
#include "Processing.h"
#include "FreeICTCLAS/FreeICTCLAS.h"
#include <math.h>
using namespace std;

//�����ı���
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

	void ExtractOFeature();//���ı����зִʴ�������ȡ����
	void CalcFeatureWeight();//��������Ȩ��
	map<string, int> GetOFeature();//��ȡԭʼ���������Ƶ
	vector<string> GetOWordFeature();//��ȡԭʼ������
	int GetOWordCount(string strWord);//��ȡԭʼ������Ƶ
	bool IsHaveFeature(string strWord);//�Ƿ����������
	vector<float> GetFeatureWeight();//��ȡ����Ȩ��
	void SetFeatureWeight(vector<float> vecWeight);

public:
	static CFreeICTCLAS* s_pICTCLAS; //�ִʴ�����
	static map<string, int> s_mapFeature;//ѡȡ�������ʣ�key:������   value:���������ʵ��ı�����
	static int s_nFeatureNum;//��������
	static int s_nTestNum;//�����ı�������
	static int s_nTrainNum;//ѵ���ı�������

protected:
	string m_strReviewID;//���
	string m_strSummary;//����
	char m_cPolarity;//������   N:����  P:����  O:����ȷ
	string m_strText;//�ı�����
	string m_strCategory;//���
	map<string, int> m_mapOFeature;//�ı�ԭʼ������key: �ִʺ���ȡ������  value:���������ı��еĴ�Ƶ
	int m_nNumOFeature;//ԭʼ��������
	vector<float> m_vecWeight;//����Ȩ��
};

#endif