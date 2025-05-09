// 导入API服务
import { PROVIDER_CONFIG, sendToComfyUI, sendToImageProvider } from './ApiService.js';

document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  // const endpointInput = document.getElementById('endpoint'); // 已移至设置页面
  const promptInput = document.getElementById('prompt');
  const generateBtn = document.getElementById('generate');
  const captureBtn = document.getElementById('captureContent');
  const openSettingsBtn = document.getElementById('openSettings');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const selectedTextEl = document.getElementById('selectedText');
  const selectedImagesEl = document.getElementById('selectedImages');

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

  // 获取当前标签页选择的内容
  captureBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: capturePageContent
      }, displayCapturedContent);
    });
  });

  // 生成图像
  generateBtn.addEventListener('click', async function() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
      showStatus('请输入提示词', 'error');
      return;
    }
    
    showStatus('正在生成图像...', 'success');
    
    // 从页面获取选中的图像
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: getSelectedImages
      }, async function(results) {
        // 获取选中的图像
        const selectedImages = results[0].result || [];
        
        try {
          // 根据选择的服务商执行不同的生成逻辑
          if (currentProvider === 'comfyui') {
            // 使用ComfyUI
            await sendToComfyUI(currentEndpoint, currentWorkflowId, prompt, selectedImages, showStatus, displayGeneratedImage);
          } else {
            // 使用其他文生图服务商
            const provider = availableProviders.find(p => p.id === currentProvider);
            if (provider && provider.settings) {
              await sendToImageProvider(currentProvider, provider.settings, prompt, selectedImages[0], showStatus, displayGeneratedImage);
            } else {
              showStatus(`未找到${currentProvider}的设置信息`, 'error');
            }
          }
        } catch (error) {
          showStatus(`生成图像时出错: ${error.message}`, 'error');
        }
      });
    });
  });

  // 显示捕获的内容
  function displayCapturedContent(results) {
    if (!results || !results[0] || !results[0].result) {
      showStatus('无法获取页面内容', 'error');
      return;
    }
    
    const content = results[0].result;
    
    // 显示文本
    if (content.text) {
      selectedTextEl.textContent = content.text;
      promptInput.value = content.text;
    } else {
      selectedTextEl.textContent = '(无选中文本)';
    }
    
    // 显示图像
    selectedImagesEl.innerHTML = '';
    if (content.images && content.images.length > 0) {
      content.images.forEach(imgSrc => {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.style.margin = '5px';
        selectedImagesEl.appendChild(img);
      });
    } else {
      selectedImagesEl.textContent = '(无选中图像)';
    }
  }

  // 显示生成的图像
  function displayGeneratedImage(imageUrl) {
    resultEl.innerHTML = '';
    
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

// 在页面上执行的内容捕获函数
function capturePageContent() {
  const selection = window.getSelection();
  const selectionText = selection.toString();
  
  // 获取选中区域内的图像
  const selectedImages = [];
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // 如果选择区域是文本节点，获取其父元素
    const element = container.nodeType === 3 ? container.parentNode : container;
    
    // 查找选择区域内的所有图像
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (img.src) {
        selectedImages.push(img.src);
      }
    });
  }
  
  // 如果没有选中文本，但有选中的图像元素
  const clickedImage = document.activeElement.tagName === 'IMG' ? document.activeElement : null;
  if (!selectionText && !selectedImages.length && clickedImage && clickedImage.src) {
    selectedImages.push(clickedImage.src);
  }
  
  return {
    text: selectionText,
    images: selectedImages
  };
}

// 获取选中的图像
function getSelectedImages() {
  const selectedImages = [];
  
  // 获取选中区域内的图像
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // 如果选择区域是文本节点，获取其父元素
    const element = container.nodeType === 3 ? container.parentNode : container;
    
    // 查找选择区域内的所有图像
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (img.src) {
        selectedImages.push(img.src);
      }
    });
  }
  
  // 如果没有选中图像，但有点击的图像元素
  const clickedImage = document.activeElement.tagName === 'IMG' ? document.activeElement : null;
  if (!selectedImages.length && clickedImage && clickedImage.src) {
    selectedImages.push(clickedImage.src);
  }
  
  return selectedImages;
} 