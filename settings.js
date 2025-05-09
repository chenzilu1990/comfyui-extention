document.addEventListener('DOMContentLoaded', function() {
  const endpointInput = document.getElementById('endpoint');
  const workflowIdInput = document.getElementById('workflowId');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const statusEl = document.getElementById('status');

  // 加载已保存的设置
  chrome.storage.sync.get(['endpoint', 'workflowId'], function(data) {
    if (data.endpoint) {
      endpointInput.value = data.endpoint;
    }
    if (data.workflowId) {
      workflowIdInput.value = data.workflowId;
    }
  });

  // 保存设置
  saveSettingsBtn.addEventListener('click', function() {
    const endpoint = endpointInput.value.trim();
    const workflowId = workflowIdInput.value.trim();

    if (!endpoint || !workflowId) {
      showStatus('API 端点和工作流 ID 不能为空', 'error');
      return;
    }

    chrome.storage.sync.set({
      endpoint: endpoint,
      workflowId: workflowId
    }, function() {
      // 检查是否有运行时错误
      if (chrome.runtime.lastError) {
        showStatus(`保存设置时出错: ${chrome.runtime.lastError.message}`, 'error');
      } else {
        showStatus('设置已成功保存!', 'success');
      }
    });
  });

  // 显示状态消息
  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status '; // 添加一个空格以便于添加类型类名
    statusEl.classList.add(type);
    // 自动隐藏消息
    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'status';
    }, 3000);
  }
}); 