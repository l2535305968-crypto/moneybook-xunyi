# 💰 记账程序 - 项目规格说明书

## 1. 项目概述

**项目名称：** MoneyBook 智能记账系统
**项目类型：** 前后端分离的Web应用
**核心功能：** 支持手动记账、微信/支付宝账单识别、多账户管理、预算规划、统计分析和数据导出的完整记账解决方案
**目标用户：** 个人用户、家庭用户、小微企业

---

## 2. 技术架构

### 后端
- **运行环境：** Node.js
- **框架：** Express.js
- **数据存储：** JSON文件持久化
- **端口：** 3000

### 前端
- **页面类型：** 纯HTML/CSS/JavaScript单页应用
- **图表库：** Chart.js
- **二维码：** qrcode.js
- **日期选择：** flatpickr

---

## 3. 功能模块

### 3.1 账户识别系统
- 通过URL参数或LocalStorage识别账户ID
- 账户ID格式：`acc_` 前缀 + 8位随机字符
- 新用户自动创建账户
- 账户数据隔离，互不访问

### 3.2 基础记账功能

#### 手动记账
- 金额输入（支持小数）
- 收支类型切换（收入/支出）
- 分类选择（下拉菜单）
- 账户选择
- 日期时间选择
- 备注说明

#### 微信/支付宝账单识别
- 支持粘贴账单文本
- 自动识别金额、日期、交易对象
- 智能分类建议
- 收入/支出自动判断

### 3.3 分类管理
- 预设分类：餐饮、交通、购物、娱乐、居住、医疗、教育、工资、理财、其他
- 支持自定义添加分类
- 分类图标和颜色设置
- 收入/支出分类区分

### 3.4 多账户管理
- 账户类型：现金、银行卡、信用卡、支付宝、微信钱包
- 账户余额管理
- 账户间转账
- 账户状态（启用/禁用）

### 3.5 记账日历
- 月视图日历展示
- 每日收支金额标注
- 点击日期查看当天明细
- 快速添加记账

### 3.6 预算与规划
- 月度预算设置（总预算）
- 分类预算设置
- 预算进度可视化
- 超支提醒

### 3.7 统计与分析
- 支出构成饼图
- 收入支出对比柱状图
- 趋势折线图（按月）
- 分类统计明细
- 时间范围筛选（本周/本月/本年/自定义）

### 3.8 数据导出
- JSON格式导出
- CSV格式导出
- 按时间范围筛选导出
- 按账户筛选导出

---

## 4. 数据结构

### 账户 (Account)
```json
{
  "id": "acc_xxxxxxxx",
  "name": "主账户",
  "type": "cash|card|credit|alipay|wechat",
  "balance": 0.00,
  "createTime": "ISO时间",
  "status": "active|disabled"
}
```

### 分类 (Category)
```json
{
  "id": "cat_xxxxxxxx",
  "name": "餐饮",
  "icon": "🍜",
  "color": "#FF6B6B",
  "type": "expense|income",
  "custom": false
}
```

### 记账记录 (Record)
```json
{
  "id": "rec_xxxxxxxx",
  "accountId": "acc_xxxxxxxx",
  "categoryId": "cat_xxxxxxxx",
  "amount": 100.00,
  "type": "income|expense",
  "date": "ISO时间",
  "remark": "备注",
  "source": "manual|wechat|alipay",
  "createTime": "ISO时间"
}
```

### 预算 (Budget)
```json
{
  "id": "bud_xxxxxxxx",
  "month": "2026-04",
  "categoryId": "cat_xxxxxxxx|null",
  "amount": 5000.00,
  "createTime": "ISO时间"
}
```

---

## 5. 页面结构

### index.html - 主页面
- 顶部：账户切换、导航菜单
- 中部：日历视图 + 快速记账
- 底部：最近记账记录列表

### add.html - 添加记账
- 记账表单
- 账单识别区域
- 分类选择网格

### accounts.html - 账户管理
- 账户列表
- 添加账户表单
- 账户详情/编辑

### categories.html - 分类管理
- 分类列表
- 添加/编辑分类

### budget.html - 预算管理
- 预算设置表单
- 预算进度展示

### statistics.html - 统计分析
- 图表区域
- 筛选控件
- 数据表格

### export.html - 数据导出
- 导出选项
- 下载按钮

---

## 6. 账户ID识别机制

### URL参数方式
```
http://domain/index.html?aid=acc_xxxxxxxx
```

### LocalStorage方式
- 首次访问自动生成账户ID
- 保存到LocalStorage
- 下次访问自动读取

### 管理员功能
- 管理员密钥访问admin.html
- 可查看所有账户数据
- 账户余额调整
- 数据管理

---

## 7. 安全机制

- 账户数据隔离（每个账户ID独立数据）
- 管理员密钥保护管理功能
- 无跨账户数据访问

---

## 8. 验收标准

- [ ] 账户ID自动生成并持久化
- [ ] 支持手动添加记账记录
- [ ] 支持粘贴识别微信/支付宝账单
- [ ] 分类增删改查
- [ ] 多账户增删改查
- [ ] 日历视图显示记账情况
- [ ] 预算设置和进度展示
- [ ] 统计图表正确显示
- [ ] JSON/CSV格式导出功能
- [ ] 响应式布局，支持手机访问

---

## 9. 部署说明

### 方案一：后端 + 前端一起部署

```bash
# 安装依赖
npm install

# 启动服务器
node server.js
# 访问 http://localhost:3000
```

### 方案二：Netlify 静态前端 + 远程后端

1. **后端部署**（需要公网服务器）
   - 将 `server.js` 部署到你的服务器
   - 启动服务：`node server.js`
   - 后端地址：`http://your-server:3000`

2. **前端部署到 Netlify**
   - 将以下文件上传到 Netlify：
     - `index.html`
     - `add.html`
     - `accounts.html`
     - `categories.html`
     - `budget.html`
     - `statistics.html`
     - `export.html`
     - `admin.html`
     - `config.js`
     - `api.js`

3. **通过 URL 参数连接后端**
   ```
   https://your-netlify-site.netlify.app/?server=your-server&port=3000
   ```
   或使用完整 API 地址：
   ```
   https://your-netlify-site.netlify.app/?api=http://your-server:3000
   ```

### 分享链接格式

分享给其他用户时，可以指定后端服务器：
```
http://your-netlify-site.netlify.app/?server=your-server&port=3000&aid=acc_xxxxxxxx
```

参数说明：
| 参数 | 说明 | 示例 |
|------|------|------|
| `server` | 后端服务器域名或IP | `api.example.com` |
| `port` | 后端端口 | `3000` |
| `https` | 是否使用HTTPS | `true` |
| `api` | 完整API地址 | `http://api.example.com:3000` |
| `aid` | 指定账户ID | `acc_xxxxxxxx` |

---

## 10. 管理员

**管理员密钥：** `moneybook_admin_2026_secure_key`

**访问管理后台：** `/admin.html`

---

## 11. 文件结构

```
money/
├── server.js          # 后端服务器 (Node.js)
├── package.json       # 配置文件
├── config.js          # 前端配置（API地址等）
├── api.js             # 前端API封装
├── data/              # 数据存储目录
├── index.html         # 首页
├── add.html           # 记账页面
├── accounts.html      # 账户管理
├── categories.html    # 分类管理
├── budget.html        # 预算管理
├── statistics.html    # 统计分析
├── export.html        # 数据导出
└── admin.html         # 管理后台
```
