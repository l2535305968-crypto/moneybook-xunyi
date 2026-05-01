const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3443;
const ADMIN_KEY = 'moneybook_admin_2026_secure_key';

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const GROUP_DIR = path.join(__dirname, 'data', 'groups');
if (!fs.existsSync(GROUP_DIR)) fs.mkdirSync(GROUP_DIR, { recursive: true });

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/account', (req, res) => {
    const { name } = req.body;
    const id = 'acc_' + Math.random().toString(36).substr(2, 8);
    
    const account = {
        id,
        name,
        accounts: [
            { id: 'acc_' + Math.random().toString(36).substr(2, 8), name: '现金', type: 'cash', balance: 0, createTime: new Date().toISOString(), status: 'active' },
            { id: 'acc_' + Math.random().toString(36).substr(2, 8), name: '微信', type: 'wechat', balance: 0, createTime: new Date().toISOString(), status: 'active' },
            { id: 'acc_' + Math.random().toString(36).substr(2, 8), name: '支付宝', type: 'alipay', balance: 0, createTime: new Date().toISOString(), status: 'active' }
        ],
        categories: [
            { id: 'cat_food', name: '餐饮', icon: '🍜', color: '#FF6B6B', type: 'expense', custom: false },
            { id: 'cat_trans', name: '交通', icon: '🚗', color: '#4ECDC4', type: 'expense', custom: false },
            { id: 'cat_shop', name: '购物', icon: '🛒', color: '#45B7D1', type: 'expense', custom: false },
            { id: 'cat_entertain', name: '娱乐', icon: '🎮', color: '#96CEB4', type: 'expense', custom: false },
            { id: 'cat_living', name: '居住', icon: '🏠', color: '#DDA0DD', type: 'expense', custom: false },
            { id: 'cat_medical', name: '医疗', icon: '💊', color: '#FFB6C1', type: 'expense', custom: false },
            { id: 'cat_edu', name: '教育', icon: '📚', color: '#87CEEB', type: 'expense', custom: false },
            { id: 'cat_salary', name: '工资', icon: '💰', color: '#90EE90', type: 'income', custom: false },
            { id: 'cat_invest', name: '理财', icon: '📈', color: '#FFD700', type: 'income', custom: false },
            { id: 'cat_other', name: '其他', icon: '📦', color: '#D3D3D3', type: 'expense', custom: false }
        ],
        records: [],
        budgets: [],
        createTime: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join(DATA_DIR, `${id}.json`), JSON.stringify(account, null, 2));
    res.json(account);
});

app.get('/api/account/find', (req, res) => {
    const searchName = req.query.name;
    if (!searchName) {
        return res.status(400).json({ error: '请提供账户名称' });
    }
    
    const files = fs.readdirSync(DATA_DIR);
    for (const file of files) {
        if (file.startsWith('acc_') && file.endsWith('.json')) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
                if (data.name && data.name === searchName) {
                    return res.json({ id: data.id, name: data.name });
                }
            } catch (e) {}
        }
    }
    
    res.status(404).json({ error: '未找到账户' });
});

