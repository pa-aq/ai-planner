import { Navigate,useLocation } from "react-router-dom";
const ProtectedRoute =({children})=>{
    const userInfo=localStorage.getItem('userInfo')
    const location = useLocation();

     if(!userInfo){
        // 重定向到登录页，并保存当前路径以便登录后跳转
        return <Navigate to="/" state={{ from: location }} replace />;
    }else{
        const info=JSON.parse(userInfo)
        if(info.expire < Date.now()){
            localStorage.removeItem('userInfo');
            return <Navigate to="/" state={{ from: location }} replace />;
        }
    }
    return children;
}
export default ProtectedRoute;