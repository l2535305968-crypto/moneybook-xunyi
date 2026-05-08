const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3443;

const ADMIN_KEY = process.env.ADMIN_KEY || 'moneybook_admin_2026_secure_key';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : [
        'http://localhost:3000', 
        'http://localhost:3443', 
        'http://127.0.0.1:3443',
        'https://159.75.91.40:3443'
    ];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    credentials: true
};

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: '请求过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: '认证请求过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(apiLimiter);

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.removeHeader('X-Powered-By');
    next();
});

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const GROUP_DIR = path.join(__dirname, 'data', 'groups');
if (!fs.existsSync(GROUP_DIR)) fs.mkdirSync(GROUP_DIR, { recursive: true });

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const validateAccountId = (id) => {
    if (!id || typeof id !== 'string') {
        throw new Error('无效的账户ID');
    }
    if (!id.startsWith('acc_')) {
        throw new Error('账户ID格式无效');
    }
    if (id.length > 50 || !/^[a-z0-9_]+$/i.test(id)) {
        throw new Error('账户ID包含非法字符');
    }
    return id;
};

const validateRecordId = (id) => {
    if (!id || typeof id !== 'string') {
        throw new Error('无效的记录ID');
    }
    if (!id.startsWith('rec_')) {
        throw new Error('记录ID格式无效');
    }
    if (id.length > 50 || !/^[a-z0-9_]+$/i.test(id)) {
        throw new Error('记录ID包含非法字符');
    }
    return id;
};

const validateGroupId = (id) => {
    if (!id || typeof id !== 'string') {
        throw new Error('无效的群组ID');
    }
    if (!id.startsWith('group_')) {
        throw new Error('群组ID格式无效');
    }
    if (id.length > 50 || !/^[a-z0-9_]+$/i.test(id)) {
        throw new Error('群组ID包含非法字符');
    }
    return id;
};

const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '');
};

const getDefaultAccount = (id, name) => ({
    id,
    name,
    accounts: [
        { id: 'acc_' + Math.random().toString(36).substr(2, 8), name: '现金', type: 'cash', balance: 0, createTime: new Date().toISOString(), status: 'active' },
        { id: 'acc_' + Math.random().toString(36).substr(2, 8), name: '微信', type: 'wechat', balance: 0, createTime: new Date().toISOString(), status: 'active' },
        { id: 'acc_' + Math.random().toString(36).substr(2, 8), name: '支付宝', type: 'alipay', balance: 0, createTime: new Date().toISOString(), status: 'active' }
    ],
    categories: [
        { id: 'cat_food',     name: '饮馔', modernName: '餐饮', icon: '🍵', color: '#FCE4EC', type: 'expense', custom: false },
        { id: 'cat_trans',    name: '舟车', modernName: '交通', icon: '⛵', color: '#E8F5E9', type: 'expense', custom: false },
        { id: 'cat_shop',     name: '采买', modernName: '购物', icon: '🧺', color: '#E3F2FD', type: 'expense', custom: false },
        { id: 'cat_entertain', name: '闲乐', modernName: '娱乐', icon: '🎯', color: '#E8F5E9', type: 'expense', custom: false },
        { id: 'cat_living',   name: '居处', modernName: '居住', icon: '🏯', color: '#F3E5F5', type: 'expense', custom: false },
        { id: 'cat_medical',  name: '药石', modernName: '医疗', icon: '🏺', color: '#FCE4EC', type: 'expense', custom: false },
        { id: 'cat_edu',      name: '束脩', modernName: '教育', icon: '📜', color: '#E0F7FA', type: 'expense', custom: false },
        { id: 'cat_clothes',  name: '衣饰', modernName: '服饰', icon: '👘', color: '#FCE4EC', type: 'expense', custom: false },
        { id: 'cat_comm',     name: '鸿雁', modernName: '通讯', icon: '🕊️', color: '#E3F2FD', type: 'expense', custom: false },
        { id: 'cat_beauty',   name: '妆奁', modernName: '美妆', icon: '🪞', color: '#FCE4EC', type: 'expense', custom: false },
        { id: 'cat_social',   name: '人情', modernName: '往来', icon: '🎁', color: '#F5F5DC', type: 'expense', custom: false },
        { id: 'cat_other',    name: '杂项', modernName: '其他', icon: '🎋', color: '#F5F5DC', type: 'expense', custom: false },
        { id: 'cat_salary',   name: '俸禄', modernName: '工资', icon: '🪙', color: '#E8F5E9', type: 'income', custom: false },
        { id: 'cat_invest',   name: '利市', modernName: '理财', icon: '🧮', color: '#FFF8E1', type: 'income', custom: false },
        { id: 'cat_bonus',    name: '赏银', modernName: '奖金', icon: '🥇', color: '#FFF3E0', type: 'income', custom: false },
        { id: 'cat_parttime', name: '佣钱', modernName: '兼职', icon: '🔨', color: '#F5F5DC', type: 'income', custom: false },
        { id: 'cat_gift',     name: '贺仪', modernName: '红包', icon: '🧧', color: '#FCE4EC', type: 'income', custom: false },
        { id: 'cat_writing',  name: '润笔', modernName: '稿费', icon: '✒️', color: '#E0F7FA', type: 'income', custom: false }
    ],
    records: [],
    budgets: [],
    createTime: new Date().toISOString()
});

