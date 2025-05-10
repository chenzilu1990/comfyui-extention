// 初始化上下文菜单
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单选项
  chrome.contextMenus.create({
    id: "textToImage",
    title: "使用选中文本生成图片",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "imageToImage",
    title: "基于选中图片生成新图片",
    contexts: ["image"]
  });
});

// 处理上下文菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab && tab.id) {
    let actionType = "";
    let data = null;

    if (info.menuItemId === "textToImage" && info.selectionText) {
      actionType = "TEXT_TO_IMAGE";
      data = info.selectionText;
      console.log("Background: Text selected - ", data);
    } else if (info.menuItemId === "imageToImage" && info.srcUrl) {
      actionType = "IMAGE_TO_IMAGE";
      data = info.srcUrl;
      console.log("Background: Image selected - ", data);
    }

    if (actionType && data) {
      chrome.tabs.sendMessage(tab.id, {
        action: actionType,
        data: data
      }).catch(error => {
        console.error("Background: Error sending message to content script:", error);
        // 尝试动态注入内容脚本并重试，如果错误是由于内容脚本未加载
        if (error.message && error.message.includes("Could not establish connection")) {
          console.log("Background: Content script might not be loaded. Attempting to inject.");
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          }).then(() => {
            console.log("Background: Content script injected. Retrying message.");
            // 动态注入CSS也可能需要，但这里简化处理
            chrome.tabs.sendMessage(tab.id, {
              action: actionType,
              data: data
            }).catch(err => console.error("Background: Error sending message after injection:", err));
          }).catch(err => console.error("Background: Error injecting content.js:", err));
        }
      });
    } else {
      console.log("Background: No action taken for context menu click.", info);
    }
  } else {
    console.error("Background: Tab ID is missing.", tab);
  }
});

// 监听来自弹出窗口或内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background: Message received from content script:", message);
  if (message.action === "REQUEST_FROM_CONTENT") {
    // 处理来自内容脚本的请求
    sendResponse({ status: "Received by background", originalData: message.data });
  }
  return true; // 异步sendResponse时需要
}); 