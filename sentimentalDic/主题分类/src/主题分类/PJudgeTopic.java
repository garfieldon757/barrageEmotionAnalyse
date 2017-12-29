package �������;

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
//��Ҫ��:�����жϻ���
public class PJudgeTopic {
	/**
	 * @param args
	 * @throws IOException 
	 */
	//����һ����Ϊterm_topic_pro_map����    keyֵΪString����  valueֵΪVector<Pair<String,Float>>����
	public static Hashtable<String, Vector<Pair<String, Float>>> term_topic_pro_map;
	//����һ����Ϊtopic_term_fre����        keyֵΪString����  valueֵΪInteger����
	public static Hashtable<String,Integer> topic_term_fre; //�������������ڶ����г��ֵ�Ƶ��
	public static FileWriter logout;
	public static FileWriter fout;
	public double curmaxprobility;
	//У���������������Ͷ��������Ƿ�һ��
	public static CheckTopicWord check;
	//�޲ι��캯��
	public PJudgeTopic() throws IOException{
		//#��#
		//ϲ��   0.1
		//Ц     0.2
		//����   0.3
		//�ػ�   0.4
		//��     0.5
		term_topic_pro_map=new Hashtable<String, Vector<Pair<String,Float>>>();
		topic_term_fre=new Hashtable<String,Integer>();
		//��־�ļ�
		logout=new FileWriter("run_sms_mageng_��ɾ_test.log",true);//��run_sms_mageng_��ɾ_test.log�ļ�
		fout=new FileWriter("run_sms_mageng_��ɾ_test.out",true);//��run_sms_mageng_��ɾ_test.out�ļ�
		//��stopword2.txt�ļ��е�ͣ�ôʼ��ص�hashmap������
		Util.loadStopWordMap("D:\\JavaProject\\�������\\src\\test\\stopword2.txt");	
		/*�����жϴʵ�,�����Ͽ�
		#��#
                     ϲ��  0.236066 
                     Ц  0.144262
                     ����  0.1
                    �ػ�  0.057377
                    ��  0.052459 
		*/
		this.loadProbability("D:\\JavaProject\\�������\\src\\test\\term_topic_probability_tall.txt");
		//�����Ų�ʵ�  
		//�� �� ���� �� &ϲ��
		//���� һ�� �Է� &�Է�
		//���ļ�43123_seg_topic.txt�е�����ʹ�����һ������topic_map������
		//keyֵΪ:����  valueֵΪ:�����´����Լ��������ֵ�Ƶ��
		check.spssTopicWord("D:\\JavaProject\\�������\\src\\test\\43123_seg_topic.txt");
	}
    //�����жϴʵ�  term_topic_probability_tall.txt�е�����ȫ����Ҫ����ص�term_topic_pro_map������
	public static int loadProbability(String filename) throws IOException
	{
		BufferedReader fi=new BufferedReader(new FileReader(filename));
		String tline;//�õ��ļ��е�һ��
		String term="";//�����г��ֵĴ���
		while((tline=fi.readLine())!=null)
		{
			if(tline.contains("#")==true)//���ﴦ����Ǵ���--����:#����#
			{
				String sp[]=tline.split("#");
				
				if (sp.length<2){//#����#  sp.length==2
					continue;
				}
				term=sp[1];//#����#   term=sp[1]==����
				if(Util.stopword_map.containsKey(term)==true) 
					continue;//�������"����"��ͣ�ôʵ��в����ص�����term_topic_pro_map��
				//�����������term_topic_pro_map�����У��򽫴������ص�������
				if(term_topic_pro_map.contains(term)==false)
				{
					Vector<Pair<String, Float>> topiclist=new Vector<Pair<String, Float>>();
					term_topic_pro_map.put(term,topiclist);
				}
			}
			else//����  ����-����   ���� 0.1�ȵ�
			{
				if(tline.contains(" ")==true)
				{
					String topic;//�洢����
					String spp[]=tline.split(" ");
					if (spp.length<3) {
						continue;
					}
					topic=spp[0];
					if(spp[2]==null) continue;
					Float pro=Float.valueOf(spp[2]);
					Pair<String,Float> t=new Pair<String,Float>(topic,pro);
					/*������-���ʼ���ӳ�Ĵ�����
					#��#
                                                    ϲ��  0.236066 
                                                     Ц  0.144262
                                                    ����  0.1
                                                   �ػ�  0.057377
                                                    ��  0.052459 
                    
                    term_topic_pro_map������
                    keyֵΪ:      ��
                    valueֵΪ:    ϲ��   0.236066
                                                                                           Ц     0.144262
                                  ......
					*/
					term_topic_pro_map.get(term).addElement(t);
				}
			}
		}
		//�����ļ�term_topic_probability_tall.txt�е�����ȫ����Ҫ����ص�term_topic_pro_map������
		fi.close();
		return 1;
	}
	//���Կո����Ϊ�ʼ�ָ����Ķ��ż�����������ŵ�����--����
	public Pair<String,Double> judge(String sms) throws IOException
	{
		String topic="";
		//����������д�����Ӧ��:  ����--����
		Hashtable<String, Float> pro_map=new Hashtable<String, Float>();
		String split[]=sms.split(" ");//split[]������ž����ո���ָ���ַ���
		Vector<Pair<String, Float>> vtop;//�����������Ӧ�� ����--����
		for(int i=0;i<split.length;i++)//����ÿ���ʵĻ����б�
		{
			
			if(!term_topic_pro_map.containsKey(split[i]))//���Ž������ķִʺ󣬴�������term_topic_pro_map������
			{
			   continue;//Ҳ����˵�������û�ж�Ӧ������,Ҳ����˵��ʲ����ļ�term_topic_probability_tall��
			}
			System.out.println("find #"+split[i]+"#");
			//��׷�ӵķ�ʽд��run_sms_mageng_��ɾ_test.out�ļ���
			fout.append("find #"+split[i]+"#\n");
            //��øôʶ�Ӧ����������б�
			vtop=term_topic_pro_map.get(split[i]);
			for(int j = 0; j < vtop.size(); j++) //�����ôʶ�Ӧ�Ļ�����ʱ�
			{
				if(topic_term_fre.containsKey(vtop.get(j).Key)==false)//�������vtop.get(j)����topic_term_fre������
				{                                                      //���������topic_term_fre�����в������ֵ�Ƶ������Ϊ1
					topic_term_fre.put(vtop.get(j).Key,1);
				}	
				else//���򣬽������Լ������Ӧ��Ƶ�ʼ�1���²���topic_term_fre������
				{
					int fre=topic_term_fre.get(vtop.get(j).Key);
					fre++;
					topic_term_fre.put(vtop.get(j).Key,fre);
				}
			    //�������vtop.get(j)����pro_map������ ������--����ֵ����������
				if(pro_map.containsKey(vtop.get(j).Key)==false)
				{
					pro_map.put(vtop.get(j).Key, vtop.get(j).Value);
				}
				else//���򣬽���Ӧ�����������ӣ����²���������
				{
					Float pro=pro_map.get(vtop.get(j).Key)+vtop.get(j).Value;
					pro_map.put(vtop.get(j).Key, pro);//���뻰�������������
				}
			}
		}
		if(pro_map.size()==0)
		{
			//һ����Ϣû�г����κε����� ���ؿ������O����
			return new Pair("",0.0);
		}
		//��ӡһ���������еģ�����--����
		System.out.println("all: "+pro_map.toString()+"\n");
		//��׷�ӵķ�ʽд��run_sms_mageng_��ɾ_test.out�ļ���
		fout.append("all: "+pro_map.toString()+"\n");
		float max=0;//����������ֵ
		String maxpos="";//����������ֵ��Ӧ������
		int exchange=0;
		float avg;
		for(Iterator it=pro_map.keySet().iterator();it.hasNext();)
		{	
			avg=0;
			String	key=(String)it.next();//��������
			//��ӡ����--����--���ֵ�Ƶ��
			System.out.println("topic: "+key+"\t probability:"+pro_map.get(key)+"\tterm count: "+topic_term_fre.get(key));
			//�������Ӧ��ƽ������
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
		//������Ҫ��ĸ���  ���ؿ�����--0����
		if(exchange==0&&pro_map.size()>1||max<=0.25)//������<=0.25Ҳ���÷�����
		{
				curmaxprobility=0.0;
				return new Pair("",0.0);
		}
		else//����Ҫ��ĸ���  ��������--������
		{
				System.out.println("max-probability topic: "+max);
				curmaxprobility=max;
				return new Pair(maxpos,max);
		}
	}
    //����һ�����ţ��õ�һ�����ŵ������Լ�����
	public Pair<String,Double> Pjudge(String sms_segementline) throws IOException
	{
		    topic_term_fre.clear();
			curmaxprobility=0.0;
			long count=0;
			Date now=new Date();
			String sms_segementlineorgin=sms_segementline.replace(" ","");//���ո��滻���õ�ԭʼ����
			//�õ����ŵ������Լ�����---������������յĽ��������Ҫ�������֤
			Pair<String,Double> res=this.judge(sms_segementline);
			String topic=res.Key;
			boolean fl=true;
			//�������ķִ���������2���ִ��ڸ�����������Щ�ִʵĴ�Ƶ�ʻ��д���3
			fl=this.check.checkTopic(sms_segementline, topic, 2, 3);
			if(fl==false&&topic.compareTo("")!=0&&curmaxprobility<=0.7)//�жεĻ������Ʋ�����ûͨ���˱���֤
			{
				res.Key="";//topic Ϊ��
			}
			if(topic.compareTo("")!=0&&(fl||curmaxprobility>0.7))//û��ͨ���ʱ���֤�����Ǹ���ֵ��Լ0.7�������
			{
				count++;
				System.out.println("���ţ�"+sms_segementline+"     ����Ϊ�� "+topic);
                //��׷�ӵķ�ʽд��run_sms_mageng_��ɾ_test.out�ļ���
				fout.append("���ţ�"+sms_segementline+"     ����Ϊ�� "+topic+"\n");
				//д����־
				this.logout.append(sms_segementlineorgin+"&"+topic+"\t"+res.Value+"\n");
			}
			this.logout.flush();
			return  res;
	}
	public static void main(String[] args) throws IOException 
	{
		BufferedReader fin=new BufferedReader(new FileReader("D:\\JavaProject\\�������\\src\\test\\in.txt"));
		File file = new File("D:\\JavaProject\\�������\\src\\test\\out.txt");
        FileOutputStream ofs = new FileOutputStream(file);
		String strLine;
		while((strLine=fin.readLine())!=null)
		{
			if(strLine.compareTo("")!=0)
			{
				
				PJudgeTopic tp=	new PJudgeTopic();
				Pair<String,Double> topic =tp.Pjudge(strLine);//�� �� �� �� �� ���� ��ˮ �� Ь �� ͸ ��
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
 ���ļ�:
 term_topic_probability_tall.txt   ������Լ�д��ͳ��ģ�ͼ��������
 43123_seg_topic.txt               ���������صĹ����ܳ���������  43123�����źͶ�Ӧ������  ��ȷ��98%
 stopword2.txt
 stopword_role.txt
 д�ļ�:
 run_sms_mageng_��ɾ_test.log
 run_sms_mageng_��ɾ_test.out
 */
