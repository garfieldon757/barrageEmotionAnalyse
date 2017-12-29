1.in.txt：读取短信的文档
2.out.txt：输出最终结果的文档
3.term_topic_pro_map容器：
4.topic_term_fre容器：










程序过程：1.从in.txt中读取短信
          2.读取第一条不为空的短信
          3.将stopword2.txt中的全部数据加载到stopword_map容器中
          4.将term_topic_probability_tall.txt(即语料库)中的全部数据加载到term_topic_pro_map容器中
          5.将43123_seg_topic.txt中的主题和词语加载到topic_map容器中
          6.将stopword_role.txt中的全部数据加载到stopword_map2容器中
          7.