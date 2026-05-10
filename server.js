const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 3443;

const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl.crt'))
};

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PENDING_REQUESTS_FILE = path.join(DATA_DIR, 'pending_requests.json');
const DELETED_ACCOUNTS_FILE = path.join(DATA_DIR, 'deleted_accounts.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const ADMIN_KEY = 'moneybook_admin_2026_secure_key';

function generateId(prefix) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = prefix + '_';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getDefaultCategories() {
    return [
        { id: 'cat_salary', name: '俸禄', modernName: '工资', type: 'income', icon: '🪙', color: '#E8F5E9', custom: false },
        { id: 'cat_investment', name: '利市', modernName: '理财', type: 'income', icon: '🧮', color: '#FFF9C4', custom: false },
        { id: 'cat_bonus', name: '赏银', modernName: '奖金', type: 'income', icon: '🏆', color: '#FFF8E1', custom: false },
        { id: 'cat_parttime', name: '佣钱', modernName: '兼职/副业', type: 'income', icon: '🔨', color: '#FFF3E0', custom: false },
        { id: 'cat_gift', name: '贺仪', modernName: '红包/礼金', type: 'income', icon: '🧧', color: '#FCE4EC', custom: false },
        { id: 'cat_manuscript', name: '润笔', modernName: '稿费/稿酬', type: 'income', icon: '✒️', color: '#E0F7FA', custom: false },
        { id: 'cat_food', name: '饮馔', modernName: '餐饮', type: 'expense', icon: '🍱', color: '#FCE4EC', custom: false },
        { id: 'cat_transport', name: '舟车', modernName: '交通', type: 'expense', icon: '⛵', color: '#E8F5E9', custom: false },
        { id: 'cat_shopping', name: '采买', modernName: '购物', type: 'expense', icon: '🧺', color: '#E3F2FD', custom: false },
        { id: 'cat_entertainment', name: '闲乐', modernName: '娱乐', type: 'expense', icon: '♟️', color: '#E8F5E9', custom: false },
        { id: 'cat_housing', name: '居处', modernName: '居住', type: 'expense', icon: '🏠', color: '#F3E5F5', custom: false },
        { id: 'cat_health', name: '药石', modernName: '医疗', type: 'expense', icon: '💊', color: '#FCE4EC', custom: false },
        { id: 'cat_education', name: '束脩', modernName: '教育', type: 'expense', icon: '📚', color: '#E0F7FA', custom: false },
        { id: 'cat_clothing', name: '衣饰', modernName: '服饰鞋包', type: 'expense', icon: '👗', color: '#FCE4EC', custom: false },
        { id: 'cat_communication', name: '鸿雁', modernName: '通讯', type: 'expense', icon: '📨', color: '#E3F2FD', custom: false },
        { id: 'cat_beauty', name: '妆奁', modernName: '护肤美妆', type: 'expense', icon: '🪞', color: '#FCE4EC', custom: false },
        { id: 'cat_social', name: '人情', modernName: '人情往来', type: 'expense', icon: '🎁', color: '#FFF3E0', custom: false },
        { id: 'cat_other_expense', name: '杂项', modernName: '其他', type: 'expense', icon: '📦', color: '#FFF3E0', custom: false }
    ];
}

function getDefaultAccounts() {
    return [
        { id: 'acc_cash', name: '现金', type: 'cash', balance: 0, status: 'active' },
        { id: 'acc_ecny', name: '数字人民币', type: 'ecny', balance: 0, status: 'active' },
        { id: 'acc_bank', name: '银行卡', type: 'card', balance: 0, status: 'active' },
        { id: 'acc_credit', name: '信用卡', type: 'credit', balance: 0, status: 'active' },
        { id: 'acc_alipay', name: '支付宝', type: 'alipay', balance: 0, status: 'active' },
        { id: 'acc_wechat', name: '微信钱包', type: 'wechat', balance: 0, status: 'active' }
    ];
}

function loadAccount(accountId) {
    try {
        const filePath = path.join(DATA_DIR, `${accountId}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.error(`Error loading account ${accountId}:`, e);
        return null;
    }
}

function saveAccount(accountId, data) {
    try {
        const filePath = path.join(DATA_DIR, `${accountId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`Error saving account ${accountId}:`, e);
        return false;
    }
}

function loadPendingRequests() {
    try {
        if (!fs.existsSync(PENDING_REQUESTS_FILE)) {
            return [];
        }
        return JSON.parse(fs.readFileSync(PENDING_REQUESTS_FILE, 'utf8'));
    } catch (e) {
        console.error('Error loading pending requests:', e);
        return [];
    }
}

function savePendingRequests(requests) {
    try {
        fs.writeFileSync(PENDING_REQUESTS_FILE, JSON.stringify(requests, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving pending requests:', e);
        return false;
    }
}

function getAllAccounts() {
    const accounts = [];
    try {
        if (!fs.existsSync(DATA_DIR)) return accounts;
        
        const files = fs.readdirSync(DATA_DIR);
        files.forEach(file => {
            if (file.startsWith('acc_') && file.endsWith('.json')) {
                try {
                    const filePath = path.join(DATA_DIR, file);
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (data && data.id && data.name) {
                        accounts.push({
                            id: data.id,
                            name: data.name,
                            accountCount: (data.accounts || []).length,
                            recordCount: (data.records || []).length,
                            totalBalance: (data.accounts || []).reduce((sum, a) => sum + (a.balance || 0), 0),
                            createTime: data.createTime
                        });
                    }
                } catch (e) {
                    console.error(`Error reading file ${file}:`, e);
                }
            }
        });
    } catch (e) {
        console.error('Error reading data directory:', e);
    }
    return accounts;
}

function loadGroups() {
    try {
        if (!fs.existsSync(GROUPS_FILE)) return [];
        return JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
    } catch (e) {
        console.error('Error loading groups:', e);
        return [];
    }
}

function saveGroups(groups) {
    try {
        fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving groups:', e);
        return false;
    }
}

function getDefaultGroupCategories() {
    return [
        { id: 'cat_food_g',     name: '饮馔', modernName: '餐饮',   icon: '🍵', color: '#FCE4EC', type: 'expense', custom: false },
        { id: 'cat_trans_g',    name: '舟车', modernName: '交通',   icon: '⛵', color: '#E8F5E9', type: 'expense', custom: false },
        { id: 'cat_shop_g',     name: '采买', modernName: '购物',   icon: '🧺', color: '#E3F2FD', type: 'expense', custom: false },
        { id: 'cat_entertain_g',name: '闲乐', modernName: '娱乐',   icon: '🎯', color: '#E8F5E9', type: 'expense', custom: false },
        { id: 'cat_living_g',   name: '居处', modernName: '居住',   icon: '🏯', color: '#F3E5F5', type: 'expense', custom: false },
        { id: 'cat_medical_g',  name: '药石', modernName: '医疗',   icon: '🏺', color: '#FCE4EC', type: 'expense', custom: false },
        { id: 'cat_edu_g',      name: '束脩', modernName: '教育',   icon: '📜', color: '#E0F7FA', type: 'expense', custom: false },
        { id: 'cat_clothes_g',  name: '衣饰', modernName: '服饰',   icon: '👘', color: '#FCE4EC', type: 'expense', custom: false },
        { id: 'cat_comm_g',     name: '鸿雁', modernName: '通讯',   icon: '🕊️', color: '#E3F2FD', type: 'expense', custom: false },
        { id: 'cat_beauty_g',   name: '妆奁', modernName: '美妆',   icon: '🪞', color: '#FCE4EC', type: 'expense', custom: false },
        { id: 'cat_social_g',   name: '人情', modernName: '往来',   icon: '🎁', color: '#F5F5DC', type: 'expense', custom: false },
        { id: 'cat_other_g',    name: '杂项', modernName: '其他',   icon: '🎋', color: '#F5F5DC', type: 'expense', custom: false },
        { id: 'cat_salary_g',   name: '俸禄', modernName: '工资',   icon: '🪙', color: '#E8F5E9', type: 'income', custom: false },
        { id: 'cat_invest_g',   name: '利市', modernName: '理财',   icon: '🧮', color: '#FFF8E1', type: 'income', custom: false },
        { id: 'cat_bonus_g',    name: '赏银', modernName: '奖金',   icon: '🥇', color: '#FFF3E0', type: 'income', custom: false },
        { id: 'cat_parttime_g', name: '佣钱', modernName: '兼职',   icon: '🔨', color: '#F5F5DC', type: 'income', custom: false },
        { id: 'cat_gift_g',     name: '贺仪', modernName: '红包',   icon: '🧧', color: '#FCE4EC', type: 'income', custom: false },
        { id: 'cat_writing_g',  name: '润笔', modernName: '稿费',   icon: '✒️', color: '#E0F7FA', type: 'income', custom: false }
    ];
}

app.post('/api/account', (req, res) => {
    try {
        const { id, name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: '账号名称不能为空' });
        }
        
        const allAccounts = getAllAccounts();
        const nameExists = allAccounts.some(acc => acc.name === name);
        if (nameExists) {
            return res.status(400).json({ error: '账号名称已存在' });
        }
        
        const accountId = id || generateId('acc');
        
        const accountData = {
            id: accountId,
            name: name,
            createTime: new Date().toISOString(),
            accounts: getDefaultAccounts(),
            categories: getDefaultCategories(),
            records: [],
            budgets: []
        };
        
        if (saveAccount(accountId, accountData)) {
            res.json(accountData);
        } else {
            res.status(500).json({ error: '保存账号失败' });
        }
    } catch (e) {
        console.error('Error creating account:', e);
        res.status(500).json({ error: '创建账号失败' });
    }
});

// 按名称查找账号 —— 必须放在 /api/account/:accountId 之前
app.get('/api/account/find', (req, res) => {
    try {
        const name = req.query.name;
        const accounts = getAllAccounts();
        const found = accounts.find(a => a.name === name);
        if (found) {
            const data = loadAccount(found.id);
            res.json({ id: found.id, name: found.name });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (e) {
        console.error('Error finding account:', e);
        res.status(500).json({ error: '查找账号失败' });
    }
});

app.get('/api/account/:accountId', (req, res) => {
    try {
        const accountId = req.params.accountId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(data);
    } catch (e) {
        console.error('Error loading account:', e);
        res.status(500).json({ error: '加载账号失败' });
    }
});

app.get('/api/records/:accountId', (req, res) => {
    try {
        const accountId = req.params.accountId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(data.records || []);
    } catch (e) {
        console.error('Error loading records:', e);
        res.status(500).json({ error: '加载记录失败' });
    }
});

app.post('/api/records', (req, res) => {
    try {
        const { accountId, record } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        record.id = generateId('rec');
        if (!data.records) data.records = [];
        data.records.unshift(record);
        
        if (data.accounts) {
            const account = data.accounts.find(a => a.id === record.accountId);
            if (account) {
                if (record.type === 'income') {
                    account.balance += parseFloat(record.amount || 0);
                } else {
                    account.balance -= parseFloat(record.amount || 0);
                }
            }
        }
        
        if (saveAccount(accountId, data)) {
            res.json(record);
        } else {
            res.status(500).json({ error: '保存记录失败' });
        }
    } catch (e) {
        console.error('Error saving record:', e);
        res.status(500).json({ error: '保存记录失败' });
    }
});

app.delete('/api/records/:recordId', (req, res) => {
    try {
        const { accountId } = req.body;
        const recordId = req.params.recordId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const recordIndex = (data.records || []).findIndex(r => r.id === recordId);
        if (recordIndex === -1) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        const record = data.records[recordIndex];
        if (data.accounts) {
            const account = data.accounts.find(a => a.id === record.accountId);
            if (account) {
                if (record.type === 'income') {
                    account.balance -= parseFloat(record.amount || 0);
                } else {
                    account.balance += parseFloat(record.amount || 0);
                }
            }
        }
        
        data.records.splice(recordIndex, 1);
        if (saveAccount(accountId, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '删除记录失败' });
        }
    } catch (e) {
        console.error('Error deleting record:', e);
        res.status(500).json({ error: '删除记录失败' });
    }
});

app.post('/api/accounts', (req, res) => {
    try {
        const { accountId, account } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const nameExists = (data.accounts || []).some(acc => acc.name === account.name);
        if (nameExists) {
            return res.status(400).json({ error: '账户名称已存在' });
        }
        
        const allAccounts = getAllAccounts();
        const conflictsWithAccountName = allAccounts.some(acc => acc.name === account.name);
        if (conflictsWithAccountName) {
            return res.status(400).json({ error: '账户名称不能与其他账号名称相同' });
        }
        
        account.id = generateId('sub');
        account.status = 'active';
        account.balance = account.balance || 0;
        if (!data.accounts) data.accounts = [];
        data.accounts.push(account);
        
        if (saveAccount(accountId, data)) {
            res.json(account);
        } else {
            res.status(500).json({ error: '保存账户失败' });
        }
    } catch (e) {
        console.error('Error adding sub-account:', e);
        res.status(500).json({ error: '添加账户失败' });
    }
});

app.put('/api/accounts/:subAccountId', (req, res) => {
    try {
        const { accountId, account } = req.body;
        const subAccountId = req.params.subAccountId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const index = (data.accounts || []).findIndex(a => a.id === subAccountId);
        if (index !== -1) {
            if (account.name && account.name !== data.accounts[index].name) {
                const nameExists = (data.accounts || []).some(acc => acc.name === account.name);
                if (nameExists) {
                    return res.status(400).json({ error: '账户名称已存在' });
                }
                
                const allAccounts = getAllAccounts();
                const conflictsWithAccountName = allAccounts.some(acc => acc.name === account.name);
                if (conflictsWithAccountName) {
                    return res.status(400).json({ error: '账户名称不能与其他账号名称相同' });
                }
            }
            
            data.accounts[index] = { ...data.accounts[index], ...account };
            if (saveAccount(accountId, data)) {
                res.json(data.accounts[index]);
            } else {
                res.status(500).json({ error: '更新账户失败' });
            }
        } else {
            res.status(404).json({ error: 'Sub-account not found' });
        }
    } catch (e) {
        console.error('Error updating sub-account:', e);
        res.status(500).json({ error: '更新账户失败' });
    }
});

app.delete('/api/accounts/:subAccountId', (req, res) => {
    try {
        const { accountId } = req.body;
        const subAccountId = req.params.subAccountId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        data.accounts = (data.accounts || []).filter(a => a.id !== subAccountId);
        if (saveAccount(accountId, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '删除账户失败' });
        }
    } catch (e) {
        console.error('Error deleting sub-account:', e);
        res.status(500).json({ error: '删除账户失败' });
    }
});

app.post('/api/transfer', (req, res) => {
    try {
        const { accountId, fromAccountId, toAccountId, amount, remark } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const fromAccount = (data.accounts || []).find(a => a.id === fromAccountId);
        const toAccount = (data.accounts || []).find(a => a.id === toAccountId);
        
        if (!fromAccount || !toAccount) {
            return res.status(400).json({ error: 'Invalid accounts' });
        }
        
        fromAccount.balance -= parseFloat(amount || 0);
        toAccount.balance += parseFloat(amount || 0);
        
        const transferId = generateId('trans');
        
        if (saveAccount(accountId, data)) {
            res.json({ success: true, transferId });
        } else {
            res.status(500).json({ error: '转账失败' });
        }
    } catch (e) {
        console.error('Error transferring:', e);
        res.status(500).json({ error: '转账失败' });
    }
});

app.post('/api/categories', (req, res) => {
    try {
        const { accountId, category } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        category.id = generateId('cat');
        category.custom = true;
        if (!data.categories) data.categories = [];
        data.categories.push(category);
        
        if (saveAccount(accountId, data)) {
            res.json(category);
        } else {
            res.status(500).json({ error: '保存分类失败' });
        }
    } catch (e) {
        console.error('Error adding category:', e);
        res.status(500).json({ error: '添加分类失败' });
    }
});

app.put('/api/categories/:categoryId', (req, res) => {
    try {
        const { accountId, category } = req.body;
        const categoryId = req.params.categoryId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const index = (data.categories || []).findIndex(c => c.id === categoryId);
        if (index !== -1) {
            data.categories[index] = { ...data.categories[index], ...category };
            if (saveAccount(accountId, data)) {
                res.json(data.categories[index]);
            } else {
                res.status(500).json({ error: '更新分类失败' });
            }
        } else {
            res.status(404).json({ error: 'Category not found' });
        }
    } catch (e) {
        console.error('Error updating category:', e);
        res.status(500).json({ error: '更新分类失败' });
    }
});

app.delete('/api/categories/:categoryId', (req, res) => {
    try {
        const { accountId } = req.body;
        const categoryId = req.params.categoryId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        data.categories = (data.categories || []).filter(c => c.id !== categoryId);
        if (saveAccount(accountId, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '删除分类失败' });
        }
    } catch (e) {
        console.error('Error deleting category:', e);
        res.status(500).json({ error: '删除分类失败' });
    }
});

app.get('/api/budgets/:accountId', (req, res) => {
    try {
        const accountId = req.params.accountId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(data.budgets || []);
    } catch (e) {
        console.error('Error loading budgets:', e);
        res.status(500).json({ error: '加载预算失败' });
    }
});

app.post('/api/budgets', (req, res) => {
    try {
        const { accountId, budget } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        if (!data.budgets) data.budgets = [];
        budget.id = generateId('budget');
        data.budgets.push(budget);
        
        if (saveAccount(accountId, data)) {
            res.json(budget);
        } else {
            res.status(500).json({ error: '保存预算失败' });
        }
    } catch (e) {
        console.error('Error saving budget:', e);
        res.status(500).json({ error: '保存预算失败' });
    }
});

app.delete('/api/budgets/:budgetId', (req, res) => {
    try {
        const { accountId } = req.body;
        const budgetId = req.params.budgetId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        data.budgets = (data.budgets || []).filter(b => b.id !== budgetId);
        if (saveAccount(accountId, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '删除预算失败' });
        }
    } catch (e) {
        console.error('Error deleting budget:', e);
        res.status(500).json({ error: '删除预算失败' });
    }
});

