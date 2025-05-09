// 服务商配置，需要保持与 settings.js 中相同
const PROVIDER_CONFIG = {
  openai: {
    name: "OpenAI",
    apiUrl: "https://api.openai.com/v1/images/generations"
  },
  midjourney: {
    name: "Midjourney",
    apiUrl: "https://api.midjourney.com/v1/generations"
  },
  stability: {
    name: "Stability AI",
    apiUrl: "https://api.stability.ai/v1/generation"
  },
  leonardo: {
    name: "Leonardo.AI",
    apiUrl: "https://cloud.leonardo.ai/api/rest/v1/generations"
  }
};

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
  generateBtn.addEventListener('click', function() {
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
      }, function(results) {
        // 获取选中的图像
        const selectedImages = results[0].result || [];
        
        // 根据选择的服务商执行不同的生成逻辑
        if (currentProvider === 'comfyui') {
          // 使用ComfyUI
          sendToComfyUI(currentEndpoint, currentWorkflowId, prompt, selectedImages);
        } else {
          // 使用其他文生图服务商
          const provider = availableProviders.find(p => p.id === currentProvider);
          if (provider && provider.settings) {
            sendToImageProvider(currentProvider, provider.settings, prompt, selectedImages[0]);
          } else {
            showStatus(`未找到${currentProvider}的设置信息`, 'error');
          }
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

  // 发送到ComfyUI API
  function sendToComfyUI(endpoint, workflowId, prompt, images) {
    // 获取当前ComfyUI类型和API密钥
    chrome.storage.sync.get(['comfyui_type', 'comfyui_api_key'], function(data) {
      const comfyuiType = data.comfyui_type || 'localhost';
      const apiKey = data.comfyui_api_key || '';
      
      // 根据不同类型构建API请求
      let apiUrl, headers = { 'Content-Type': 'application/json' };
      
      switch(comfyuiType) {
        case 'localhost': 
          apiUrl = `${endpoint}/queue`;
          break;
        case 'comfydeploy':
          apiUrl = `${endpoint}/run/deployment/queue`;
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
        case 'other':
          apiUrl = `${endpoint}/api/queue`;
          if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
          }
          break;
      }
      
      // 构建工作流输入
      const workflowInputs = {
        prompt: {
          type: "string",
          value: prompt
        }
      };
      
      // 如果有选中的图像，添加到工作流输入
      if (images && images.length > 0) {
        workflowInputs.image = {
          type: "image", 
          value: images[0] // 使用第一张选中的图像
        };
      }
      
      // 准备请求主体
      let requestBody;
      if (comfyuiType === 'comfydeploy') {
        requestBody = {
          deployment_id: workflowId,
          inputs: workflowInputs
        };
      } else {
        requestBody = {
          workflow_id: workflowId,
          inputs: workflowInputs
        };
      }
      
      // 发送请求
      fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API错误: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // 处理返回结果
        let runId = data.run_id || data.id || data.task_id;
        
        if (runId) {
          showStatus(`成功提交! 运行ID: ${runId}`, 'success');
          
          // 轮询结果
          pollComfyUIStatus(endpoint, runId, comfyuiType, apiKey);
        } else {
          showStatus('提交成功，但未返回运行ID', 'error');
        }
      })
      .catch(error => {
        showStatus(`错误: ${error.message}`, 'error');
      });
    });
  }

  // 轮询ComfyUI运行状态
  function pollComfyUIStatus(endpoint, runId, comfyuiType, apiKey) {
    // 根据不同类型构建状态URL
    let statusUrl, headers = {};
    
    switch(comfyuiType) {
      case 'localhost':
        statusUrl = `${endpoint}/history/${runId}`;
        break;
      case 'comfydeploy':
        statusUrl = `${endpoint}/run/${runId}`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'other':
        statusUrl = `${endpoint}/api/runs/${runId}`;
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        break;
    }
    
    const checkStatus = () => {
      fetch(statusUrl, { headers })
        .then(response => response.json())
        .then(data => {
          // 检查运行状态，根据不同类型处理不同的响应格式
          let status = data.status || '';
          let outputImage = null;
          
          // 根据不同类型提取图像
          if (comfyuiType === 'localhost') {
            if (data.outputs && data.outputs[0] && data.outputs[0].images && data.outputs[0].images.length > 0) {
              outputImage = `${endpoint}/view?filename=${data.outputs[0].images[0].filename}&type=output`;
              status = 'completed';
            }
          } else if (comfyuiType === 'comfydeploy') {
            if (status === 'completed' || status === 'succeeded') {
              if (data.outputs && data.outputs.length > 0 && data.outputs[0].type === 'image_url') {
                outputImage = data.outputs[0].data.url;
              } else if (data.output && data.output.images && data.output.images.length > 0) {
                outputImage = data.output.images[0].url;
              }
            }
          } else {
            if (status === 'completed') {
              if (data.outputs && data.outputs.image) {
                outputImage = data.outputs.image;
              }
            }
          }
          
          if (status === 'completed' || status === 'succeeded') {
            if (outputImage) {
              displayGeneratedImage(outputImage);
            } else {
              showStatus('图像生成成功，但未找到输出图像', 'error');
            }
          } else if (status === 'failed') {
            showStatus(`生成失败: ${data.error || '未知错误'}`, 'error');
          } else {
            // 继续轮询
            setTimeout(checkStatus, 1000);
          }
        })
        .catch(error => {
          showStatus(`检查状态错误: ${error.message}`, 'error');
        });
    };
    
    // 开始轮询
    setTimeout(checkStatus, 1000);
  }

  // 发送到第三方文生图服务商
  function sendToImageProvider(providerId, settings, prompt, referenceImage) {
    const provider = PROVIDER_CONFIG[providerId];
    if (!provider) {
      showStatus(`未找到服务商: ${providerId}`, 'error');
      return;
    }
    
    let requestBody = {};
    let headers = {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    };
    
    // 根据不同服务商准备请求
    switch (providerId) {
      case 'openai':
        requestBody = {
          model: settings.model,
          prompt: prompt,
          n: 1
        };
        
        // 添加额外设置
        if (settings.additionalSettings && settings.additionalSettings.size) {
          requestBody.size = settings.additionalSettings.size;
        }
        
        // 如果有参考图像，使用 DALL-E 的图像变体 API
        if (referenceImage) {
          requestBody.image = referenceImage;
          // 注意：这里应该换成OpenAI的变体API
          provider.apiUrl = "https://api.openai.com/v1/images/variations";
        }
        break;
        
      case 'stability':
        requestBody = {
          text_prompts: [
            {
              text: prompt
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1
        };
        
        // 设置模型
        provider.apiUrl = `https://api.stability.ai/v1/generation/${settings.model}/text-to-image`;
        
        // 添加额外设置
        if (settings.additionalSettings) {
          if (settings.additionalSettings.samples) {
            requestBody.samples = parseInt(settings.additionalSettings.samples);
          }
          if (settings.additionalSettings.steps) {
            requestBody.steps = parseInt(settings.additionalSettings.steps);
          }
        }
        break;
        
      case 'midjourney':
        requestBody = {
          prompt: prompt,
          version: settings.model
        };
        
        // 添加额外设置
        if (settings.additionalSettings) {
          if (settings.additionalSettings.quality) {
            requestBody.quality = parseInt(settings.additionalSettings.quality);
          }
          if (settings.additionalSettings.style) {
            requestBody.style = parseInt(settings.additionalSettings.style);
          }
        }
        break;
        
      case 'leonardo':
        requestBody = {
          prompt: prompt,
          modelId: settings.model,
          num_images: 1
        };
        
        // 添加额外设置
        if (settings.additionalSettings) {
          if (settings.additionalSettings.num_images) {
            requestBody.num_images = parseInt(settings.additionalSettings.num_images);
          }
          if (settings.additionalSettings.width && settings.additionalSettings.height) {
            requestBody.width = parseInt(settings.additionalSettings.width);
            requestBody.height = parseInt(settings.additionalSettings.height);
          }
        }
        break;
        
      default:
        showStatus(`不支持的服务商: ${providerId}`, 'error');
        return;
    }
    
    // 发送API请求
    fetch(provider.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // 根据不同服务商处理返回结果
      let imageUrl = '';
      
      switch (providerId) {
        case 'openai':
          if (data.data && data.data.length > 0 && data.data[0].url) {
            imageUrl = data.data[0].url;
            displayGeneratedImage(imageUrl);
          }
          break;
          
        case 'stability':
          if (data.artifacts && data.artifacts.length > 0 && data.artifacts[0].base64) {
            imageUrl = 'data:image/png;base64,' + data.artifacts[0].base64;
            displayGeneratedImage(imageUrl);
          }
          break;
          
        case 'midjourney':
          if (data.image_url) {
            imageUrl = data.image_url;
            displayGeneratedImage(imageUrl);
          } else if (data.task_id) {
            // Midjourney可能需要轮询结果
            pollMidJourneyStatus(data.task_id, settings.apiKey);
          }
          break;
          
        case 'leonardo':
          if (data.generationId) {
            // Leonardo需要轮询结果
            pollLeonardoStatus(data.generationId, settings.apiKey);
          }
          break;
      }
      
      if (!imageUrl && !data.task_id && !data.generationId) {
        showStatus('API返回成功，但未找到图像URL', 'error');
      }
    })
    .catch(error => {
      showStatus(`API错误: ${error.message}`, 'error');
    });
  }
  
  // 轮询MidJourney状态
  function pollMidJourneyStatus(taskId, apiKey) {
    const statusUrl = `https://api.midjourney.com/v1/tasks/${taskId}`;
    
    const checkStatus = () => {
      fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.status === 'completed') {
            if (data.image_url) {
              displayGeneratedImage(data.image_url);
            } else {
              showStatus('MidJourney任务完成，但未找到图像URL', 'error');
            }
          } else if (data.status === 'failed') {
            showStatus(`MidJourney生成失败: ${data.error || '未知错误'}`, 'error');
          } else {
            // 继续轮询
            setTimeout(checkStatus, 2000);
          }
        })
        .catch(error => {
          showStatus(`检查MidJourney状态错误: ${error.message}`, 'error');
        });
    };
    
    // 开始轮询
    setTimeout(checkStatus, 2000);
  }
  
  // 轮询Leonardo.AI状态
  function pollLeonardoStatus(generationId, apiKey) {
    const statusUrl = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`;
    
    const checkStatus = () => {
      fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.status === 'COMPLETE') {
            if (data.generations && data.generations.length > 0) {
              displayGeneratedImage(data.generations[0].url);
            } else {
              showStatus('Leonardo任务完成，但未找到图像URL', 'error');
            }
          } else if (data.status === 'FAILED') {
            showStatus(`Leonardo生成失败: ${data.error || '未知错误'}`, 'error');
          } else {
            // 继续轮询
            setTimeout(checkStatus, 2000);
          }
        })
        .catch(error => {
          showStatus(`检查Leonardo状态错误: ${error.message}`, 'error');
        });
    };
    
    // 开始轮询
    setTimeout(checkStatus, 2000);
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
    if (type !== 'error') {
      setTimeout(() => {
        statusEl.classList.remove('visible');
        setTimeout(() => {
          statusEl.className = 'status';
          statusEl.innerHTML = '';
        }, 300); // 等待淡出动画完成
      }, 3000);
    }
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