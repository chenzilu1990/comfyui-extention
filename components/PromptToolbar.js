/**
 * 提示词工具栏组件
 */
class PromptToolbar {
  constructor(options = {}) {
    this.options = Object.assign({
      onClear: null,
      onToggleHistory: null,
      onToggleTemplates: null,
      showTemplates: true
    }, options);
    
    this.element = null;
    this.templatesToggleBtn = null;
    
    this.render();
    this.addStyles();
  }
  
  /**
   * 渲染组件
   */
  render() {
    // 创建工具栏
    this.element = document.createElement('div');
    this.element.className = 'prompt-toolbar';
    
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
    
    // 如果初始状态为显示模板，则添加激活样式
    if (this.options.showTemplates) {
      this.templatesToggleBtn.classList.add('active');
    }
    
    this.templatesToggleBtn.addEventListener('click', () => {
      if (typeof this.options.onToggleTemplates === 'function') {
        this.options.onToggleTemplates();
      }
    });
    
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
    clearBtn.addEventListener('click', () => {
      if (typeof this.options.onClear === 'function') {
        this.options.onClear();
      }
    });
    
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
    historyBtn.addEventListener('click', () => {
      if (typeof this.options.onToggleHistory === 'function') {
        this.options.onToggleHistory();
      }
    });
    
    // 添加按钮到工具栏
    this.element.appendChild(this.templatesToggleBtn);
    this.element.appendChild(clearBtn);
    this.element.appendChild(historyBtn);
  }
  
  /**
   * 添加组件样式
   */
  addStyles() {
    // 检查是否已存在样式
    if (document.getElementById('prompt-toolbar-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'prompt-toolbar-styles';
    style.textContent = `
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
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 获取组件元素
   * @returns {HTMLElement} 组件元素
   */
  getElement() {
    return this.element;
  }
  
  /**
   * 设置模板按钮激活状态
   * @param {boolean} active 是否激活
   */
  setTemplatesActive(active) {
    if (active) {
      this.templatesToggleBtn.classList.add('active');
    } else {
      this.templatesToggleBtn.classList.remove('active');
    }
  }
}

export default PromptToolbar; 