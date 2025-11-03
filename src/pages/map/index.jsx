import { useEffect } from 'react';
import './style.css';
const Map = () => {
  useEffect(() => {
    //全局对象用window访问
    const map = new window.BMap.Map('container');
    //设置中心点坐标
    const point = new window.BMap.Point(116.404, 39.915);
    //设置地图中心点和级别
    map.centerAndZoom(point, 15);
  })
  return (
    <div className="map">
        <div id="container">
        
        </div>
    </div>
  )
}

export default Map