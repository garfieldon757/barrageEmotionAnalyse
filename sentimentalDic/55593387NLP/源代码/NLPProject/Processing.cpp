#include "Processing.h"
#include "CommentText.h"
#include "LibSVM/svm.h"

//判断数据字典文件是否存在
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


//解析XML文件，构建相应的评论文本数据
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
		//没有找到item标签
		return NULL;
	}
	else
	{
		//为评论文本类初始化内存空间
		pCommentTextArr = new CCommentText*[CCommentText::s_nTestNum];

		pMarkup->ResetPos();//重置XML文件处理位置

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

//按CHI降序函数
bool CompareCHI(WordFeature f1, WordFeature f2)
{
	return f1.dCHI > f2.dCHI;
}

//特征选择
void SelectFeature(CCommentText** pComArr, float fRatio)
{
	vector<WordFeature> vecFeatureArr;//存储原始特征的特征词集与相应值
	vector<string> vecWordFeature;//存储当前文本的特征词
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
			//当前文本为贬义文本
			nNNum++;
		}
		else if (pComArr[i]->GetPolarity() == 'P')
		{
			//当前文本为褒义文本
			nPNum++;
		}

		vecWordFeature = pComArr[i]->GetOWordFeature();
		for (itor = vecWordFeature.begin(); itor != vecWordFeature.end(); itor++)
		{
			//在原始特征词集中寻找目前的特征词，若不存在则添加到特征词集并设定相应值，否则设定相应值即可
			for (itorArr = vecFeatureArr.begin(); itorArr != vecFeatureArr.end(); itorArr++)
			{
				if ((*itorArr).strWord == (*itor))
				{
					break;
				}
			}

			if (itorArr != vecFeatureArr.end())
			{
				//当前原始特征集已经包含该特征词,对该特征的相应值进行修改
				if (pComArr[i]->GetPolarity() == 'N')
				{
					//当前文本为贬义文本
					itorArr->nNumB++;
				}
				else if (pComArr[i]->GetPolarity() == 'P')
				{
					//当前文本为褒义文本
					itorArr->nNumA++;
				}
			}
			else
			{
				//当前原始特征集不包含该特征词,添加该特征词
				feature.strWord = *itor;
				feature.nNumA = 0;
				feature.nNumB = 0;
				if (pComArr[i]->GetPolarity() == 'N')
				{
					//当前文本为贬义文本
					feature.nNumB = 1;
				}
				else if (pComArr[i]->GetPolarity() == 'P')
				{
					//当前文本为褒义文本
					feature.nNumA = 1;
				}
				vecFeatureArr.push_back(feature);
			}
		}
	}

	int nA, nB, nC, nD;
	//计算提取后特征的CHI
	for (itorArr = vecFeatureArr.begin(); itorArr!= vecFeatureArr.end(); itorArr++)
	{
		nA = (*itorArr).nNumA;
		nB = (*itorArr).nNumB;
		nC = nPNum - (*itorArr).nNumA;
		nD = nNNum - (*itorArr).nNumB;

		//对褒义与贬义分别进行卡方统计量计算，选取最大值作为该特征词的卡方统计量
		//dNCHI = nTextNum * (nB * nC - nA * nD) * 1.0 / ((nA + nC) * (nB + nD) * (nA + nB) * (nC + nD));//贬义统计量
		//dPCHI = nTextNum * (nA * nD - nB * nC) * 1.0 / ((nA + nC) * (nB + nD) * (nA + nB) * (nC + nD));//褒义统计量

		//这里为两种类别，故简化计算
		if (nB* nC > nA * nD)
		{
			(*itorArr).dCHI = nB * nC - nA * nD;
		}
		else
		{
			(*itorArr).dCHI = nA * nD - nB * nC;
		}
	}

	//对提取后的特征按CHI排序
	sort(vecFeatureArr.begin(), vecFeatureArr.end(), CompareCHI);

	//根据给定的比例值，提取一定的特征作为选取后的特征
	itorArr = vecFeatureArr.begin();
	int nArrNum = vecFeatureArr.size();
	for (int i = 0; i < nArrNum * fRatio; i++, itorArr++)
	{
		CCommentText::s_mapFeature.insert(pair<string, int>(itorArr->strWord, itorArr->nNumA + itorArr->nNumB));
	}
	CCommentText::s_nFeatureNum = nArrNum * fRatio;
}