app.post('/api/account/delete', (req, res) => {
    try {
        const { accountId } = req.body;
        const filePath = path.join(DATA_DIR, `${accountId}.json`);
        
        if (fs.existsSync(filePath)) {
            try {
                const accountData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let deletedAccounts = [];
                if (fs.existsSync(DELETED_ACCOUNTS_FILE)) {
                    deletedAccounts = JSON.parse(fs.readFileSync(DELETED_ACCOUNTS_FILE, 'utf8'));
                }
                deletedAccounts.push({
                    id: accountData.id,
                    name: accountData.name,
                    recordCount: (accountData.records || []).length,
                    accountCount: (accountData.accounts || []).length,
                    totalBalance: (accountData.accounts || []).reduce((sum, a) => sum + (a.balance || 0), 0),
                    createTime: accountData.createTime,
                    deleteTime: new Date().toISOString()
                });
                fs.writeFileSync(DELETED_ACCOUNTS_FILE, JSON.stringify(deletedAccounts, null, 2));
            } catch (e) {
                console.error('Error recording deleted account:', e);
            }
            fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Error deleting account:', e);
        res.status(500).json({ error: '注销账号失败' });
    }
});

app.post('/api/account/rename', (req, res) => {
    try {
        const { accountId, newName } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const allAccounts = getAllAccounts();
        const nameExists = allAccounts.some(acc => acc.name === newName && acc.id !== accountId);
        if (nameExists) {
            return res.status(400).json({ error: '账号名称已存在' });
        }
        
        data.name = newName;
        if (saveAccount(accountId, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '重命名账号失败' });
        }
    } catch (e) {
        console.error('Error renaming account:', e);
        res.status(500).json({ error: '重命名账号失败' });
    }
});

