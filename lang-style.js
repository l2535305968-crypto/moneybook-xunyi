window.LangStyle = (function() {
    var ACCOUNT_TYPE_MAP = {
        cash:    { classic: '碎银子',       modern: '现金' },
        ecny:    { classic: '宝钞',         modern: '数字人民币' },
        card:    { classic: '钱庄',         modern: '银行卡' },
        credit:  { classic: '赊账',         modern: '信用卡' },
        alipay:  { classic: '通宝',         modern: '支付宝' },
        wechat:  { classic: '交子',         modern: '微信钱包' },
        bank:    { classic: '钱庄',         modern: '银行卡' }
    };

    var ACCOUNT_TYPE_ICONS = {
        cash: '🪙', ecny: '📱', card: '🏦', credit: '💳',
        alipay: '💙', wechat: '💚', bank: '🏦'
    };

    var DEFAULT_ACCOUNTS_CLASSIC = [
        { id: 'acc_ecny',   name: '宝钞 (数币)',   type: 'ecny',   balance: 0, status: 'active' },
        { id: 'acc_alipay', name: '通宝 (支付宝)',  type: 'alipay', balance: 0, status: 'active' },
        { id: 'acc_wechat', name: '交子 (微信)',    type: 'wechat', balance: 0, status: 'active' }
    ];

    var DEFAULT_ACCOUNTS_MODERN = [
        { id: 'acc_ecny',   name: '数字人民币',  type: 'ecny',   balance: 0, status: 'active' },
        { id: 'acc_alipay', name: '支付宝',      type: 'alipay', balance: 0, status: 'active' },
        { id: 'acc_wechat', name: '微信钱包',    type: 'wechat', balance: 0, status: 'active' }
    ];

    function getStyle() {
        return localStorage.getItem('langStyle') || 'classic';
    }

    function setStyle(style) {
        localStorage.setItem('langStyle', style);
    }

    function isClassic() {
        return getStyle() === 'classic';
    }

    function getAccountTypeName(type) {
        var mapping = ACCOUNT_TYPE_MAP[type];
        if (!mapping) return type;
        if (getStyle() === 'classic') {
            if (mapping.classic !== mapping.modern) {
                return mapping.classic + ' (' + mapping.modern + ')';
            }
            return mapping.classic;
        }
        return mapping.modern;
    }

    function getAccountTypeIcon(type) {
        return ACCOUNT_TYPE_ICONS[type] || '💰';
    }

    function formatCategoryName(cat) {
        if (!cat) return '';
        var classicName = cat.name || '';
        var modernName = cat.modernName || '';
        if (getStyle() === 'classic') {
            if (modernName && modernName !== classicName) {
                return '<span>' + classicName + '<span style="font-size: 0.85em; opacity: 0.65; margin-left: 6px; font-family: system-ui;">(' + modernName + ')</span></span>';
            }
            return classicName;
        }
        return modernName || classicName;
    }

    function formatCategoryNamePlain(cat) {
        if (!cat) return '';
        var classicName = cat.name || '';
        var modernName = cat.modernName || '';
        if (getStyle() === 'classic') {
            if (modernName && modernName !== classicName) {
                return classicName + ' (' + modernName + ')';
            }
            return classicName;
        }
        return modernName || classicName;
    }

    function formatCategoryNameSelect(cat) {
        if (!cat) return '';
        var icon = cat.icon || '';
        var classicName = cat.name || '';
        var modernName = cat.modernName || '';
        if (getStyle() === 'classic') {
            if (modernName && modernName !== classicName) {
                return icon + ' ' + classicName + ' (' + modernName + ')';
            }
            return icon + ' ' + classicName;
        }
        return icon + ' ' + (modernName || classicName);
    }

    function getAccountTypeSelectOptions(includeModernHint) {
        var html = '';
        var types = ['ecny', 'alipay', 'wechat'];
        if (getStyle() === 'classic') {
            types.forEach(function(t) {
                var m = ACCOUNT_TYPE_MAP[t];
                var label = m.classic;
                if (includeModernHint && m.modern !== m.classic) {
                    label = m.classic + ' (' + m.modern + ')';
                }
                html += '<option value="' + t + '">' + ACCOUNT_TYPE_ICONS[t] + ' ' + label + '</option>';
            });
        } else {
            types.forEach(function(t) {
                var m = ACCOUNT_TYPE_MAP[t];
                html += '<option value="' + t + '">' + ACCOUNT_TYPE_ICONS[t] + ' ' + m.modern + '</option>';
            });
        }
        return html;
    }

    return {
        getStyle: getStyle,
        setStyle: setStyle,
        isClassic: isClassic,

        ACCOUNT_TYPE_MAP: ACCOUNT_TYPE_MAP,
        ACCOUNT_TYPE_ICONS: ACCOUNT_TYPE_ICONS,

        getAccountTypeName: getAccountTypeName,
        getAccountTypeIcon: getAccountTypeIcon,
        getAccountTypeSelectOptions: getAccountTypeSelectOptions,

        formatCategoryName: formatCategoryName,
        formatCategoryNamePlain: formatCategoryNamePlain,
        formatCategoryNameSelect: formatCategoryNameSelect,

        DEFAULT_ACCOUNTS_CLASSIC: DEFAULT_ACCOUNTS_CLASSIC,
        DEFAULT_ACCOUNTS_MODERN: DEFAULT_ACCOUNTS_MODERN
    };
})();
