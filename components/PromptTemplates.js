/**
 * 提示词模板组件
 * 提供常用提示词模板和智能建议功能
 */
class PromptTemplates {
  constructor(options = {}) {
    this.options = Object.assign({
      onSelectTemplate: null,
      parentElement: null,
      maxSuggestions: 5
    }, options);
    
    this.element = null;
    this.templates = [
      {
        id: 'realistic',
        name: '写实风格',
        icon: '🖼️',
        template: 'photo-realistic, highly detailed, 8k, HD, perfect lighting, masterpiece'
      },
      {
        id: 'anime',
        name: '动漫风格',
        icon: '🎨',
        template: 'anime style, vibrant colors, detailed illustration, Studio Ghibli, cel shading'
      },
      {
        id: 'portrait',
        name: '人物肖像',
        icon: '👤',
        template: 'portrait of [subject], detailed facial features, dramatic lighting, professional photography'
      },
      {
        id: 'landscape',
        name: '风景',
        icon: '🏞️',
        template: 'stunning landscape, panoramic view, golden hour, perfect composition, ultra detailed'
      },
      {
        id: 'concept',
        name: '概念艺术',
        icon: '🎭',
        template: 'concept art, digital artwork, highly detailed, fantasy setting, trending on ArtStation'
      },
      {
        id: 'sketch',
        name: '素描',
        icon: '✏️',
        template: 'pencil sketch, detailed line art, black and white drawing, shading, high contrast'
      }
    ];
    
    this.categories = [
      {
        id: 'styles',
        name: '风格',
        tags: [
          { name: '写实', value: 'realistic,' },
          { name: '动漫', value: 'anime style,' },
          { name: '油画', value: 'oil painting,' },
          { name: '水彩', value: 'watercolor,' },
          { name: '像素', value: 'pixel art,' },
          { name: '3D渲染', value: '3D rendering,' },
          { name: '赛博朋克', value: 'cyberpunk,' },
          { name: '科幻', value: 'sci-fi,' },
          { name: '奇幻', value: 'fantasy,' }
        ]
      },
      {
        id: 'quality',
        name: '质量',
        tags: [
          { name: '高清', value: 'high-definition,' },
          { name: '细节', value: 'detailed,' },
          { name: '8K', value: '8K,' },
          { name: '精细', value: 'highly detailed,' },
          { name: '完美光照', value: 'perfect lighting,' },
          { name: '杰作', value: 'masterpiece,' }
        ]
      },
      {
        id: 'lighting',
        name: '光照',
        tags: [
          { name: '日落', value: 'sunset lighting,' },
          { name: '戏剧性', value: 'dramatic lighting,' },
          { name: '柔和', value: 'soft lighting,' },
          { name: '霓虹', value: 'neon lighting,' },
          { name: '自然', value: 'natural lighting,' }
        ]
      }
    ];
    
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
    this.element.className = 'prompt-templates';
    
    // 创建模板选择区域
    const templatesWrapper = document.createElement('div');
    templatesWrapper.className = 'templates-wrapper';
    this.element.appendChild(templatesWrapper);
    
    // 添加标题
    const templateTitle = document.createElement('div');
    templateTitle.className = 'template-section-title';
    templateTitle.textContent = '常用模板';
    templatesWrapper.appendChild(templateTitle);
    
    // 创建模板列表
    const templatesList = document.createElement('div');
    templatesList.className = 'templates-list';
    templatesWrapper.appendChild(templatesList);
    
    // 添加模板
    this.templates.forEach(template => {
      const templateItem = document.createElement('div');
      templateItem.className = 'template-item';
      templateItem.dataset.id = template.id;
      templateItem.innerHTML = `
        <span class="template-icon">${template.icon}</span>
        <span class="template-name">${template.name}</span>
      `;
      templateItem.title = template.template;
      
      templateItem.addEventListener('click', () => {
        this.selectTemplate(template);
      });
      
      templatesList.appendChild(templateItem);
    });
    
    // 创建类别和标签选择区域
    const tagsWrapper = document.createElement('div');
    tagsWrapper.className = 'tags-wrapper';
    this.element.appendChild(tagsWrapper);
    
    // 添加类别和标签
    this.categories.forEach(category => {
      // 添加类别标题
      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'category-title';
      categoryTitle.textContent = category.name;
      tagsWrapper.appendChild(categoryTitle);
      
      // 添加标签列表
      const tagsList = document.createElement('div');
      tagsList.className = 'tags-list';
      tagsWrapper.appendChild(tagsList);
      
      // 添加标签
      category.tags.forEach(tag => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.textContent = tag.name;
        tagItem.dataset.value = tag.value;
        
        tagItem.addEventListener('click', () => {
          this.selectTag(tag);
        });
        
        tagsList.appendChild(tagItem);
      });
    });
    
