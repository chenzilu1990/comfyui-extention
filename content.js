console.log("Content script loaded.");

let uiContainer = null;

function removePreviousUI() {
  if (uiContainer && uiContainer.parentNode) {
    uiContainer.parentNode.removeChild(uiContainer);
    uiContainer = null;
  }
}

function showImageGeneratorUI(action, data) {
  removePreviousUI(); // 移除任何已存在的UI

  uiContainer = document.createElement('div');
  uiContainer.id = 'ai-image-generator-ui';
  // 基本样式，后续可以通过 style.css 完善
  uiContainer.style.position = 'fixed';
  uiContainer.style.top = '20px';
  uiContainer.style.right = '20px';
  uiContainer.style.width = '350px';
  uiContainer.style.backgroundColor = 'white';
  uiContainer.style.border = '1px solid #ccc';
  uiContainer.style.padding = '15px';
  uiContainer.style.zIndex = '10000'; // 确保在顶层
  uiContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  uiContainer.style.fontFamily = 'Arial, sans-serif';
  uiContainer.style.color = '#333';

  const title = document.createElement('h3');
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '16px';
  title.style.borderBottom = '1px solid #eee';
  title.style.paddingBottom = '5px';

  const contentArea = document.createElement('div');
  contentArea.style.marginBottom = '10px';

  const resultImage = document.createElement('img');
  resultImage.style.maxWidth = '100%';
  resultImage.style.maxHeight = '200px';
  resultImage.style.display = 'none'; // 默认隐藏
  resultImage.style.border = '1px solid #ddd';
  resultImage.style.marginTop = '10px';

  const loadingMessage = document.createElement('p');
  loadingMessage.textContent = '正在请求图像生成...';
  loadingMessage.style.color = '#777';

  if (action === 'TEXT_TO_IMAGE') {
    title.textContent = '文本生成图片';
    const textPreview = document.createElement('p');
    textPreview.textContent = `文本: "${data.substring(0, 100)}${data.length > 100 ? '...' : ''}"`;
    textPreview.style.fontSize = '12px';
    textPreview.style.wordBreak = 'break-all';
    contentArea.appendChild(textPreview);
    // 模拟API调用和结果
    mockApiCall(action, data, resultImage, loadingMessage);
  } else if (action === 'IMAGE_TO_IMAGE') {
    title.textContent = '图片生成图片';
    const imagePreview = document.createElement('img');
    imagePreview.src = data;
    imagePreview.style.maxWidth = '100px';
    imagePreview.style.maxHeight = '100px';
    imagePreview.style.border = '1px solid #ddd';
    const imageInfo = document.createElement('p');
    imageInfo.textContent = '基于以下图片:';
    imageInfo.style.fontSize = '12px';
    contentArea.appendChild(imageInfo);
    contentArea.appendChild(imagePreview);
    // 模拟API调用和结果
    mockApiCall(action, data, resultImage, loadingMessage);
  }

  const closeButton = document.createElement('button');
  closeButton.textContent = '关闭';
  closeButton.style.padding = '8px 12px';
  closeButton.style.border = 'none';
  closeButton.style.backgroundColor = '#f0f0f0';
  closeButton.style.cursor = 'pointer';
  closeButton.style.marginTop = '10px';
  closeButton.onclick = () => {
    removePreviousUI();
  };

  uiContainer.appendChild(title);
  uiContainer.appendChild(contentArea);
  uiContainer.appendChild(loadingMessage);
  uiContainer.appendChild(resultImage);
  uiContainer.appendChild(closeButton);
  document.body.appendChild(uiContainer);
}

// 模拟API调用
function mockApiCall(action, inputData, imageElement, loadingElement) {
  console.log(`Content Script: Mock API call for ${action} with data:`, inputData);
  loadingElement.textContent = '正在生成图片... (模拟)';
  
  // 模拟网络延迟和处理
  setTimeout(() => {
    // 假设这是从API返回的图片URL
    // 在实际应用中，您需要替换为真实的API调用
    const mockImageUrl = `https://via.placeholder.com/300x200.png?text=Generated+for+${action === 'TEXT_TO_IMAGE' ? 'Text' : 'Image'}`;
    
    imageElement.src = mockImageUrl;
    imageElement.style.display = 'block';
    loadingElement.textContent = '图片生成完成!';
    loadingElement.style.color = 'green';

    // 可以在这里向背景脚本发送消息，如果需要
    // chrome.runtime.sendMessage({ action: "IMAGE_GENERATED_SUCCESS", data: mockImageUrl });

  }, 2500); // 模拟2.5秒延迟
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script: Message received from background - ", message);
  if (message.action === "TEXT_TO_IMAGE" || message.action === "IMAGE_TO_IMAGE") {
    showImageGeneratorUI(message.action, message.data);
    sendResponse({ status: "UI shown", data: message.data });
  } else {
    sendResponse({ status: "Unknown action" });
  }
  return true; // 表示将异步发送响应
}); 