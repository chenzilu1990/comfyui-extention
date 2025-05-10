/**
 * 提示词输入框组件
 * 提供输入框、历史提示词和快捷操作
 */
import PromptTemplates from './PromptTemplates.js';
import translationService from './TranslationService.js';
class PromptInput {
  constructor(options = {}) {
    this.options = Object.assign({
      placeholder: '输入提示词...',
      maxHistory: 10,
      onChange: null,
      onSubmit: null,
      storageKey: 'promptHistory',
      parentElement: document.body,
      showTemplates: true,
      detectChinese: true  // 是否检测中文并提供翻译提醒
    }, options);
    
    this.history = [];
    this.element = null;
    this.inputElement = null;
    this.historyElement = null;
    this.templatesElement = null;
    this.templatesToggleBtn = null;
    this.translateWarningElement = null;
    this.currentHistoryIndex = -1;
    this.promptTemplates = null;
    this.showingTemplates = true;
    this.inputContainsChinese = false;
    
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
    
    // 添加模板切换按钮
    this.templatesToggleBtn = document.createElement('button');
    this.templatesToggleBtn.className = 'prompt-tool-btn';
    this.templatesToggleBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
        <line x1="3" y1="9" x2="21" y2="9"></line>
      </svg>
    `;
    this.templatesToggleBtn.title = '显示/隐藏模板';
    this.templatesToggleBtn.addEventListener('click', () => this.toggleTemplates());
    
    // 添加按钮到工具栏
    toolbar.appendChild(this.templatesToggleBtn);
    toolbar.appendChild(clearBtn);
    toolbar.appendChild(historyBtn);
    
    // 组装输入区域
    inputArea.appendChild(this.inputElement);
    inputArea.appendChild(toolbar);
    
    // 创建翻译提醒区域
    this.translateWarningElement = document.createElement('div');
    this.translateWarningElement.className = 'translate-warning';
    this.translateWarningElement.style.display = 'none';
    
    // 创建历史面板
    this.historyElement = document.createElement('div');
    this.historyElement.className = 'prompt-history';
    this.historyElement.style.display = 'none';
    this.refreshHistoryPanel();
    
    // 创建模板面板容器
    this.templatesElement = document.createElement('div');
    this.templatesElement.className = 'prompt-templates-container';
    if (!this.options.showTemplates) {
      this.templatesElement.style.display = 'none';
      this.showingTemplates = false;
    }
    
    // 组装所有元素
    this.element.appendChild(this.templatesElement);
    this.element.appendChild(inputArea);
    this.element.appendChild(this.translateWarningElement);
    this.element.appendChild(this.historyElement);
    
    // 添加到父元素
    if (this.options.parentElement) {
      this.options.parentElement.appendChild(this.element);
    }
    
    // 初始化模板组件
    this.promptTemplates = new PromptTemplates({
      parentElement: this.templatesElement,
      onSelectTemplate: (template) => this.insertTemplate(template),
      onSelectTag: (tag) => this.insertTag(tag)
    });
    
    // 添加样式
    this.addStyles();
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 输入框内容变化事件
    this.inputElement.addEventListener('input', () => {
      if (this.options.detectChinese) {
        this.checkForChineseCharacters();
      }
      
      if (typeof this.options.onChange === 'function') {
        this.options.onChange(this.getValue());
      }
    });
    
    // 回车提交事件
    this.inputElement.addEventListener('keydown', (e) => {
      // 如果按下Ctrl+Enter键
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.submitWithChineseCheck();
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
      
      .prompt-tool-btn.active {
        color: var(--primary-color, #4f46e5);
        background-color: var(--bg-secondary, #f9fafb);
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
      
      .translate-warning {
        margin-top: 8px;
        padding: 8px 12px;
        background-color: #fff8e6;
        border: 1px solid #ffeeba;
        border-radius: 6px;
        color: #856404;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      
      .translate-warning .warning-icon {
        flex-shrink: 0;
        color: #f0ad4e;
      }
      
      .translate-warning .warning-text {
        flex: 1;
      }
      
      .translate-warning .translate-buttons {
        display: flex;
        gap: 8px;
      }
      
      .translate-warning .translate-btn {
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .translate-warning .translate-btn:hover {
        background-color: #0069d9;
      }
      
      .translate-warning .ignore-btn {
        background-color: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .translate-warning .ignore-btn:hover {
        background-color: #5a6268;
      }
      
      .translated-text {
        margin-top: 8px;
        padding: 8px 12px;
        background-color: #e6f7ff;
        border: 1px solid #b3e0ff;
        border-radius: 6px;
        color: #0056b3;
        font-size: 13px;
      }
      
      .translated-text .translated-content {
        font-weight: 500;
        margin-top: 4px;
      }
      
      .translated-text .use-translation-btn {
        margin-top: 6px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .translated-text .use-translation-btn:hover {
        background-color: #0069d9;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 检查文本中是否包含中文字符
   */
  checkForChineseCharacters() {
    const value = this.getValue();
    // 使用正则表达式检查中文字符
    // 匹配中文字符的正则表达式
    const chineseRegex = /[\u4e00-\u9fa5]/;
    this.inputContainsChinese = chineseRegex.test(value);
    
    if (this.inputContainsChinese) {
      this.showTranslateWarning();
    } else {
      this.hideTranslateWarning();
    }
  }
  
  /**
   * 显示翻译警告
   */
  showTranslateWarning() {
    if (!this.translateWarningElement) return;
    
    this.translateWarningElement.innerHTML = '';
    
    const warningIcon = document.createElement('div');
    warningIcon.className = 'warning-icon';
    warningIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
    
    const warningText = document.createElement('div');
    warningText.className = 'warning-text';
    warningText.textContent = '检测到中文输入！大多数AI绘图模型对英文理解更好，建议转换为英文后提交。';
    
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'translate-buttons';
    
    const translateBtn = document.createElement('button');
    translateBtn.className = 'translate-btn';
    translateBtn.textContent = '翻译为英文';
    translateBtn.addEventListener('click', () => this.translateInput());
    
    const ignoreBtn = document.createElement('button');
    ignoreBtn.className = 'ignore-btn';
    ignoreBtn.textContent = '忽略';
    ignoreBtn.addEventListener('click', () => this.hideTranslateWarning());
    
    buttonsWrapper.appendChild(translateBtn);
    buttonsWrapper.appendChild(ignoreBtn);
    
    this.translateWarningElement.appendChild(warningIcon);
    this.translateWarningElement.appendChild(warningText);
    this.translateWarningElement.appendChild(buttonsWrapper);
    
    this.translateWarningElement.style.display = 'flex';
  }
  
  /**
   * 隐藏翻译警告
   */
  hideTranslateWarning() {
    if (this.translateWarningElement) {
      this.translateWarningElement.style.display = 'none';
    }
  }
  
  /**
   * 尝试翻译输入内容
   */
  async translateInput() {
    const inputText = this.getValue();
    
    // 显示加载状态
    if (this.translateWarningElement) {
      const warningText = this.translateWarningElement.querySelector('.warning-text');
      if (warningText) {
        warningText.textContent = '正在翻译...';
      }
      
      const buttonsWrapper = this.translateWarningElement.querySelector('.translate-buttons');
      if (buttonsWrapper) {
        buttonsWrapper.style.display = 'none';
      }
    }
    
    try {
      // 调用翻译服务
      const translatedText = await translationService.translate(inputText);
      
      // 直接设置翻译结果到输入框
      this.setValue(translatedText);
      
      // 隐藏翻译警告
      this.hideTranslateWarning();
      
      // 添加到历史记录（可选）
      // this.addToHistory(translatedText);
    } catch (error) {
      console.error('翻译失败:', error);
      
      // 恢复警告文本
      if (this.translateWarningElement) {
        const warningText = this.translateWarningElement.querySelector('.warning-text');
        if (warningText) {
          warningText.textContent = '翻译失败！请重试或手动翻译。';
        }
        
        const buttonsWrapper = this.translateWarningElement.querySelector('.translate-buttons');
        if (buttonsWrapper) {
          buttonsWrapper.style.display = 'flex';
        }
      }
    }
  }
  
  /**
   * 显示翻译结果 - 不再需要此功能，但保留方法以避免引用错误
   * @param {string} originalText 原始文本
   */
  showTranslationResults(originalText) {
    // 此方法不再使用，但保留以防其他地方有引用
    console.log('showTranslationResults方法已弃用');
  }
  
  /**
   * 检查中文并提交
   */
  submitWithChineseCheck() {
    const value = this.getValue();
    
    if (value.trim() === '') {
      return;
    }
    
    if (this.options.detectChinese && this.inputContainsChinese) {
      // 如果包含中文且没有显示过提醒，则显示提醒
      if (this.translateWarningElement.style.display === 'none') {
        this.showTranslateWarning();
        return; // 显示警告后先不提交
      }
    }
    
    // 如果不包含中文或用户已经看到了警告，则直接提交
    if (typeof this.options.onSubmit === 'function') {
      this.options.onSubmit(value);
    }
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
   * 切换模板面板显示状态
   */
  toggleTemplates() {
    this.showingTemplates = !this.showingTemplates;
    this.templatesElement.style.display = this.showingTemplates ? 'block' : 'none';
    
    // 更新按钮状态
    if (this.showingTemplates) {
      this.templatesToggleBtn.classList.add('active');
    } else {
      this.templatesToggleBtn.classList.remove('active');
    }
  }
  
  /**
   * 插入模板到输入框
   * @param {string} template 模板内容
   */
  insertTemplate(template) {
    this.setValue(template);
    this.inputElement.focus();
    this.checkForChineseCharacters(); // 检查是否包含中文
  }
  
  /**
   * 插入标签到输入框
   * @param {string} tag 标签内容
   */
  insertTag(tag) {
    const currentText = this.getValue();
    const cursorPos = this.inputElement.selectionStart;
    
    // 在光标位置插入标签
    const newText = currentText.substring(0, cursorPos) + tag + currentText.substring(cursorPos);
    this.setValue(newText);
    
    // 将光标定位到插入内容之后
    setTimeout(() => {
      this.inputElement.focus();
      this.inputElement.setSelectionRange(cursorPos + tag.length, cursorPos + tag.length);
    }, 0);
    
    this.checkForChineseCharacters(); // 检查是否包含中文
  }
  
  /**
   * 设置输入框值
   * @param {string} value 值
   */
  setValue(value) {
    if (!this.inputElement) return;
    this.inputElement.value = value;
    
    // 检查是否包含中文
    if (this.options.detectChinese) {
      this.checkForChineseCharacters();
    }
    
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
    this.hideTranslateWarning();
    this.inputElement.focus();
  }
  
  /**
   * 提交当前输入
   */
  submit() {
    this.submitWithChineseCheck();
  }
}

export default PromptInput;