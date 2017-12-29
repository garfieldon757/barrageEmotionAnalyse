package 主题分类;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
//一般的工具类
public class Util{
	//定义2个hashmap容器 key值是String类型    value值是Integer类型
	//存储的是停用词以及停用词的序号
	public static HashMap<String, Integer> stopword_map=new HashMap<String, Integer>();
	public static HashMap<String, Integer> stopword_map2=new HashMap<String, Integer>();
	//无参构造函数
	public Util() {
		
	}
	//将文件filename中的数据全部加载到stopword_map容器中
	public static int loadStopWordMap(String filename) throws IOException
	{
			BufferedReader fin=new BufferedReader(new FileReader(filename));
			String t;
			int id=1;
			while((t=fin.readLine())!=null)
			{
				if(t.compareTo("")!=0)
				{
					stopword_map.put(t, id);
					id++;
				}
				
			}
			fin.close();
			return stopword_map.size();
	}
	//将文件filename中的数据全部加载到stopword_map2容器中
	public static int loadStopWordMap2(String filename) throws IOException
	{
			BufferedReader fin=new BufferedReader(new FileReader(filename));
			String t;
			int id=1;
			while((t=fin.readLine())!=null)
			{
				if(t.compareTo("")!=0)
				{
					stopword_map2.put(t, id);
					id++;
				}
				
			}
			fin.close();
			return stopword_map2.size();
	}
	/*
	将文件segfile和文件topic_sms中的主题提取出来，写入文件outmergefile中------没有用到过这个函数
	*/
	public void merge(String segfile,String topic_sms,String outmergefile) throws IOException
	{
		BufferedReader f1=new BufferedReader(new FileReader(segfile));
		BufferedReader f2=new BufferedReader(new FileReader(topic_sms));
		PrintWriter pout=new PrintWriter(outmergefile);
		String sms,seg,topic,writeline;
		while((seg=f1.readLine())!=null)
		{
			sms=f2.readLine();
			int pos=sms.indexOf("&");
			topic=sms.substring(pos);
			System.out.println("topic :"+topic);
			writeline=seg+topic;
			pout.write(writeline+"\n");
		}
		pout.close();
		f1.close();
		f2.close();
	}
}

