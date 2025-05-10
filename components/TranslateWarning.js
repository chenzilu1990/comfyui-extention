/**
 * 翻译警告组件
 * 检测中文并提供翻译提示
 */
class TranslateWarning {
  constructor(options = {}) {
    this.options = Object.assign({
      onTranslate: null,
      onIgnore: null
    }, options);
    
    this.element = null;
    this.warningText = null;
    this.buttonsWrapper = null;
    
    this.render();
    this.addStyles();
  }
  
  /**
   * 渲染组件
   */
  render() {
    // 创建翻译提醒区域
    this.element = document.createElement('div');
    this.element.className = 'translate-warning';
    this.element.style.display = 'none';
    
    const warningIcon = document.createElement('div');
    warningIcon.className = 'warning-icon';
    warningIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
    
    this.warningText = document.createElement('div');
    this.warningText.className = 'warning-text';
    this.warningText.textContent = '检测到中文输入！大多数AI绘图模型对英文理解更好，建议转换为英文后提交。';
    
    this.buttonsWrapper = document.createElement('div');
    this.buttonsWrapper.className = 'translate-buttons';
    
    const translateBtn = document.createElement('button');
    translateBtn.className = 'translate-btn';
    translateBtn.textContent = '翻译为英文';
    translateBtn.addEventListener('click', () => {
      if (typeof this.options.onTranslate === 'function') {
        this.options.onTranslate();
      }
    });
    
    const ignoreBtn = document.createElement('button');
    ignoreBtn.className = 'ignore-btn';
    ignoreBtn.textContent = '忽略';
    ignoreBtn.addEventListener('click', () => {
      if (typeof this.options.onIgnore === 'function') {
        this.options.onIgnore();
      }
    });
    
    this.buttonsWrapper.appendChild(translateBtn);
    this.buttonsWrapper.appendChild(ignoreBtn);
    
    this.element.appendChild(warningIcon);
    this.element.appendChild(this.warningText);
    this.element.appendChild(this.buttonsWrapper);
  }
  
  /**
   * 添加组件样式
   */
  addStyles() {
    // 检查是否已存在样式
    if (document.getElementById('translate-warning-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'translate-warning-styles';
    style.textContent = `
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
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 显示翻译警告
   */
  show() {
    // 恢复默认状态
    this.resetState();
    this.element.style.display = 'flex';
  }
  
  /**
   * 隐藏翻译警告
   */
  hide() {
    this.element.style.display = 'none';
  }
  
  /**
   * 设置翻译中状态
   * @param {boolean} isTranslating 是否正在翻译
   */
  setTranslating(isTranslating) {
    if (isTranslating) {
      this.warningText.textContent = '正在翻译...';
      this.buttonsWrapper.style.display = 'none';
    } else {
      this.resetState();
    }
  }
  
  /**
   * 设置错误状态
   * @param {string} errorMessage 错误信息
   */
  setError(errorMessage) {
    this.warningText.textContent = errorMessage;
    this.buttonsWrapper.style.display = 'flex';
  }
  
  /**
   * 重置为初始状态
   */
  resetState() {
    this.warningText.textContent = '检测到中文输入！大多数AI绘图模型对英文理解更好，建议转换为英文后提交。';
    this.buttonsWrapper.style.display = 'flex';
  }
  
  /**
   * 获取组件元素
   * @returns {HTMLElement} 组件元素
   */
  getElement() {
    return this.element;
  }
  
  /**
   * 检查是否可见
   * @returns {boolean} 是否可见
   */
  isVisible() {
    return this.element.style.display !== 'none';
  }
}

export default TranslateWarning; 