app.get('/api/admin/accounts', (req, res) => {
    try {
        const adminKey = req.headers['admin-key'];
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        res.json(getAllAccounts());
    } catch (e) {
        console.error('Error getting admin accounts:', e);
        res.status(500).json({ error: '获取账号列表失败' });
    }
});

app.get('/api/admin/account/:accountId', (req, res) => {
    try {
        const adminKey = req.headers['admin-key'];
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const accountId = req.params.accountId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(data);
    } catch (e) {
        console.error('Error getting admin account:', e);
        res.status(500).json({ error: '获取账号详情失败' });
    }
});

app.post('/api/admin/rename-account', (req, res) => {
    try {
        const adminKey = req.headers['admin-key'];
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const { accountId, newName } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        data.name = newName;
        if (saveAccount(accountId, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '重命名账号失败' });
        }
    } catch (e) {
        console.error('Error renaming account:', e);
        res.status(500).json({ error: '重命名账号失败' });
    }
});

app.post('/api/admin/delete-account', (req, res) => {
    try {
        const adminKey = req.headers['admin-key'];
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const { accountId } = req.body;
        const filePath = path.join(DATA_DIR, `${accountId}.json`);
        
        // 删除前保存账号信息到注销记录
        if (fs.existsSync(filePath)) {
            try {
                const accountData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let deletedAccounts = [];
                if (fs.existsSync(DELETED_ACCOUNTS_FILE)) {
                    deletedAccounts = JSON.parse(fs.readFileSync(DELETED_ACCOUNTS_FILE, 'utf8'));
                }
                deletedAccounts.push({
                    id: accountData.id,
                    name: accountData.name,
                    recordCount: (accountData.records || []).length,
                    accountCount: (accountData.accounts || []).length,
                    totalBalance: (accountData.accounts || []).reduce((sum, a) => sum + (a.balance || 0), 0),
                    createTime: accountData.createTime,
                    deleteTime: new Date().toISOString()
                });
                fs.writeFileSync(DELETED_ACCOUNTS_FILE, JSON.stringify(deletedAccounts, null, 2));
            } catch (e) {
                console.error('Error recording deleted account:', e);
            }
            fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Error deleting account:', e);
        res.status(500).json({ error: '删除账号失败' });
    }
});

app.get('/api/admin/deleted-accounts', (req, res) => {
    try {
        const adminKey = req.headers['admin-key'];
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        if (!fs.existsSync(DELETED_ACCOUNTS_FILE)) {
            return res.json([]);
        }
        res.json(JSON.parse(fs.readFileSync(DELETED_ACCOUNTS_FILE, 'utf8')));
    } catch (e) {
        console.error('Error getting deleted accounts:', e);
        res.status(500).json({ error: '获取注销记录失败' });
    }
});

app.post('/api/admin/reset-account', (req, res) => {
    try {
        const adminKey = req.headers['admin-key'];
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const { accountId } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        data.records = [];
        (data.accounts || []).forEach(a => a.balance = 0);
        if (saveAccount(accountId, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '重置账号失败' });
        }
    } catch (e) {
        console.error('Error resetting account:', e);
        res.status(500).json({ error: '重置账号失败' });
    }
});

