package �������;


public class Pair<A,B>{
	public Pair(A key, B value){
		super();  // ���ø��๹�캯��,���캯��û�в���
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
