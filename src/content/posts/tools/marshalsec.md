---
title: marshalsec
auther: Creexile
date: 2025-07-25 16:07:35
lastMod: 2025-07-25
summary: '解决Java版本切换问题的'
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: [Java]
---

参考文章

- [KALI安装JAVA8和切换JDK版本](https://blog.csdn.net/2301_78255681/article/details/147303620)

# 配置

## Java环境

首先是Java环境, kali一般只有java环境而没有javac环境

备份

```bash
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak
```

编辑源列表

```bash
sudo vim /etc/apt/sources.list
```

注释所有旧源, 然后粘个清华源进去

```text
deb http://mirrors.tuna.tsinghua.edu.cn/kali kali-rolling main non-free contrib
deb-src http://mirrors.tuna.tsinghua.edu.cn/kali kali-rolling main non-free contrib

# 这还有https版本的, 上下选一个就行了
deb https://mirrors.tuna.tsinghua.edu.cn/kali kali-rolling main non-free contrib
deb-src https://mirrors.tuna.tsinghua.edu.cn/kali kali-rolling main non-free contrib
```

然后更新软件包列表, 我就不更新其它了, 我怕kali爆了

```bash
sudo apt update
```

做到这里发现没有Java8的下载, 那就只能依靠手动配置了 [KALI安装JAVA8和切换JDK版本](https://blog.csdn.net/2301_78255681/article/details/147303620)

切换jdk版本, 输入对应数字切换jdk

```bash
sudo update-alternatives --config java
sudo update-alternatives --config javac
```

验证一下java和javac是否为同一个版本, 1.8

```bash
java -version
javac -version
```

## maven

下载maven

```bash
sudo apt install maven -y
```

验证

```bash
mvn -v
```

换源

```bash
sudo vim /usr/share/maven/conf/settings.xml
```

注释原来的部分

```
<mirror>
    <id>aliyunmaven</id>
    <mirrorOf>*</mirrorOf>
    <name>阿里云公共仓库</name>
    <url>https://maven.aliyun.com/repository/public</url>
</mirror>
<mirror>
    <id>huaweicloud</id>
    <mirrorOf>*</mirrorOf>
    <url>https://repo.huaweicloud.com/repository/maven/</url>
</mirror>
```

体验飞一般的感觉

## marshalsec

下载并编译

```bash
git clone https://github.com/mbechler/marshalsec.git

cd marshalsec

mvn clean package -DskipTests
```

> 还有个预编译的解决方法, 但是不是很信任第三方, 还是从源码编译

验证安装

```bash
java -cp marshalsec-0.0.3-SNAPSHOT-all.jar marshalsec.jndi.RMIRefServer -h
# 输出为 marshalsec.jndi.RMIRefServer<codebase_url#classname> [<port>]
```

至此安装成功
