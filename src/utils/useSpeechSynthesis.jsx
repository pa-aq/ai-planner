const useSpeechSynthesis = () => {
  const speak = (text, options = {}) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    // 动态选择语音（需等待语音列表加载）
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v => v.lang.includes('zh'));
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }
    speechSynthesis.speak(utterance);
  };
  const stopSpeaking = () => {
    speechSynthesis.cancel();
  };
  return { speak, stopSpeaking };
};
export default useSpeechSynthesis;