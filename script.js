const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
  revealObserver.observe(el);
});

const glow = document.querySelector('.cursor-glow');
if (glow && window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  });
}

document.querySelectorAll('.system-node, .method-step, .mission-card, .layer-card').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${y * -3}deg) rotateY(${x * 4}deg) translateY(-5px)`;
  });
  card.addEventListener('pointerleave', () => card.style.transform = '');
});

const contributionForm = document.querySelector('.contribution-form');

if (contributionForm) {
  const status = contributionForm.querySelector('.form-note');
  const submitButton = contributionForm.querySelector('.submit-button');
  const endpoint = contributionForm.dataset.endpoint;

  contributionForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!endpoint || !contributionForm.reportValidity()) return;

    const formData = new FormData(contributionForm);
    const email = String(formData.get('email') || '').trim();
    const source = [
      'Hidden Infrastructure contribution',
      `Name: ${String(formData.get('name') || '').trim()}`,
      `Layer: ${String(formData.get('layer') || '').trim()}`,
      `Problem noticed: ${String(formData.get('observation') || '').trim()}`,
      `First action: ${String(formData.get('first_move') || '').trim()}`,
      `Relevant link or example: ${String(formData.get('evidence') || '').trim() || 'Not provided'}`,
    ].join('\n');

    submitButton.disabled = true;
    status.textContent = 'Sending your signal…';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          email,
          source,
          createdAt: new Date().toISOString(),
        }),
        redirect: 'follow',
      });
      const result = await response.text();

      if (!response.ok || result.trim().toLowerCase() !== 'ok') {
        throw new Error(`Submission failed: ${result}`);
      }

      contributionForm.reset();
      status.textContent = 'Received. Thank you — your signal is in the system.';
    } catch (error) {
      console.error('Contribution form error:', error);
      status.textContent = 'Not connected. Please try again or email admin@whimsycyberspace.com.';
    } finally {
      submitButton.disabled = false;
    }
  });
}