app.get('/api/account/:id', (req, res) => {
    const file = path.join(DATA_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
    res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
});

app.post('/api/account/:id/record', (req, res) => {
    const file = path.join(DATA_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
    
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const record = {
        id: 'rec_' + Math.random().toString(36).substr(2, 8),
        ...req.body,
        createTime: new Date().toISOString()
    };
    
    const account = data.accounts.find(a => a.id === record.accountId);
    if (account) {
        if (record.type === 'expense') {
            account.balance -= parseFloat(record.amount);
        } else {
            account.balance += parseFloat(record.amount);
        }
    }
    
    data.records.push(record);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    res.json(record);
});

app.delete('/api/account/:id/record/:recordId', (req, res) => {
    const file = path.join(DATA_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
    
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const record = data.records.find(r => r.id === req.params.recordId);
    
    if (record) {
        const account = data.accounts.find(a => a.id === record.accountId);
        if (account) {
            if (record.type === 'expense') {
                account.balance += parseFloat(record.amount);
            } else {
                account.balance -= parseFloat(record.amount);
            }
        }
        data.records = data.records.filter(r => r.id !== req.params.recordId);
    }
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

app.get('/api/admin/accounts', (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }
    
    const accounts = [];
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(file => {
        if (file.endsWith('.json') && !file.startsWith('group_')) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
                const totalBalance = data.accounts ? data.accounts.reduce((sum, a) => sum + a.balance, 0) : 0;
                accounts.push({
                    id: data.id,
                    name: data.name,
                    accountCount: data.accounts ? data.accounts.length : 0,
                    recordCount: data.records ? data.records.length : 0,
                    totalBalance,
                    createTime: data.createTime
                });
            } catch (e) {}
        }
    });
    res.json(accounts);
});

app.get('/api/admin/account/:id', (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }
    
    const file = path.join(DATA_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
    res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
});

app.post('/api/admin/adjust-balance', (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }
    
    const { accountId, targetAccountId, adjustment } = req.body;
    const file = path.join(DATA_DIR, `${accountId}.json`);
    
    if (!fs.existsSync(file)) {
        return res.status(404).json({ error: '账户不存在' });
    }
    
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const targetAccount = data.accounts.find(a => a.id === targetAccountId);
    
    if (targetAccount) {
        targetAccount.balance += parseFloat(adjustment);
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: '目标账户不存在' });
    }
});

app.post('/api/admin/rename-account', (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }

    const { accountId, newName } = req.body;
    const dataFile = path.join(DATA_DIR, `${accountId}.json`);

    if (!fs.existsSync(dataFile)) {
        return res.status(404).json({ error: '账户不存在' });
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    data.name = newName;
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    res.json({ success: true });
});

app.post('/api/admin/delete-account', (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }

    const { accountId } = req.body;
    const dataFile = path.join(DATA_DIR, `${accountId}.json`);

    if (!fs.existsSync(dataFile)) {
        return res.status(404).json({ error: '账户不存在' });
    }

    fs.unlinkSync(dataFile);
    res.json({ success: true });
});

