# 部署到云服务器指南

## 服务器信息
- 公网 IP：159.75.91.40
- SSH 端口：22
- 应用端口：3443
- 管理密钥：moneybook_admin_2026_secure_key

## 需要上传的文件清单
```
server.js
package.json
package-lock.json
config.js
api.js
ink-transition.js
ink-transition.css
ecosystem.config.js
index.html
add.html
accounts.html
admin.html
budget.html
categories.html
export.html
groups.html
group-detail.html
statistics.html
```

---

## 方法一：使用 SCP 命令上传（推荐）

在您的 Windows 电脑上打开 PowerShell 或 CMD，进入项目目录：

```powershell
cd d:\AI\记账\money
```

然后逐个上传文件，或者用打包的方式：

### 方式 A：逐个上传关键文件
```powershell
# 上传服务器文件
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" server.js root@159.75.91.40:/root/moneybook/
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" package.json root@159.75.91.40:/root/moneybook/
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" package-lock.json root@159.75.91.40:/root/moneybook/
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" ecosystem.config.js root@159.75.91.40:/root/moneybook/

# 上传前端文件
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" config.js root@159.75.91.40:/root/moneybook/
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" api.js root@159.75.91.40:/root/moneybook/
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" ink-transition.js root@159.75.91.40:/root/moneybook/
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" ink-transition.css root@159.75.91.40:/root/moneybook/
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" *.html root@159.75.91.40:/root/moneybook/
```

### 方式 B：先打包再上传（更简单）
```powershell
# 在项目目录下创建 zip 压缩包
Compress-Archive -Path * -DestinationPath moneybook.zip

# 上传压缩包
scp -i "C:\Users\l2535\Desktop\xunyi4_26.pem" moneybook.zip root@159.75.91.40:/root/
```

---

## 方法二：使用 SFTP 工具（图形界面）

如果不熟悉命令行，推荐使用以下工具之一：
1. **FileZilla** - 免费开源
2. **WinSCP** - Windows 用户友好
3. **MobaXterm** - 集成 SSH 和 SFTP

### 连接信息：
- 主机：159.75.91.40
- 端口：22
- 用户名：root
- 认证方式：使用密钥文件 `C:\Users\l2535\Desktop\xunyi4_26.pem`

---

## 服务器端部署步骤

### 1. SSH 连接服务器
```bash
ssh -i "C:\Users\l2535\Desktop\xunyi4_26.pem" root@159.75.91.40
```

### 2. 准备目录和文件
```bash
# 创建项目目录
mkdir -p /root/moneybook
cd /root/moneybook

# 如果用了 zip 包，先解压
cd /root
unzip moneybook.zip -d /root/moneybook
cd /root/moneybook
```

### 3. 安装 Node.js（如果还没安装）
```bash
# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node -v
npm -v
```

### 4. 安装项目依赖
```bash
cd /root/moneybook
npm install
```

### 5. 开放防火墙端口
```bash
firewall-cmd --zone=public --add-port=3443/tcp --permanent
firewall-cmd --reload
```

### 6. 使用 PM2 启动服务（推荐）
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 或直接启动
pm2 start server.js --name moneybook

# 查看状态
pm2 status
pm2 logs moneybook

# 设置开机自启
pm2 startup
pm2 save
```

### 7. 验证部署
在浏览器访问：
```
https://159.75.91.40:3443
```

---

## 常用 PM2 命令
```bash
pm2 status              # 查看运行状态
pm2 logs moneybook      # 查看日志
pm2 restart moneybook   # 重启服务
pm2 stop moneybook      # 停止服务
pm2 delete moneybook    # 删除服务
```

---

## 测试账号
您可以在首页创建新账号，或者使用管理后台：
- 管理后台：https://159.75.91.40:3443/admin.html
- 管理密钥：moneybook_admin_2026_secure_key
