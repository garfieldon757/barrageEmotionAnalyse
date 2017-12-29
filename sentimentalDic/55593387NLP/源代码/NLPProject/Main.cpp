#include <iostream>
#include "Processing.h"
#include "CommentText.h"
#include "FreeICTCLAS/FreeICTCLAS.h"
using namespace std;

int main()
{
	if (!IsDctDataExists())
	{
		printf("ERROR: Cannot Find Dictionary Data File!\n");
		return 0;
	}

	//��XML�ļ���ȡ�����ı�
	CCommentText** pComArr = AnalyseXML("Dataset/CSC_music_test");

	LoadFeature("Feature/feature_music_10%");

	for (int i = 0; i < CCommentText::s_nTestNum; i++)
	{
		printf("%s\n", (pComArr[i]->GetReviewID()).c_str());
		pComArr[i]->ExtractOFeature();//��ȡԭʼ����

		pComArr[i]->CalcFeatureWeight();
	}

	//������һ��
	//	NormalizedWeight(pComArr);

//	SaveWeight(pComArr, "Weight/weight_book_bool_10%");
	
	
//	SVMTrain(pComArr, "Model/model_book_10%");

	//SVMѧϰ
	SVMPredict(pComArr, "Model/model_music_10%");
	//���������ļ�
	SaveResult(pComArr, "Result/result_music_10%");

	system("PAUSE");
	return 0;
}