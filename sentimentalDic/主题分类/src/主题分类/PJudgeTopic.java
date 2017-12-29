package 主题分类;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;

import java.io.IOException;
import java.io.ObjectInputStream.GetField;

import java.text.DateFormat;
import java.util.Date;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Vector;
//主要类:用于判断话题
public class PJudgeTopic {
	/**
	 * @param args
	 * @throws IOException 
	 */
	//定义一个名为term_topic_pro_map容器    key值为String类型  value值为Vector<Pair<String,Float>>类型
	public static Hashtable<String, Vector<Pair<String, Float>>> term_topic_pro_map;
	//定义一个名为topic_term_fre容器        key值为String类型  value值为Integer类型
	public static Hashtable<String,Integer> topic_term_fre; //保存的是主题和在短信中出现的频率
	public static FileWriter logout;
	public static FileWriter fout;
	public double curmaxprobility;
	//校验推算出来的主题和短信内容是否一致
	public static CheckTopicWord check;
	//无参构造函数
	public PJudgeTopic() throws IOException{
		//#爱#
		//喜悦   0.1
		//笑     0.2
		//生气   0.3
		//关怀   0.4
		//悲     0.5
		term_topic_pro_map=new Hashtable<String, Vector<Pair<String,Float>>>();
		topic_term_fre=new Hashtable<String,Integer>();
		//日志文件
		logout=new FileWriter("run_sms_mageng_别删_test.log",true);//打开run_sms_mageng_别删_test.log文件
		fout=new FileWriter("run_sms_mageng_别删_test.out",true);//打开run_sms_mageng_别删_test.out文件
		//将stopword2.txt文件中的停用词加载到hashmap容器中
		Util.loadStopWordMap("D:\\JavaProject\\主题分类\\src\\test\\stopword2.txt");	
		/*加载判断词典,即语料库
		#爱#
                     喜悦  0.236066 
                     笑  0.144262
                     生气  0.1
                    关怀  0.057377
                    悲  0.052459 
		*/
		this.loadProbability("D:\\JavaProject\\主题分类\\src\\test\\term_topic_probability_tall.txt");
		//加载排查词典  
		//我 好 高兴 啊 &喜悦
		//晚上 一起 吃饭 &吃饭
		//将文件43123_seg_topic.txt中的主题和词条归一化存入topic_map容器中
		//key值为:主题  value值为:主题下词条以及词条出现的频率
		check.spssTopicWord("D:\\JavaProject\\主题分类\\src\\test\\43123_seg_topic.txt");
	}
    //加载判断词典  term_topic_probability_tall.txt中的数据全部按要求加载到term_topic_pro_map容器中
	public static int loadProbability(String filename) throws IOException
	{
		BufferedReader fi=new BufferedReader(new FileReader(filename));
		String tline;//得到文件中的一行
		String term="";//短信中出现的词语
		while((tline=fi.readLine())!=null)
		{
			if(tline.contains("#")==true)//这里处理的是词条--例如:#爱好#
			{
				String sp[]=tline.split("#");
				
				if (sp.length<2){//#爱好#  sp.length==2
					continue;
				}
				term=sp[1];//#爱好#   term=sp[1]==爱好
				if(Util.stopword_map.containsKey(term)==true) 
					continue;//如果词条"爱好"在停用词典中不加载到容器term_topic_pro_map中
				//如果词条不在term_topic_pro_map容器中，则将词条加载到容器中
				if(term_topic_pro_map.contains(term)==false)
				{
					Vector<Pair<String, Float>> topiclist=new Vector<Pair<String, Float>>();
					term_topic_pro_map.put(term,topiclist);
				}
			}
			else//处理  主题-概率   生气 0.1等等
			{
				if(tline.contains(" ")==true)
				{
					String topic;//存储主题
					String spp[]=tline.split(" ");
					if (spp.length<3) {
						continue;
					}
					topic=spp[0];
					if(spp[2]==null) continue;
					Float pro=Float.valueOf(spp[2]);
					Pair<String,Float> t=new Pair<String,Float>(topic,pro);
					/*将主题-概率加载映的词条下
					#爱#
                                                    喜悦  0.236066 
                                                     笑  0.144262
                                                    生气  0.1
                                                   关怀  0.057377
                                                    悲  0.052459 
                    
                    term_topic_pro_map容器中
                    key值为:      爱
                    value值为:    喜悦   0.236066
                                                                                           笑     0.144262
                                  ......
					*/
					term_topic_pro_map.get(term).addElement(t);
				}
			}
		}
		//至此文件term_topic_probability_tall.txt中的数据全部按要求加载到term_topic_pro_map容器中
		fi.close();
		return 1;
	}
	//将以空格符作为词间分隔符的短信计算出这条短信的主题--概率
	public Pair<String,Double> judge(String sms) throws IOException
	{
		String topic="";
		//保存短信所有词条对应的:  主题--概率
		Hashtable<String, Float> pro_map=new Hashtable<String, Float>();
		String split[]=sms.split(" ");//split[]保存短信经过空格符分割的字符串
		Vector<Pair<String, Float>> vtop;//保存词条所对应的 主题--概率
		for(int i=0;i<split.length;i++)//测试每个词的话题列表
		{
			
			if(!term_topic_pro_map.containsKey(split[i]))//短信进行中文分词后，词条不在term_topic_pro_map容器中
			{
			   continue;//也就是说，这个词没有对应的主题,也可以说这词不在文件term_topic_probability_tall中
			}
			System.out.println("find #"+split[i]+"#");
			//以追加的方式写入run_sms_mageng_别删_test.out文件中
			fout.append("find #"+split[i]+"#\n");
            //获得该词对应的主题概率列表
			vtop=term_topic_pro_map.get(split[i]);
			for(int j = 0; j < vtop.size(); j++) //遍历该词对应的话题概率表
			{
				if(topic_term_fre.containsKey(vtop.get(j).Key)==false)//如果主题vtop.get(j)不在topic_term_fre容器中
				{                                                      //则将主题插入topic_term_fre容器中并将出现的频率设置为1
					topic_term_fre.put(vtop.get(j).Key,1);
				}	
				else//否则，将主题以及主题对应的频率加1重新插入topic_term_fre容器中
				{
					int fre=topic_term_fre.get(vtop.get(j).Key);
					fre++;
					topic_term_fre.put(vtop.get(j).Key,fre);
				}
			    //如果主题vtop.get(j)不在pro_map容器中 则将主题--概率值插入容器中
				if(pro_map.containsKey(vtop.get(j).Key)==false)
				{
					pro_map.put(vtop.get(j).Key, vtop.get(j).Value);
				}
				else//否则，将对应的主题概率相加，重新插入容器中
				{
					Float pro=pro_map.get(vtop.get(j).Key)+vtop.get(j).Value;
					pro_map.put(vtop.get(j).Key, pro);//存入话题名，话题概率
				}
			}
		}
		if(pro_map.size()==0)
		{
			//一条短息没有出现任何的主题 返回空主题和O概率
			return new Pair("",0.0);
		}
		//打印一条短信所有的：主题--概率
		System.out.println("all: "+pro_map.toString()+"\n");
		//以追加的方式写入run_sms_mageng_别删_test.out文件中
		fout.append("all: "+pro_map.toString()+"\n");
		float max=0;//保存最大概率值
		String maxpos="";//保存最大概率值对应的主题
		int exchange=0;
		float avg;
		for(Iterator it=pro_map.keySet().iterator();it.hasNext();)
		{	
			avg=0;
			String	key=(String)it.next();//话题名称
			//打印主题--概率--出现的频率
			System.out.println("topic: "+key+"\t probability:"+pro_map.get(key)+"\tterm count: "+topic_term_fre.get(key));
			//求主题对应的平均概率
			avg=(pro_map.get(key)/topic_term_fre.get(key));
			if(max<avg)
			{
				max=avg;
				maxpos=key;
				exchange=1;
			}
			else if(max>avg)
				exchange=1;
		}
		//不符合要求的概率  返回空主题--0概率
		if(exchange==0&&pro_map.size()>1||max<=0.25)//最大概率<=0.25也不用返回了
		{
				curmaxprobility=0.0;
				return new Pair("",0.0);
		}
		else//符合要求的概率  返回主题--最大概率
		{
				System.out.println("max-probability topic: "+max);
				curmaxprobility=max;
				return new Pair(maxpos,max);
		}
	}
    //给定一条短信，得到一条短信的主题以及概率
	public Pair<String,Double> Pjudge(String sms_segementline) throws IOException
	{
		    topic_term_fre.clear();
			curmaxprobility=0.0;
			long count=0;
			Date now=new Date();
			String sms_segementlineorgin=sms_segementline.replace(" ","");//将空格替换，得到原始短信
			//得到短信的主题以及概率---这个并不是最终的结果，还需要下面的验证
			Pair<String,Double> res=this.judge(sms_segementline);
			String topic=res.Key;
			boolean fl=true;
			//短信中文分词中至少有2个分词在该主题下且这些分词的词频率还有大于3
			fl=this.check.checkTopic(sms_segementline, topic, 2, 3);
			if(fl==false&&topic.compareTo("")!=0&&curmaxprobility<=0.7)//判段的话题名称不合理，没通过此表验证
			{
				res.Key="";//topic 为空
			}
			if(topic.compareTo("")!=0&&(fl||curmaxprobility>0.7))//没有通过词表验证，但是概率值大约0.7照样输出
			{
				count++;
				System.out.println("短信："+sms_segementline+"     话题为： "+topic);
                //以追加的方式写入run_sms_mageng_别删_test.out文件中
				fout.append("短信："+sms_segementline+"     话题为： "+topic+"\n");
				//写入日志
				this.logout.append(sms_segementlineorgin+"&"+topic+"\t"+res.Value+"\n");
			}
			this.logout.flush();
			return  res;
	}
	public static void main(String[] args) throws IOException 
	{
		BufferedReader fin=new BufferedReader(new FileReader("D:\\JavaProject\\主题分类\\src\\test\\in.txt"));
		File file = new File("D:\\JavaProject\\主题分类\\src\\test\\out.txt");
        FileOutputStream ofs = new FileOutputStream(file);
		String strLine;
		while((strLine=fin.readLine())!=null)
		{
			if(strLine.compareTo("")!=0)
			{
				
				PJudgeTopic tp=	new PJudgeTopic();
				Pair<String,Double> topic =tp.Pjudge(strLine);//雨 好 大 了 ， 地上 积水 ， 鞋 都 透 了
				System.out.println("topic:"+topic.Key+"           probality:"+topic.Value);
				System.out.println("......................................");
				String result="topic:"+topic.Key+"           probality:"+topic.Value+"\n";
				ofs.write(result.getBytes());
			}
		}
		ofs.flush();
        ofs.close();
		fin.close();
	}
}
/*
 读文件:
 term_topic_probability_tall.txt   是马庚自己写的统计模型计算出来的
 43123_seg_topic.txt               利用孙蓉蓉的规则跑出来的数据  43123条短信和对应的主题  正确率98%
 stopword2.txt
 stopword_role.txt
 写文件:
 run_sms_mageng_别删_test.log
 run_sms_mageng_别删_test.out
 */
