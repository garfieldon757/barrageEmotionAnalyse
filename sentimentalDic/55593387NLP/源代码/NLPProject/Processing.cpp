#include "Processing.h"
#include "CommentText.h"
#include "LibSVM/svm.h"

//�ж������ֵ��ļ��Ƿ����
bool IsDctDataExists()
{
	char sDataFiles[][40]={"FreeICTCLAS\\data\\BigramDict.dct",
		"FreeICTCLAS\\data\\coreDict.dct",
		"FreeICTCLAS\\data\\lexical.ctx",
		"FreeICTCLAS\\data\\nr.dct",
		"FreeICTCLAS\\data\\nr.ctx",
		"FreeICTCLAS\\data\\ns.dct",
		"FreeICTCLAS\\data\\ns.ctx",
		"FreeICTCLAS\\data\\tr.dct",
		"FreeICTCLAS\\data\\tr.ctx",
		""
	};
	int i=0;
	while(sDataFiles[i][0]!=0)
	{
		if((_access( sDataFiles[i], 0 ))==-1)
			return false;
		i++;
	}
	return true;
}


//����XML�ļ���������Ӧ�������ı�����
CCommentText** AnalyseXML(string strXMLFile)
{
	CCommentText** pCommentTextArr;
	CMarkup* pMarkup = new CMarkup();
	pMarkup->Load(strXMLFile.c_str());

	CCommentText::s_nTestNum = 0;
	while (pMarkup->FindChildElem(_T("item")))
	{
		CCommentText::s_nTestNum++;
	}
	if (CCommentText::s_nTestNum == 0)
	{
		//û���ҵ�item��ǩ
		return NULL;
	}
	else
	{
		//Ϊ�����ı����ʼ���ڴ�ռ�
		pCommentTextArr = new CCommentText*[CCommentText::s_nTestNum];

		pMarkup->ResetPos();//����XML�ļ�����λ��

		int i = 0;
		while (pMarkup->FindChildElem("item"))
		{
			pCommentTextArr[i] = new CCommentText();

			pMarkup->IntoElem();

			if (pMarkup->FindChildElem("review_id"))
			{
				pCommentTextArr[i]->SetReviewID((pMarkup->GetChildData()).GetBuffer(0));
			}
			if (pMarkup->FindChildElem("summary"))
			{
				pCommentTextArr[i]->SetSummary((pMarkup->GetChildData()).GetBuffer(0));
			}
			if (pMarkup->FindChildElem("polarity"))
			{
				pCommentTextArr[i]->SetPolarity((pMarkup->GetChildData())[0]);
			}
			if (pMarkup->FindChildElem("text"))
			{
				pCommentTextArr[i]->SetText((pMarkup->GetChildData()).GetBuffer(0));
			}
			if (pMarkup->FindChildElem("category"))
			{
				pCommentTextArr[i]->SetCategory((pMarkup->GetChildData()).GetBuffer(0));
			}
			
			pMarkup->OutOfElem();

			i++;
		}
	}

	return pCommentTextArr;
}

//��CHI������
bool CompareCHI(WordFeature f1, WordFeature f2)
{
	return f1.dCHI > f2.dCHI;
}