app.post('/api/admin/reset-account', (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }

    const { accountId } = req.body;
    const dataFile = path.join(DATA_DIR, `${accountId}.json`);

    if (!fs.existsSync(dataFile)) {
        return res.status(404).json({ error: '账户不存在' });
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    data.accounts.forEach(acc => {
        acc.balance = 0;
    });
    data.records = [];
    data.budgets = [];
    
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

app.post('/api/groups/create', (req, res) => {
    const { name, creatorId, creatorName } = req.body;
    const groupId = 'group_' + Math.random().toString(36).substr(2, 8);
    
    const group = {
        id: groupId,
        name,
        creatorId,
        members: [{
            accountId: creatorId,
            name: creatorName,
            role: 'admin',
            joinTime: new Date().toISOString()
        }],
        accounts: [{
            id: 'gacc_' + Math.random().toString(36).substr(2, 8),
            name: '公共账户',
            type: 'cash',
            balance: 0
        }],
        categories: [
            { id: 'cat_food', name: '餐饮', icon: '🍜', color: '#FF6B6B', type: 'expense', custom: false },
            { id: 'cat_trans', name: '交通', icon: '🚗', color: '#4ECDC4', type: 'expense', custom: false },
            { id: 'cat_shop', name: '购物', icon: '🛒', color: '#45B7D1', type: 'expense', custom: false },
            { id: 'cat_entertain', name: '娱乐', icon: '🎮', color: '#96CEB4', type: 'expense', custom: false },
            { id: 'cat_living', name: '居住', icon: '🏠', color: '#DDA0DD', type: 'expense', custom: false },
            { id: 'cat_medical', name: '医疗', icon: '💊', color: '#FFB6C1', type: 'expense', custom: false },
            { id: 'cat_edu', name: '教育', icon: '📚', color: '#87CEEB', type: 'expense', custom: false },
            { id: 'cat_salary', name: '工资', icon: '💰', color: '#90EE90', type: 'income', custom: false },
            { id: 'cat_invest', name: '理财', icon: '📈', color: '#FFD700', type: 'income', custom: false },
            { id: 'cat_other', name: '其他', icon: '📦', color: '#D3D3D3', type: 'expense', custom: false }
        ],
        records: [],
        createTime: new Date().toISOString()
    };

    fs.writeFileSync(path.join(GROUP_DIR, `${groupId}.json`), JSON.stringify(group, null, 2));
    res.json(group);
});

app.post('/api/groups/:groupId/categories', (req, res) => {
    const groupFile = path.join(GROUP_DIR, `${req.params.groupId}.json`);
    if (!fs.existsSync(groupFile)) {
        return res.status(404).json({ error: '群不存在' });
    }
    
    const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
    const category = {
        id: 'gcat_' + Math.random().toString(36).substr(2, 8),
        name: req.body.name,
        icon: req.body.icon || '📦',
        color: req.body.color || '#FF6B6B',
        type: req.body.type || 'expense',
        custom: true
    };
    
    group.categories.push(category);
    fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
    res.json(category);
});

app.delete('/api/groups/:groupId/categories/:categoryId', (req, res) => {
    const groupFile = path.join(GROUP_DIR, `${req.params.groupId}.json`);
    if (!fs.existsSync(groupFile)) {
        return res.status(404).json({ error: '群不存在' });
    }
    
    const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
    group.categories = group.categories.filter(c => c.id !== req.params.categoryId);
    
    fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
    res.json({ success: true });
});

app.get('/api/groups/my', (req, res) => {
    const accountId = req.query.accountId;
    const groups = [];
    
    const files = fs.readdirSync(GROUP_DIR);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(path.join(GROUP_DIR, file), 'utf8'));
            const isMember = data.members && data.members.some(m => m.accountId === accountId);
            if (isMember) groups.push(data);
        }
    });
    
    res.json(groups);
});

app.post('/api/groups/join', (req, res) => {
    const { groupId, accountId, accountName } = req.body;
    const groupFile = path.join(GROUP_DIR, `${groupId}.json`);
    
    if (!fs.existsSync(groupFile)) {
        return res.status(404).json({ error: '群不存在' });
    }
    
    const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
    
    const alreadyMember = group.members.some(m => m.accountId === accountId);
    if (alreadyMember) {
        return res.status(400).json({ error: '已经是群成员' });
    }
    
    group.members.push({
        accountId,
        name: accountName,
        role: 'member',
        joinTime: new Date().toISOString()
    });
    
    fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
    res.json({ success: true });
});

app.get('/api/groups/:groupId', (req, res) => {
    const groupFile = path.join(GROUP_DIR, `${req.params.groupId}.json`);
    if (!fs.existsSync(groupFile)) {
        return res.status(404).json({ error: '群不存在' });
    }
    res.json(JSON.parse(fs.readFileSync(groupFile, 'utf8')));
});

app.post('/api/groups/:groupId/record', (req, res) => {
    const groupFile = path.join(GROUP_DIR, `${req.params.groupId}.json`);
    if (!fs.existsSync(groupFile)) {
        return res.status(404).json({ error: '群不存在' });
    }
    
    const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
    const { accountId, categoryId, amount, type, date, remark, memberId, memberName } = req.body;
    
    const account = group.accounts.find(a => a.id === accountId);
    if (!account) {
        return res.status(404).json({ error: '账户不存在' });
    }
    
    if (type === 'expense') {
        account.balance -= parseFloat(amount);
    } else {
        account.balance += parseFloat(amount);
    }
    
    group.records.push({
        id: 'grec_' + Math.random().toString(36).substr(2, 8),
        accountId,
        categoryId,
        amount: parseFloat(amount),
        type,
        date,
        remark,
        memberId,
        memberName,
        createTime: new Date().toISOString()
    });
    
    fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
    res.json({ success: true });
});

