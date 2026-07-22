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
});