app.post('/api/admin/adjust-balance', (req, res) => {
    try {
        const adminKey = req.headers['admin-key'];
        if (adminKey !== ADMIN_KEY) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const { accountId, targetAccountId, adjustment } = req.body;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const account = (data.accounts || []).find(a => a.id === targetAccountId);
        if (account) {
            account.balance += parseFloat(adjustment || 0);
            if (saveAccount(accountId, data)) {
                res.json({ success: true });
            } else {
                res.status(500).json({ error: '调整余额失败' });
            }
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (e) {
        console.error('Error adjusting balance:', e);
        res.status(500).json({ error: '调整余额失败' });
    }
});

app.post('/api/parse-bill', (req, res) => {
    try {
        const { text, source } = req.body;
        const amountMatch = text.match(/[¥￥]?\s*(\d+(?:\.\d{1,2})?)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
        
        if (!amount) {
            return res.json({ amount: null, error: 'Cannot parse amount' });
        }
        
        res.json({
            amount: amount,
            type: 'expense',
            remark: text.substring(0, 50),
            categorySuggestions: ['cat_food', 'cat_shopping', 'cat_other_expense']
        });
    } catch (e) {
        console.error('Error parsing bill:', e);
        res.status(500).json({ error: '解析账单失败' });
    }
});

app.get('/api/statistics/:accountId', (req, res) => {
    try {
        const accountId = req.params.accountId;
        const data = loadAccount(accountId);
        if (!data) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthRecords = (data.records || []).filter(r => {
            try {
                const d = new Date(r.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            } catch (e) {
                return false;
            }
        });
        
        const totalExpense = monthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
        const totalIncome = monthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
        
        const categoryStats = {};
        const categoryMap = {};
        (data.categories || []).forEach(c => categoryMap[c.id] = c);
        
        monthRecords.forEach(r => {
            if (!categoryStats[r.categoryId]) {
                categoryStats[r.categoryId] = { 
                    category: categoryMap[r.categoryId] || { name: '未知', icon: '📦' }, 
                    amount: 0, 
                    count: 0 
                };
            }
            categoryStats[r.categoryId].amount += parseFloat(r.amount || 0);
            categoryStats[r.categoryId].count++;
        });
        
        res.json({
            totalExpense,
            totalIncome,
            categoryStats,
            records: monthRecords
        });
    } catch (e) {
        console.error('Error getting statistics:', e);
        res.status(500).json({ error: '获取统计失败' });
    }
});

// ==================== 群组 API ====================

// 获取我的群组列表
app.get('/api/groups/my', (req, res) => {
    try {
        const accountId = req.query.accountId;
        if (!accountId) return res.status(400).json({ error: '缺少accountId' });

        const groups = loadGroups();
        const myGroups = groups.filter(g =>
            (g.members || []).some(m => m.accountId === accountId)
        );
        res.json(myGroups);
    } catch (e) {
        console.error('Error loading my groups:', e);
        res.status(500).json({ error: '加载群组失败' });
    }
});

// 创建群组
app.post('/api/groups/create', (req, res) => {
    try {
        const { name, creatorId, creatorName } = req.body;
        if (!name) return res.status(400).json({ error: '群名称不能为空' });
        if (!creatorId) return res.status(400).json({ error: '缺少创建者信息' });

        const groups = loadGroups();
        const groupId = generateId('grp');
        const group = {
            id: groupId,
            name: name,
            creatorId: creatorId,
            createTime: new Date().toISOString(),
            members: [
                { accountId: creatorId, name: creatorName || '未知', role: 'admin' }
            ],
            accounts: [],
            categories: getDefaultGroupCategories(),
            records: []
        };
        groups.push(group);
        if (saveGroups(groups)) {
            res.json(group);
        } else {
            res.status(500).json({ error: '保存群组失败' });
        }
    } catch (e) {
        console.error('Error creating group:', e);
        res.status(500).json({ error: '创建群组失败' });
    }
});

// 加入群组
app.post('/api/groups/join', (req, res) => {
    try {
        const { groupId, accountId, accountName } = req.body;
        if (!groupId || !accountId) return res.status(400).json({ error: '参数不完整' });

        const groups = loadGroups();
        const index = groups.findIndex(g => g.id === groupId);
        if (index < 0) return res.status(404).json({ error: '群组不存在' });

        const group = groups[index];
        const alreadyMember = (group.members || []).some(m => m.accountId === accountId);
        if (alreadyMember) return res.status(400).json({ error: '已经是群成员' });

        group.members.push({ accountId, name: accountName || '成员', role: 'member' });
        if (saveGroups(groups)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '加入失败' });
        }
    } catch (e) {
        console.error('Error joining group:', e);
        res.status(500).json({ error: '加入群组失败' });
    }
});

// 获取群组详情
app.get('/api/groups/:groupId', (req, res) => {
    try {
        const groupId = req.params.groupId;
        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return res.status(404).json({ error: '群组不存在' });
        res.json(group);
    } catch (e) {
        console.error('Error loading group:', e);
        res.status(500).json({ error: '加载群组详情失败' });
    }
});

// 修改群组名称
app.put('/api/groups/:groupId', (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { name, creatorId } = req.body;
        if (!name) return res.status(400).json({ error: '群名称不能为空' });

        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return res.status(404).json({ error: '群组不存在' });
        if (group.creatorId !== creatorId) return res.status(403).json({ error: '只有群主可以修改' });

        group.name = name;
        if (saveGroups(groups)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '修改失败' });
        }
    } catch (e) {
        console.error('Error updating group:', e);
        res.status(500).json({ error: '修改群组失败' });
    }
});

