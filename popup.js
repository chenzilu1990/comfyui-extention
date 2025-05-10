// 导入API服务
import { PROVIDER_CONFIG, sendToComfyUI, sendToImageProvider } from './ApiService.js';

document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  // const endpointInput = document.getElementById('endpoint'); // 已移至设置页面
  const promptInput = document.getElementById('prompt');
  const generateBtn = document.getElementById('generate');
  const openSettingsBtn = document.getElementById('openSettings');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const historyContainerEl = document.getElementById('historyContainer');
  const clearHistoryBtn = document.getElementById('clearHistory');
  
  // 添加服务商选择器
  const providerSelectorContainer = document.querySelector('.provider-selector');
  providerSelectorContainer.innerHTML = `
    <div class="form-group">
      <label for="provider-selector">选择服务商:</label>
      <select id="provider-selector">
        <option value="comfyui">ComfyUI</option>
      </select>
    </div>
  `;
  
  const providerSelector = document.getElementById('provider-selector');
  
  // 用于存储从设置中加载的值
  let currentEndpoint = '';
  let currentWorkflowId = '';
  let currentComfyUIType = '';
  let currentComfyUIApiKey = '';
  let availableProviders = [];
  let currentProvider = 'comfyui'; // 默认使用ComfyUI
  
  // 历史记录数据
  let imageHistory = [];
  const MAX_HISTORY_ITEMS = 30; // 最多保存的历史记录数

  // 加载保存的设置
  function loadSettings() {
    // 加载ComfyUI设置
    chrome.storage.sync.get(['comfyui_type', 'endpoint', 'workflowId', 'comfyui_api_key'], function(data) {
      if (data.endpoint) {
        currentEndpoint = data.endpoint;
      }
      if (data.workflowId) {
        currentWorkflowId = data.workflowId;
      }
      if (data.comfyui_type) {
        currentComfyUIType = data.comfyui_type || 'localhost';
      }
      if (data.comfyui_api_key) {
        currentComfyUIApiKey = data.comfyui_api_key;
      }
      
      // 如果缺少ComfyUI设置，提示用户
      if (!currentEndpoint || !currentWorkflowId) {
        showStatus('请先在设置页面配置ComfyUI API端点和工作流ID', 'error');
        // 可以考虑禁用生成按钮，直到设置完成
        if (currentProvider === 'comfyui') {
          generateBtn.disabled = true;
        }
      } else if (currentProvider === 'comfyui') {
        generateBtn.disabled = false;
      }
    });
    
    // 加载可用的服务商
    chrome.storage.sync.get(null, function(data) {
      const providers = [];
      
      // 检查哪些服务商已配置
      Object.keys(data).forEach(key => {
        if (key.startsWith('provider_')) {
          const providerId = key.replace('provider_', '');
          if (PROVIDER_CONFIG[providerId]) {
            providers.push({
              id: providerId,
              name: PROVIDER_CONFIG[providerId].name,
              settings: data[key]
            });
          }
        }
      });
      
      availableProviders = providers;
      
      // 更新服务商选择器
      updateProviderSelector();
    });
    
    // 加载历史记录
    loadImageHistory();
  }
  
  // 更新服务商选择器
  function updateProviderSelector() {
    // 保留ComfyUI选项
    providerSelector.innerHTML = '<option value="comfyui">ComfyUI</option>';
    
    // 添加已配置的服务商
    availableProviders.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider.id;
      option.textContent = provider.name;
      providerSelector.appendChild(option);
    });
  }
  
  // 当服务商选择变化时
  providerSelector.addEventListener('change', function() {
    currentProvider = this.value;
    
    // 更新UI状态
    if (currentProvider === 'comfyui') {
      // 检查ComfyUI设置
      if (!currentEndpoint || !currentWorkflowId) {
        generateBtn.disabled = true;
        showStatus('请先在设置页面配置ComfyUI API端点和工作流ID', 'error');
      } else {
        generateBtn.disabled = false;
        showStatus('已选择ComfyUI作为生成服务', 'info');
      }
    } else {
      // 检查服务商设置
      const provider = availableProviders.find(p => p.id === currentProvider);
      if (provider && provider.settings && provider.settings.apiKey) {
        generateBtn.disabled = false;
        showStatus(`已选择${PROVIDER_CONFIG[currentProvider].name}作为生成服务`, 'info');
      } else {
        generateBtn.disabled = true;
        showStatus(`请先在设置页面配置${PROVIDER_CONFIG[currentProvider].name}`, 'error');
      }
    }
  });
  
  loadSettings(); // 页面加载时执行

  // 打开设置页面
  openSettingsBtn.addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('settings.html'));
    }
  });

  // 清除结果区域
  function clearResult() {
    resultEl.innerHTML = '';
  }

  // 生成图像
  generateBtn.addEventListener('click', async function() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
      showStatus('请输入提示词', 'error');
      return;
    }
    
    // 先清除上一次的结果
    clearResult();
    
    showStatus('正在生成图像...', 'success');
    
    try {
      // 根据选择的服务商执行不同的生成逻辑
      if (currentProvider === 'comfyui') {
        // 使用ComfyUI
        await sendToComfyUI(currentEndpoint, currentWorkflowId, prompt, [], showStatus, imageUrl => {
          displayGeneratedImage(imageUrl);
          saveToHistory(imageUrl, prompt);
        });
      } else {
        // 使用其他文生图服务商
        const provider = availableProviders.find(p => p.id === currentProvider);
        if (provider && provider.settings) {
          await sendToImageProvider(currentProvider, provider.settings, prompt, null, showStatus, imageUrl => {
            displayGeneratedImage(imageUrl);
            saveToHistory(imageUrl, prompt);
          });
        } else {
          showStatus(`未找到${currentProvider}的设置信息`, 'error');
        }
      }
    } catch (error) {
      showStatus(`生成图像时出错: ${error.message}`, 'error');
    }
  });

  // 显示生成的图像
  function displayGeneratedImage(imageUrl) {
    // 确保结果区域是空的
    clearResult();
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '100%';
    
    resultEl.appendChild(img);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;
    downloadLink.download = 'generated-image.png';
    downloadLink.className = 'download-btn';
    downloadLink.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      下载图像
    `;
    
    resultEl.appendChild(downloadLink);
    
    showStatus('图像生成完成!', 'success');
  }
  
  // 加载历史记录
  function loadImageHistory() {
    chrome.storage.local.get(['imageHistory'], function(result) {
      if (result.imageHistory && Array.isArray(result.imageHistory)) {
        imageHistory = result.imageHistory;
        renderHistoryItems();
      } else {
        imageHistory = [];
        renderHistoryItems();
      }
    });
  }
  
  // 保存图像到历史记录
  function saveToHistory(imageUrl, prompt) {
    const timestamp = new Date().toISOString();
    const newItem = {
      url: imageUrl,
      prompt: prompt,
      timestamp: timestamp,
      date: new Date().toLocaleString('zh-CN')
    };
    
    // 添加到历史记录的开头
    imageHistory.unshift(newItem);
    
    // 限制历史记录数量
    if (imageHistory.length > MAX_HISTORY_ITEMS) {
      imageHistory = imageHistory.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // 保存到存储
    chrome.storage.local.set({ imageHistory: imageHistory }, function() {
      console.log('历史记录已保存');
      renderHistoryItems();
    });
  }
  
  // 渲染历史记录
  function renderHistoryItems() {
    // 清空历史容器
    historyContainerEl.innerHTML = '';
    
    if (imageHistory.length === 0) {
      historyContainerEl.innerHTML = '<div class="no-history">暂无生成历史记录</div>';
      return;
    }
    
    // 添加历史记录项
    imageHistory.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.dataset.index = index;
      
      // 图片
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = `生成的图片 ${index + 1}`;
      img.loading = 'lazy'; // 延迟加载
      
      // 悬停时显示的提示信息
      const overlay = document.createElement('div');
      overlay.className = 'history-item-overlay';
      overlay.textContent = item.prompt.length > 30 ? item.prompt.substring(0, 30) + '...' : item.prompt;
      
      historyItem.appendChild(img);
      historyItem.appendChild(overlay);
      historyContainerEl.appendChild(historyItem);
      
      // 点击历史项时的事件处理
      historyItem.addEventListener('click', function() {
        const selectedItem = imageHistory[this.dataset.index];
        // 显示该历史记录的图像
        displayGeneratedImage(selectedItem.url);
        // 在提示词输入框中填入该历史记录的提示词
        promptInput.value = selectedItem.prompt;
      });
    });
  }
  
  // 清除历史记录
  clearHistoryBtn.addEventListener('click', function() {
    // 确认是否清除
    if (imageHistory.length > 0 && confirm('确定要清除所有历史记录吗？此操作不可撤销。')) {
      imageHistory = [];
      chrome.storage.local.remove('imageHistory', function() {
        console.log('历史记录已清除');
        renderHistoryItems();
        showStatus('历史记录已清除', 'info');
      });
    } else if (imageHistory.length === 0) {
      showStatus('没有历史记录可清除', 'info');
    }
  });
  
  // 显示状态消息
  function showStatus(message, type) {
    statusEl.innerHTML = '';
    
    let icon = '';
    if (type === 'success') {
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'info') {
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    statusEl.innerHTML = icon + message;
    statusEl.className = 'status visible';
    if(type) {
      statusEl.classList.add(type);
    }
    
    // 如果不是错误消息，3秒后自动隐藏
    // if (type !== 'error') {
    //   setTimeout(() => {
    //     statusEl.classList.remove('visible');
    //     setTimeout(() => {
    //       statusEl.className = 'status';
    //       statusEl.innerHTML = '';
    //     }, 300); // 等待淡出动画完成
    //   }, 3000);
    // }
  }
}); 