import './index.css'
import Navbar from './components/Navbar'
import {Routes, Route} from 'react-router-dom'
import HomePage from './pages/HomePage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'
import { useEffect } from 'react'
import { Loader } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import CallUI from './components/CallUI'
import IncomingCallNotification from './components/IncomingCallNotification'
import notificationService from './lib/notificationService'

const App = () => {
  const {authUser,checkAuth,isCheckingAuth} = useAuthStore();
  const {theme} = useThemeStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Request notification permission when the user logs in
  useEffect(() => {
    if (authUser) {
      notificationService.requestPermission();
    }
  }, [authUser]);
  
  // Apply theme to document element
  useEffect(() => {
    // Apply theme to html element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  console.log(authUser);
  
  if(isCheckingAuth && !authUser){
    return(
      <div className='flex justify-center items-center h-screen'>
        <Loader className="size-10 animate-spin"/>
      </div>
    )
  }
  
  return (
  <div className="min-h-screen">
    <Navbar />
    <Routes>
      <Route path="/" element={authUser ?<HomePage/>:<Navigate to="/login"/>}/>
      <Route path="/signup" element={!authUser ?<SignUpPage/>:<Navigate to="/"/>}/>
      <Route path="/login" element={!authUser ?<LoginPage/>:<Navigate to="/"/>}/>
      <Route path="/settings" element={<SettingsPage/>}/>
      <Route path="/profile" element={authUser ?<ProfilePage/>:<Navigate to="/login"/>}/>
    </Routes>
    <Toaster position="top-center" />
    
    {/* Call UI components */}
    {authUser && (
      <>
        <CallUI />
        <IncomingCallNotification />
      </>
    )}
  </div>
  );
}

export default App;
