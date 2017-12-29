各文件夹作用说明：
    FreeICTCLAS: 中科院中文分词处理系统接口（修改，添加字母数字剔除，停用词去除）
    LibSVM: SVM分类器开源库
    Data: 分词处理数据字典
    Dataset: 处理文本测试集与训练集
    Feature: 对训练集提取的特征文件
    Model: 利用SVM生成的模型文件
    Result: 分类结果文件
其他文件说明：
    Markup.h与Markup.cpp: 开源的xml文件处理接口
    CommentText.h与CommentText.cpp: 评论文本类，文本的主要处理对象，用于分词处理，计算权重等
    Processing.h与Processing.cpp: 通用处理接口，包括SVM训练，学习接口，特征选取，权值归一化等
