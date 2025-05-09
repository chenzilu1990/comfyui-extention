document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const endpointInput = document.getElementById('endpoint');
  const promptInput = document.getElementById('prompt');
  const generateBtn = document.getElementById('generate');
  const captureBtn = document.getElementById('captureContent');
  const openSettingsBtn = document.getElementById('openSettings');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const selectedTextEl = document.getElementById('selectedText');
  const selectedImagesEl = document.getElementById('selectedImages');

  // 用于存储从设置中加载的值
  let currentEndpoint = '';
  let currentWorkflowId = '';

  // 加载保存的设置
  function loadSettings() {
    chrome.storage.sync.get(['endpoint', 'workflowId'], function(data) {
      if (data.endpoint) {
        endpointInput.value = data.endpoint;
        currentEndpoint = data.endpoint;
      }
      if (data.workflowId) {
        currentWorkflowId = data.workflowId;
      }
      // 如果缺少设置，提示用户
      if (!currentEndpoint || !currentWorkflowId) {
        showStatus('请先在设置页面配置API端点和工作流ID', 'error');
        // 可以考虑禁用生成按钮，直到设置完成
        generateBtn.disabled = true;
      } else {
        generateBtn.disabled = false;
      }
    });
  }
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
    // 使用从设置加载的值
    const endpoint = currentEndpoint;
    const workflowId = currentWorkflowId;
    const prompt = promptInput.value.trim();
    
    if (!endpoint) {
      showStatus('请输入ComfyUI API端点', 'error');
      return;
    }
    
    if (!workflowId) {
      showStatus('请输入工作流ID', 'error');
      return;
    }
    
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
        // 组合提示词和选中的图像发送到ComfyUI
        const selectedImages = results[0].result || [];
        sendToComfyUI(endpoint, workflowId, prompt, selectedImages);
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
    // 构建API请求
    const apiUrl = `${endpoint}/run`;
    
    // 构建ComfyUI工作流输入
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
    
    // 发送请求
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deployment_id: workflowId,
        inputs: workflowInputs
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // 处理返回结果
      if (data.run_id) {
        showStatus(`成功提交! 运行ID: ${data.run_id}`, 'success');
        
        // 轮询结果
        pollRunStatus(endpoint, data.run_id);
      } else {
        showStatus('提交成功，但未返回运行ID', 'error');
      }
    })
    .catch(error => {
      showStatus(`错误: ${error.message}`, 'error');
    });
  }
  
  // 轮询运行状态
  function pollRunStatus(endpoint, runId) {
    const statusUrl = `${endpoint}/run_status?run_id=${runId}`;
    
    const checkStatus = () => {
      fetch(statusUrl)
        .then(response => response.json())
        .then(data => {
          // 检查运行状态
          if (data.status === 'completed' || data.status === 'succeeded') {
            // 获取生成的图像
            if (data.outputs && data.outputs.length > 0 && data.outputs[0].type === 'image_url') {
              displayGeneratedImage(data.outputs[0].data.url);
            } else if (data.output && data.output.images && data.output.images.length > 0) {
              displayGeneratedImage(data.output.images[0].url);
            } else {
              showStatus('图像生成成功，但未找到输出图像的URL', 'error');
            }
          } else if (data.status === 'failed') {
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
    downloadLink.textContent = '下载图像';
    downloadLink.style.display = 'block';
    downloadLink.style.marginTop = '10px';
    
    resultEl.appendChild(downloadLink);
    
    showStatus('图像生成完成!', 'success');
  }
  
  // 显示状态消息
  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status';
    statusEl.classList.add(type);
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