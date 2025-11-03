import React, { useRef, useEffect, useState } from 'react';

// 定义行程数据的PropTypes，假设一个地点对象包含：name, lng, lat
const TripMap = ({ itinerary = [] }) => {
  // 创建一个ref来指向地图的容器DOM元素
  const mapContainerRef = useRef(null);
  // 状态用于存储地图实例
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    // 确保SDK已加载且容器ref已挂载
    if (!window.BMapGL || !mapContainerRef.current) return;

    // 初始化地图实例
    const map = new window.BMapGL.Map(mapContainerRef.current);
    
    // 设置中心点和缩放级别（可以先用第一个地点，或者一个默认城市）
    const centerPoint = new window.BMapGL.Point(itinerary[0].lng, itinerary[0].lat); // 默认北京
    map.centerAndZoom(centerPoint, 12);
    
    // 启用缩放控件
    map.enableScrollWheelZoom(true);
    map.addControl(new window.BMapGL.ZoomControl());

    // 将地图实例保存到状态
    setMapInstance(map);

    // 清理函数：组件卸载时销毁地图
    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, []); // 空依赖数组，确保只在组件挂载时执行一次

  // 在第一个useEffect之后，添加第二个useEffect来处理行程数据
useEffect(() => {
  if (!mapInstance || !itinerary.length) return;

  // 清除地图上所有覆盖物（标记、折线等），防止重复添加
  mapInstance.clearOverlays();

  const points = []; // 用于存储所有地点的坐标，以便绘制折线和调整视野

  // 1. 遍历行程，添加标记点(Marker)
    // 在遍历行程数据的forEach循环中
  // 在遍历行程数据的forEach循环中
  itinerary.forEach((place, index) => {
    const point = new window.BMapGL.Point(place.lng, place.lat);
    points.push(point);

    const marker = new window.BMapGL.Marker(point);
    // console.log('Marker created:', place.name);
    // 创建信息窗口内容，只包含百度地图导航
    const infoWindowContent = `
      <div style="padding: 16px; min-width: 220px; font-family: system-ui;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #2c3e50; font-size: 14px;">${index + 1}. ${place.name}</strong>
        </div>
        ${place.daytime ? `<div style="color: #7f8c8d; margin-bottom: 8px; font-size: 12px;">⏰ ${place.daytime}</div>` : ''}
        <button 
          onclick="window.navigateWithBaidu('${place.name}', ${place.lat}, ${place.lng})"
          style="width: 100%; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; margin-top: 8px;"
          onmouseover="this.style.background='#c0392b'"
          onmouseout="this.style.background='#e74c3c'"
        >
          🗺️ 去导航
        </button>
        ${place.address ? `<div style="margin-top: 10px; color: #95a5a6; font-size: 12px; border-top: 1px solid #ecf0f1; padding-top: 8px;">📍 ${place.address}</div>` : ''}
      </div>
    `;

    const infoWindow = new window.BMapGL.InfoWindow(infoWindowContent, {
      width: 260
    });

    marker.addEventListener('click', () => {
      mapInstance.openInfoWindow(infoWindow, point);
    });

    mapInstance.addOverlay(marker);

    // 数字标签代码保持不变...
    const label = new window.BMapGL.Label(`${index + 1}`, {
      position: point,
      offset: new window.BMapGL.Size(15, -30)
    });
    label.setStyle({
      color: '#fff',
      backgroundColor: '#e74c3c',
      borderRadius: '50%',
      padding: '4px 8px',
      border: '2px solid #fff',
      fontSize: '12px',
      fontWeight: 'bold'
    });
    mapInstance.addOverlay(label);
  });

  // 2. 绘制折线(Polyline)连接所有地点
  if (points.length > 1) {
    const polyline = new window.BMapGL.Polyline(points, {
      strokeColor: '#3498db', // 线条颜色
      strokeWeight: 4,        // 线条宽度
      strokeOpacity: 0.8,     // 线条透明度
    });
    mapInstance.addOverlay(polyline);
  }

  // 3. 调整地图视野，让所有标记点和折线都在视野范围内
  if (points.length > 0) {
    mapInstance.setViewport(points); // 这个API会自动调整缩放和中心点
  }

}, [mapInstance, itinerary]); // 依赖项：当地图实例或行程数据变化时重新渲染
  return (
    // 地图容器，必须指定高度
    <div 
      ref={mapContainerRef} 
      style={{ width: '100%', height: '90%',minHeight: '520px', border: '1px solid #ccc' }} 
    />
  );
};

export default TripMap;