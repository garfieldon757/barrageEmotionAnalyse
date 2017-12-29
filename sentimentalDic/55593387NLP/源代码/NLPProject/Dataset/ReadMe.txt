说明：
    这里使用的数据集与原先老师给定的数据集有一点点的区别，主要是由于把数据集按照XML的文件格式进行访问，所以会出现一些问题。具体如下：
    1.对于每个测试集，在文件头加入<review>标签，文件尾加入</review>标签。这是由于训练集和测试集XML格式不同，为了方便统一处理，故保持其一致。
    2.由于使用的分词处理模块为计算所的ICTCLAS开源系统，该系统存在对于book类别的训练集有一段文本无法正常分词，故将该文本段进行一点点的修改。
    该文本段位于CSC_book_train文件第3192-3194行。原始文本如下：
        1/ 错字挺多，感觉责编和译者没有把好出书前的最后审核关，而且行距太大，如果压缩一点，这本书估计不需要这么多页
        2/ 作者所引用的别人的文字绝大部分都是上世纪90年代的，甚至更早，21世纪的东西很少，而且不超过2002年，这样就不得不让人考虑作者近几年干什么了？别人的最新发现作者都没注意吗？
        3/ 如我标题所说，本书中讲的那些不仅Anita Woolfolk的〈教育心理学〉都囊括了，而且比他讲得更有实用价值。
        4/ 其他几本早几年翻译过来的〈儿童心理学〉也比本书写得更详细，看本书有种被作者愚弄的感觉，而看过其他早几年翻译过来的〈儿童心理学〉则有被作者尊重的感觉。
    ICTCLAS无法处理类似"1/ "、"2/ "这样的片段，故将其删除"/ "两个字符。更改后的文本如下：
        1错字挺多，感觉责编和译者没有把好出书前的最后审核关，而且行距太大，如果压缩一点，这本书估计不需要这么多页
        2作者所引用的别人的文字绝大部分都是上世纪90年代的，甚至更早，21世纪的东西很少，而且不超过2002年，这样就不得不让人考虑作者近几年干什么了？别人的最新发现作者都没注意吗？
        3如我标题所说，本书中讲的那些不仅Anita Woolfolk的〈教育心理学〉都囊括了，而且比他讲得更有实用价值。
        4其他几本早几年翻译过来的〈儿童心理学〉也比本书写得更详细，看本书有种被作者愚弄的感觉，而看过其他早几年翻译过来的〈儿童心理学〉则有被作者尊重的感觉。
    这样处理后，不会对提取的特征词照成影响，故不影响使用效果。


    dvd类别：去除该训练数据
    <item>
	<review_id>0016552</review_id>
	<summary>六区吉卜力作品10号</summary>
	<polarity>P</polarity>
	<text>纸封塑料盒包装，外封简体汉化，内封纯原版日文。
随碟赠送日本吉卜力工作室系列作品宣传册。
制作精美，配置优良，值得吉卜力爱好者们珍藏！
音轨：国语杜比2.0，日语DTS 5.1/全码1536Kbps，日语杜比2.0
字幕：简体中文（对照国语发音），简体中文（对照日语发音），日文，英文，字幕可隐藏可切换
容量：5.56 G
时长：1小时43分32秒
片基IFPI：X421</text>
	<category>dvd</category>
   </item>

<item>
<review_id>0036850</review_id>
<summary>品质一般</summary>
<polarity>N</polarity>
<text>画面清晰度一般，远没达到BD分辩率，音轨是2.0而不是5.1,所以只能选择退货了。不过，是出版商的问题，不是卓越的问题。卓越的包装和服务是没话说的，我一直最喜欢卓越，其次是京东。</text>
<category>dvd</category>
</item>


music类别：
<item>
<review_id>0184302</review_id>
<summary>..</summary>
<polarity>P</polarity>
<text>有签名的..........是用金色笔签的.........爱你........郭静</text>
<category>music</category>
</item>


<item>
<review_id>0181674</review_id>
<summary>赞！</summary>
<polarity>P</polarity>
<text>很喜欢《Silent All These Years》.....................
Years go by, will I still be waiting for somebody else to understand?
时光流逝，我还会等待吗？等待有个人了解我。
Years go by, if I’m stripped to my beauty and the orange clouds raining in my heads?
时光流逝，如果我美貌不再，我的世界也惨白一片。
Years go by, will I chock on my tears till finally there is nothing left?
时光流逝，我会哽住泪水，直到什么也不剩。</text>
<category>music</category>
</item>
    
<item>
<review_id>0183821</review_id>
<summary>卓越你很可笑</summary>
<polarity>N</polarity>
<text>卓越啊，卓越你太可笑了。。//
我们所有的亲都在你那买专辑，提高你的知名度，提高你的销量。
可你是怎么做的啊，假签名，可笑不可笑，我们不在乎有没签名，在乎你的态度..
请你记住，笔亲强大的，是团结的，如果这个假签名不给我们解决的，那么损失的是你们，卓越。
现在发货就算了，
总之以后没有任何一个喜欢周笔畅的人到你这再买东西，CD也好，书也罢...</text>
<category>music</category>
</item>