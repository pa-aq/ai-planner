// inputValidator.js
import { VALIDATION_CONFIG } from './validationConfig';

export class TravelInputValidator {
  static validateAndParse(input) {
    const result = {
      isValid: true,
      missingFields: [],
      parsedData: {},
      confidence: 0, // 置信度 0-1
      message: ''
    };

    // 解析必填字段
    VALIDATION_CONFIG.requiredFields.forEach(field => {
      const parsedValue = this.parseField(input, field);
      
      if (field.required && !parsedValue.found) {
        result.isValid = false;
        result.missingFields.push(field.name);
      }
      
      if (parsedValue.found) {
        result.parsedData[field.key] = parsedValue.value;
      }
    });

    // 解析可选字段
    VALIDATION_CONFIG.optionalFields.forEach(field => {
      const parsedValue = this.parseField(input, field);
      if (parsedValue.found) {
        result.parsedData[field.key] = parsedValue.value;
      }
    });

    // 计算置信度
    result.confidence = this.calculateConfidence(result);
    
    // 生成提示消息
    result.message = this.generateMessage(result);

    return result;
  }

  static parseField(input, fieldConfig) {
    // console.log("fieldConfig:", fieldConfig," input:", input)
    for (const pattern of fieldConfig.patterns) {
      const match = input.match(pattern);
      // console.log("pattern:", pattern)
      if (match) {
        return {
          found: true,
          // value: this.cleanValue(match[1] || match[0], fieldConfig.key),
          match: match[0]
        };
      }
    }
    return { found: false, value: null };
  }

  // 中文数字转阿拉伯数字
  static chineseNumToInt(chineseNum) {
    const numMap = {
      '一': 1,
      '二': 2,
      '三': 3,
      '四': 4,
      '五': 5,
      '六': 6,
      '七': 7,
      '八': 8,
      '九': 9,
      '十': 10,
      '百': 100,
      '千': 1000
    };
    
    // 检查是否是单个数字
    if (numMap[chineseNum]) {
      return numMap[chineseNum];
    }
    
    // 处理复合数字，如"十三"、"二十"等
    let result = 0;
    let temp = 0;
    
    for (let i = 0; i < chineseNum.length; i++) {
      const char = chineseNum[i];
      const num = numMap[char];
      
      if (num) {
        if (num >= 10) {
          // 处理"十"、"百"、"千"
          if (temp === 0) temp = 1; // 处理"十"直接出现的情况，如"十"表示10
          result += temp * num;
          temp = 0;
        } else {
          // 处理"一"到"九"
          temp = num;
        }
      }
    }
    
    return result + temp;
  }

  static cleanValue(value, fieldType) {
    switch (fieldType) {
      case 'duration':
        // 尝试直接转换为数字
        let num = parseInt(value);
        if (isNaN(num)) {
          // 如果不是数字，尝试转换中文数字
          num = this.chineseNumToInt(value);
        }
        return num || 1;
      case 'budget':
        // 处理"1万元" -> 10000
        if (value.includes('万')) {
          return parseFloat(value) * 10000;
        }
        return parseFloat(value) || 0;
      case 'people':
        return parseInt(value) || 1;
      default:
        return value.trim();
    }
  }

  static calculateConfidence(result) {
    const totalRequired = VALIDATION_CONFIG.requiredFields.filter(f => f.required).length;
    const foundRequired = totalRequired - result.missingFields.length;
    
    return foundRequired / totalRequired;
  }

  static generateMessage(result) {
    if (result.isValid) {
      return `✅ 信息完整！正在为您规划${result.parsedData.destination}的${result.parsedData.duration}天旅行...`;
    } else {
      const missingText = result.missingFields.join('、');
      return `请补充${missingText}信息，我才能为您生成详细的旅行路线哦！`;
    }
  }
}