//����ѡ��
void SelectFeature(CCommentText** pComArr, float fRatio)
{
	vector<WordFeature> vecFeatureArr;//�洢ԭʼ�����������ʼ�����Ӧֵ
	vector<string> vecWordFeature;//�洢��ǰ�ı���������
	vector<string>::iterator itor;
	vector<WordFeature>::iterator itorArr;
	WordFeature feature;
	int nTextNum = CCommentText::s_nTestNum;
	int nNNum = 0;
	int nPNum = 0;
	for (int i = 0; i < nTextNum; i++)
	{
		if (pComArr[i]->GetPolarity() == 'N')
		{
			//��ǰ�ı�Ϊ�����ı�
			nNNum++;
		}
		else if (pComArr[i]->GetPolarity() == 'P')
		{
			//��ǰ�ı�Ϊ�����ı�
			nPNum++;
		}

		vecWordFeature = pComArr[i]->GetOWordFeature();
		for (itor = vecWordFeature.begin(); itor != vecWordFeature.end(); itor++)
		{
			//��ԭʼ�����ʼ���Ѱ��Ŀǰ�������ʣ�������������ӵ������ʼ����趨��Ӧֵ�������趨��Ӧֵ����
			for (itorArr = vecFeatureArr.begin(); itorArr != vecFeatureArr.end(); itorArr++)
			{
				if ((*itorArr).strWord == (*itor))
				{
					break;
				}
			}

			if (itorArr != vecFeatureArr.end())
			{
				//��ǰԭʼ�������Ѿ�������������,�Ը���������Ӧֵ�����޸�
				if (pComArr[i]->GetPolarity() == 'N')
				{
					//��ǰ�ı�Ϊ�����ı�
					itorArr->nNumB++;
				}
				else if (pComArr[i]->GetPolarity() == 'P')
				{
					//��ǰ�ı�Ϊ�����ı�
					itorArr->nNumA++;
				}
			}
			else
			{
				//��ǰԭʼ��������������������,��Ӹ�������
				feature.strWord = *itor;
				feature.nNumA = 0;
				feature.nNumB = 0;
				if (pComArr[i]->GetPolarity() == 'N')
				{
					//��ǰ�ı�Ϊ�����ı�
					feature.nNumB = 1;
				}
				else if (pComArr[i]->GetPolarity() == 'P')
				{
					//��ǰ�ı�Ϊ�����ı�
					feature.nNumA = 1;
				}
				vecFeatureArr.push_back(feature);
			}
		}
	}

	int nA, nB, nC, nD;
	//������ȡ��������CHI
	for (itorArr = vecFeatureArr.begin(); itorArr!= vecFeatureArr.end(); itorArr++)
	{
		nA = (*itorArr).nNumA;
		nB = (*itorArr).nNumB;
		nC = nPNum - (*itorArr).nNumA;
		nD = nNNum - (*itorArr).nNumB;

		//�԰��������ֱ���п���ͳ�������㣬ѡȡ���ֵ��Ϊ�������ʵĿ���ͳ����
		//dNCHI = nTextNum * (nB * nC - nA * nD) * 1.0 / ((nA + nC) * (nB + nD) * (nA + nB) * (nC + nD));//����ͳ����
		//dPCHI = nTextNum * (nA * nD - nB * nC) * 1.0 / ((nA + nC) * (nB + nD) * (nA + nB) * (nC + nD));//����ͳ����

		//����Ϊ������𣬹ʼ򻯼���
		if (nB* nC > nA * nD)
		{
			(*itorArr).dCHI = nB * nC - nA * nD;
		}
		else
		{
			(*itorArr).dCHI = nA * nD - nB * nC;
		}
	}

	//����ȡ���������CHI����
	sort(vecFeatureArr.begin(), vecFeatureArr.end(), CompareCHI);

	//���ݸ����ı���ֵ����ȡһ����������Ϊѡȡ�������
	itorArr = vecFeatureArr.begin();
	int nArrNum = vecFeatureArr.size();
	for (int i = 0; i < nArrNum * fRatio; i++, itorArr++)
	{
		CCommentText::s_mapFeature.insert(pair<string, int>(itorArr->strWord, itorArr->nNumA + itorArr->nNumB));
	}
	CCommentText::s_nFeatureNum = nArrNum * fRatio;
}

//��������
void SaveFeature(string strFile)
{
	ofstream fout;
	fout.open(strFile);

	fout<<CCommentText::s_nTestNum<<endl;
	map<string, int>::iterator itor = CCommentText::s_mapFeature.begin();
	for (; itor != CCommentText::s_mapFeature.end(); itor++)
	{
		fout<<itor->first<<" "<<itor->second<<endl;
	}

	fout.close();
}

