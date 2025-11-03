import { createBrowserRouter } from "react-router-dom";
import App from '../App';
import LoginPage from '../pages/login';
import Home from '../pages/home';
// import Planner from '../pages/planner';
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/home',
    element: <ProtectedRoute><Home /></ProtectedRoute>
  },
]);

export default router;