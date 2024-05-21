import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify';
import { toastErrorStyle, toastSuccessStyle } from './uitls/toastStyle';

function AdminLoginForm({ app, closeStatus }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email Cannot be empty", toastErrorStyle());
      return;
    }

    if (!password.trim()) {
      toast.error("Password Cannot be empty", toastErrorStyle());
      return;
    }

    try {
      const auth = getAuth(app);

      await signInWithEmailAndPassword(auth, email, password);

      // signal to close component
      closeStatus(true);
      toast.success("Admin Login Successfull", toastSuccessStyle());
      console.log('Admin logged in successfully!');
    } catch (error) {
      toast.error("Invalid Login Credentials", toastErrorStyle());
      console.error('Error signing in:', error.message);
      closeStatus(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email Cannot be empty", toastErrorStyle());
      return;
    }

    try {
      const auth = getAuth(app);

      await sendPasswordResetEmail(auth, email);

      toast.success("Success! If your email is registered, you'll receive a password reset link soon. Please check your inbox.",
      {...toastSuccessStyle(), autoClose : false} );
      console.log('Password reset email sent.');

      setIsButtonDisabled(true);
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 5000); // 5 sec
    } catch (error) {
      if (error.code === 'auth/invalid-email')
        toast.error("Invalid email", toastErrorStyle());
      else
        toast.error("Failed to send password reset email. Please try again later.", toastErrorStyle());

      console.error('Error sending password reset email:', error.message);
    }
  };

  return (
    <div className='admin-form'>
      <form onSubmit={handleLogin}>
        <input
          className='admin-email'
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
        />
        <input
          className='admin-password'
          type="password"
          placeholder=" password"
          value={password}
          onChange={(e) => setPassword(e.target.value.trim())}
        />
        <button className='admin-submit' type="submit">Login</button>
      </form>
      <button className='admin-ForgotPass' disabled={isButtonDisabled} onClick={handleForgotPassword}>
        { isButtonDisabled? 'Please wait for 5 seconds...' : 'Forgot Password?'}
      </button>
    </div>
  );
}

export default AdminLoginForm;