---
title: QQbot
auther: Creexile
date: 2025-01-05
lastMod: 2025-10-10
summary: ''
cover: ''
category: '工具'
draft: false
comments: false
sticky: 0
tags: []
---

# qqbot

**该文章已失效**

> 对于任何插件, qq都有封禁风险, 谨慎使用

采用的是 **LLOneBot + NTQQ +NoneBot2 + LiteLoaderQQNT**

协议实现[LLOneBot](https://llonebot.github.io/zh-CN/)
新版qq[NTQQ](https://im.qq.com/pcqq/index.shtml)
机器人本体[NoneBot](https://nonebot.dev/docs/quick-start)
插件加载器[LiteLoaderQQNT](https://liteloaderqqnt.github.io/)

> 协议实现和机器人本体都比较好替换, 比如[NapCatQQ](https://doc.napneko.icu/)之类的协议实现; 其他的机器人可以看任意教程中对接配置啥的

## 安装NoneBot

[NoneBot教程](https://nonebot.dev/docs/quick-start)

> LLOneBot 实现了 OneBot 11 以及 go-cqhttp 的大部分 API, 所以暂时只能用OneBot V11

1. 你的终端目前所在的路径就是生成机器人的路径, 确保你处于正确的路径下
2. 我没有使用pipx(虚拟环境)

在安装适配器, 即显示"要使用哪些适配器"中, 需要选择OneBot V11(OneBot V11协议), console可以不要, 如果想测试方便可以留着, 后面再删除

在教程的"尝试使用"发现可以正常运行的时候完成配置

## 安装LLOneBot

[LLOneBot教程](https://llonebot.github.io/zh-CN/guide/getting-started)

我是通过安装LiteLoaderQQNT作为脚本框架然后安装LLOneBot, 可以在机器人上线的时候继续唠嗑, 弊端也很明显, 要么这是本地机器人, 要么就是要登陆到云端服务器才能唠嗑

> 这都是没有小号导致的

有些协议的实现有一键包, 给你的QQNT自动安装LiteLoaderQQNT和对应协议; 还有一种是内置qq, 通过控制台控制, 扫码登录qq

反正最后进入设置, 左边存在LiteLoaderQQNT和LLOneBot两个选项就证明安装成功了

## 对接配置

### NoneBot

在bot的文件夹下存在`.env.prod`文件, 这个为配置文件, 常规配置如下(详细看NoneBot文档):

```bash
# NoneBot运行所使用的驱动器, 系统生成的就不要动
DRIVER=~fastapi
# 服务开启时的ip以及端口
HOST=127.0.0.1
PORT=8890
# 日志详细程度, 最好是 LOG_LEVEL=DEBUG
LOG_LEVEL=SUCCESS
# 等一下要用的token
ONEBOT_ACCESS_TOKEN=
# 最大消息长度限制
SHORT_MESSAGE_MAX_LENGTH=40
# 复杂指令识别, 比如whitelist.add等
COMMAND_START=["/"]
COMMAND_SEP=["."]
```

这里设置了开启ip和端口为`127.0.0.1:8890`, 现在来配置LLOneBot

### LLOneBot

基本其他的都可以关掉, 主要是OneBot协议要开正向和反向的WebSocket服务

正向WebSocket服务监听端口只要不占用即可

反向WebSocket监听地址为`ws://127.0.0.1:8890/onebot/v11/ws`, 只需要修改ip和端口对应前面的即可

最好设置Access token, 只要LLOneBot和NoneBot配置的token相同即可

如果你的NoneBot已经安装了echo且在console中测试echo没有问题, 可以在qq进行测试:

```bash
# 群聊
@bot /echo q
# 私聊
/echo m
```

## 其他

如果想要其他功能, 可以去NoneBot的插件商店下载安装; 带红×的就是目前无法适配使用的, 注意甄别

# 替代方式

不想配置那么多可以直接找LLOneBot的特供qq, 已经自带协议, 只需要配置NoneBot即可
