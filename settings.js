// 服务商配置
const PROVIDER_CONFIG = {
  openai: {
    name: "OpenAI",
    description: "OpenAI的DALL-E模型",
    models: [
      {id: "dall-e-3", name: "DALL-E 3", description: "高质量图像生成，最大支持1024x1024分辨率"},
      {id: "dall-e-2", name: "DALL-E 2", description: "标准图像生成，支持多种尺寸"}
    ],
    additionalSettings: [
      {id: "size", name: "图像尺寸", type: "select", options: [
        {value: "1024x1024", label: "1024x1024 (标准)"},
        {value: "1792x1024", label: "1792x1024 (宽)"},
        {value: "1024x1792", label: "1024x1792 (高)"}
      ]}
    ],
    testEndpoint: "https://api.openai.com/v1/models",
    apiUrl: "https://api.openai.com/v1/images/generations"
  },
  midjourney: {
    name: "Midjourney",
    description: "通过API使用Midjourney",
    models: [
      {id: "mj-v5", name: "Midjourney v5", description: "当前最新版本的Midjourney"},
      {id: "mj-v4", name: "Midjourney v4", description: "旧版Midjourney"}
    ],
    additionalSettings: [
      {id: "quality", name: "质量", type: "select", options: [
        {value: "1", label: "标准"},
        {value: "2", label: "高质量"}
      ]},
      {id: "style", name: "风格", type: "select", options: [
        {value: "0", label: "无风格"},
        {value: "50", label: "低风格化"},
        {value: "100", label: "高风格化"}
      ]}
    ],
    testEndpoint: "https://api.midjourney.com/v1/ping",
    apiUrl: "https://api.midjourney.com/v1/generations"
  },
  stability: {
    name: "Stability AI",
    description: "Stable Diffusion API",
    models: [
      {id: "stable-diffusion-xl-1024-v1-0", name: "Stable Diffusion XL", description: "最高质量的Stable Diffusion模型"},
      {id: "stable-diffusion-v1-6", name: "Stable Diffusion 1.6", description: "标准Stable Diffusion模型"}
    ],
    additionalSettings: [
      {id: "samples", name: "样本数量", type: "select", options: [
        {value: "1", label: "1张图像"},
        {value: "2", label: "2张图像"},
        {value: "4", label: "4张图像"}
      ]},
      {id: "steps", name: "生成步数", type: "select", options: [
        {value: "30", label: "30步 (标准)"},
        {value: "50", label: "50步 (高质量)"}
      ]}
    ],
    testEndpoint: "https://api.stability.ai/v1/engines/list",
    apiUrl: "https://api.stability.ai/v1/generation"
  },
  leonardo: {
    name: "Leonardo.AI",
    description: "快速且高度可定制的AI图像生成",
    models: [
      {id: "leonardo-diffusion-xl", name: "Leonardo Diffusion XL", description: "Leonardo的高级模型"},
      {id: "dream-shaper-xl", name: "Dream Shaper XL", description: "梦幻风格模型"}
    ],
    additionalSettings: [
      {id: "num_images", name: "生成数量", type: "select", options: [
        {value: "1", label: "1张图像"},
        {value: "2", label: "2张图像"},
        {value: "4", label: "4张图像"}
      ]},
      {id: "width", name: "宽度", type: "select", options: [
        {value: "512", label: "512px"},
        {value: "768", label: "768px"},
        {value: "1024", label: "1024px"}
      ]},
      {id: "height", name: "高度", type: "select", options: [
        {value: "512", label: "512px"},
        {value: "768", label: "768px"},
        {value: "1024", label: "1024px"}
      ]}
    ],
    testEndpoint: "https://cloud.leonardo.ai/api/rest/v1/models",
    apiUrl: "https://cloud.leonardo.ai/api/rest/v1/generations"
  }
};

