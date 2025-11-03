import { useState,useEffect, useRef } from 'react';
const useSpeechRecognition = () => {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || 
                             window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'zh-CN';
    recognitionRef.current.onresult = (event) => {
      console.log("onresult!!!!!!!!!")
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        console.log(event.results[i])
        const curTranscript = event.results[i][0].transcript;
        interimTranscript=curTranscript;
        if(event.results[i].isFinal){
            setTranscript(curTranscript);
        }
      }
      // 实时更新临时结果
      if (transcript!==interimTranscript) {
        setTranscript(interimTranscript);
      }
    };
    recognitionRef.current.onerror = (event) => {
      console.error('识别错误:', event.error);
      setIsListening(false);
    };
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  const startListening = () => {
    try{
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      console.log("开始识别，listening=",isListening)
    }catch(e){
      console.error('无法开始识别:', e);
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  const stopListening = () => {
    recognitionRef.current.stop();
    setIsListening(false);
    console.log("结束识别，listening=",isListening," transcript=",transcript)
  };
  return { transcript, isListening, startListening, stopListening };
};
export default useSpeechRecognition;