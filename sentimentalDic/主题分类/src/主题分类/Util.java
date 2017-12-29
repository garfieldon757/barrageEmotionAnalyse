package �������;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
//һ��Ĺ�����
public class Util{
	//����2��hashmap���� keyֵ��String����    valueֵ��Integer����
	//�洢����ͣ�ô��Լ�ͣ�ôʵ����
	public static HashMap<String, Integer> stopword_map=new HashMap<String, Integer>();
	public static HashMap<String, Integer> stopword_map2=new HashMap<String, Integer>();
	//�޲ι��캯��
	public Util() {
		
	}
	//���ļ�filename�е�����ȫ�����ص�stopword_map������
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
	//���ļ�filename�е�����ȫ�����ص�stopword_map2������
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
	���ļ�segfile���ļ�topic_sms�е�������ȡ������д���ļ�outmergefile��------û���õ����������
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