app.post('/api/account', (req, res) => {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.length > 50) {
        return res.status(400).json({ error: '账户名称无效' });
    }
    
    const sanitizedName = name.replace(/[<>]/g, '').trim();
    const id = 'acc_' + Math.random().toString(36).substr(2, 8);
    
    const account = getDefaultAccount(id, sanitizedName);
    account.name = sanitizedName;
    
    const safeFilename = sanitizeFilename(`${id}.json`);
    fs.writeFileSync(path.join(DATA_DIR, safeFilename), JSON.stringify(account, null, 2));
    res.json(account);
});

app.get('/api/account/find', (req, res) => {
    const searchName = req.query.name;
    if (!searchName || typeof searchName !== 'string' || searchName.length > 50) {
        return res.status(400).json({ error: '请提供有效的账户名称' });
    }
    
    const sanitizedSearchName = searchName.replace(/[<>]/g, '').trim();
    
    const files = fs.readdirSync(DATA_DIR);
    for (const file of files) {
        if (file.startsWith('acc_') && file.endsWith('.json')) {
            try {
                const safeFile = sanitizeFilename(file);
                const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, safeFile), 'utf8'));
                if (data.name && data.name === sanitizedSearchName) {
                    return res.json({ id: data.id, name: data.name });
                }
            } catch (e) {}
        }
    }
    
    res.status(404).json({ error: '未找到账户' });
});