app.delete('/api/groups/:groupId', (req, res) => {
    const groupFile = path.join(GROUP_DIR, `${req.params.groupId}.json`);
    if (!fs.existsSync(groupFile)) {
        return res.status(404).json({ error: '群不存在' });
    }
    
    const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
    if (group.creatorId !== req.body.creatorId) {
        return res.status(403).json({ error: '只有群主可以删除群' });
    }
    
    fs.unlinkSync(groupFile);
    res.json({ success: true });
});

app.put('/api/groups/:groupId', (req, res) => {
    const groupFile = path.join(GROUP_DIR, `${req.params.groupId}.json`);
    if (!fs.existsSync(groupFile)) {
        return res.status(404).json({ error: '群不存在' });
    }
    
    const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
    if (group.creatorId !== req.body.creatorId) {
        return res.status(403).json({ error: '只有群主可以修改群' });
    }
    
    if (req.body.name) {
        group.name = req.body.name;
    }
    
    fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
    res.json({ success: true });
});

app.delete('/api/groups/:groupId/members/:memberId', (req, res) => {
    const groupFile = path.join(GROUP_DIR, `${req.params.groupId}.json`);
    if (!fs.existsSync(groupFile)) {
        return res.status(404).json({ error: '群不存在' });
    }
    
    const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
    if (group.creatorId !== req.body.creatorId) {
        return res.status(403).json({ error: '只有群主可以移除成员' });
    }
    
    if (group.creatorId === req.params.memberId) {
        return res.status(400).json({ error: '不能移除群主自己' });
    }
    
    group.members = group.members.filter(m => m.accountId !== req.params.memberId);
    
    fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
    res.json({ success: true });
});

app.post('/groups/create', (req, res) => res.redirect(307, '/api/groups/create'));
app.get('/groups/my', (req, res) => res.redirect(307, '/api/groups/my'));
app.post('/groups/join', (req, res) => res.redirect(307, '/api/groups/join'));
app.get('/groups/:groupId', (req, res) => res.redirect(307, `/api/groups/${req.params.groupId}`));
app.post('/groups/:groupId/record', (req, res) => res.redirect(307, `/api/groups/${req.params.groupId}/record`));
app.put('/groups/:groupId', (req, res) => res.redirect(307, `/api/groups/${req.params.groupId}`));
app.delete('/groups/:groupId', (req, res) => res.redirect(307, `/api/groups/${req.params.groupId}`));
app.delete('/groups/:groupId/members/:memberId', (req, res) => res.redirect(307, `/api/groups/${req.params.groupId}/members/${req.params.memberId}`));

app.post('/admin/rename-account', (req, res) => res.redirect(307, '/api/admin/rename-account'));
app.post('/admin/delete-account', (req, res) => res.redirect(307, '/api/admin/delete-account'));
app.post('/admin/reset-account', (req, res) => res.redirect(307, '/api/admin/reset-account'));
app.get('/admin/accounts', (req, res) => res.redirect(307, '/api/admin/accounts'));
app.get('/admin/account/:id', (req, res) => res.redirect(307, `/api/admin/account/${req.params.id}`));
app.post('/admin/adjust-balance', (req, res) => res.redirect(307, '/api/admin/adjust-balance'));

const httpsOptions = {};

if (fs.existsSync(path.join(__dirname, 'key.pem')) && fs.existsSync(path.join(__dirname, 'cert.pem'))) {
    httpsOptions.key = fs.readFileSync(path.join(__dirname, 'key.pem'));
    httpsOptions.cert = fs.readFileSync(path.join(__dirname, 'cert.pem'));
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(PORT, () => console.log(`MoneyBook HTTPS running on port ${PORT}`));
} else {
    app.listen(PORT, () => console.log(`MoneyBook HTTP running on port ${PORT}`));
}