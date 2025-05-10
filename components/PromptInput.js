/**
 * 提示词输入框组件
 * 提供输入框、历史提示词和快捷操作
 */
import PromptTemplates from './PromptTemplates.js';
import translationService from './TranslationService.js';
import PromptHistory from './PromptHistory.js';
import PromptToolbar from './PromptToolbar.js';
import TranslateWarning from './TranslateWarning.js';

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
    
    this.element = null;
    this.inputElement = null;
    this.showingTemplates = true;
    this.inputContainsChinese = false;
    
    // 组件引用
    this.promptHistory = null;
    this.promptToolbar = null;
    this.translateWarning = null;
    this.promptTemplates = null;
    
    this.init();
  }
  
  /**
   * 初始化组件
   */
  init() {
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
    this.promptToolbar = new PromptToolbar({
      onClear: () => this.clearInput(),
      onToggleHistory: () => this.promptHistory.toggle(),
      onToggleTemplates: () => this.toggleTemplates(),
      showTemplates: this.options.showTemplates
    });
    
    // 组装输入区域
    inputArea.appendChild(this.inputElement);
    inputArea.appendChild(this.promptToolbar.getElement());
    
    // 创建翻译提醒组件
    this.translateWarning = new TranslateWarning({
      onTranslate: () => this.translateInput(),
      onIgnore: () => this.translateWarning.hide()
    });
    
    // 创建历史记录组件
    this.promptHistory = new PromptHistory({
      storageKey: this.options.storageKey,
      maxHistory: this.options.maxHistory,
      onSelect: (prompt) => {
        this.setValue(prompt);
        this.promptHistory.hide();
      }
    });
    
    // 创建模板面板容器
    const templatesElement = document.createElement('div');
    templatesElement.className = 'prompt-templates-container';
    if (!this.options.showTemplates) {
      templatesElement.style.display = 'none';
      this.showingTemplates = false;
    }
    // 保存模板容器引用
    this.templatesContainer = templatesElement;
    
    // 组装所有元素
    this.element.appendChild(templatesElement);
    this.element.appendChild(inputArea);
    this.element.appendChild(this.translateWarning.getElement());
    this.element.appendChild(this.promptHistory.getElement());
    
    // 添加到父元素
    if (this.options.parentElement) {
      this.options.parentElement.appendChild(this.element);
    }
    
    // 初始化模板组件
    this.promptTemplates = new PromptTemplates({
      parentElement: templatesElement,
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
      this.translateWarning.show();
    } else {
      this.translateWarning.hide();
    }
  }
  
  /**
   * 尝试翻译输入内容
   */
  async translateInput() {
    const inputText = this.getValue();
    
    // 显示加载状态
    this.translateWarning.setTranslating(true);
    
    try {
      // 调用翻译服务
      const translatedText = await translationService.translate(inputText);
      
      // 直接设置翻译结果到输入框
      this.setValue(translatedText);
      
      // 隐藏翻译警告
      this.translateWarning.hide();
      
      // 添加到历史记录（可选）
      // this.promptHistory.addItem(translatedText);
    } catch (error) {
      console.error('翻译失败:', error);
      this.translateWarning.setError('翻译失败！请重试或手动翻译。');
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
      if (!this.translateWarning.isVisible()) {
        this.translateWarning.show();
        return; // 显示警告后先不提交
      }
    }
    
    // 如果不包含中文或用户已经看到了警告，则直接提交
    if (typeof this.options.onSubmit === 'function') {
      this.options.onSubmit(value);
    }
  }
  
  /**
   * 切换模板面板显示状态
   */
  toggleTemplates() {
    this.showingTemplates = !this.showingTemplates;
    const templatesElement = this.templatesContainer;
    templatesElement.style.display = this.showingTemplates ? 'block' : 'none';
    
    // 更新按钮状态
    this.promptToolbar.setTemplatesActive(this.showingTemplates);
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
    this.translateWarning.hide();
    this.inputElement.focus();
  }
  
  /**
   * 提交当前输入
   */
  submit() {
    this.submitWithChineseCheck();
  }
  
  /**
   * 添加提示词到历史记录
   * @param {string} prompt 提示词
   */
  addToHistory(prompt) {
    this.promptHistory.addItem(prompt);
  }
}

export default PromptInput;