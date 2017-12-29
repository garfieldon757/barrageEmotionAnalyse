package �������;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.Hashtable;
//У������Ƿ�����ĳһ����
public class CheckTopicWord {
	//�洢�����Լ������³��ֵĴʺ�Ƶ��
	public static Hashtable<String,Hashtable> topic_map=new Hashtable<String, Hashtable>();
	/*
	 * ֮ǰ�������spssTopicWord����
	 * level��Ҫ����ּ�������ʵ��½�,��������
	 * occur��Ϊ����ĳ��ִ����½�
	 * ��һ������segline�ÿո�ֿ�,�ٸ�һ������topicname 
	 * ö�ٶ�Ϣ��ÿ���ִʣ��������ִ����ڸ�topicname�µĴ����Ҹô�����Ƶ��>=occur  ��testlevel+1
	 * ���testlevel>=level�򷵻�true,��ʾ���ź�����һ��  �񷵻�false��һ��
	 */
	public static boolean checkTopic(String segline,String topicname,int level,int occur)
	{
		if(topic_map.containsKey(topicname)==false) 
			return false;//����topic_map��û������ͳ����Ϣ���޷����
		//�õ�topicname�����´����Լ�Ƶ��
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
	 * ���ļ�43123_seg_topic.txt�е�����ʹ�����һ������topic_map������
	 * keyֵΪ:����  valueֵΪ:�����´����Լ��������ֵ�Ƶ��
	 * ���磺���� һ�� �Է� &�Է�
       ����Ϊ:   �Է�
       ����ֵΪ:����   1
               һ��   1
               �Է�   1
	 */ 
	public static void spssTopicWord(String filename) throws IOException
	{
		BufferedReader fin=new BufferedReader(new FileReader(filename));
		String temp;
		String spl[];
		String topic;
		//��stopword_role.txt�ļ��е�ͣ�ôʼ��ص�hashmap������
		Util.loadStopWordMap2("D:\\JavaProject\\�������\\src\\test\\stopword_role.txt");
		while((temp=fin.readLine())!=null)//�� ���� �Ⱦ� �� &�Է�
		{
			
			spl=temp.split(" ");
			topic=spl[spl.length-1];//&�Է�
			topic=topic.substring(1);//�Է�
			//���topic_map������û��topic���⣬��topic�������topic_map������
			if(topic_map.containsKey(topic)==false)
			{
				Hashtable<String, Integer> topic_word_map=new Hashtable<String, Integer>();
				topic_map.put(topic,topic_word_map);
			}
			for(int i=0;i<spl.length-1;i++)
			{
				if(Util.stopword_map2.containsKey(spl[i])==true)//������stopword_role.txt�ļ���--��ͣ�ôʹ��˵�
					continue;
				//�����µĴ���֮ǰ���ֹ�����Ƶ��+1
				if((topic_map.get(topic).containsKey(spl[i]))==true)
				{
					int t=(Integer)(topic_map.get(topic).get(spl[i]))+1;
					topic_map.get(topic).put(spl[i], t);
				}
				else//�����ڸ������� ����--1��������topic_map��
				{
					topic_map.get(topic).put(spl[i],1);
				}
					
			}
		}
		fin.close();
	}
}
