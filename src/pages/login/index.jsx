import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { message } from 'antd';
import service from '../../service/request';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const errorToast = (info,duration=1) => {
    messageApi.open({
      type: 'error',
      content: info,
      duration:duration,
    });
  };

  const successToast = (info) => {
    messageApi.open({
      type: 'success',
      content: info,
    });
  };

  // 邮箱格式验证
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 处理邮箱输入
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('请输入有效的邮箱地址');
    } else {
      setEmailError('');
    }
  };

  // 处理验证码输入
  const handleCodeChange = (e) => {
    setVerificationCode(e.target.value);
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!email || !validateEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      return;
    }
    setLoading(true);
    try {
      // API调用
      // console.log('发送验证码到邮箱:', email);
      service({
        url:"/user/sendCode",
        method:'get',
        params:{
          email:email
        }
      }).then((res) => {
        // console.log('发送验证码res=：', res);
        setLoading(false);
        setCountdown(60);
        if(res.code===200){
          successToast('验证码已发送，有效期10分钟！');
        }else{
          errorToast(res.message);
        }
      });
    } catch (error) {
      setLoading(false);
      errorToast('发送验证码失败');
    }
  };

  // 处理登录
  const handleLogin = async () => {
    if (!email || !validateEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      return;
    }

    if (!verificationCode) {
      errorToast('请输入验证码');
      return;
    }
    setLoading(true);
    try {
      // 模拟API调用
      console.log('登录请求:', { email, verificationCode });
      service({
        url:"/user/login",
        method:'post',
        data:{
          email:email,
          code:verificationCode
        }
      }).then((res) => {
        setLoading(false);
        if(res.code===200){
          localStorage.setItem('userInfo', 
            JSON.stringify({value: res.data, expire: Date.now() + 360000000})
          );
          navigate('/home');
        }else{
          errorToast('登录失败，请检查验证码是否正确');
        }
      })
    } catch (error) {
      setLoading(false);
      errorToast('登录失败，请检查验证码是否正确');
    }
  };

  // 倒计时效果
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  return (
    <div className="login-container">
      {contextHolder}
      <div className="login-card">
        {/* Logo区域 */}
        <div className="login-logo">🌍</div>
        
        {/* 标题 */}
        <h2 className="login-title">AI 旅行规划师</h2>
        
        <div className="form-group">
          <label htmlFor="email">邮箱</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="请输入邮箱地址"
            className={`form-input ${emailError ? 'error' : ''}`}
            disabled={loading}
          />
          {emailError && <div className="error-message">{emailError}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="verificationCode">验证码</label>
          <div className="code-input-group">
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="请输入验证码"
              className="form-input code-input"
              disabled={loading}
            />
            <button
              className={`send-code-btn ${countdown > 0 ? 'disabled' : ''}`}
              onClick={handleSendCode}
              disabled={countdown > 0 || loading || !email || emailError}
            >
              {loading ? '发送中...' : countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
            </button>
          </div>
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading || !email || emailError || !verificationCode}
        >
          登录
        </button>

        <div className="login-tips">
          <p>开启您的智能旅行之旅</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;