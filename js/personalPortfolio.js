// ======= Portfolio JavaScript =======

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Update copyright year dynamically
(function updateYear() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
})();

// Smooth scrolling for anchor links
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });

        history.pushState(null, '', href);
        updateActiveNav(href);
      }
    });
  });
})();

function updateActiveNav(hash = null) {
  const navLinks = document.querySelectorAll('.nav__links a');
  const sections = document.querySelectorAll('section[id]');

  navLinks.forEach((link) => {
    link.removeAttribute('aria-current');
  });

  if (hash) {
    const activeLink = document.querySelector(`.nav__links a[href="${hash}"]`);
    if (activeLink) {
      activeLink.setAttribute('aria-current', 'page');
    }
  } else {
    let currentSection = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        currentSection = section.getAttribute('id');
      }
    });

    if (currentSection) {
      const activeLink = document.querySelector(
        `.nav__links a[href="#${currentSection}"]`
      );
      if (activeLink) {
        activeLink.setAttribute('aria-current', 'page');
      }
    }
  }
}

let scrollTimeout;
window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }
  scrollTimeout = window.requestAnimationFrame(() => {
    updateActiveNav();
    toggleScrollTopButton();
  });
});

function toggleScrollTopButton() {
  const scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }
}

(function createScrollTopButton() {
  const button = document.createElement('button');
  button.id = 'scroll-top';
  button.className = 'scroll-top';
  button.setAttribute('aria-label', 'Scroll to top');
  button.innerHTML = '↑';
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  });
  document.body.appendChild(button);
})();

function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = '';

  field.classList.remove('error');
  const existingError = field.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  if (field.hasAttribute('required') && !value) {
    isValid = false;
    errorMessage = 'This field is required.';
  } else if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address.';
    }
  }

  if (!isValid) {
    field.classList.add('error');
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = errorMessage;
    field.parentElement.appendChild(errorElement);
  }

  return isValid;
}

function showFormMessage(message, type) {
  const existing = document.querySelector('.form-status-message');
  if (existing) {
    existing.remove();
  }

  const messageElement = document.createElement('p');
  messageElement.className = `form-status-message ${type}`;
  messageElement.setAttribute('role', 'status');
  messageElement.textContent = message;

  const form = document.querySelector('.contact-form');
  const helpText = document.getElementById('contact-help');
  if (form && helpText) {
    form.insertBefore(messageElement, helpText.nextSibling);

    setTimeout(() => {
      messageElement.remove();
    }, 6000);
  }
}

(function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const inputs = form.querySelectorAll('input, textarea');
  const submitButton = form.querySelector('button[type="submit"]');

  inputs.forEach((input) => {
    input.addEventListener('blur', function () {
      validateField(this);
    });

    input.addEventListener('input', function () {
      if (this.classList.contains('error')) {
        this.classList.remove('error');
        const errorMsg = this.parentElement.querySelector('.error-message');
        if (errorMsg) {
          errorMsg.remove();
        }
      }
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    let isValid = true;
    inputs.forEach((input) => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      showFormMessage('Please correct the errors above.', 'error');
      return;
    }

    const action = form.getAttribute('action') || '';

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        showFormMessage('Thank you! Your message has been sent.', 'success');
        form.reset();
      } else {
        showFormMessage(
          'Something went wrong sending your message. Please try again or reach out on GitHub.',
          'error'
        );
      }
    } catch {
      showFormMessage(
        'Unable to send right now. Please try again or reach out on GitHub.',
        'error'
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash) {
    updateActiveNav(hash);
  } else {
    updateActiveNav('#about');
  }
});

(function initMobileMenu() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav__links');
  const navOverlay = document.querySelector('.nav-overlay');

  if (!navToggle || !navMenu) return;

  function toggleMenu() {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
    navMenu.setAttribute('aria-expanded', String(!isExpanded));

    if (navOverlay) {
      navOverlay.classList.toggle('visible');
      navOverlay.setAttribute('aria-hidden', String(isExpanded));
    }

    document.body.style.overflow = !isExpanded ? 'hidden' : '';
  }

  navToggle.addEventListener('click', toggleMenu);

  if (navOverlay) {
    navOverlay.addEventListener('click', () => {
      if (navToggle.getAttribute('aria-expanded') === 'true') {
        toggleMenu();
      }
    });
  }

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (
        window.innerWidth <= 719 &&
        navToggle.getAttribute('aria-expanded') === 'true'
      ) {
        toggleMenu();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'Escape' &&
      navToggle.getAttribute('aria-expanded') === 'true'
    ) {
      toggleMenu();
    }
  });
})();

(function initProjectCarousels() {
  const carousels = document.querySelectorAll('[data-carousel]');

  carousels.forEach((carousel) => {
    const slides = Array.from(
      carousel.querySelectorAll('.carousel__slide')
    );
    const prevBtn = carousel.querySelector('.carousel__btn--prev');
    const nextBtn = carousel.querySelector('.carousel__btn--next');
    const dots = Array.from(
      carousel.querySelectorAll('.carousel__dot')
    );

    if (slides.length < 2) return;

    let index = slides.findIndex((slide) =>
      slide.classList.contains('is-active')
    );
    if (index < 0) index = 0;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', String(i !== index));
      });

      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', String(active));
        dot.tabIndex = active ? 0 : -1;
      });
    }

    show(index);

    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      show(index - 1);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      show(index + 1);
    });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        show(i);
      });
    });

    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        show(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        show(index + 1);
      }
    });

    // Swipe support for touch devices
    let touchStartX = 0;
    let touchStartY = 0;
    carousel.addEventListener(
      'touchstart',
      (e) => {
        const touch = e.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true }
    );
    carousel.addEventListener(
      'touchend',
      (e) => {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) show(index + 1);
        else show(index - 1);
      },
      { passive: true }
    );
  });
})();
