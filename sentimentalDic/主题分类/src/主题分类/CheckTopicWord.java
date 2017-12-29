package 主题分类;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.Hashtable;
//校验短信是否满足某一主题
public class CheckTopicWord {
	//存储主题以及主题下出现的词和频率
	public static Hashtable<String,Hashtable> topic_map=new Hashtable<String, Hashtable>();
	/*
	 * 之前必须调用spssTopicWord方法
	 * level是要求出现几个话题词的下界,包括等于
	 * occur视为话题的出现次数下界
	 * 给一条短信segline用空格分开,再给一个主题topicname 
	 * 枚举短息的每个分词，如果这个分词属于该topicname下的词条且该词条的频率>=occur  则testlevel+1
	 * 如果testlevel>=level则返回true,表示短信和主题一致  否返回false不一致
	 */
	public static boolean checkTopic(String segline,String topicname,int level,int occur)
	{
		if(topic_map.containsKey(topicname)==false) 
			return false;//容器topic_map中没有主题统计信息，无法检测
		//得到topicname主题下词条以及频率
		Hashtable<String, Integer> t=topic_map.get(topicname);
		String ss[];
		ss=segline.split(" ");
		int testlevel=0;
		for(int i=0;i<ss.length;i++){
			if(t.containsKey(ss[i])==true&&t.get(ss[i])>=occur){
				testlevel++;
			}
		}
		if(testlevel>=level)
			return true;
		else 
			return false;
	}
	/*
	 * 将文件43123_seg_topic.txt中的主题和词条归一化存入topic_map容器中
	 * key值为:主题  value值为:主题下词条以及词条出现的频率
	 * 例如：晚上 一起 吃饭 &吃饭
       主题为:   吃饭
       关联值为:晚上   1
               一起   1
               吃饭   1
	 */ 
	public static void spssTopicWord(String filename) throws IOException
	{
		BufferedReader fin=new BufferedReader(new FileReader(filename));
		String temp;
		String spl[];
		String topic;
		//将stopword_role.txt文件中的停用词加载到hashmap容器中
		Util.loadStopWordMap2("D:\\JavaProject\\主题分类\\src\\test\\stopword_role.txt");
		while((temp=fin.readLine())!=null)//我 中午 喝酒 了 &吃饭
		{
			
			spl=temp.split(" ");
			topic=spl[spl.length-1];//&吃饭
			topic=topic.substring(1);//吃饭
			//如果topic_map容器中没有topic主题，则将topic主题插入topic_map容器中
			if(topic_map.containsKey(topic)==false)
			{
				Hashtable<String, Integer> topic_word_map=new Hashtable<String, Integer>();
				topic_map.put(topic,topic_word_map);
			}
			for(int i=0;i<spl.length-1;i++)
			{
				if(Util.stopword_map2.containsKey(spl[i])==true)//词条在stopword_role.txt文件中--是停用词过滤掉
					continue;
				//主题下的词条之前出现过，则频数+1
				if((topic_map.get(topic).containsKey(spl[i]))==true)
				{
					int t=(Integer)(topic_map.get(topic).get(spl[i]))+1;
					topic_map.get(topic).put(spl[i], t);
				}
				else//否则在该主题下 词条--1插入容器topic_map中
				{
					topic_map.get(topic).put(spl[i],1);
				}
					
			}
		}
		fin.close();
	}
}