//��������
void LoadFeature(string strFile)
{
	ifstream fin;
	fin.open(strFile);
	string strFeature;
	int nNum;
	CCommentText::s_nFeatureNum = 0;

	fin>>CCommentText::s_nTrainNum;
	while (fin >> strFeature >> nNum)
	{
		CCommentText::s_mapFeature.insert(pair<string, int>(strFeature, nNum));
		CCommentText::s_nFeatureNum++;
	}

	fin.close();
}



//�ı�����Ȩֵ��һ������
void NormalizedWeight(CCommentText** pCommentTextArr)
{
	vector<float> vecWeight;
	vector<float> vecSumWeight;
	vector<float>::iterator itorSum;
	vector<float>::iterator itor;
	float fTemp;
	int nTextNum = CCommentText::s_nTestNum;
	//��������Ȩֵ��
	for (int i = 0; i < nTextNum; i++)
	{
		vecWeight = pCommentTextArr[i]->GetFeatureWeight();
		if (i == 0)
		{
			//��һ�γ�ʼ���ռ�
			vecSumWeight.resize(vecWeight.size());
			memcpy(&vecSumWeight[0], &vecWeight[0], vecWeight.size() * sizeof(float));
		}
		else
		{
			for (itorSum = vecSumWeight.begin(), itor = vecWeight.begin(); itorSum != vecSumWeight.end(); itorSum++, itor++)
			{
				(*itorSum) += (*itor) * (*itor);
			}
		}
	}
	//��һ������Ȩֵ
	for (int i = 0; i < nTextNum; i++)
	{
		vecWeight = pCommentTextArr[i]->GetFeatureWeight();
		for (itorSum = vecSumWeight.begin(), itor = vecWeight.begin(); itorSum != vecSumWeight.end(); itorSum++, itor++)
		{
			fTemp = sqrt((*itorSum));
			if (fTemp != 0)
			{
				(*itor) = (*itor) / fTemp;
			}
		}
		pCommentTextArr[i]->SetFeatureWeight(vecWeight);
	}
}

//����libSVM������ʽ��������Ȩֵ���ļ�
void SaveWeight(CCommentText** pCommArr, string strWeightFile)
{
	int nTextNum = CCommentText::s_nTestNum;
	if (NULL == pCommArr || nTextNum <= 0)
	{
		return;
	}

	ofstream fout;
	fout.open(strWeightFile);
	for (int i = 0; i < nTextNum; i++)
	{
		vector<float> vecWeight = pCommArr[i]->GetFeatureWeight();

		if (pCommArr[i]->GetPolarity() == 'N')
		{
			fout<<"-1"<<" ";
		}
		else
		{
			fout<<"+1"<<" ";
		}
		vector<float>::iterator itor = vecWeight.begin();
		for (int i = 1; itor != vecWeight.end(); i++, itor++)
		{
			fout<<i<<':'<<(*itor)<<" ";
		}
		fout<<endl;
	}
	fout.close();
}

