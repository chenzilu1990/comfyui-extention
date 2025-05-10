/**
 * 提示词历史记录组件
 * 管理和显示历史提示词
 */
class PromptHistory {
  constructor(options = {}) {
    this.options = Object.assign({
      storageKey: 'promptHistory',
      maxHistory: 10,
      onSelect: null
    }, options);
    
    this.history = [];
    this.element = null;
    
    this.init();
  }
  
  /**
   * 初始化组件
   */
  init() {
    this.loadHistory();
    this.render();
    this.addStyles();
  }
  
  /**
   * 渲染组件
   */
  render() {
    // 创建历史面板
    this.element = document.createElement('div');
    this.element.className = 'prompt-history';
    this.element.style.display = 'none';
    
    this.refreshPanel();
  }
  
  /**
   * 刷新历史面板
   */
  refreshPanel() {
    if (!this.element) return;
    
    this.element.innerHTML = '';
    
    if (this.history.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'prompt-history-empty';
      emptyEl.textContent = '暂无历史提示词';
      this.element.appendChild(emptyEl);
      return;
    }
    
    this.history.forEach((prompt, index) => {
      const item = document.createElement('div');
      item.className = 'prompt-history-item';
      item.textContent = prompt;
      item.title = prompt;
      item.dataset.index = index;
      
      item.addEventListener('click', () => {
        if (typeof this.options.onSelect === 'function') {
          this.options.onSelect(prompt);
        }
      });
      
      this.element.appendChild(item);
    });
  }
  
  /**
   * 添加组件样式
   */
  addStyles() {
    // 检查是否已存在样式
    if (document.getElementById('prompt-history-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'prompt-history-styles';
    style.textContent = `
      .prompt-history {
        margin-top: 8px;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 6px;
        max-height: 150px;
        overflow-y: auto;
      }
      
      .prompt-history-item {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        font-size: 13px;
        color: var(--text-primary, #111827);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: all 0.2s;
      }
      
      .prompt-history-item:last-child {
        border-bottom: none;
      }
      
      .prompt-history-item:hover {
        background-color: var(--bg-secondary, #f9fafb);
      }
      
      .prompt-history-empty {
        padding: 12px;
        text-align: center;
        color: var(--text-secondary, #4b5563);
        font-size: 13px;
        font-style: italic;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 加载历史提示词
   */
  loadHistory() {
    try {
      const savedHistory = localStorage.getItem(this.options.storageKey);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('加载提示词历史记录失败:', error);
      this.history = [];
    }
  }
  
  /**
   * 保存历史提示词
   */
  saveHistory() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.error('保存提示词历史记录失败:', error);
    }
  }
  
  /**
   * 添加提示词到历史记录
   * @param {string} prompt 提示词
   */
  addItem(prompt) {
    if (!prompt || prompt.trim() === '') return;
    
    // 移除相同的历史记录
    this.history = this.history.filter(item => item !== prompt);
    
    // 添加到历史开头
    this.history.unshift(prompt);
    
    // 限制历史记录数量
    if (this.history.length > this.options.maxHistory) {
      this.history = this.history.slice(0, this.options.maxHistory);
    }
    
    // 保存历史记录
    this.saveHistory();
    
    // 刷新历史面板
    this.refreshPanel();
  }
  
  /**
   * 切换历史面板显示状态
   */
  toggle() {
    if (this.element.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }
  
  /**
   * 显示历史面板
   */
  show() {
    this.element.style.display = 'block';
  }
  
  /**
   * 隐藏历史面板
   */
  hide() {
    this.element.style.display = 'none';
  }
  
  /**
   * 获取组件元素
   * @returns {HTMLElement} 组件元素
   */
  getElement() {
    return this.element;
  }
  
  /**
   * 获取历史记录
   * @returns {Array} 历史记录数组
   */
  getHistory() {
    return [...this.history];
  }
  
  /**
   * 清空历史记录
   */
  clearHistory() {
    this.history = [];
    this.saveHistory();
    this.refreshPanel();
  }
}

export default PromptHistory; 