app.get('/api/account/:id', (req, res) => {
    try {
        const accountId = validateAccountId(req.params.id);
        const safeFilename = sanitizeFilename(`${accountId}.json`);
        const file = path.join(DATA_DIR, safeFilename);
        
        if (!fs.existsSync(file)) {
            const newAccount = getDefaultAccount(accountId, accountId);
            fs.writeFileSync(file, JSON.stringify(newAccount, null, 2));
            return res.json(newAccount);
        }
        res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/account/:id/record', (req, res) => {
    try {
        const accountId = validateAccountId(req.params.id);
        const safeFilename = sanitizeFilename(`${accountId}.json`);
        const file = path.join(DATA_DIR, safeFilename);
        
        if (!fs.existsSync(file)) {
            return res.status(404).json({ error: '账户不存在' });
        }
        
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        
        if (!req.body.amount || typeof parseFloat(req.body.amount) !== 'number' || parseFloat(req.body.amount) <= 0) {
            return res.status(400).json({ error: '无效的金额' });
        }
        
        const record = {
            id: 'rec_' + Math.random().toString(36).substr(2, 8),
            accountId: req.body.accountId,
            categoryId: req.body.categoryId,
            amount: parseFloat(req.body.amount),
            type: req.body.type === 'income' ? 'income' : 'expense',
            date: req.body.date || new Date().toISOString(),
            remark: (req.body.remark || '').replace(/[<>]/g, '').substring(0, 200),
            source: 'manual',
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
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/account/:id/record/:recordId', (req, res) => {
    try {
        const accountId = validateAccountId(req.params.id);
        const recordId = validateRecordId(req.params.recordId);
        const safeFilename = sanitizeFilename(`${accountId}.json`);
        const file = path.join(DATA_DIR, safeFilename);
        
        if (!fs.existsSync(file)) {
            return res.status(404).json({ error: '账户不存在' });
        }
        
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const record = data.records.find(r => r.id === recordId);
        
        if (record) {
            const account = data.accounts.find(a => a.id === record.accountId);
            if (account) {
                if (record.type === 'expense') {
                    account.balance += parseFloat(record.amount);
                } else {
                    account.balance -= parseFloat(record.amount);
                }
            }
            data.records = data.records.filter(r => r.id !== recordId);
        }
        
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/admin/accounts', authLimiter, (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }
    
    const accounts = [];
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(file => {
        if (file.endsWith('.json') && !file.startsWith('group_')) {
            try {
                const safeFile = sanitizeFilename(file);
                const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, safeFile), 'utf8'));
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

app.get('/api/admin/account/:id', authLimiter, (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }
    
    try {
        const accountId = validateAccountId(req.params.id);
        const safeFilename = sanitizeFilename(`${accountId}.json`);
        const file = path.join(DATA_DIR, safeFilename);
        
        if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
        res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/admin/adjust-balance', authLimiter, (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }
    
    try {
        const { accountId, targetAccountId, adjustment } = req.body;
        
        if (!accountId || !targetAccountId || typeof parseFloat(adjustment) !== 'number') {
            return res.status(400).json({ error: '参数无效' });
        }
        
        const validAccountId = validateAccountId(accountId);
        const safeFilename = sanitizeFilename(`${validAccountId}.json`);
        const file = path.join(DATA_DIR, safeFilename);
        
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
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/admin/rename-account', authLimiter, (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }

    try {
        const { accountId, newName } = req.body;
        
        if (!accountId || !newName || typeof newName !== 'string' || newName.length > 50) {
            return res.status(400).json({ error: '参数无效' });
        }
        
        const validAccountId = validateAccountId(accountId);
        const safeFilename = sanitizeFilename(`${validAccountId}.json`);
        const dataFile = path.join(DATA_DIR, safeFilename);

        if (!fs.existsSync(dataFile)) {
            return res.status(404).json({ error: '账户不存在' });
        }

        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        data.name = newName.replace(/[<>]/g, '').trim();
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/admin/delete-account', authLimiter, (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }

    try {
        const { accountId } = req.body;
        
        if (!accountId) {
            return res.status(400).json({ error: '缺少账户ID' });
        }
        
        const validAccountId = validateAccountId(accountId);
        const safeFilename = sanitizeFilename(`${validAccountId}.json`);
        const dataFile = path.join(DATA_DIR, safeFilename);

        if (!fs.existsSync(dataFile)) {
            return res.status(404).json({ error: '账户不存在' });
        }

        fs.unlinkSync(dataFile);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/admin/reset-account', authLimiter, (req, res) => {
    if (req.headers['admin-key'] !== ADMIN_KEY) {
        return res.status(401).json({ error: '无权限' });
    }

    try {
        const { accountId } = req.body;
        
        if (!accountId) {
            return res.status(400).json({ error: '缺少账户ID' });
        }
        
        const validAccountId = validateAccountId(accountId);
        const safeFilename = sanitizeFilename(`${validAccountId}.json`);
        const dataFile = path.join(DATA_DIR, safeFilename);

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
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/groups/create', (req, res) => {
    const { name, creatorId, creatorName } = req.body;
    
    if (!name || typeof name !== 'string' || name.length > 50) {
        return res.status(400).json({ error: '群组名称无效' });
    }
    
    try {
        if (creatorId) validateAccountId(creatorId);
    } catch (e) {
        return res.status(400).json({ error: '创建者ID无效' });
    }
    
    const groupId = 'group_' + Math.random().toString(36).substr(2, 8);
    
    const group = {
        id: groupId,
        name: name.replace(/[<>]/g, '').trim(),
        creatorId,
        members: [{
            accountId: creatorId,
            name: (creatorName || '未知').replace(/[<>]/g, '').trim(),
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
            { id: 'cat_food',     name: '饮馔', modernName: '餐饮', icon: '🍵', color: '#FCE4EC', type: 'expense', custom: false },
            { id: 'cat_trans',    name: '舟车', modernName: '交通', icon: '⛵', color: '#E8F5E9', type: 'expense', custom: false },
            { id: 'cat_shop',     name: '采买', modernName: '购物', icon: '🧺', color: '#E3F2FD', type: 'expense', custom: false },
            { id: 'cat_entertain', name: '闲乐', modernName: '娱乐', icon: '🎯', color: '#E8F5E9', type: 'expense', custom: false },
            { id: 'cat_living',   name: '居处', modernName: '居住', icon: '🏯', color: '#F3E5F5', type: 'expense', custom: false },
            { id: 'cat_medical',  name: '药石', modernName: '医疗', icon: '🏺', color: '#FCE4EC', type: 'expense', custom: false },
            { id: 'cat_edu',      name: '束脩', modernName: '教育', icon: '📜', color: '#E0F7FA', type: 'expense', custom: false },
            { id: 'cat_clothes',  name: '衣饰', modernName: '服饰', icon: '👘', color: '#FCE4EC', type: 'expense', custom: false },
            { id: 'cat_comm',     name: '鸿雁', modernName: '通讯', icon: '🕊️', color: '#E3F2FD', type: 'expense', custom: false },
            { id: 'cat_beauty',   name: '妆奁', modernName: '美妆', icon: '🪞', color: '#FCE4EC', type: 'expense', custom: false },
            { id: 'cat_social',   name: '人情', modernName: '往来', icon: '🎁', color: '#F5F5DC', type: 'expense', custom: false },
            { id: 'cat_other',    name: '杂项', modernName: '其他', icon: '🎋', color: '#F5F5DC', type: 'expense', custom: false },
            { id: 'cat_salary',   name: '俸禄', modernName: '工资', icon: '🪙', color: '#E8F5E9', type: 'income', custom: false },
            { id: 'cat_invest',   name: '利市', modernName: '理财', icon: '🧮', color: '#FFF8E1', type: 'income', custom: false },
            { id: 'cat_bonus',    name: '赏银', modernName: '奖金', icon: '🥇', color: '#FFF3E0', type: 'income', custom: false },
            { id: 'cat_parttime', name: '佣钱', modernName: '兼职', icon: '🔨', color: '#F5F5DC', type: 'income', custom: false },
            { id: 'cat_gift',     name: '贺仪', modernName: '红包', icon: '🧧', color: '#FCE4EC', type: 'income', custom: false },
            { id: 'cat_writing',  name: '润笔', modernName: '稿费', icon: '✒️', color: '#E0F7FA', type: 'income', custom: false }
        ],
        records: [],
        createTime: new Date().toISOString()
    };

    const safeFilename = sanitizeFilename(`${groupId}.json`);
    fs.writeFileSync(path.join(GROUP_DIR, safeFilename), JSON.stringify(group, null, 2));
    res.json(group);
});

app.post('/api/groups/:groupId/categories', (req, res) => {
    try {
        const groupId = validateGroupId(req.params.groupId);
        const safeFilename = sanitizeFilename(`${groupId}.json`);
        const groupFile = path.join(GROUP_DIR, safeFilename);
        
        if (!fs.existsSync(groupFile)) {
            return res.status(404).json({ error: '群不存在' });
        }
        
        const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
        const category = {
            id: 'gcat_' + Math.random().toString(36).substr(2, 8),
            name: (req.body.name || '').replace(/[<>]/g, '').trim().substring(0, 20),
            modernName: (req.body.modernName || '').replace(/[<>]/g, '').trim().substring(0, 20),
            icon: req.body.icon || '📦',
            color: req.body.color || '#FF6B6B',
            type: req.body.type === 'income' ? 'income' : 'expense',
            custom: true
        };
        
        group.categories.push(category);
        fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
        res.json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/groups/:groupId/categories/:categoryId', (req, res) => {
    try {
        const groupId = validateGroupId(req.params.groupId);
        const safeFilename = sanitizeFilename(`${groupId}.json`);
        const groupFile = path.join(GROUP_DIR, safeFilename);
        
        if (!fs.existsSync(groupFile)) {
            return res.status(404).json({ error: '群不存在' });
        }
        
        const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
        group.categories = group.categories.filter(c => c.id !== req.params.categoryId);
        
        fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/groups/my', (req, res) => {
    const accountId = req.query.accountId;
    const groups = [];
    
    const files = fs.readdirSync(GROUP_DIR);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            try {
                const safeFile = sanitizeFilename(file);
                const data = JSON.parse(fs.readFileSync(path.join(GROUP_DIR, safeFile), 'utf8'));
                const isMember = data.members && data.members.some(m => m.accountId === accountId);
                if (isMember) groups.push(data);
            } catch (e) {}
        }
    });
    
    res.json(groups);
});

app.post('/api/groups/join', (req, res) => {
    const { groupId, accountId, accountName } = req.body;
    
    try {
        const validGroupId = validateGroupId(groupId);
        const safeFilename = sanitizeFilename(`${validGroupId}.json`);
        const groupFile = path.join(GROUP_DIR, safeFilename);
        
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
            name: (accountName || '未知').replace(/[<>]/g, '').trim(),
            role: 'member',
            joinTime: new Date().toISOString()
        });
        
        fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/groups/:groupId', (req, res) => {
    try {
        const groupId = validateGroupId(req.params.groupId);
        const safeFilename = sanitizeFilename(`${groupId}.json`);
        const groupFile = path.join(GROUP_DIR, safeFilename);
        
        if (!fs.existsSync(groupFile)) {
            return res.status(404).json({ error: '群不存在' });
        }
        res.json(JSON.parse(fs.readFileSync(groupFile, 'utf8')));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/groups/:groupId/record', (req, res) => {
    try {
        const groupId = validateGroupId(req.params.groupId);
        const safeFilename = sanitizeFilename(`${groupId}.json`);
        const groupFile = path.join(GROUP_DIR, safeFilename);
        
        if (!fs.existsSync(groupFile)) {
            return res.status(404).json({ error: '群不存在' });
        }
        
        const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
        const { accountId, categoryId, amount, type, date, remark, memberId, memberName } = req.body;
        
        if (!amount || typeof parseFloat(amount) !== 'number' || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: '无效的金额' });
        }
        
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
            type: type === 'income' ? 'income' : 'expense',
            date,
            remark: (remark || '').replace(/[<>]/g, '').substring(0, 200),
            memberId,
            memberName: (memberName || '').replace(/[<>]/g, '').trim(),
            createTime: new Date().toISOString()
        });
        
        fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/groups/:groupId', (req, res) => {
    try {
        const groupId = validateGroupId(req.params.groupId);
        const safeFilename = sanitizeFilename(`${groupId}.json`);
        const groupFile = path.join(GROUP_DIR, safeFilename);
        
        if (!fs.existsSync(groupFile)) {
            return res.status(404).json({ error: '群不存在' });
        }
        
        const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
        if (group.creatorId !== req.body.creatorId) {
            return res.status(403).json({ error: '只有群主可以删除群' });
        }
        
        fs.unlinkSync(groupFile);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/groups/:groupId', (req, res) => {
    try {
        const groupId = validateGroupId(req.params.groupId);
        const safeFilename = sanitizeFilename(`${groupId}.json`);
        const groupFile = path.join(GROUP_DIR, safeFilename);
        
        if (!fs.existsSync(groupFile)) {
            return res.status(404).json({ error: '群不存在' });
        }
        
        const group = JSON.parse(fs.readFileSync(groupFile, 'utf8'));
        if (group.creatorId !== req.body.creatorId) {
            return res.status(403).json({ error: '只有群主可以修改群' });
        }
        
        if (req.body.name) {
            group.name = req.body.name.replace(/[<>]/g, '').trim().substring(0, 50);
        }
        
        fs.writeFileSync(groupFile, JSON.stringify(group, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/groups/:groupId/members/:memberId', (req, res) => {
    try {
        const groupId = validateGroupId(req.params.groupId);
        const safeFilename = sanitizeFilename(`${groupId}.json`);
        const groupFile = path.join(GROUP_DIR, safeFilename);
        
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
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
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