// 删除群组
app.delete('/api/groups/:groupId', (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { creatorId } = req.body;
        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return res.status(404).json({ error: '群组不存在' });
        if (group.creatorId !== creatorId) return res.status(403).json({ error: '只有群主可以删除' });

        const newGroups = groups.filter(g => g.id !== groupId);
        if (saveGroups(newGroups)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '删除失败' });
        }
    } catch (e) {
        console.error('Error deleting group:', e);
        res.status(500).json({ error: '删除群组失败' });
    }
});

// 群内记账
app.post('/api/groups/:groupId/record', (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { accountId, categoryId, amount, type, date, remark, memberId, memberName } = req.body;
        if (!accountId || !categoryId || !amount || !type) {
            return res.status(400).json({ error: '参数不完整' });
        }

        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return res.status(404).json({ error: '群组不存在' });

        const record = {
            id: generateId('grec'),
            accountId,
            categoryId,
            amount: parseFloat(amount),
            type,
            date: date || new Date().toISOString(),
            remark: remark || '',
            memberId: memberId || '',
            memberName: memberName || ''
        };

        if (!group.records) group.records = [];
        group.records.push(record);

        if (group.accounts) {
            const acc = group.accounts.find(a => a.id === accountId);
            if (acc) {
                if (type === 'income') {
                    acc.balance = (acc.balance || 0) + parseFloat(amount);
                } else {
                    acc.balance = (acc.balance || 0) - parseFloat(amount);
                }
            }
        }

        if (saveGroups(groups)) {
            res.json(record);
        } else {
            res.status(500).json({ error: '保存记录失败' });
        }
    } catch (e) {
        console.error('Error adding group record:', e);
        res.status(500).json({ error: '群组记账失败' });
    }
});

