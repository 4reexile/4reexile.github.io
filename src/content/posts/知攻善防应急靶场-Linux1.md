---
title: 知攻善防应急靶场-Linux1
author: Creexile
date: 2024-11-13 20:36:17
lastMod: 2025-04-10
summary: ''
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [应急响应]
---

# 应急响应靶机训练-Linux1

---

> 来源: 知攻善防公众号

## 背景和环境

小王急匆匆地找到小张，小王说"李哥，我dev服务器被黑了",快救救我！！

内容:

- 黑客的IP地址
- 遗留下的三个flag

账密:

- defend / defend
- root / defend

## 应急响应

### 查看历史命令

先查看两个用户各自的历史命令, 在root用户的历史命令中找到第一个flag

```bash
history
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241020220827.png)

### 查看开机启动项

```bash
cat /etc/rc.d/rc.local
```

在文件中找到了第二个flag: `flag{kfcvme50}`

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241020220909.png)

### redis日志分析

这里有redis服务, 我们去查看redis日志

```bash
cd /var/log/redis
cat redis.log
```

开启了记录, 且记录了连接情况以及IP, 应该是可以找到的

```bash
cat redis.log | grep Accepted
```

成功找到外来ip: 192.168.75.129

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241020222219.png)

### 查询登录成功的ip

```bash
grep "Accepted " /var/log/secure | awk '{print $11}' | sort | uniq -c | sort -nr | more
```

发现`192.168.75.129`通过sshd登录了靶机

### 配置文件

在redis.config中找到了最后的flag; 大概是直觉, 因为配置文件通常有服务账号密码, 甚至可以在配置文件中触发反弹shell

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241020224406.png)

### 未发现异常

```bash
# 进程
ps -ef
top
# 定时任务
crontab -l
# 服务
systemctl list-unit-files --type=service | grep enabled
```

## 结束

```
192.168.75.129
flag{thisismybaby}
flag{kfcvme50}
flag{P@ssW0rd_redis}
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241020224612.png)
