import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider, useAuth } from './context/AuthContext';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import './App.css';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import ProtectedRoute from './components/ProtectedRoute';
import theme from './theme';
import { getToken } from './utils/auth';

const Dashboard = () => {
  const { logout } = useAuth();
  const token = getToken()
  useEffect(()=>{
    setTimeout(()=>{
      window.location.href = `https://3000_172_31_37_49.workspace.develop.kavia.ai?token=${token}`;
    }, 3000)
  }, [])

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Welcome! You are logged in.</Typography>
      <Button
        variant="contained"
        color="secondary"
        onClick={logout}
        sx={{ mt: 2 }}
      >
        Logout
      </Button>
    </Box>
  );
};

const Navigation = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 2 }}>
      <Button
        component={Link}
        to="/login"
        variant="contained"
        color="primary"
        fullWidth
      >
        Login
      </Button>
      <Button
        component={Link}
        to="/register"
        variant="outlined"
        color="primary"
        fullWidth
      >
        Register
      </Button>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Container component="main">
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography component="h1" variant="h4" gutterBottom>
                User Registration and Login
              </Typography>
              
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute
                      redirectTo="/login"
                      requiredRoles={['user']}
                    >
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute
                      redirectTo="/login"
                      requiredRoles={['admin']}
                    >
                      <Typography variant="h6">Admin Dashboard</Typography>
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigation />} />
              </Routes>
            </Box>
          </Container>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
