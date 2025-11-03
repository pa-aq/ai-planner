import { useState, useEffect } from "react";
import './style.css';
import { Button,message } from "antd";
import { ArrowUpOutlined,AudioOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import TripPlan from "../../components/tripPlan";
import service from "../../service/request";
import { TravelInputValidator } from "../../utils/inputValidator";
import { useLocation } from 'react-router-dom';

const { TextArea } = Input;
const Home = () => {
  //所有的Planid
  const [planIdList, setPlanIdList]=useState([]);
  // 当前选中的travelPlanID
  const [selectedPlanId, setselectedPlanId] = useState(sessionStorage.getItem('selectedPlanId')? Number(sessionStorage.getItem('selectedPlanId')):null);
  // 当前计划详情
  // const [selectedPlan, setSelectedPlan]=useState(null);
  // 用户输入内容
  const [inputMessage, setInputMessage] = useState('');
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  //当前页面是哪个
  const [currentListening, setCurrentListening]=useState('');
  const [messageApi, contextHolder] = message.useMessage();
  // 最后的语音内容（使用状态变量保存以确保跨渲染保留值）
  const [lastTranscript, setLastTranscript] = useState('')
  // 语音识别功能
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  
  // 获取参数
  const uid= JSON.parse(localStorage.getItem('userInfo'))?.value;
  // 查询所有的plan
  const getAllPlanId=async()=>{
    const res=await service({
      url:'/travel/getTotalPlan',
      method:'get',
      params:{
        uid:uid
      }
    })
    if(res.code===200){
      setPlanIdList(res.data);
    }
  }
  
  useEffect(()=>{
    getAllPlanId();
  },[])


  // 当语音识别结果变化时更新输入框
  useEffect(() => {
    if(transcript&&currentListening==='home'){
      setLastTranscript(transcript)
      console.log("lastTranscript:", transcript);
    }
  }, [transcript]);

  useEffect(()=>{
    // console.log("listening变化了:", listening)
    if(!listening&&currentListening==='home'){
      setCurrentListening('')
      setInputMessage(prev=>{
        // console.log("prev+trans:",prev+lastTranscript);
        return prev+lastTranscript;
      });
    }
  },[listening])
  
  // 处理语音按钮点击
  const handleVoiceButtonClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setCurrentListening('')
    } else {
      setCurrentListening('home');
      SpeechRecognition.startListening();
    }
  };

  // 开始新对话
  const startNewConversation = () => {
    setselectedPlanId(null);
    sessionStorage.removeItem('selectedPlanId');
    setInputMessage('');
  };

  // 选择对话
  const selectPlan = (pId) => {
    setselectedPlanId(pId);
    sessionStorage.setItem('selectedPlanId', pId);
    setInputMessage('');
  };
  const errorToast = (info) => {
    messageApi.open({
      type: 'error',
      content: info,
    });
  };
  const successToast = (info) => {
    messageApi.open({
      type: 'success',
      content: info,
    });
  };
  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

     // 1. 验证输入
    const validation = TravelInputValidator.validateAndParse(inputMessage);
    if (!(validation.isValid && validation.confidence > 0.5)) {
       const missingText = validation.missingFields.join('、');
       errorToast(`请补充${missingText}信息，我才能为您生成详细的旅行路线哦！`);
      return;
    }

    setIsLoading(true);
    // 调用用后端接口!!!!!!!！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
    //拿到后使用set方法更新数据
    const res = await service({
      url:'/travel/generateTravelPlan',
      method:'post',
      data:{
        pid:selectedPlanId,
        uid:uid,
        uInput:inputMessage
      }
    });
    console.log('res:', res);
    setIsLoading(false);

    if (res.code===200 && !selectedPlanId) {
      setselectedPlanId(res.data);
      sessionStorage.setItem('selectedPlanId', res.data);
      getAllPlanId()
    } 
    setInputMessage('');
  };

  // 删除对话
  const deleteConversation = async (pId) => {
    // 删除特定的travel plan
    const res = await service({
      url:'/travel/deletePlan',
      method:'post',
      data:{
        pid:pId,
      }
    })
    if(res.code===200){
      successToast('删除成功！');
      //重新查询
      getAllPlanId()
      if (selectedPlanId === pId) {
        sessionStorage.removeItem('selectedPlanId');
        setselectedPlanId(null);
      }
    }else{
      errorToast('删除失败，请稍后再试！')
    }  
  };
  // 格式化时间显示
  const formatTime = (date) => {
    const d = new Date(date);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }
  return (
    <div className="ai-chat-container">
      {contextHolder}
      {/* 左侧对话列表 */}
      <div className="conversation-list">
        <div className="conversation-list-header">
          <h3>AI 旅行规划师</h3>
          <button className="new-chat-btn" onClick={startNewConversation}>
            新建规划
          </button>
        </div>
        
        <div className="conversation-items">
          {planIdList.length === 0 ? (
            <div className="no-conversations">暂无旅行规划</div>
          ) : (
            planIdList.map(planId => (
              <div 
                key={planId.id} 
                className={`conversation-item ${selectedPlanId === planId.id ? 'active' : ''}`}
                onClick={() => selectPlan(planId.id)}
              >
                <div className="conversation-info">
                  <h3 className="conversation-title">{planId.title}</h3>
                  <span className="conversation-time">{formatTime(planId.created_time)}</span>
                </div>
                <button 
                  className="delete-conversation-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(planId.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧对话详情 */}
      <div className="conversation-detail">
        {(!selectedPlanId&&isLoading===false)? (
          // 初始状态：新建对话
          <div className="new-conversation">
            <div className="new-conversation-content">
              <div className="welcome-icon">🌍</div>
              <h2>欢迎使用AI旅行规划师</h2>
              <p>请在下方输入您的旅行需求，让我为您制定个性化的旅行规划！</p>
              <p className="example-text">示例问题：</p>
              <ul className="example-list">
                <li>我想去北京玩3天，帮我规划行程</li>
                <li>我想到云南旅行，帮我规划3天2晚的行程</li>
                <li>我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子</li>
              </ul>
            </div>
          </div>
        ) : (
          // 显示对话详情
          <div className="chat-messages-container">
            {isLoading? (
                <div className="message assistant typing">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <div>正在帮您规划行程</div>
                </div>
              ):(<div className="chat-messages">
                <TripPlan pId={selectedPlanId}/>
            </div>)}
          </div>
        )}

        {/* 输入区域 */}
        <div className="message-input-container">
          <div className="input-wrapper">
            <TextArea
              value={inputMessage}
              // value={transcript}
              onChange={(e) => {
                setInputMessage(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                  // 如果正在录音，发送后停止
                  if (listening) {
                    SpeechRecognition.stopListening();
                  }
                }
              }}
              placeholder="输入您的旅行问题，按Enter发送..."
              className="message-input"
              autoSize={{ minRows: 1, maxRows: 5 }}
            />

            <div className="input-bottom"> 
                <span className="input-bottom-content"> 
                    <Button 
                        shape="circle" icon={<AudioOutlined />}
                        onClick={handleVoiceButtonClick}
                        disabled={isLoading}
                        className={`voice-button ${listening&&currentListening==='home' ? 'listening' : ''}`}
                        >
                    </Button>
                    <span className="split-line"></span>
                    <Button 
                        shape="circle" icon={<ArrowUpOutlined />}
                        onClick={sendMessage} 
                        disabled={!inputMessage.trim() || isLoading}
                        className="send-message-btn"
                    >
                    </Button>
                </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;