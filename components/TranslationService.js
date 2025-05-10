/**
 * 翻译服务
 * 提供简单的免费翻译功能
 */
class TranslationService {
  constructor() {
    // 简化构造函数，移除API密钥相关内容
    this.dictionary = this.getSimpleDictionary();
  }
  
  /**
   * 翻译文本
   * @param {string} text 要翻译的文本
   * @param {string} targetLang 目标语言代码 (默认为英文)
   * @returns {Promise<string>} 翻译后的文本
   */
  async translate(text, targetLang = 'en') {
    // 首先尝试使用免费Google翻译
    try {
      const translated = await this.googleFreeTranslate(text, targetLang);
      return translated;
    } catch (error) {
      console.warn('Google免费翻译失败，使用本地简单翻译:', error);
      // 出错时回退到简单翻译
      return this.simpleTranslate(text);
    }
  }
  
  /**
   * 使用Google免费翻译API翻译
   * @param {string} text 要翻译的文本
   * @param {string} targetLang 目标语言代码
   * @returns {Promise<string>} 翻译后的文本
   */
  async googleFreeTranslate(text, targetLang = 'en') {
    try {
      // 使用Google翻译的非官方接口
      const sourceLang = 'zh'; // 自动检测源语言
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google翻译错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 解析翻译结果
      if (data && data[0]) {
        let translatedText = '';
        
        // 拼接所有翻译段落
        for (let i = 0; i < data[0].length; i++) {
          if (data[0][i][0]) {
            translatedText += data[0][i][0];
          }
        }
        
        return translatedText;
      } else {
        throw new Error('Google翻译返回数据格式异常');
      }
    } catch (error) {
      console.error('Google翻译错误:', error);
      throw error; // 向上抛出错误，让调用者处理
    }
  }
  
  /**
   * 简单的本地翻译（作为后备方案）
   * @param {string} text 要翻译的文本
   * @returns {string} 翻译后的文本
   */
  simpleTranslate(text) {
    // 使用字典翻译
    let translatedText = text;
    Object.keys(this.dictionary).forEach(key => {
      translatedText = translatedText.replace(new RegExp(key, 'g'), this.dictionary[key]);
    });
    
    return translatedText;
  }
  
  /**
   * 获取简单字典
   * @returns {Object} 翻译字典
   */
  getSimpleDictionary() {
    return {
      '人物': 'person, character',
      '风景': 'landscape',
      '城市': 'city, urban',
      '海边': 'seaside, beach',
      '山': 'mountain',
      '天空': 'sky',
      '水彩': 'watercolor',
      '油画': 'oil painting',
      '素描': 'sketch',
      '动漫': 'anime',
      '写实': 'realistic',
      '高质量': 'high quality',
      '细节': 'detailed',
      '光照': 'lighting',
      '写实风格': 'realistic style',
      '照片级': 'photorealistic',
      '高清晰度': 'high definition',
      '精细': 'fine details',
      '8K': '8K',
      '超高清': 'ultra HD',
      '艺术风格': 'artistic style',
      '赛博朋克': 'cyberpunk',
      '科幻': 'sci-fi',
      '奇幻': 'fantasy',
      '黑暗': 'dark',
      '明亮': 'bright',
      '戏剧性': 'dramatic',
      '自然': 'natural',
      '美丽': 'beautiful',
      '壮观': 'spectacular',
      '逼真': 'lifelike'
    };
  }
  
  /**
   * 获取当前使用的翻译服务名称
   * @returns {string} 翻译服务名称
   */
  getCurrentServiceName() {
    return 'Google免费翻译';
  }
}

// 创建单例实例
const translationService = new TranslationService();

export default translationService; 