#include "CommentText.h"

CFreeICTCLAS *CCommentText::s_pICTCLAS = new CFreeICTCLAS();
map<string, int> CCommentText::s_mapFeature;//ѡȡ�������ʣ�key:������   value:���������ı����еĴ�Ƶ
int CCommentText::s_nFeatureNum = 0;//��������
int CCommentText::s_nTrainNum = 0;//ѵ���ı�������
int CCommentText::s_nTestNum = 0;//�����ı�������

CCommentText::CCommentText(void)
{
	m_strReviewID = _T("");
	m_strSummary = _T("");
	m_cPolarity = _T('O');
	m_strText = _T("");
	m_strCategory = _T("");
}


CCommentText::~CCommentText(void)
{
	m_mapOFeature.swap(map<string, int>());
	m_vecWeight.swap(vector<float>());
}

void CCommentText::SetReviewID(string strReviewID)
{
	m_strReviewID = strReviewID;
}

string CCommentText::GetReviewID()
{
	return m_strReviewID;
}


void CCommentText::SetSummary(string strSummary)
{
	m_strSummary = strSummary;
}

void CCommentText::SetPolarity(char cPolarity)
{
	m_cPolarity = cPolarity;
}

char CCommentText::GetPolarity()
{
	return m_cPolarity;
}

void CCommentText::SetText(string strText)
{
	m_strText = strText;
}

void CCommentText::SetCategory(string strCategory)
{
	m_strCategory = strCategory;
}

void CCommentText::ExtractOFeature()
{
	s_pICTCLAS->ParagraphProcessing(const_cast<char*>(m_strText.c_str()));
	m_mapOFeature = s_pICTCLAS->GetParagraphFeature();

	map<string, int>::iterator itor = m_mapOFeature.begin();
	m_nNumOFeature = 0;
	for (; itor != m_mapOFeature.end(); itor++)
	{
		m_nNumOFeature += itor->second;
	}
}

void CCommentText::CalcFeatureWeight()//��������Ȩ��
{
	if (s_mapFeature.size() <= 0)
	{
		return;
	}

	map<string, int>::iterator itor = s_mapFeature.begin();
	map<string, int>::iterator itorO;
	float fWeight = 0;
	for (; itor != s_mapFeature.end(); itor++)
	{
		//�жϸ������Ƿ�����ı���
		itorO = m_mapOFeature.find(itor->first);

		if (itorO != m_mapOFeature.end())
		{
			//����TFIDFȨ��
			fWeight = (itorO->second * 1.0 / m_nNumOFeature) * log(s_nTrainNum * 1.0 / (itor->second) + 0.01);


			//����TFȨ��
			//fWeight = (itorO->second * 1.0 / m_nNumOFeature);
		
			//���㲼��Ȩ��
			//fWeight = 1;
		}
		else
		{
			//Ȩ��Ϊ0
			fWeight = 0;
		}
		m_vecWeight.push_back(fWeight);
	}
}

map<string, int> CCommentText::GetOFeature()//��ȡԭʼ���������Ƶ
{
	return m_mapOFeature;
}

vector<string> CCommentText::GetOWordFeature()//��ȡԭʼ������
{
	vector<string> vecFeature;

	map<string, int>::iterator itor = m_mapOFeature.begin();
	for (; itor != m_mapOFeature.end(); itor++)
	{
		vecFeature.push_back(itor->first);
	}
	return vecFeature;
}

int CCommentText::GetOWordCount(string strWord)
{
	map<string, int>::iterator itor = m_mapOFeature.find(strWord);

	if (itor != m_mapOFeature.end())
	{
		return itor->second;
	}
	else
	{
		return 0;
	}
}

bool CCommentText::IsHaveFeature(string strWord)
{
	map<string, int>::iterator itor = m_mapOFeature.find(strWord);

	if (itor != m_mapOFeature.end())
	{
		return true;
	}
	else
	{
		return false;
	}
}

vector<float> CCommentText::GetFeatureWeight()//��ȡ����Ȩ��
{
	return m_vecWeight;
}

void CCommentText::SetFeatureWeight(vector<float> vecWeight)
{
	m_vecWeight.resize(vecWeight.size());
	memcpy(&m_vecWeight[0], &vecWeight[0], vecWeight.size() * sizeof(float));
}

string CCommentText::GetPolarityResult()
{
	return m_strCategory + " " + m_strReviewID + " " + m_cPolarity;
}