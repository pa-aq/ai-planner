import './App.css';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import TripMap from './components/tripMap';
function App() {
   const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  // 模拟从AI规划结果或API获取的行程数据
  const sampleItinerary = [
    { name: '天安门广场', lng: 116.3974, lat: 39.9093, time: '09:00' },
    { name: '故宫博物院', lng: 116.3970, lat: 39.9175, time: '10:30' },
    { name: '景山公园', lng: 116.3914, lat: 39.9245, time: '14:00' },
    { name: '北海公园', lng: 116.3811, lat: 39.9254, time: '16:00' },
  ];

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }


  return (
    <div>
      <p>Microphone: {listening ? 'on' : 'off'}</p>
      <button onClick={SpeechRecognition.startListening}>Start</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{transcript}</p>

      <h1>北京一日文化之旅</h1>
      <div className="itinerary-details">
        {/* 您的行程文字描述列表 */}
        <ul>
          {sampleItinerary.map((place, index) => (
            <li key={index}>
              <strong>{place.time}</strong> - {place.name}
            </li>
          ))}
        </ul>
      </div>
      
      {/* 嵌入行程地图 */}
      <div className="itinerary-map">
        <h2>行程地图</h2>
        <TripMap itinerary={sampleItinerary} />
      </div>
    </div>
  );
}

export default App;
