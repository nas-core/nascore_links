// API 处理模块
class API {
    constructor() {
        this.baseURL = '';
    }

    // 通用请求方法
    async request(url, options = {}) {
        const defaultOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(this.baseURL + url, finalOptions);
            const data = await response.json();

            if (data.code !== 0) {
                throw new Error(data.message || 'Request failed');
            }

            return data.data;
        } catch (error) {
            console.error('[api] Request failed:', error);
            throw error;
        }
    }

    // 获取分类列表
    async getCategories() {
        return this.request('/api/categories', { method: 'GET' });
    }

    // 创建分类
    async createCategory(category) {
        return this.request('/api/category', {
            method: 'POST',
            body: JSON.stringify(category)
        });
    }

    // 更新分类
    async updateCategory(category) {
        return this.request('/api/category', {
            method: 'PUT',
            body: JSON.stringify(category)
        });
    }

    // 删除分类
    async deleteCategory(id) {
        return this.request(`/api/category?id=${id}`, {
            method: 'DELETE'
        });
    }

    // 获取链接列表
    async getLinks(categoryId = '') {
        const url = categoryId ? `/api/links?category_id=${categoryId}` : '/api/links';
        return this.request(url, { method: 'GET' });
    }

    // 创建链接
    async createLink(link) {
        return this.request('/api/link', {
            method: 'POST',
            body: JSON.stringify(link)
        });
    }

    // 更新链接
    async updateLink(link) {
        return this.request('/api/link', {
            method: 'PUT',
            body: JSON.stringify(link)
        });
    }

    // 删除链接
    async deleteLink(id) {
        return this.request(`/api/link?id=${id}`, {
            method: 'DELETE'
        });
    }
}

// 创建全局API实例
window.api = new API();

// 工具函数
window.utils = {
    // 显示加载状态
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    },

    // 隐藏加载状态
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    },

    // 显示消息提示
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            animation: slideInRight 0.3s ease-out;
        `;

        // 设置背景颜色
        switch (type) {
            case 'success':
                messageEl.style.backgroundColor = '#4caf50';
                break;
            case 'error':
                messageEl.style.backgroundColor = '#f44336';
                break;
            case 'warning':
                messageEl.style.backgroundColor = '#ff9800';
                break;
            default:
                messageEl.style.backgroundColor = '#2196f3';
        }

        // 添加到页面
        document.body.appendChild(messageEl);

        // 3秒后自动移除
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    },

    // 确认对话框
    confirm(message) {
        return new Promise((resolve) => {
            const result = window.confirm(message);
            resolve(result);
        });
    },

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;

        return date.toLocaleDateString('zh-CN');
    },

    // 提取域名
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url;
        }
    },

    // 验证URL格式
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            // 检查是否是相对路径或简单域名
            const simplePattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return simplePattern.test(string);
        }
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 安全的JSON解析
    safeParseJSON(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch {
            return defaultValue;
        }
    }
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
