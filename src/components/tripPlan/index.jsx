import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button , Card, Tabs, List, Badge, Form, InputNumber, Select, message } from 'antd';
import { AudioOutlined} from '@ant-design/icons';
import TripMap from '../tripMap';
import './style.css';
import service from '../../service/request';

const { TabPane } = Tabs;
const { Option } = Select;

const TripPlan = ({pId}) => { 
    // 状态管理
  const[planDetail,setPlanDetail]=useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [expense, setExpense] = useState({ category: '', amount: 0 });
  const [selectedDay, setSelectedDay] = useState(1);
  
  const [messageApi, contextHolder] = message.useMessage();

  const [lastTranscript, setLastTranscript]=useState('');
  const [comCurListening, setComCurListening]=useState('');

  const [points, setPoints] = useState([]);

  const category=['餐饮','交通','住宿','景点','购物']
  
  //设置某一天的行程路线
  const updatePoints=(val)=>{
    const selectedDayData = planDetail.days.filter(day => day.day === val);
    if (selectedDayData) {
      const newPoints=selectedDayData[0].points.filter(point=>point.lat!==0)
      setPoints(newPoints);
      // console.log("points:",points)
    }
  }
    // 查询计划详情
  const getPlanDetail=async()=>{
    const res=await service({
      url:'/travel/getPlanDetail',
      method:'get',
      params:{
        pid:pId
      }
    })
    if(res.code===200){
      setPlanDetail(res.data);
    }else{
      error("查询计划详情失败")
    }
  }
  useEffect(()=>{
    getPlanDetail()
  },[pId])
  useEffect(()=>{
    if(planDetail&&planDetail.days){
        updatePoints(selectedDay);
    }
  },[planDetail,selectedDay])
  // 语音识别相关
 const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  useEffect(()=>{
    if (!browserSupportsSpeechRecognition) {
        return <span>Browser doesn't support speech recognition.</span>;
    }
  },[])

  useEffect(()=>{
    if(transcript&&comCurListening==='tripPlan'){
      setLastTranscript(transcript)
    }
  },[transcript])

  useEffect(()=>{
    if(!listening&&comCurListening==='tripPlan'){
      setComCurListening('')
      // 解析预算语音输入
      parseBudgetVoiceInput(lastTranscript);
    }
  },[listening])

  // 处理预算语音按钮点击
  const handleBudgetVoiceButtonClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setComCurListening('')
    } else {
      setComCurListening('tripPlan')
      SpeechRecognition.startListening();
      console.log("开始听")
    }
  };
  
  // 解析预算语音输入 - 增强版本，支持汉字数字表示的金额
  const parseBudgetVoiceInput = (text) => {
    if (!text || typeof text !== 'string') {
      return;
    }
    
    // 去除多余空格并转换为小写以便于匹配
    const normalizedText = text.trim().toLowerCase();
    
    // 匹配支出类别
    const categoryPattern = /(餐饮|交通|住宿|景点|购物)/;
    const categoryMatch = normalizedText.match(categoryPattern);
    
    if (!categoryMatch) {
      error('无法识别支出类别，请包含"餐饮"、"交通"、"住宿"、"景点"或"购物"');
      return;
    }
    
    // 汉字数字到阿拉伯数字的映射表
    const chineseNumberMap = {
      '零': 0,
      '一': 1,
      '二': 2,
      '两': 2, // 特殊处理"两"
      '三': 3,
      '四': 4,
      '五': 5,
      '六': 6,
      '七': 7,
      '八': 8,
      '九': 9,
      '十': 10,
      '百': 100,
      '千': 1000,
      '万': 10000,
      '亿': 100000000
    };
    
    // 解析汉字数字的辅助函数
    const parseChineseNumber = (numStr) => {
      let result = 0;
      let tempNum = 0;
      let unit = 1;
      
      // 从右往左解析
      for (let i = numStr.length - 1; i >= 0; i--) {
        const char = numStr[i];
        const value = chineseNumberMap[char];
        
        if (value >= 10) { // 单位：十、百、千、万、亿
          if (value > unit) {
            unit = value;
            tempNum = 1; // 默认单位前有1（如"十"等于"一十"）
          } else {
            unit *= value;
          }
        } else if (value !== undefined) { // 数字：零到九
          tempNum = value;
          result += tempNum * unit;
        }
      }
      
      // 处理特殊情况，如"十"应该等于10，而不是0
      if (numStr === '十') {
        return 10;
      }
      
      // 处理没有单位的情况
      if (result === 0 && tempNum !== 0) {
        return tempNum;
      }
      
      return result;
    };
    
    // 匹配多种金额格式：
    // 1. 阿拉伯数字格式: "123元" 或 "123块"
    // 2. 汉字数字格式: "十元" 或 "一百二十三元"
    // 3. 带角/毛: "123元5角" 或 "123块5毛" 或 "十块五毛"
    // 4. 带分: "123元5角6分" 或 "123块5毛6分" 或 "十块五毛六分"
    // 5. 纯角分: "5角6分" 或 "5毛6分"
    // 6. 只有角: "5角" 或 "5毛"
    // 7. 只有分: "6分"
    
    // 提取整数部分（元/块）
    let yuan = 0;
    
    // 尝试匹配汉字数字+元/块格式
    const chineseYuanPattern = /([零一二两三四五六七八九十百千万亿]+)\s*[元块]/;
    const chineseYuanMatch = normalizedText.match(chineseYuanPattern);
    if (chineseYuanMatch) {
      yuan = parseChineseNumber(chineseYuanMatch[1]);
    } else {
      // 尝试匹配阿拉伯数字+元/块格式
      const arabicYuanPattern = /(\d+)\s*[元块]/;
      const arabicYuanMatch = normalizedText.match(arabicYuanPattern);
      yuan = arabicYuanMatch ? parseInt(arabicYuanMatch[1]) : 0;
    }
    
    // 提取角/毛部分
    let jiao = 0;
    
    // 尝试匹配汉字数字+角/毛格式
    const chineseJiaoPattern = /([零一二两三四五六七八九十]+)\s*[角毛]/;
    const chineseJiaoMatch = normalizedText.match(chineseJiaoPattern);
    if (chineseJiaoMatch) {
      jiao = parseChineseNumber(chineseJiaoMatch[1]);
    } else {
      // 尝试匹配阿拉伯数字+角/毛格式
      const arabicJiaoPattern = /(\d+)\s*[角毛]/;
      const arabicJiaoMatch = normalizedText.match(arabicJiaoPattern);
      jiao = arabicJiaoMatch ? parseInt(arabicJiaoMatch[1]) : 0;
    }
    
    // 提取分部分
    let fen = 0;
    
    // 尝试匹配汉字数字+分格式
    const chineseFenPattern = /([零一二两三四五六七八九十]+)\s*分/;
    const chineseFenMatch = normalizedText.match(chineseFenPattern);
    if (chineseFenMatch) {
      fen = parseChineseNumber(chineseFenMatch[1]);
    } else {
      // 尝试匹配阿拉伯数字+分格式
      const arabicFenPattern = /(\d+)\s*分/;
      const arabicFenMatch = normalizedText.match(arabicFenPattern);
      fen = arabicFenMatch ? parseInt(arabicFenMatch[1]) : 0;
    }
    
    // 如果没有匹配到任何金额部分
    if (yuan === 0 && jiao === 0 && fen === 0) {
      error('无法识别金额，请尝试包含数字和单位如"123元"或"十元"');
      return;
    }
    
    // 计算总金额（转换为元，保留2位小数）
    const totalAmount = yuan + (jiao / 10) + (fen / 100);
    
    // 检查金额合理性
    if (totalAmount <= 0 || totalAmount > 999999.99) {
      error('金额必须在0到999,999.99之间');
      return;
    }
    
    // 设置支出信息
    setExpense({
      category: categoryMatch[1],
      amount: parseFloat(totalAmount.toFixed(2)) // 四舍五入到2位小数
    });
    console.log("category=",categoryMatch[1], " amount=",totalAmount.toFixed(2))
    // 提供成功反馈 - 注释可以根据需要取消
    messageApi.open({
      type: 'success',
      content: `已识别: ${categoryMatch[1]} ${totalAmount.toFixed(2)}元`,
    });
  };
  const error = (info) => {
    messageApi.open({
      type: 'error',
      content: info,
    });
  };
  // 获取活动类型对应的颜色
  const getActivityTypeColor = (type) => {
    const colorMap = {
      '交通': '#1890ff',
      '餐饮': '#52c41a',
      '景点': '#fa8c16',
      '住宿': '#722ed1',
      '购物': '#cb5da7ff',
    };
    return colorMap[type] || '#d9d9d9';
  };
  
    // 添加预算支出
  const addExpense = async() => {
    if (!expense.category || !expense.amount) return;
    // console.log("addExpense",expense)
    const res = await service({
        url:'/travel/addCost',
        method:'post',
        data:{
          pid:planDetail.pid,
          category:expense.category,
          amount:expense.amount,
        }
    });
    if(res.code===200){
      messageApi.open({
        type: 'success',
        content: '添加成功',
      });
      setExpense({
        category:'',
        amount:0,
      })
      getPlanDetail()
    }else{
      messageApi.open({
        type: 'error',
        content: '添加失败',
      });
    }
    
  };
  // 重新获取预算

    return (
      planDetail &&
        <div className="planner-container" style={{minHeight:'450px'}}> 
        {contextHolder}
            <Tabs activeKey={activeTab} onChange={setActiveTab} className="content-tabs" type="card">
               <TabPane tab="行程地图" key="map"> 
                    {/* 嵌入行程地图 */}
                    <div className="itinerary-map" >
                       <div className="itinerary-select"> 
                          <span>请选择行程：</span>
                           <Select 
                            style={{ width: 120 }} 
                            value={selectedDay}
                            onChange={(value) => setSelectedDay(value)}
                            >
                            {planDetail.days.map(day => (
                                <Option key={day.day} value={day.day}>第{day.day}天</Option>
                            ))}
                            </Select>
                        </div>
                        <TripMap itinerary={points} />
                    </div>
               </TabPane>
                
                <TabPane tab="行程详情" key="itinerary">
                    <div className="itinerary-details">
                        <h2>{planDetail.title}</h2>
                        <p className="itinerary-meta">{planDetail.destination}</p>
                        
                        {planDetail.days.map(day => (
                        <Card key={day.day} className="day-card">
                            <h3>第{day.day}天
                              <span className="day-theme">{day.theme}</span>
                            </h3>
                            <List
                            dataSource={day.points}
                            renderItem={activity => (
                                <Badge.Ribbon text={activity.type} color={getActivityTypeColor(activity.type)}>
                                    <List.Item
                                    className="activity-item"
                                    >
                                    <List.Item.Meta
                                        title={
                                        <div className="activity-header">
                                            <span className="activity-time">{activity.daytime}</span>
                                            <span className="activity-name">{activity.name}</span>
                                        </div>
                                        }
                                        description={activity.description}
                                    />
                                    </List.Item>
                                </Badge.Ribbon>
                                
                            )}
                            />
                        </Card>
                        ))}
                    </div>
                </TabPane>
                
                <TabPane tab="预算管理" key="budget">
                <div className="budget-management">
                    <Card className="budget-summary">
                    <h3>预算总览</h3>
                    <div className="budget-totals">
                        <div className="budget-total-item">
                        <span>总预算</span>
                        <span className="budget-amount">¥{planDetail.total_budget}</span>
                        </div>
                        <div className="budget-total-item">
                        <span>已花费</span>
                        <span className="budget-amount spent">¥{planDetail.total_budget-planDetail.left}</span>
                        </div>
                        <div className="budget-total-item">
                        <span>剩余</span>
                        <span className="budget-amount remaining">¥{planDetail.left}</span>
                        </div>
                    </div>
                    <div className="budget-progress-large">
                        <div 
                        className="budget-bar-large" 
                        style={{ width: `${((planDetail.total_budget-planDetail.left) / planDetail.total_budget) * 100}%` }}
                        ></div>
                    </div>
                    </Card>
                    
                    <Card className="budget-categories">
                    <h3>分类预算</h3>
                    <div  className="category-item">
                        <div className="category-header">
                            <span>住宿</span>
                            <span>¥{(planDetail.accommodation-planDetail.accommodationLeft)} / ¥{planDetail.accommodation}</span>
                        </div>
                        <div className="category-progress">
                            <div 
                            className="category-bar" 
                            style={{ width: `${((planDetail.accommodation-planDetail.accommodationLeft) / planDetail.accommodation) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div  className="category-item">
                        <div className="category-header">
                            <span>交通</span>
                            <span>¥{(planDetail.transportation-planDetail.transportationLeft)} / ¥{planDetail.transportation}</span>
                        </div>
                        <div className="category-progress">
                            <div 
                            className="category-bar" 
                            style={{ width: `${((planDetail.transportation-planDetail.transportationLeft) / planDetail.transportation) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div  className="category-item">
                        <div className="category-header">
                            <span>餐饮</span>
                            <span>¥{(planDetail.food-planDetail.foodLeft)} / ¥{planDetail.food}</span>
                        </div>
                        <div className="category-progress">
                            <div 
                            className="category-bar" 
                            style={{ width: `${((planDetail.food-planDetail.foodLeft) / planDetail.food) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div  className="category-item">
                        <div className="category-header">
                            <span>景点</span>
                            <span>¥{(planDetail.attraction-planDetail.attractionLeft)} / ¥{planDetail.attraction}</span>
                        </div>
                        <div className="category-progress">
                            <div 
                            className="category-bar" 
                            style={{ width: `${((planDetail.attraction-planDetail.attractionLeft) / planDetail.attraction) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div  className="category-item">
                        <div className="category-header">
                            <span>购物</span>
                            <span>¥{(planDetail.shopping-planDetail.shoppingLeft)} / ¥{planDetail.shopping}</span>
                        </div>
                        <div className="category-progress">
                            <div 
                            className="category-bar" 
                            style={{ width: `${((planDetail.shopping-planDetail.shoppingLeft) / planDetail.shopping) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    </Card>
                    
                    <Card className="expense-input">
                    <h3>添加支出</h3>
                    <div className="expense-input-wrapper">
                        <Form layout="horizontal">
                        <Form.Item label="类别">
                            <Select 
                            style={{ width: 120 }} 
                            value={expense.category}
                            onChange={(value) => setExpense({...expense, category: value})}
                            >
                            {category.map(val => (
                                <Option key={val} value={val}>{val}</Option>
                            ))}
                            </Select>
                        </Form.Item>
                        <Form.Item label="金额">
                            <InputNumber 
                            style={{ width: 120 }} 
                            prefix="¥" 
                            min="0"
                            step="1"
                            value={expense.amount}
                            onChange={(value) => setExpense({...expense, amount: value || 0})}
                            
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" disabled={!expense.category || !expense.amount}
                              onClick={addExpense}
                            >
                            添加
                            </Button>
                            <Button
                                icon={<AudioOutlined />}
                                onClick={handleBudgetVoiceButtonClick}
                                className={`budget-voice-button ${listening&&comCurListening==='tripPlan' ? 'listening' : ''}`}
                                >
                                {listening&&comCurListening==='tripPlan' ? '停止录音' : '开始录音'}
                            </Button>
                        </Form.Item>
                        </Form>
                        
                    </div>
                    <p>当前语音输入: {transcript}</p>
                    </Card>
                </div>
                </TabPane>
            </Tabs>
        </div>
    )
};

export default TripPlan;