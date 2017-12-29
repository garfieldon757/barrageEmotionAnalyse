package 主题分类;


public class Pair<A,B>{
	public Pair(A key, B value){
		super();  // 调用父类构造函数,构造函数没有参数
		Key = key;
		Value = value;
	}
	public A Key;
	public B Value;
	public A getKey(){
		return Key;
	}
	public void setKey(A key){
		Key = key;
	}
	public B getValue(){
		return Value;
	}
	public void setValue(B value){
		Value = value;
	}
}
