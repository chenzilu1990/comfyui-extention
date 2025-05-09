// 初始化上下文菜单
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单选项
  chrome.contextMenus.create({
    id: "captureText",
    title: "使用文本生成图像",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "captureImage",
    title: "使用此图像生成新图像",
    contexts: ["image"]
  });
  
  chrome.contextMenus.create({
    id: "captureBoth",
    title: "使用文本和图像生成",
    contexts: ["selection", "image"]
  });
});

// 处理上下文菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "captureText" || info.menuItemId === "captureImage" || info.menuItemId === "captureBoth") {
    // 打开弹出窗口
    chrome.action.openPopup();
    
    // 存储选择的内容
    let dataToStore = {};
    
    if (info.selectionText) {
      dataToStore.selectedText = info.selectionText;
    }
    
    if (info.srcUrl) {
      dataToStore.selectedImage = info.srcUrl;
    }
    
    // 临时存储数据
    chrome.storage.local.set(dataToStore);
    
    // 向弹出窗口发送消息
    chrome.runtime.sendMessage({
      action: "contentSelected",
      data: dataToStore
    });
  }
});

// 监听来自弹出窗口或内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedContent") {
    // 从存储中获取选中的内容
    chrome.storage.local.get(["selectedText", "selectedImage"], (data) => {
      sendResponse({
        text: data.selectedText || "",
        image: data.selectedImage || ""
      });
      
      // 清除存储的数据
      chrome.storage.local.remove(["selectedText", "selectedImage"]);
    });
    
    // 返回true表示会异步发送响应
    return true;
  }
}); 