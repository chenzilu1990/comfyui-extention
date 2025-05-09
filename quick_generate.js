import { sendToComfyUI } from './ApiService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const headerTitle = document.querySelector('header h2');
  const promptTextEl = document.getElementById('promptText');
  const refImageEl = document.getElementById('refImage');
  const statusDiv = document.getElementById('status');
  const resultContainer = document.getElementById('resultContainer');
  const generatedImageEl = document.getElementById('generatedImage');
  const downloadLink = document.getElementById('downloadLink');
  const closeButton = document.getElementById('closeButton');

  // closeButton.addEventListener('click', () => window.close()); // 旧的关闭方式
  closeButton.addEventListener('click', () => {
    // 向父窗口 (content.js) 发送消息以关闭 iframe
    window.parent.postMessage({ type: 'close-quick-generate-iframe' }, '*'); //  '*' 用于目标源，实际项目中应指定确切的源
  });

  const urlParams = new URLSearchParams(window.location.search);
  const promptParam = urlParams.get('prompt') || ''; // 如果没有提供提示，则为空字符串
  const imageUrlParam = urlParams.get('imageUrl');

  // 显示输入
  promptTextEl.textContent = promptParam || (imageUrlParam ? "(基于图片)" : "(无提示词)");
  if (imageUrlParam) {
    refImageEl.src = imageUrlParam;
    refImageEl.style.display = 'block';
  }
  
  // 显示状态的函数
  function showQuickStatus(message, type) {
    statusDiv.innerHTML = ''; // 清除之前的状态
    const statusMessageP = document.createElement('p');
    statusMessageP.textContent = message;
    
    if (type === 'error') {
        statusDiv.innerHTML = `<div class="status-message error">${message}</div>`;
        headerTitle.textContent = "请求失败";
    } else if (type === 'success') {
        // 最终成功时，隐藏主状态区并显示图片
        statusDiv.style.display = 'none';
        resultContainer.style.display = 'block';
        headerTitle.textContent = "生成完成！";
    } else if (type === 'info') {
        // 信息或中间状态
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        statusDiv.appendChild(spinner);
        statusDiv.appendChild(statusMessageP);
        headerTitle.textContent = message; // 用中间状态更新标题
    } else {
        // 初始默认状态
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        statusDiv.appendChild(spinner);
        statusDiv.appendChild(statusMessageP);
    }
  }

  // 显示生成图片的函数
  function displayQuickGeneratedImage(imageUrl) {
    generatedImageEl.src = imageUrl;
    downloadLink.href = imageUrl;
    downloadLink.style.display = 'inline-block';
    showQuickStatus("生成完成！", "success");
  }

  showQuickStatus("正在获取设置...", null);

  // 获取ComfyUI设置
  chrome.storage.sync.get(['endpoint', 'workflowId', 'comfyui_type', 'comfyui_api_key'], async (settings) => {
    const { endpoint, workflowId } = settings;

    if (!endpoint || !workflowId) {
      showQuickStatus("错误：请先在扩展程序主设置中配置 ComfyUI 端点和工作流 ID。", 'error');
      return;
    }

    const imagesArray = imageUrlParam ? [imageUrlParam] : [];
    // 如果没有提供文本提示但有图片，则使用默认提示
    const effectivePrompt = promptParam || (imageUrlParam ? "基于参考图片生成" : "默认提示词");
    
    if (!effectivePrompt && !imagesArray.length) {
        showQuickStatus("错误：没有提供文本提示或参考图片来生成图像。", 'error');
        return;
    }

    showQuickStatus("正在发送请求至 ComfyUI...", 'info');

    try {
      await sendToComfyUI(endpoint, workflowId, effectivePrompt, imagesArray, showQuickStatus, displayQuickGeneratedImage);
    } catch (error) {
      console.error("Error calling sendToComfyUI:", error);
      showQuickStatus(`请求失败: ${error.message}`, 'error');
    }
  });
}); 