    // 添加组件到父元素
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
    // 这里可以添加全局事件，如关闭标签选择器等
    document.addEventListener('click', (e) => {
      // 处理点击组件外部的情况
    });
  }
  
  /**
   * 添加组件样式
   */
  addStyles() {
    // 检查是否已存在样式
    if (document.getElementById('prompt-templates-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'prompt-templates-styles';
    style.textContent = `
      .prompt-templates {
        width: 100%;
        margin-bottom: 12px;
      }
      
      .template-section-title {
        font-size: 12px;
        color: var(--text-secondary, #4b5563);
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .templates-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .template-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background-color: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        color: var(--text-primary, #111827);
        transition: all 0.2s;
        max-width: 100px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .template-item:hover {
        background-color: var(--primary-color, #4f46e5);
        color: white;
        border-color: var(--primary-color, #4f46e5);
      }
      
      .template-icon {
        font-size: 14px;
      }
      
      .category-title {
        font-size: 12px;
        color: var(--text-secondary, #4b5563);
        margin: 8px 0 6px 0;
        font-weight: 500;
      }
      
      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
      }
      
      .tag-item {
        padding: 4px 8px;
        background-color: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
        cursor: pointer;
        font-size: 11px;
        color: var(--text-primary, #111827);
        transition: all 0.2s;
      }
      
      .tag-item:hover {
        background-color: var(--primary-color, #4f46e5);
        color: white;
        border-color: var(--primary-color, #4f46e5);
      }
      
      .tag-item.active {
        background-color: var(--primary-color, #4f46e5);
        color: white;
        border-color: var(--primary-color, #4f46e5);
      }
      
      .templates-wrapper, .tags-wrapper {
        margin-bottom: 8px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 选择模板
   * @param {Object} template 选择的模板
   */
  selectTemplate(template) {
    if (typeof this.options.onSelectTemplate === 'function') {
      this.options.onSelectTemplate(template.template);
    }
  }
  
  /**
   * 选择标签
   * @param {Object} tag 选择的标签
   */
  selectTag(tag) {
    if (typeof this.options.onSelectTag === 'function') {
      this.options.onSelectTag(tag.value);
    }
  }
  
  /**
   * 根据当前输入内容生成建议
   * @param {string} input 当前输入内容
   * @returns {Array} 建议列表
   */
  getSuggestions(input) {
    // 这里可以实现更复杂的逻辑，根据当前输入推荐相关标签
    if (!input || input.trim() === '') {
      return [];
    }
    
    // 简单实现：返回与输入文本匹配的标签
    const suggestions = [];
    
    this.categories.forEach(category => {
      category.tags.forEach(tag => {
        if (
          tag.name.toLowerCase().includes(input.toLowerCase()) || 
          tag.value.toLowerCase().includes(input.toLowerCase())
        ) {
          suggestions.push(tag);
        }
      });
    });
    
    return suggestions.slice(0, this.options.maxSuggestions);
  }
  
  /**
   * 设置组件可见性
   * @param {boolean} visible 是否可见
   */
  setVisible(visible) {
    if (this.element) {
      this.element.style.display = visible ? 'block' : 'none';
    }
  }
}

export default PromptTemplates; 