document.addEventListener('DOMContentLoaded', () => {
  // Toggle Password Visibility
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('id_password');
  const eyeOpen = document.getElementById('eyeOpen');
  const eyeClosed = document.getElementById('eyeClosed');

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      if (type === 'text') {
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
      } else {
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
      }
    });
  }

  // Toggle Signup Password Visibility
  const toggleSignupBtn = document.getElementById('toggleSignupPassword');
  const signupPasswordInput = document.getElementById('id_signup_password');
  const eyeSignupOpen = document.getElementById('eyeSignupOpen');
  const eyeSignupClosed = document.getElementById('eyeSignupClosed');

  if (toggleSignupBtn && signupPasswordInput) {
    toggleSignupBtn.addEventListener('click', () => {
      const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      signupPasswordInput.setAttribute('type', type);
      if (type === 'text') {
        eyeSignupOpen.classList.add('hidden');
        eyeSignupClosed.classList.remove('hidden');
      } else {
        eyeSignupOpen.classList.remove('hidden');
        eyeSignupClosed.classList.add('hidden');
      }
    });
  }
  // Snappy Icon Animation On Type
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      const iconWrapper = input.parentElement.querySelector('.pointer-events-none svg');
      if (iconWrapper) {
        // override group focus scaling for this split second
        iconWrapper.style.transform = 'scale(1.25) translateY(-2px)';
        // Adding a small filter or color pop optionally
        iconWrapper.style.color = '#3b82f6'; 
        setTimeout(() => {
          iconWrapper.style.transform = '';
          iconWrapper.style.color = '';
        }, 120);
      }
    });
  });
  // Submit Form Button Logic
  const form = document.querySelector('form');
  const submitBtn = document.getElementById('submitLoginBtn');
  const submitText = document.getElementById('submitLoginText');
  const submitArrow = document.getElementById('submitLoginArrow');
  const submitSpinner = document.getElementById('submitLoginSpinner');
  if (form && submitBtn) {
    form.addEventListener('submit', (e) => {
      // If valid, show loading state
      if (form.checkValidity()) {
        submitBtn.classList.add('opacity-90', 'cursor-wait');
        submitText.textContent = 'SIGNING IN...';
        submitArrow.classList.add('hidden');
        submitSpinner.classList.remove('hidden');
      }
    });
  }

  // Slider Animation Logic
  const authSlider = document.getElementById('authSlider');
  const showSignupBtn = document.getElementById('showSignupBtn');
  const showLoginBtn = document.getElementById('showLoginBtn');

  if (authSlider && showSignupBtn && showLoginBtn) {
    showSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      authSlider.classList.remove('translate-x-0');
      authSlider.classList.add('-translate-x-1/2');
    });
    
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      authSlider.classList.remove('-translate-x-1/2');
      authSlider.classList.add('translate-x-0');
    });
  }



  // Success Modal Logic for Login Page
  const successModalOverlay = document.getElementById('successModalOverlay');
  const successModalCard = document.getElementById('successModalCard');
  const successModalMessage = document.getElementById('successModalMessage');
  const successModalCloseBtn = document.getElementById('successModalCloseBtn');

  function showSuccessModal(msg) {
    if (successModalMessage) successModalMessage.innerHTML = msg;
    if (successModalOverlay) {
      successModalOverlay.style.display = 'flex';
      // Trigger reflow
      void successModalOverlay.offsetWidth;
      successModalOverlay.classList.remove('opacity-0', 'pointer-events-none');
      successModalOverlay.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (successModalCard) {
      successModalCard.classList.remove('-translate-x-[100vw]', 'opacity-0');
      successModalCard.classList.add('translate-x-0', 'opacity-100');
    }
  }

  function hideSuccessModal() {
    if (successModalOverlay) {
      successModalOverlay.classList.remove('opacity-100', 'pointer-events-auto');
      successModalOverlay.classList.add('opacity-0', 'pointer-events-none');
    }
    if (successModalCard) {
      successModalCard.classList.remove('translate-x-0', 'opacity-100');
      successModalCard.classList.add('-translate-x-[100vw]', 'opacity-0');
    }
    setTimeout(() => {
      if (successModalOverlay) successModalOverlay.style.display = 'none';
      // Return to login
      const authSlider = document.getElementById('authSlider');
      if(authSlider) {
        authSlider.classList.remove('-translate-x-1/2');
        authSlider.classList.add('translate-x-0');
      }
    }, 500);
  }

  if (successModalCloseBtn) {
    successModalCloseBtn.addEventListener('click', hideSuccessModal);
  }

  // OTP Signup Logic
  let otpInterval;
  let timeRemaining = 120; // 2 minutes

  const triggerSignupBtn = document.getElementById('triggerSignupBtn');
  const triggerSignupText = document.getElementById('triggerSignupText');
  const triggerSignupArrow = document.getElementById('triggerSignupArrow');
  const triggerSignupSpinner = document.getElementById('triggerSignupSpinner');

  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const verifyOtpText = document.getElementById('verifyOtpText');
  const verifyOtpArrow = document.getElementById('verifyOtpArrow');
  const verifyOtpSpinner = document.getElementById('verifyOtpSpinner');

  const signupFields = document.getElementById('signupFields');
  const otpFields = document.getElementById('otpFields');
  const otpTimer = document.getElementById('otpTimer');
  const signupErrorToast = document.getElementById('signupErrorToast');

  function showSignupError(msg) {
    if(!signupErrorToast) return;
    signupErrorToast.textContent = msg;
    signupErrorToast.classList.remove('hidden');
  }
  function hideSignupError() {
    if(signupErrorToast) signupErrorToast.classList.add('hidden');
  }

  function startOtpTimer() {
    clearInterval(otpInterval);
    timeRemaining = 120;
    updateTimerDisplay();
    otpInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        clearInterval(otpInterval);
        otpTimer.textContent = '00:00';
        otpTimer.classList.replace('text-blue-600', 'text-red-500');
        showSignupError('Verification code expired. Please restart the process.');
        verifyOtpBtn.classList.add('opacity-50', 'pointer-events-none');
      } else {
        updateTimerDisplay();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const s = (timeRemaining % 60).toString().padStart(2, '0');
    otpTimer.textContent = m + ':' + s;
  }

  if (triggerSignupBtn) {
    triggerSignupBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      hideSignupError();

      const email = document.getElementById('id_signup_email').value.trim();
      const username = document.getElementById('id_signup_username').value.trim();
      const password = document.getElementById('id_signup_password').value;

      if (!email || !username || !password) {
        showSignupError('Please fill out all fields.');
        return;
      }

      // Show Loading
      triggerSignupBtn.classList.add('pointer-events-none');
      triggerSignupText.textContent = 'SENDING OTP...';
      if(triggerSignupArrow) triggerSignupArrow.classList.add('hidden');
      if(triggerSignupSpinner) triggerSignupSpinner.classList.remove('hidden');

      try {
        const response = await fetch('/api/send-otp/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, username, password })
        });
        
        const data = await response.json();
        if (data.success) {
          // Transition UI to OTP State
          signupFields.classList.add('hidden');
          triggerSignupBtn.classList.add('hidden');
          otpFields.classList.remove('hidden');
          verifyOtpBtn.classList.remove('hidden');
          startOtpTimer();
        } else {
          showSignupError(data.error);
        }
      } catch (err) {
        showSignupError('JS Error: ' + (err.message || err.toString()));
      } finally {
        triggerSignupBtn.classList.remove('pointer-events-none');
        triggerSignupText.textContent = 'CREATE ACCOUNT';
        if(triggerSignupArrow) triggerSignupArrow.classList.remove('hidden');
        if(triggerSignupSpinner) triggerSignupSpinner.classList.add('hidden');
      }
    });
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      hideSignupError();

      const otp = document.getElementById('id_signup_otp').value.trim();
      if (!otp || otp.length !== 6) {
        showSignupError('Please enter a valid 6-digit OTP.');
        return;
      }

      // Show Loading
      verifyOtpBtn.classList.add('pointer-events-none');
      verifyOtpText.textContent = 'VERIFYING...';
      if(verifyOtpArrow) verifyOtpArrow.classList.add('hidden');
      if(verifyOtpSpinner) verifyOtpSpinner.classList.remove('hidden');

      try {
        const response = await fetch('/api/verify-otp/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ otp })
        });
        
        const data = await response.json();
        if (data.success) {
          // Success! Show Modal
          clearInterval(otpInterval);
          showSuccessModal("<span class='block text-[15px] mb-2'>Congratulations! 🎉</span><span class='block text-[13px] font-medium text-slate-600 leading-relaxed mb-3'>Your ITS Inventory account has been successfully verified and created.</span><span class='block text-[12px] text-emerald-600 font-extrabold uppercase tracking-[0.1em] mt-3'>You can now login</span>");
          
          // Optionally populate username
          document.getElementById('id_username').value = document.getElementById('id_signup_username').value;
          
          // Reset Signup UI for next potential round
          signupFields.classList.remove('hidden');
          triggerSignupBtn.classList.remove('hidden');
          otpFields.classList.add('hidden');
          verifyOtpBtn.classList.add('hidden');
          document.getElementById('id_signup_email').value = '';
          document.getElementById('id_signup_username').value = '';
          document.getElementById('id_signup_password').value = '';
          document.getElementById('id_signup_otp').value = '';
          
        } else {
          showSignupError(data.error);
        }
      } catch (err) {
        showSignupError('JS Error: ' + (err.message || err.toString()));
      } finally {
        verifyOtpBtn.classList.remove('pointer-events-none');
        verifyOtpText.textContent = 'VERIFY & SIGNUP';
        if(verifyOtpArrow) verifyOtpArrow.classList.remove('hidden');
        if(verifyOtpSpinner) verifyOtpSpinner.classList.add('hidden');
      }
    });
  }

  // ============================================
  // FORGOT PASSWORD LOGIC
  // ============================================
  const triggerForgotPasswordBtn = document.getElementById('triggerForgotPasswordBtn');
  const loginFieldsContainer = document.getElementById('loginFieldsContainer');
  const forgotPasswordEmailContainer = document.getElementById('forgotPasswordEmailContainer');
  const backToLoginFromEmail = document.getElementById('backToLoginFromEmail');
  const submitForgotEmailBtn = document.getElementById('submitForgotEmailBtn');
  
  const forgotPasswordOtpContainer = document.getElementById('forgotPasswordOtpContainer');
  const backToLoginFromOtp = document.getElementById('backToLoginFromOtp');
  const submitForgotOtpBtn = document.getElementById('submitForgotOtpBtn');
  const forgotOtpTimer = document.getElementById('forgotOtpTimer');

  const forgotPasswordResetContainer = document.getElementById('forgotPasswordResetContainer');
  const submitForgotResetBtn = document.getElementById('submitForgotResetBtn');

  let forgotInterval;
  let forgotTimeRemaining = 120; // 2 minutes

  const showLoginFromForgot = (e) => {
    if(e) e.preventDefault();
    forgotPasswordEmailContainer.classList.add('hidden');
    forgotPasswordOtpContainer.classList.add('hidden');
    forgotPasswordResetContainer.classList.add('hidden');
    loginFieldsContainer.classList.remove('hidden');
    clearInterval(forgotInterval);
  };

  if (triggerForgotPasswordBtn) {
    triggerForgotPasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideSignupError(); 
      loginFieldsContainer.classList.add('hidden');
      forgotPasswordEmailContainer.classList.remove('hidden');
    });
  }

  if (backToLoginFromEmail) {
    backToLoginFromEmail.addEventListener('click', showLoginFromForgot);
  }
  
  if (backToLoginFromOtp) {
    backToLoginFromOtp.addEventListener('click', showLoginFromForgot);
  }

  function startForgotOtpTimer() {
    clearInterval(forgotInterval);
    forgotTimeRemaining = 120;
    
    const m = Math.floor(forgotTimeRemaining / 60).toString().padStart(2, '0');
    const s = (forgotTimeRemaining % 60).toString().padStart(2, '0');
    if(forgotOtpTimer) {
      forgotOtpTimer.textContent = m + ':' + s;
      forgotOtpTimer.className = 'text-blue-600 font-bold text-[14px]';
    }
    
    forgotInterval = setInterval(() => {
      forgotTimeRemaining--;
      if (forgotTimeRemaining <= 0) {
        clearInterval(forgotInterval);
        if(forgotOtpTimer) {
          forgotOtpTimer.textContent = '00:00';
          forgotOtpTimer.classList.replace('text-blue-600', 'text-red-500');
        }
        showSignupError('Verification code expired. Please request a new one.');
        if(submitForgotOtpBtn) submitForgotOtpBtn.classList.add('opacity-50', 'pointer-events-none');
      } else {
        const mm = Math.floor(forgotTimeRemaining / 60).toString().padStart(2, '0');
        const ss = (forgotTimeRemaining % 60).toString().padStart(2, '0');
        if(forgotOtpTimer) forgotOtpTimer.textContent = mm + ':' + ss;
      }
    }, 1000);
  }

  // 1. Submit Forgot Email
  if (submitForgotEmailBtn) {
    submitForgotEmailBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      hideSignupError();
      const email = document.getElementById('id_forgot_email').value.trim();
      if (!email) {
        showSignupError('Please enter your email.');
        return;
      }

      const textEl = document.getElementById('submitForgotEmailText');
      const arrowEl = document.getElementById('submitForgotEmailArrow');
      const spinnerEl = document.getElementById('submitForgotEmailSpinner');

      submitForgotEmailBtn.classList.add('pointer-events-none');
      textEl.textContent = 'SENDING...';
      if(arrowEl) arrowEl.classList.add('hidden');
      if(spinnerEl) spinnerEl.classList.remove('hidden');

      try {
        const response = await fetch('/api/forgot-password/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        
        if (data.success) {
          forgotPasswordEmailContainer.classList.add('hidden');
          forgotPasswordOtpContainer.classList.remove('hidden');
          startForgotOtpTimer();
        } else {
          showSignupError(data.error);
        }
      } catch (err) {
        showSignupError('Error: ' + err.toString());
      } finally {
        submitForgotEmailBtn.classList.remove('pointer-events-none');
        textEl.textContent = 'SEND CODE';
        if(arrowEl) arrowEl.classList.remove('hidden');
        if(spinnerEl) spinnerEl.classList.add('hidden');
      }
    });
  }

  // 2. Submit Forgot OTP
  if (submitForgotOtpBtn) {
    submitForgotOtpBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      hideSignupError();
      const otp = document.getElementById('id_forgot_otp').value.trim();
      if (!otp || otp.length !== 6) {
        showSignupError('Please enter a valid 6-digit OTP.');
        return;
      }

      const textEl = document.getElementById('submitForgotOtpText');
      const arrowEl = document.getElementById('submitForgotOtpArrow');
      const spinnerEl = document.getElementById('submitForgotOtpSpinner');

      submitForgotOtpBtn.classList.add('pointer-events-none');
      textEl.textContent = 'VERIFYING...';
      if(arrowEl) arrowEl.classList.add('hidden');
      if(spinnerEl) spinnerEl.classList.remove('hidden');

      try {
        const response = await fetch('/api/forgot-verify-otp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp })
        });
        const data = await response.json();
        
        if (data.success) {
          clearInterval(forgotInterval);
          forgotPasswordOtpContainer.classList.add('hidden');
          forgotPasswordResetContainer.classList.remove('hidden');
        } else {
          showSignupError(data.error);
        }
      } catch (err) {
        showSignupError('Error: ' + err.toString());
      } finally {
        submitForgotOtpBtn.classList.remove('pointer-events-none');
        textEl.textContent = 'VERIFY';
        if(arrowEl) arrowEl.classList.remove('hidden');
        if(spinnerEl) spinnerEl.classList.add('hidden');
      }
    });
  }

  // 3. Submit New Password
  if (submitForgotResetBtn) {
    submitForgotResetBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      hideSignupError();
      const pwd = document.getElementById('id_forgot_new_password').value;
      const confirm = document.getElementById('id_forgot_confirm_password').value;
      
      if (!pwd || !confirm) {
        showSignupError('Please fill out all password fields.');
        return;
      }
      if (pwd !== confirm) {
        showSignupError('Passwords do not match.');
        return;
      }

      const textEl = document.getElementById('submitForgotResetText');
      const arrowEl = document.getElementById('submitForgotResetArrow');
      const spinnerEl = document.getElementById('submitForgotResetSpinner');

      submitForgotResetBtn.classList.add('pointer-events-none');
      textEl.textContent = 'SAVING...';
      if(arrowEl) arrowEl.classList.add('hidden');
      if(spinnerEl) spinnerEl.classList.remove('hidden');

      try {
        const response = await fetch('/api/forgot-reset-password/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_password: pwd })
        });
        const data = await response.json();
        
        if (data.success) {
          showLoginFromForgot();
          
          let msg = "<span class='block text-[15px] mb-2'>Password Reset! 🎉</span><span class='block text-[13px] font-medium text-slate-600 leading-relaxed mb-3'>Your ITS Inventory account password was changed successfully.</span><span class='block text-[12px] text-emerald-600 font-extrabold uppercase tracking-[0.1em] mt-3'>You can now login</span>";
          showSuccessModal(msg);
          
          // clear inputs
          document.getElementById('id_forgot_email').value = '';
          document.getElementById('id_forgot_otp').value = '';
          document.getElementById('id_forgot_new_password').value = '';
          document.getElementById('id_forgot_confirm_password').value = '';
          
        } else {
          showSignupError(data.error);
        }
      } catch (err) {
        showSignupError('Error: ' + err.toString());
      } finally {
        submitForgotResetBtn.classList.remove('pointer-events-none');
        textEl.textContent = 'SAVE PASSWORD';
        if(arrowEl) arrowEl.classList.remove('hidden');
        if(spinnerEl) spinnerEl.classList.add('hidden');
      }
    });
  }

});
