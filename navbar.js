// Dark, light theme 

    function setTheme(mode) {
      if (mode === 'light') {
          document.body.classList.add('light-mode');
          document.querySelectorAll('.light-btn').forEach(btn => btn.classList.add('active'));
          document.querySelectorAll('.dark-btn').forEach(btn => btn.classList.remove('active'));
          localStorage.setItem('theme', 'light');
      } else {
          document.body.classList.remove('light-mode');
          document.querySelectorAll('.dark-btn').forEach(btn => btn.classList.add('active'));
          document.querySelectorAll('.light-btn').forEach(btn => btn.classList.remove('active'));
          localStorage.setItem('theme', 'dark');
      }
    }

    document.querySelectorAll('.dark-btn').forEach(btn => {
      btn.addEventListener('click', () => setTheme('dark'));
      });
      document.querySelectorAll('.light-btn').forEach(btn => {
      btn.addEventListener('click', () => setTheme('light'));
      });

      // On load, set theme from storage
      window.addEventListener('DOMContentLoaded', () => {
      const saved = localStorage.getItem('theme');
      setTheme(saved === 'light' ? 'light' : 'dark');
    });

// Sophisticated navbar interactivity
// Handles mobile menu toggle and active link highlighting
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.navbar ul');
    const links = document.querySelectorAll('.navbar ul li a');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
    }

    // Highlight active link
    links.forEach(link => {
        if (window.location.pathname.replace(/\/.*\//, '') === link.getAttribute('href')) {
            link.classList.add('active');
        }
        link.addEventListener('click', function() {
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// images and icons section

document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('.masonry-item');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('loaded');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  images.forEach(img => observer.observe(img));
});


const toggleBtn = document.getElementById('theme-toggle');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  // Optionally, save preference
  if(document.body.classList.contains('light-mode')) {
    localStorage.setItem('theme', 'light');
    toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    localStorage.setItem('theme', 'dark');
    toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  }
});
// On load, set theme from storage
window.addEventListener('DOMContentLoaded', () => {
  if(localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
  }
});


// Animate any element with .animate-on-scroll when it enters view
document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".animate-on-scroll");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
});