void SVMTrain(CCommentText** pCommentTextArr, string strModelFile)
{
	int nTextNum = CCommentText::s_nTestNum;
	if (NULL == pCommentTextArr || nTextNum <= 0)
	{
		return;
	}

	svm_parameter param;
	svm_problem prob;
	svm_model* model;
	vector<float> vecWeightFeature;
	vector<float>::iterator itor;

	//SVM������ʼ��,Ĭ�ϲ���
	param.svm_type = C_SVC;
	param.kernel_type = RBF;
	param.degree = 3;
	param.gamma = 0;	// 1/num_features
	param.coef0 = 0;
	param.nu = 0.5;
	param.cache_size = 100;


	param.C = 1.0;//������Ĳ���֮һ
	param.gamma = 0.5;//������Ĳ���֮һ


	param.eps = 1e-3;
	param.p = 0.1;
	param.shrinking = 1;
	param.probability = 0;
	param.nr_weight = 0;
	param.weight_label = NULL;
	param.weight = NULL;
	svm_set_print_string_function(NULL);


	//SVMѵ�����ݹ���
	prob.l = nTextNum;
	prob.y = (double*)malloc(sizeof(double) * nTextNum);
	prob.x = (svm_node**)malloc(sizeof(svm_node*) * nTextNum);

	for (int i = 0; i < nTextNum; i++)
	{
		if (pCommentTextArr[i]->GetPolarity() == 'P')
		{
			prob.y[i] = 1;//������� 1
		}
		else if (pCommentTextArr[i]->GetPolarity() == 'N')
		{
			prob.y[i] = 2;//������� -1
		}
		prob.x[i] = (svm_node*)malloc(sizeof(svm_node) * (CCommentText::s_nFeatureNum + 1));
		vecWeightFeature = pCommentTextArr[i]->GetFeatureWeight();
		itor = vecWeightFeature.begin();
		int j = 0;
		for (j = 0; itor != vecWeightFeature.end(); j++, itor++)
		{
			prob.x[i][j].index = j + 1;
			prob.x[i][j].value = (*itor);
		}
		prob.x[i][j].index = -1;
	}

	//SVM�����Լ�ѵ�����ݼ��
	const char* error_msg = svm_check_parameter(&prob, &param);
	if (error_msg)
	{
		printf("SVM ERROR: %s\n",error_msg);
		return;
	}

	//SVMѵ��
	model = svm_train(&prob, &param);
	if (svm_save_model(strModelFile.c_str(), model))
	{
		printf("SVM ERROR: Cannot Save Model File!\n");
	}

	//�����ڴ��ͷ�
	svm_free_and_destroy_model(&model);
	svm_destroy_param(&param);
	free(prob.y);
	free(prob.x);
}

void SVMPredict(CCommentText** pCommentTextArr, string strModelFile)
{
	int nTextNum = CCommentText::s_nTestNum;
	if (NULL == pCommentTextArr || nTextNum <= 0)
	{
		return;
	}

	svm_node* x = (svm_node*)malloc(sizeof(svm_node) * (CCommentText::s_nFeatureNum + 1));
	svm_model* model = NULL;
	vector<float> vecWeightFeature;
	vector<float>::iterator itor;
	double predict_label;
	int j = 0;
	//����ģ��
	if ((model = svm_load_model(strModelFile.c_str())) == 0)
	{
		printf("SVM ERROR: Cannot Load SVM Model!\n");
		return;
	}
	//ģ�ͼ��
	if (svm_check_probability_model(model) != 0)
	{
		printf("SVM ERROR: Model Param Error!\n");
	}

	int nCorrectNum = 0;

	//���ι���������ݣ���������
	for (int i = 0; i < nTextNum; i++)
	{
		//����������ݸ�ʽ
		vecWeightFeature = pCommentTextArr[i]->GetFeatureWeight();
		itor = vecWeightFeature.begin();
		for (j = 0; itor != vecWeightFeature.end(); j++, itor++)
		{
			x[j].index = j + 1;
			x[j].value = (*itor);
		}
		x[j].index = -1;//������־

		//Ԥ��
		predict_label = svm_predict(model, x);

		if (fabs(predict_label - 1.0) < 0.001)
		{
			//Ԥ��Ϊ����
			if (pCommentTextArr[i]->GetPolarity() == 'P')
			{
				nCorrectNum++;
			}
			pCommentTextArr[i]->SetPolarity('P');
		}
		else
		{
			//Ԥ��Ϊ����
			if (pCommentTextArr[i]->GetPolarity() == 'N')
			{
				nCorrectNum++;
			}
			pCommentTextArr[i]->SetPolarity('N');
		}
	}

	printf("SVM Predict Correct Ratio: %f.\n", nCorrectNum * 1.0 / nTextNum);

	svm_free_and_destroy_model(&model);
//	free(x);
}

//�������Ԥ�������ļ�
void SaveResult(CCommentText** pCommentTextArr, string strResultFile)
{
	int nTextNum = CCommentText::s_nTestNum;
	if (NULL == pCommentTextArr || nTextNum <= 0)
	{
		return;
	}
	ofstream fout;
	fout.open(strResultFile);

	for (int i = 0; i < nTextNum; i++)
	{
		fout<<pCommentTextArr[i]->GetPolarityResult()<<endl;
	}

	fout.close();
}