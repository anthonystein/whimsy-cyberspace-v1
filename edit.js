(() => {
  const form = document.querySelector('.login-card');
  const message = document.querySelector('.login-message');
  fetch('/api/auth/session', { credentials: 'same-origin' }).then(response => response.json()).then(data => {
    if (data.authenticated) location.replace('/?edit=1');
  }).catch(() => {});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    message.textContent = 'Checking…';
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: new FormData(form).get('passphrase') })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign-in failed.');
      location.replace('/?edit=1');
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });
})();
