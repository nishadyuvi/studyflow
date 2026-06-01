import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ThemeProvider } from './context/ThemeContext'
import { AcademicPlanner } from './pages/AcademicPlanner'
import { DayPlanner } from './pages/DayPlanner'
import { HabitTracker } from './pages/HabitTracker'
import SignUp from './pages/SignUp'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/AuthContext'
import ResetPassword from './pages/ResetPassword'


// TEST SUPABASE CONNECTION

 
export default function App() {

  return (
    
    <ThemeProvider>
      <AuthProvider> 
      <BrowserRouter>
        <Routes>

           

           <Route path="/signup" element={<SignUp />} />
           <Route path="/login" element={<Login />} /> 
           <Route path="/dashboard" element={<Dashboard />} />
          <Route
  path="reset-password"
  element={<ResetPassword />}
/>


          <Route element={<AppLayout />}>
            
            {/* Home Page */}
            <Route index element={<AcademicPlanner />} />

            {/* Day Planner */}
            <Route path="day-planner" element={<DayPlanner />} />

            {/* Habit Tracker */}
            <Route path="habit-tracker" element={<HabitTracker />} />

            {/* Redirect Unknown Routes */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider> 
    </ThemeProvider>
    
  )
}