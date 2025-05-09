// 监听来自弹出窗口或背景脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getPageContent") {
    // 获取当前选中的文本
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    // 获取当前页面上所有的图像
    const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
    
    // 返回内容
    sendResponse({
      text: selectedText,
      images: images
    });
  }
  
  if (message.action === "getSelectedImages") {
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
    
    sendResponse({
      images: selectedImages
    });
  }
});

// 在右键点击图像或选中文本时，向背景脚本发送消息
document.addEventListener('contextmenu', (event) => {
  // 检查是否是图像
  const isImage = event.target.tagName === 'IMG';
  
  // 检查是否有选中文本
  const hasSelectedText = window.getSelection().toString().length > 0;
  
  if (isImage || hasSelectedText) {
    chrome.runtime.sendMessage({
      action: "contentRightClicked",
      data: {
        isImage: isImage,
        hasSelectedText: hasSelectedText,
        imageUrl: isImage ? event.target.src : null,
        selectedText: hasSelectedText ? window.getSelection().toString() : null
      }
    });
  }
}); 