// 添加群账户
app.post('/api/groups/:groupId/accounts', (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { name, type } = req.body;
        if (!name) return res.status(400).json({ error: '账户名称不能为空' });

        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return res.status(404).json({ error: '群组不存在' });

        const account = {
            id: generateId('gacc'),
            name,
            type: type || 'cash',
            balance: 0
        };
        if (!group.accounts) group.accounts = [];
        group.accounts.push(account);

        if (saveGroups(groups)) {
            res.json(account);
        } else {
            res.status(500).json({ error: '添加账户失败' });
        }
    } catch (e) {
        console.error('Error adding group account:', e);
        res.status(500).json({ error: '添加群账户失败' });
    }
});

// 添加群组分类
app.post('/api/groups/:groupId/categories', (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { name, modernName, icon, color, type } = req.body;
        if (!name) return res.status(400).json({ error: '分类名称不能为空' });

        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return res.status(404).json({ error: '群组不存在' });

        const category = {
            id: generateId('gcat'),
            name,
            modernName: modernName || '',
            icon: icon || '📦',
            color: color || '#F5F5DC',
            type: type || 'expense',
            custom: true
        };
        if (!group.categories) group.categories = getDefaultGroupCategories();
        group.categories.push(category);

        if (saveGroups(groups)) {
            res.json(category);
        } else {
            res.status(500).json({ error: '添加分类失败' });
        }
    } catch (e) {
        console.error('Error adding group category:', e);
        res.status(500).json({ error: '添加群分类失败' });
    }
});

