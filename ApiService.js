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

// 发送到ComfyUI API
async function sendToComfyUI(endpoint, workflowId, prompt, images, statusCallback, displayImageCallback) {
  // 获取当前ComfyUI类型和API密钥
  return new Promise((resolve) => {
    chrome.storage.sync.get(['comfyui_type', 'comfyui_api_key'], async function(data) {
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
      let workflowInputs;
      if (comfyuiType === 'comfydeploy') {
        workflowInputs = {
          input_text: prompt
        }
      } else {
        workflowInputs = {
          prompt: prompt
        }
      }
      
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
      
      try {
        // 发送请求
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`API错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 处理返回结果
        let runId = data.run_id || data.id || data.task_id;
        
        if (runId) {
          statusCallback(`成功提交! 运行ID: ${runId}`, 'success');
          
          // 轮询结果
          await pollComfyUIStatus(endpoint, runId, comfyuiType, apiKey, statusCallback, displayImageCallback);
          resolve();
        } else {
          statusCallback('提交成功，但未返回运行ID', 'error');
          resolve();
        }
      } catch (error) {
        statusCallback(`错误: ${error.message}`, 'error');
        resolve();
      }
    });
  });
}

// 轮询ComfyUI运行状态
async function pollComfyUIStatus(endpoint, runId, comfyuiType, apiKey, statusCallback, displayImageCallback) {
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
  
  const checkStatus = async () => {
    try {
      const response = await fetch(statusUrl, { headers });
      const data = await response.json();
      
      // 检查运行状态，根据不同类型处理不同的响应格式
      statusCallback(`ComfyUI状态: ${data.status}`, 'info');
      let status = data.status || '';
      let outputImage = null;
      
      // 根据不同类型提取图像
      if (comfyuiType === 'localhost') {
        if (data.outputs && data.outputs[0] && data.outputs[0].images && data.outputs[0].images.length > 0) {
          outputImage = `${endpoint}/view?filename=${data.outputs[0].images[0].filename}&type=output`;
          status = 'completed';
        }
      } else if (comfyuiType === 'comfydeploy') {
        if (status === 'completed' || status === 'success') {
          if (data.outputs && data.outputs.length > 0) {
            outputImage = data.outputs[0].data.images[0].url;
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
      
      if (status === 'completed' || status === 'success') {
        if (outputImage) {
          displayImageCallback(outputImage);
        } else {
          statusCallback('图像生成成功，但未找到输出图像', 'error');
        }
      } else if (status === 'failed') {
        statusCallback(`生成失败: ${data.error || '未知错误'}`, 'error');
      } else {
        // 继续轮询
        setTimeout(checkStatus, 2000);
      }
    } catch (error) {
      statusCallback(`检查状态错误: ${error.message}`, 'error');
    }
  };
  
  // 开始轮询
  setTimeout(checkStatus, 1000);
}

// 发送到第三方文生图服务商
async function sendToImageProvider(providerId, settings, prompt, referenceImage, statusCallback, displayImageCallback) {
  const provider = PROVIDER_CONFIG[providerId];
  if (!provider) {
    statusCallback(`未找到服务商: ${providerId}`, 'error');
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
      statusCallback(`不支持的服务商: ${providerId}`, 'error');
      return;
  }
  
  try {
    // 发送API请求
    const response = await fetch(provider.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 根据不同服务商处理返回结果
    let imageUrl = '';
    
    switch (providerId) {
      case 'openai':
        if (data.data && data.data.length > 0 && data.data[0].url) {
          imageUrl = data.data[0].url;
          displayImageCallback(imageUrl);
        }
        break;
        
      case 'stability':
        if (data.artifacts && data.artifacts.length > 0 && data.artifacts[0].base64) {
          imageUrl = 'data:image/png;base64,' + data.artifacts[0].base64;
          displayImageCallback(imageUrl);
        }
        break;
        
      case 'midjourney':
        if (data.image_url) {
          imageUrl = data.image_url;
          displayImageCallback(imageUrl);
        } else if (data.task_id) {
          // Midjourney可能需要轮询结果
          await pollMidJourneyStatus(data.task_id, settings.apiKey, statusCallback, displayImageCallback);
        }
        break;
        
      case 'leonardo':
        if (data.generationId) {
          // Leonardo需要轮询结果
          await pollLeonardoStatus(data.generationId, settings.apiKey, statusCallback, displayImageCallback);
        }
        break;
    }
    
    if (!imageUrl && !data.task_id && !data.generationId) {
      statusCallback('API返回成功，但未找到图像URL', 'error');
    }
  } catch (error) {
    statusCallback(`API错误: ${error.message}`, 'error');
  }
}

// 轮询MidJourney状态
async function pollMidJourneyStatus(taskId, apiKey, statusCallback, displayImageCallback) {
  const statusUrl = `https://api.midjourney.com/v1/tasks/${taskId}`;
  
  const checkStatus = async () => {
    try {
      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'completed') {
        if (data.image_url) {
          displayImageCallback(data.image_url);
        } else {
          statusCallback('MidJourney任务完成，但未找到图像URL', 'error');
        }
      } else if (data.status === 'failed') {
        statusCallback(`MidJourney生成失败: ${data.error || '未知错误'}`, 'error');
      } else {
        // 继续轮询
        setTimeout(checkStatus, 2000);
      }
    } catch (error) {
      statusCallback(`检查MidJourney状态错误: ${error.message}`, 'error');
    }
  };
  
  // 开始轮询
  setTimeout(checkStatus, 2000);
}

// 轮询Leonardo.AI状态
async function pollLeonardoStatus(generationId, apiKey, statusCallback, displayImageCallback) {
  const statusUrl = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`;
  
  const checkStatus = async () => {
    try {
      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'COMPLETE') {
        if (data.generations && data.generations.length > 0) {
          displayImageCallback(data.generations[0].url);
        } else {
          statusCallback('Leonardo任务完成，但未找到图像URL', 'error');
        }
      } else if (data.status === 'FAILED') {
        statusCallback(`Leonardo生成失败: ${data.error || '未知错误'}`, 'error');
      } else {
        // 继续轮询
        setTimeout(checkStatus, 2000);
      }
    } catch (error) {
      statusCallback(`检查Leonardo状态错误: ${error.message}`, 'error');
    }
  };
  
  // 开始轮询
  setTimeout(checkStatus, 2000);
}

// 导出函数和配置
export {
  PROVIDER_CONFIG,
  sendToComfyUI,
  pollComfyUIStatus,
  sendToImageProvider,
  pollMidJourneyStatus,
  pollLeonardoStatus
}; 