document.addEventListener('DOMContentLoaded', function() {
  // 获取ComfyUI设置DOM元素
  const endpointInput = document.getElementById('endpoint');
  const workflowIdInput = document.getElementById('workflowId');
  const comfyuiTypeSelect = document.getElementById('comfyui-type');
  const comfyuiApiKeyInput = document.getElementById('comfyui-api-key');
  const comfydeploySettings = document.getElementById('comfydeploy-settings');
  const saveComfySettingsBtn = document.getElementById('saveComfySettings');
  const testComfyAPIBtn = document.getElementById('testComfyAPI');
  const statusEl = document.getElementById('status');
  
  // 获取部署说明元素
  const localhostInfo = document.getElementById('localhost-info');
  const comfydeployInfo = document.getElementById('comfydeploy-info');
  const otherInfo = document.getElementById('other-info');
  
  // 获取服务商设置DOM元素
  const selectedProviderSelect = document.getElementById('selected-provider');
  const apiKeyInput = document.getElementById('api-key');
  const modelSelectionSelect = document.getElementById('model-selection');
  const providerSettingsTitle = document.getElementById('provider-settings-title');
  const additionalSettingsContainer = document.getElementById('additional-settings');
  const testProviderBtn = document.getElementById('testProvider');
  const saveProviderSettingsBtn = document.getElementById('saveProviderSettings');
  
  // 获取所有侧边栏项目
  const providerItems = document.querySelectorAll('.provider-item');
  const providerConfigs = document.querySelectorAll('.provider-config');
  
  // 当前选择的服务商
  let currentProvider = '';
  
  // 初始化服务商下拉列表
  function initProvidersList() {
    selectedProviderSelect.innerHTML = '';
    Object.keys(PROVIDER_CONFIG).forEach(providerId => {
      const provider = PROVIDER_CONFIG[providerId];
      const option = document.createElement('option');
      option.value = providerId;
      option.textContent = provider.name;
      selectedProviderSelect.appendChild(option);
    });
    
    // 默认选择第一个服务商
    if (Object.keys(PROVIDER_CONFIG).length > 0) {
      const firstProviderId = Object.keys(PROVIDER_CONFIG)[0];
      selectedProviderSelect.value = firstProviderId;
      loadProviderSettings(firstProviderId);
    }
  }
  
  // 加载服务商设置
  function loadProviderSettings(providerId) {
    currentProvider = providerId;
    const provider = PROVIDER_CONFIG[providerId];
    
    if (!provider) return;
    
    // 更新标题
    providerSettingsTitle.textContent = `${provider.name} 设置`;
    
    // 清空并填充模型选择
    modelSelectionSelect.innerHTML = '';
    provider.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      option.title = model.description;
      modelSelectionSelect.appendChild(option);
    });
    
    // 创建额外设置
    additionalSettingsContainer.innerHTML = '';
    if (provider.additionalSettings && provider.additionalSettings.length > 0) {
      provider.additionalSettings.forEach(setting => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.setAttribute('for', setting.id);
        label.textContent = setting.name;
        formGroup.appendChild(label);
        
        if (setting.type === 'select') {
          const select = document.createElement('select');
          select.id = setting.id;
          select.name = setting.id;
          
          setting.options.forEach(option => {
            const optEl = document.createElement('option');
            optEl.value = option.value;
            optEl.textContent = option.label;
            select.appendChild(optEl);
          });
          
          formGroup.appendChild(select);
        } else if (setting.type === 'text' || setting.type === 'number') {
          const input = document.createElement('input');
          input.type = setting.type;
          input.id = setting.id;
          input.name = setting.id;
          input.placeholder = setting.placeholder || '';
          formGroup.appendChild(input);
        }
        
        additionalSettingsContainer.appendChild(formGroup);
      });
    }
    
    // 从存储中加载已保存的设置
    chrome.storage.sync.get([`provider_${providerId}`], function(data) {
      const savedSettings = data[`provider_${providerId}`];
      if (savedSettings) {
        apiKeyInput.value = savedSettings.apiKey || '';
        if (savedSettings.model) {
          modelSelectionSelect.value = savedSettings.model;
        }
        
        // 加载额外设置
        if (savedSettings.additionalSettings) {
          Object.keys(savedSettings.additionalSettings).forEach(settingId => {
            const settingElement = document.getElementById(settingId);
            if (settingElement) {
              settingElement.value = savedSettings.additionalSettings[settingId];
            }
          });
        }
      }
    });
  }
  
  // 保存服务商设置
  function saveProviderSettings() {
    if (!currentProvider) {
      showStatus('请先选择一个服务商', 'error');
      return;
    }
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus('API密钥不能为空', 'error');
      return;
    }
    
    const model = modelSelectionSelect.value;
    if (!model) {
      showStatus('请选择一个模型', 'error');
      return;
    }
    
    // 收集额外设置
    const additionalSettings = {};
    const provider = PROVIDER_CONFIG[currentProvider];
    if (provider.additionalSettings) {
      provider.additionalSettings.forEach(setting => {
        const settingElement = document.getElementById(setting.id);
        if (settingElement) {
          additionalSettings[setting.id] = settingElement.value;
        }
      });
    }
    
    // 保存到存储
    const settingsKey = `provider_${currentProvider}`;
    const settingsToSave = {
      apiKey: apiKey,
      model: model,
      additionalSettings: additionalSettings
    };
    
    chrome.storage.sync.set({
      [settingsKey]: settingsToSave
    }, function() {
      if (chrome.runtime.lastError) {
        showStatus(`保存设置时出错: ${chrome.runtime.lastError.message}`, 'error');
      } else {
        showStatus(`${provider.name}的设置已成功保存!`, 'success');
      }
    });
  }
  
  // 测试服务商连接
  function testProviderConnection() {
    if (!currentProvider) {
      showStatus('请先选择一个服务商', 'error');
      return;
    }
    
    const provider = PROVIDER_CONFIG[currentProvider];
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('请输入API密钥', 'error');
      return;
    }
    
    showStatus(`正在测试${provider.name}的连接...`, 'info');
    
    fetch(provider.testEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API返回错误: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      showStatus(`成功连接到${provider.name}!`, 'success');
    })
    .catch(error => {
      showStatus(`连接测试失败: ${error.message}`, 'error');
    });
  }
  
  // 侧边栏切换
  function switchTab(tabId) {
    // 更新侧边栏选中状态
    providerItems.forEach(item => {
      if (item.dataset.provider === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // 更新内容区域显示
    providerConfigs.forEach(config => {
      if (config.id === `${tabId}-config`) {
        config.classList.add('active');
      } else {
        config.classList.remove('active');
      }
    });
  }
  
  // ComfyUI部署类型改变事件
  comfyuiTypeSelect.addEventListener('change', function() {
    const selectedType = this.value;
    
    // 重置所有部署说明的显示状态
    localhostInfo.style.display = 'none';
    comfydeployInfo.style.display = 'none';
    otherInfo.style.display = 'none';
    
    // 根据选择的类型显示相应的部署说明
    switch(selectedType) {
      case 'localhost':
        localhostInfo.style.display = 'block';
        comfydeploySettings.style.display = 'none';
        endpointInput.placeholder = 'http://localhost:8188';
        workflowIdInput.placeholder = '输入您的工作流ID';
        break;
      case 'comfydeploy':
        comfydeployInfo.style.display = 'block';
        comfydeploySettings.style.display = 'block';
        endpointInput.placeholder = 'https://your-instance.comfydeploy.com';
        workflowIdInput.placeholder = '输入您的部署ID';
        break;
      case 'other':
        otherInfo.style.display = 'block';
        comfydeploySettings.style.display = 'block';
        endpointInput.placeholder = '输入API端点URL';
        workflowIdInput.placeholder = '输入工作流或部署ID';
        break;
    }
  });

  // 加载ComfyUI设置
  function loadComfySettings() {
    chrome.storage.sync.get(['comfyui_type', 'endpoint', 'workflowId', 'comfyui_api_key'], function(data) {
      if (data.comfyui_type) {
        comfyuiTypeSelect.value = data.comfyui_type;
        // 触发change事件以更新UI
        comfyuiTypeSelect.dispatchEvent(new Event('change'));
      }
      if (data.endpoint) {
        endpointInput.value = data.endpoint;
      }
      if (data.workflowId) {
        workflowIdInput.value = data.workflowId;
      }
      if (data.comfyui_api_key) {
        comfyuiApiKeyInput.value = data.comfyui_api_key;
      }
    });
  }
  
  // 保存ComfyUI设置
  function saveComfySettings() {
    const comfyuiType = comfyuiTypeSelect.value;
    const endpoint = endpointInput.value.trim();
    const workflowId = workflowIdInput.value.trim();
    const apiKey = comfyuiApiKeyInput.value.trim();

    if (!endpoint) {
      showStatus('API端点不能为空', 'error');
      return;
    }

    if (!workflowId) {
      showStatus('工作流/部署ID不能为空', 'error');
      return;
    }
    
    // 对于ComfyDeploy和其他第三方服务，需要检查API密钥
    if ((comfyuiType === 'comfydeploy' || comfyuiType === 'other') && !apiKey) {
      showStatus('API密钥不能为空', 'error');
      return;
    }

    // 保存所有ComfyUI相关设置
    chrome.storage.sync.set({
      comfyui_type: comfyuiType,
      endpoint: endpoint,
      workflowId: workflowId,
      comfyui_api_key: apiKey
    }, function() {
      if (chrome.runtime.lastError) {
        showStatus(`保存设置时出错: ${chrome.runtime.lastError.message}`, 'error');
      } else {
        showStatus('ComfyUI设置已成功保存!', 'success');
      }
    });
  }

  // 测试ComfyUI API连接
  testComfyAPIBtn.addEventListener('click', function() {
    const comfyuiType = comfyuiTypeSelect.value;
    const endpoint = endpointInput.value.trim();
    const apiKey = comfyuiApiKeyInput.value.trim();
    
    if (!endpoint) {
      showStatus('请输入API端点', 'error');
      return;
    }
    
    // 对于ComfyDeploy和其他第三方服务，检查API密钥
    if ((comfyuiType === 'comfydeploy' || comfyuiType === 'other') && !apiKey) {
      showStatus('请输入API密钥', 'error');
      return;
    }
    
    // 构建测试请求
    let testUrl, headers = {};
    
    switch(comfyuiType) {
      case 'localhost':
        testUrl = `${endpoint}/system_stats`;
        break;
      case 'comfydeploy':
        testUrl = `${endpoint}/healthz`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'other':
        testUrl = `${endpoint}/healthz`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
    }
    
    showStatus('正在测试API连接...', 'info');
    
    fetch(testUrl, {
      method: 'GET',
      headers: headers
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API返回错误: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      showStatus('API连接成功!', 'success');
    })
    .catch(error => {
      showStatus(`连接测试失败: ${error.message}`, 'error');
    });
  });

  // 显示状态消息
  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status';
    if(type) {
      statusEl.classList.add(type);
    }
    
    // 如果不是错误消息，3秒后自动隐藏
    if (type !== 'error') {
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'status';
      }, 3000);
    }
  }

  // 初始化
  loadComfySettings();
  initProvidersList();
  
  // 事件监听
  saveComfySettingsBtn.addEventListener('click', saveComfySettings);
  saveProviderSettingsBtn.addEventListener('click', saveProviderSettings);
  testProviderBtn.addEventListener('click', testProviderConnection);
  
  // 服务商选择变化事件
  selectedProviderSelect.addEventListener('change', function() {
    loadProviderSettings(this.value);
  });
  
  // 侧边栏点击事件
  providerItems.forEach(item => {
    item.addEventListener('click', function() {
      switchTab(this.dataset.provider);
    });
  });
}); 