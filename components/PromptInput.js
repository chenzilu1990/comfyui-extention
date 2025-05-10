 /**
 * 提示词输入框组件
 * 提供输入框、历史提示词和快捷操作
 */
class PromptInput {
  constructor(options = {}) {
    this.options = Object.assign({
      placeholder: '输入提示词...',
      maxHistory: 10,
      onChange: null,
      onSubmit: null,
      storageKey: 'promptHistory',
      parentElement: document.body,
    }, options);
    
    this.history = [];
    this.element = null;
    this.inputElement = null;
    this.historyElement = null;
    this.currentHistoryIndex = -1;
    
    this.init();
  }
  
  /**
   * 初始化组件
   */
  init() {
    this.loadHistory();
    this.render();
    this.setupEventListeners();
  }
  
  /**
   * 渲染组件
   */
  render() {
    // 创建主容器
    this.element = document.createElement('div');
    this.element.className = 'prompt-input-container';
    
    // 创建主输入框区域
    const inputArea = document.createElement('div');
    inputArea.className = 'prompt-input-area';
    
    // 创建输入框
    this.inputElement = document.createElement('textarea');
    this.inputElement.className = 'prompt-input';
    this.inputElement.placeholder = this.options.placeholder;
    this.inputElement.rows = 3;
    
    // 创建工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'prompt-toolbar';
    
    // 添加清除按钮
    const clearBtn = document.createElement('button');
    clearBtn.className = 'prompt-tool-btn';
    clearBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    clearBtn.title = '清除输入';
    clearBtn.addEventListener('click', () => this.clearInput());
    
    // 添加历史按钮
    const historyBtn = document.createElement('button');
    historyBtn.className = 'prompt-tool-btn';
    historyBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
    `;
    historyBtn.title = '历史提示词';
    historyBtn.addEventListener('click', () => this.toggleHistoryPanel());
    
    // 添加按钮到工具栏
    toolbar.appendChild(clearBtn);
    toolbar.appendChild(historyBtn);
    
    // 组装输入区域
    inputArea.appendChild(this.inputElement);
    inputArea.appendChild(toolbar);
    
    // 创建历史面板
    this.historyElement = document.createElement('div');
    this.historyElement.className = 'prompt-history';
    this.historyElement.style.display = 'none';
    this.refreshHistoryPanel();
    
    // 组装所有元素
    this.element.appendChild(inputArea);
    this.element.appendChild(this.historyElement);
    
    // 添加到父元素
    if (this.options.parentElement) {
      this.options.parentElement.appendChild(this.element);
    }
    
    // 添加样式
    this.addStyles();
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 输入框内容变化事件
    this.inputElement.addEventListener('input', () => {
      if (typeof this.options.onChange === 'function') {
        this.options.onChange(this.getValue());
      }
    });
    
    // 回车提交事件
    this.inputElement.addEventListener('keydown', (e) => {
      // 如果按下Ctrl+Enter键
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        if (typeof this.options.onSubmit === 'function') {
          this.options.onSubmit(this.getValue());
        }
      }
    });
  }
  
  /**
   * 添加组件样式
   */
  addStyles() {
    // 检查是否已存在样式
    if (document.getElementById('prompt-input-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'prompt-input-styles';
    style.textContent = `
      .prompt-input-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-bottom: 16px;
      }
      
      .prompt-input-area {
        position: relative;
        width: 100%;
      }
      
      .prompt-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 6px;
        background-color: var(--bg-primary, #ffffff);
        color: var(--text-primary, #111827);
        font-size: 14px;
        resize: vertical;
        min-height: 80px;
        transition: all 0.2s;
      }
      
      .prompt-input:focus {
        outline: none;
        border-color: var(--primary-color, #4f46e5);
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
      }
      
      .prompt-toolbar {
        position: absolute;
        bottom: 8px;
        right: 8px;
        display: flex;
        gap: 4px;
        align-items: center;
      }
      
      .prompt-tool-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        background-color: transparent;
        border-radius: 4px;
        cursor: pointer;
        padding: 0;
        color: var(--text-secondary, #4b5563);
        transition: all 0.2s;
      }
      
      .prompt-tool-btn:hover {
        background-color: var(--bg-secondary, #f9fafb);
        color: var(--primary-color, #4f46e5);
      }
      
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
  addToHistory(prompt) {
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
    this.refreshHistoryPanel();
  }
  
  /**
   * 刷新历史面板
   */
  refreshHistoryPanel() {
    if (!this.historyElement) return;
    
    this.historyElement.innerHTML = '';
    
    if (this.history.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'prompt-history-empty';
      emptyEl.textContent = '暂无历史提示词';
      this.historyElement.appendChild(emptyEl);
      return;
    }
    
    this.history.forEach((prompt, index) => {
      const item = document.createElement('div');
      item.className = 'prompt-history-item';
      item.textContent = prompt;
      item.title = prompt;
      item.dataset.index = index;
      
      item.addEventListener('click', () => {
        this.setValue(prompt);
        this.hideHistoryPanel();
      });
      
      this.historyElement.appendChild(item);
    });
  }
  
  /**
   * 切换历史面板显示状态
   */
  toggleHistoryPanel() {
    if (this.historyElement.style.display === 'none') {
      this.showHistoryPanel();
    } else {
      this.hideHistoryPanel();
    }
  }
  
  /**
   * 显示历史面板
   */
  showHistoryPanel() {
    this.historyElement.style.display = 'block';
  }
  
  /**
   * 隐藏历史面板
   */
  hideHistoryPanel() {
    this.historyElement.style.display = 'none';
  }
  
  /**
   * 设置输入框值
   * @param {string} value 值
   */
  setValue(value) {
    if (!this.inputElement) return;
    this.inputElement.value = value;
    
    // 触发onChange事件
    if (typeof this.options.onChange === 'function') {
      this.options.onChange(value);
    }
  }
  
  /**
   * 获取输入框值
   * @returns {string} 输入框值
   */
  getValue() {
    if (!this.inputElement) return '';
    return this.inputElement.value;
  }
  
  /**
   * 清除输入框
   */
  clearInput() {
    this.setValue('');
    this.inputElement.focus();
  }
  
  /**
   * 提交当前输入
   */
  submit() {
    const value = this.getValue();
    if (value.trim() !== '') {
      this.addToHistory(value);
      
      if (typeof this.options.onSubmit === 'function') {
        this.options.onSubmit(value);
      }
    }
  }
}

export default PromptInput;