//保存特征
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

//导入特征
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



//文本特征权值归一化处理
void NormalizedWeight(CCommentText** pCommentTextArr)
{
	vector<float> vecWeight;
	vector<float> vecSumWeight;
	vector<float>::iterator itorSum;
	vector<float>::iterator itor;
	float fTemp;
	int nTextNum = CCommentText::s_nTestNum;
	//计算特征权值和
	for (int i = 0; i < nTextNum; i++)
	{
		vecWeight = pCommentTextArr[i]->GetFeatureWeight();
		if (i == 0)
		{
			//第一次初始化空间
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
	//归一化特征权值
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

//按照libSVM特征格式保存特征权值到文件
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

	//SVM参数初始化,默认参数
	param.svm_type = C_SVC;
	param.kernel_type = RBF;
	param.degree = 3;
	param.gamma = 0;	// 1/num_features
	param.coef0 = 0;
	param.nu = 0.5;
	param.cache_size = 100;


	param.C = 1.0;//需调整的参数之一
	param.gamma = 0.5;//需调整的参数之一


	param.eps = 1e-3;
	param.p = 0.1;
	param.shrinking = 1;
	param.probability = 0;
	param.nr_weight = 0;
	param.weight_label = NULL;
	param.weight = NULL;
	svm_set_print_string_function(NULL);


	//SVM训练数据构造
	prob.l = nTextNum;
	prob.y = (double*)malloc(sizeof(double) * nTextNum);
	prob.x = (svm_node**)malloc(sizeof(svm_node*) * nTextNum);

	for (int i = 0; i < nTextNum; i++)
	{
		if (pCommentTextArr[i]->GetPolarity() == 'P')
		{
			prob.y[i] = 1;//褒义类别 1
		}
		else if (pCommentTextArr[i]->GetPolarity() == 'N')
		{
			prob.y[i] = 2;//贬义类别 -1
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

	//SVM参数以及训练数据检查
	const char* error_msg = svm_check_parameter(&prob, &param);
	if (error_msg)
	{
		printf("SVM ERROR: %s\n",error_msg);
		return;
	}

	//SVM训练
	model = svm_train(&prob, &param);
	if (svm_save_model(strModelFile.c_str(), model))
	{
		printf("SVM ERROR: Cannot Save Model File!\n");
	}

	//数据内存释放
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
	//导入模型
	if ((model = svm_load_model(strModelFile.c_str())) == 0)
	{
		printf("SVM ERROR: Cannot Load SVM Model!\n");
		return;
	}
	//模型检查
	if (svm_check_probability_model(model) != 0)
	{
		printf("SVM ERROR: Model Param Error!\n");
	}

	int nCorrectNum = 0;

	//依次构造测试数据，并输出结果
	for (int i = 0; i < nTextNum; i++)
	{
		//构造测试数据格式
		vecWeightFeature = pCommentTextArr[i]->GetFeatureWeight();
		itor = vecWeightFeature.begin();
		for (j = 0; itor != vecWeightFeature.end(); j++, itor++)
		{
			x[j].index = j + 1;
			x[j].value = (*itor);
		}
		x[j].index = -1;//结束标志

		//预测
		predict_label = svm_predict(model, x);

		if (fabs(predict_label - 1.0) < 0.001)
		{
			//预测为褒义
			if (pCommentTextArr[i]->GetPolarity() == 'P')
			{
				nCorrectNum++;
			}
			pCommentTextArr[i]->SetPolarity('P');
		}
		else
		{
			//预测为贬义
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

//保存情感预测结果到文件
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