async function loadArticles() {
  const articleList = document.getElementById('article-list');
  if (!articleList) return;

  const res = await fetch('/api/articles');
  const articles = await res.json();

  articleList.innerHTML = articles.map((article, index) => `
    <article class="article-card reveal" style="transition-delay:${index * 90}ms">
      <div class="article-card-top">
        <span class="tag">${article.category}</span>
        <span class="article-icon">${index % 2 === 0 ? '🔐' : '🧠'}</span>
      </div>
      <h3>${article.title}</h3>
      <p>${article.summary}</p>
      <details>
        <summary>Read more</summary>
        <p>${article.content}</p>
      </details>
    </article>
  `).join('');

  revealOnScroll();
}

async function setupForm() {
  const form = document.getElementById('reportForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const message = document.getElementById('formMessage');

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        message.textContent = data.message || 'Something went wrong.';
        message.className = 'form-message error';
        return;
      }

      message.textContent = data.message;
      message.className = 'form-message success';
      form.reset();
    } catch (error) {
      message.textContent = 'Unable to submit right now. Please try again.';
      message.className = 'form-message error';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Report';
    }
  });
}

function setupMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

function revealOnScroll() {
  const items = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(item => observer.observe(item));
}

loadArticles();
setupForm();
setupMenu();
revealOnScroll();