// 删除群组分类
app.delete('/api/groups/:groupId/categories/:categoryId', (req, res) => {
    try {
        const { groupId, categoryId } = req.params;
        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return res.status(404).json({ error: '群组不存在' });

        if (group.categories) {
            group.categories = group.categories.filter(c => c.id !== categoryId);
        }
        if (saveGroups(groups)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '删除分类失败' });
        }
    } catch (e) {
        console.error('Error deleting group category:', e);
        res.status(500).json({ error: '删除群分类失败' });
    }
});

// 移出群成员
app.delete('/api/groups/:groupId/members/:memberAccountId', (req, res) => {
    try {
        const { groupId, memberAccountId } = req.params;
        const { creatorId } = req.body;
        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return res.status(404).json({ error: '群组不存在' });
        if (group.creatorId !== creatorId) return res.status(403).json({ error: '只有群主可以移出成员' });

        if (group.members) {
            const member = group.members.find(m => m.accountId === memberAccountId);
            if (member && member.role === 'admin') {
                return res.status(400).json({ error: '不能移出群主' });
            }
            group.members = group.members.filter(m => m.accountId !== memberAccountId);
        }
        if (saveGroups(groups)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '移出成员失败' });
        }
    } catch (e) {
        console.error('Error removing group member:', e);
        res.status(500).json({ error: '移出群成员失败' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`墨记记账服务器已启动: https://0.0.0.0:${PORT}`);
    console.log(`数据文件将保存在: ${DATA_DIR}`);
});
