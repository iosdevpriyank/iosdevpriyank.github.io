//
//  portfolio-integration.js
//  Portfolio Integration for Ignite Framework
//
//  Created by Priyank Gandhi on 30/08/25.
//

// Enhanced GitHub Integration for Ignite
class GitHubIntegration {
    constructor(username = 'iosdevpriyank') {
        this.username = username;
        this.apiUrl = 'https://api.github.com';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }
    
    async fetchWithCache(url, cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error(`Error fetching ${cacheKey}:`, error);
            return cached ? cached.data : null;
        }
    }
    
    async fetchRepositories() {
        const repos = await this.fetchWithCache(
            `${this.apiUrl}/users/${this.username}/repos?sort=updated&per_page=12&type=owner`,
            'repositories'
        );
        return repos ? repos.filter(repo => !repo.fork && !repo.private) : [];
    }
    
    async fetchUserStats() {
        const user = await this.fetchWithCache(
            `${this.apiUrl}/users/${this.username}`,
            'user'
        );
        
        if (!user) return null;
        
        const repos = await this.fetchRepositories();
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        
        return {
            publicRepos: user.public_repos,
            followers: user.followers,
            stars: totalStars,
            forks: totalForks
        };
    }
    
    getLanguageIcon(language) {
        const icons = {
            'Swift': '🍎',
            'Objective-C': '🔵',
            'JavaScript': '🟡',
            'TypeScript': '🔷',
            'Python': '🐍',
            'Java': '☕',
            'Kotlin': '🟣',
            'Dart': '🎯',
            'C++': '⚡',
            'Ruby': '💎',
            'Go': '🐹',
            'Rust': '🦀'
        };
        return icons[language] || '📱';
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

// Enhanced Medium Integration
class MediumIntegration {
    constructor(username = '@priyankgandhi') {
        this.username = username;
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
        this.proxyUrl = 'https://api.rss2json.com/v1/api.json?rss_url=';
        this.feedUrl = `https://medium.com/feed/${this.username}`;
    }
    
    async fetchWithCache(url, cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error(`Error fetching Medium blogs:`, error);
            return cached ? cached.data : this.getFallbackBlogs();
        }
    }
    
    async fetchBlogs() {
        const url = `${this.proxyUrl}${encodeURIComponent(this.feedUrl)}`;
        const data = await this.fetchWithCache(url, 'medium-blogs');
        
        if (data && data.status === 'ok' && data.items) {
            return data.items.slice(0, 6).map(item => ({
                title: item.title,
                link: item.link,
                description: this.stripHtml(item.description).substring(0, 150) + '...',
                pubDate: new Date(item.pubDate),
                categories: item.categories || [],
                thumbnail: this.extractThumbnail(item.description) || this.getDefaultThumbnail(),
                readTime: this.estimateReadTime(item.description)
            }));
        }
        
        return this.getFallbackBlogs();
    }
    
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
    
    extractThumbnail(description) {
        const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
        return imgMatch ? imgMatch[1] : null;
    }
    
    getDefaultThumbnail() {
        const thumbnails = [
            'https://via.placeholder.com/400x220/007aff/ffffff?text=iOS+Development',
            'https://via.placeholder.com/400x220/5856d6/ffffff?text=Swift+Tips',
            'https://via.placeholder.com/400x220/af52de/ffffff?text=Mobile+Dev'
        ];
        return thumbnails[Math.floor(Math.random() * thumbnails.length)];
    }
    
    estimateReadTime(content) {
        const wordsPerMinute = 200;
        const wordCount = this.stripHtml(content).split(' ').length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }
    
    getFallbackBlogs() {
        return [
            {
                title: "Building Modern iOS Apps with SwiftUI",
                link: "#",
                description: "Explore the latest SwiftUI features and best practices for creating stunning iOS applications with declarative UI patterns...",
                pubDate: new Date(),
                categories: ["iOS", "SwiftUI", "Mobile Development"],
                thumbnail: this.getDefaultThumbnail(),
                readTime: 5
            },
            {
                title: "iOS Performance Optimization Techniques",
                link: "#",
                description: "Deep dive into performance optimization strategies for iOS apps, covering memory management, rendering, and battery efficiency...",
                pubDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                categories: ["Performance", "iOS", "Optimization"],
                thumbnail: this.getDefaultThumbnail(),
                readTime: 8
            },
            {
                title: "The Future of Mobile Development",
                link: "#",
                description: "Exploring emerging trends in mobile development, from cross-platform solutions to AI integration in mobile apps...",
                pubDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                categories: ["Mobile", "Technology", "Future"],
                thumbnail: this.getDefaultThumbnail(),
                readTime: 6
            }
        ];
    }
    
    formatDate(date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
}

// Navigation Manager for Ignite
class NavigationManager {
    constructor() {
        this.nav = document.querySelector('.main-nav');
        this.setupScrollEffects();
        this.setupSmoothScrolling();
        this.setupActiveStates();
    }
    
    setupScrollEffects() {
        let ticking = false;
        
        const updateNavigation = () => {
            if (!this.nav) return;
            
            const scrolled = window.scrollY > 50;
            this.nav.classList.toggle('scrolled', scrolled);
        };
        
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateNavigation();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', onScroll, { passive: true });
    }
    
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const navHeight = 100;
                    const targetPosition = target.offsetTop - navHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    setupActiveStates() {
        // Set active navigation state based on current page
        const setActiveNav = () => {
            const currentPath = window.location.pathname;
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                
                const href = link.getAttribute('href');
                if (href === currentPath ||
                    (currentPath === '/' && href === '/') ||
                    (currentPath === '/index.html' && href === '/')) {
                    link.classList.add('active');
                }
            });
        };
        
        setActiveNav();
        window.addEventListener('popstate', setActiveNav);
    }
}

// Main Portfolio Application for Ignite
class PortfolioApp {
    constructor() {
        this.github = new GitHubIntegration('iosdevpriyank');
        this.medium = new MediumIntegration('@priyankgandhi');
        this.navigationManager = new NavigationManager();
        this.init();
    }
    
    async init() {
        await this.loadDynamicContent();
        this.setupAnimations();
        this.setupThemeToggle();
        this.setupAutoRefresh();
    }
    
    async loadDynamicContent() {
        await Promise.all([
            this.loadGitHubProjects(),
            this.loadMediumBlogs()
        ]);
    }
    
    async loadGitHubProjects() {
        const projectsContainer = document.getElementById('github-projects');
        if (!projectsContainer) return;
        
        // Show loading state
        projectsContainer.innerHTML = this.createProjectLoadingSkeleton();
        
        try {
            const repos = await this.github.fetchRepositories();
            if (repos.length > 0) {
                projectsContainer.innerHTML = repos.slice(0, 6).map(repo =>
                    this.createProjectCard(repo)
                ).join('');
            } else {
                projectsContainer.innerHTML = this.createFallbackProjects();
            }
        } catch (error) {
            console.error('Error loading GitHub projects:', error);
            projectsContainer.innerHTML = this.createFallbackProjects();
        }
        
        this.animateElements('.project-card');
    }
    
    async loadMediumBlogs() {
        const blogsContainer = document.getElementById('medium-blogs');
        if (!blogsContainer) return;
        
        // Show loading state
        blogsContainer.innerHTML = this.createBlogLoadingSkeleton();
        
        try {
            const blogs = await this.medium.fetchBlogs();
            blogsContainer.innerHTML = blogs.map(blog =>
                this.createBlogCard(blog)
            ).join('');
        } catch (error) {
            console.error('Error loading Medium blogs:', error);
            blogsContainer.innerHTML = this.createFallbackBlogs();
        }
        
        this.animateElements('.blog-card');
    }
    
    createProjectCard(repo) {
        const language = repo.language || 'Swift';
        const icon = this.github.getLanguageIcon(language);
        const updatedDate = new Date(repo.updated_at).toLocaleDateString();
        
        return `
            <div class="project-card" data-type="${language.toLowerCase()}">
                <div class="project-image" style="background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; height: 180px;">
                    <div style="font-size: 4rem; opacity: 0.8; color: white;">${icon}</div>
                </div>
                <div class="project-content">
                    <div class="project-header">
                        <h3 class="project-title">${repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                        <span class="project-language">${language}</span>
                    </div>
                    <p class="project-description">${repo.description || 'iOS development project showcasing modern Swift development practices.'}</p>
                    <div class="project-stats">
                        <span>⭐ ${repo.stargazers_count}</span>
                        <span>🔀 ${repo.forks_count}</span>
                        <span>📅 ${updatedDate}</span>
                        <span>📊 ${(repo.size / 1024).toFixed(1)}MB</span>
                    </div>
                    <div class="project-links">
                        <a href="${repo.html_url}" class="project-link" target="_blank" rel="noopener">
                            <span>📱</span> View Code
                        </a>
                        ${repo.homepage ? `<a href="${repo.homepage}" class="project-link" target="_blank" rel="noopener">
                            <span>🚀</span> Live Demo
                        </a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    createBlogCard(blog) {
        const categories = blog.categories.slice(0, 2);
        const categoryString = categories.join(',').toLowerCase();
        
        return `
            <div class="blog-card" data-category="${categoryString}">
                <div class="blog-image" style="background-image: url('${blog.thumbnail}'); background-size: cover; background-position: center;">
                    <div class="blog-overlay">
                        <span class="read-time">📖 ${blog.readTime} min read</span>
                    </div>
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-date">📅 ${this.medium.formatDate(blog.pubDate)}</span>
                        ${categories.length > 0 ? `<span class="blog-category">#${categories[0]}</span>` : ''}
                    </div>
                    <h3 class="blog-title">${blog.title}</h3>
                    <p class="blog-description">${blog.description}</p>
                    <div class="blog-footer">
                        <a href="${blog.link}" class="blog-link" target="_blank" rel="noopener">
                            <span>📝</span> Read Article
                        </a>
                        <div class="blog-tags">
                            ${categories.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createProjectLoadingSkeleton() {
        return Array(3).fill().map(() => `
            <div class="project-card">
                <div class="project-image loading-skeleton" style="height: 180px;"></div>
                <div class="project-content">
                    <div class="loading-skeleton" style="height: 1.5rem; margin-bottom: 1rem;"></div>
                    <div class="loading-skeleton" style="height: 1rem; margin-bottom: 0.5rem;"></div>
                    <div class="loading-skeleton" style="height: 1rem; width: 80%; margin-bottom: 1rem;"></div>
                    <div class="loading-skeleton" style="height: 2rem; width: 60%;"></div>
                </div>
            </div>
        `).join('');
    }
    
    createBlogLoadingSkeleton() {
        return Array(3).fill().map(() => `
            <div class="blog-card">
                <div class="blog-image loading-skeleton" style="height: 220px;"></div>
                <div class="blog-content">
                    <div class="loading-skeleton" style="height: 1.5rem; margin-bottom: 1rem;"></div>
                    <div class="loading-skeleton" style="height: 1rem; margin-bottom: 0.5rem;"></div>
                    <div class="loading-skeleton" style="height: 1rem; width: 70%;"></div>
                </div>
            </div>
        `).join('');
    }
    
    createFallbackProjects() {
        const fallbackRepos = [
            {
                name: 'iOS-Finance-Tracker',
                language: 'Swift',
                description: 'Personal finance tracking app with Core Data and CloudKit integration',
                stargazers_count: 45,
                forks_count: 12,
                updated_at: new Date().toISOString(),
                size: 2048,
                html_url: '#',
                homepage: null
            },
            {
                name: 'AR-Shopping-App',
                language: 'Swift',
                description: 'Augmented reality shopping experience with ARKit integration',
                stargazers_count: 67,
                forks_count: 19,
                updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                size: 3072,
                html_url: '#',
                homepage: null
            },
            {
                name: 'SwiftUI-Components',
                language: 'Swift',
                description: 'Collection of reusable SwiftUI components and custom views',
                stargazers_count: 23,
                forks_count: 8,
                updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                size: 1024,
                html_url: '#',
                homepage: null
            }
        ];
        
        return fallbackRepos.map(repo => this.createProjectCard(repo)).join('');
    }
    
    createFallbackBlogs() {
        const fallbackBlogs = [
            {
                title: "Building Modern iOS Apps with SwiftUI",
                link: "#",
                description: "Explore the latest SwiftUI features and best practices for creating stunning iOS applications...",
                pubDate: new Date(),
                categories: ["iOS", "SwiftUI"],
                thumbnail: "https://via.placeholder.com/400x220/007aff/ffffff?text=SwiftUI",
                readTime: 5
            },
            {
                title: "iOS Performance Optimization Guide",
                link: "#",
                description: "Deep dive into performance optimization strategies for iOS applications...",
                pubDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                categories: ["Performance", "iOS"],
                thumbnail: "https://via.placeholder.com/400x220/5856d6/ffffff?text=Performance",
                readTime: 8
            },
            {
                title: "The Future of Mobile Development",
                link: "#",
                description: "Exploring emerging trends in mobile development and what's coming next...",
                pubDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                categories: ["Mobile", "Future"],
                thumbnail: "https://via.placeholder.com/400x220/af52de/ffffff?text=Future",
                readTime: 6
            }
        ];
        
        return fallbackBlogs.map(blog => this.createBlogCard(blog)).join('');
    }
    
    setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'slideInUp 0.8s ease-out forwards';
                    entry.target.style.opacity = '1';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        // Observe elements when they're created
        setTimeout(() => {
            document.querySelectorAll('.project-card, .blog-card, .skill-card').forEach(el => {
                if (!el.style.opacity) {
                    el.style.opacity = '0';
                    observer.observe(el);
                }
            });
        }, 100);
    }
    
    animateElements(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.animation = 'slideInUp 0.6s ease-out forwards';
                element.style.opacity = '1';
            }, index * 100);
        });
    }
    
    setupThemeToggle() {
        // Initialize theme from localStorage or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme toggle button
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
        
        // Create theme toggle if it doesn't exist
        if (!themeToggle) {
            this.createThemeToggle();
        }
    }
    
    createThemeToggle() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
        button.onclick = () => this.toggleTheme();
        button.setAttribute('aria-label', 'Toggle theme');
        document.body.appendChild(button);
    }
    
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        
        const button = document.querySelector('.theme-toggle');
        if (button) {
            button.textContent = next === 'dark' ? '☀️' : '🌙';
        }
    }
    
    setupAutoRefresh() {
        // Refresh data every 15 minutes
        setInterval(async () => {
            await this.loadDynamicContent();
            console.log('Portfolio data refreshed');
        }, 900000);
    }
}

// Blog Filter Functionality
function filterBlogs(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter blog cards
    const cards = document.querySelectorAll('.blog-card');
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category') || '';
        if (category === 'all' || cardCategory.includes(category)) {
            card.style.display = 'block';
            card.style.animation = 'slideInUp 0.4s ease-out';
        } else {
            card.style.display = 'none';
        }
    });
}

async function handleContactForm(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // validation
  if (!data['contact-name'] || !data['contact-email'] || !data['contact-subject'] || !data['contact-message']) {
    alert('Please fill in all required fields.');
    return;
  }

  const serviceID = 'service_esv4plm';                 // replace if different
  const autoTemplateID = 'template_m0evb99';        // replace with your actual template ID
  const notifyTemplateID = 'template_aqumjmb';    // replace with your actual template ID

  // template params for auto-reply (visitor)
  const autoParams = {
    to_email: data['contact-email'],     // maps to {{to_email}} in Auto-reply template
    contact_name: data['contact-name'],
    contact_subject: data['contact-subject'],
    contact_message: data['contact-message']
  };

  // template params for owner notification
  const notifyParams = {
    contact_name: data['contact-name'],
    contact_email: data['contact-email'],
    contact_subject: data['contact-subject'],
    contact_message: data['contact-message'],
    reply_to: data['contact-email']      // maps to {{reply_to}} in Notification template for Reply-To header
  };

  try {
    // send both at once
    await Promise.all([
      emailjs.send(serviceID, autoTemplateID, autoParams),
      emailjs.send(serviceID, notifyTemplateID, notifyParams)
    ]);

    alert('Thank you — a confirmation email has been sent to you.');
    form.reset();
  } catch (err) {
    console.error('Email send error', err);
    alert('Failed to send email. Check console and EmailJS dashboard logs.');
  }
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navHeight = 100;
        const targetPosition = section.offsetTop - navHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize portfolio app
    window.portfolioApp = new PortfolioApp();

    // Setup contact form if it exists
    const contactForm = document.querySelector('form#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Initialize EmailJS SDK
    (function() {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        script.onload = function() {
            emailjs.init('sucKAvw4vDdHnhCvA');
        };
        document.head.appendChild(script);
    })();

    // Setup navigation highlighting on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active');
            }
        });
    }, { passive: true });

    // Add click handlers for external links
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.addEventListener('click', (e) => {
            console.log('External link clicked:', link.href);
        });
    });

    // Setup keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal, .overlay').forEach(el => {
                if (el.style.display !== 'none') {
                    el.style.display = 'none';
                }
            });
        }

        if (e.altKey && e.key === 't') {
            e.preventDefault();
            if (window.portfolioApp) {
                window.portfolioApp.toggleTheme();
            }
        }
    });

    // Loading state management
    const showLoading = (container) => {
        if (container) {
            container.classList.add('loading');
        }
    };

    const hideLoading = (container) => {
        if (container) {
            container.classList.remove('loading');
        }
    };

    // Export functions globally
    window.filterBlogs = filterBlogs;
    window.scrollToSection = scrollToSection;
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Page is visible, resume animations
        document.querySelectorAll('.project-card, .blog-card').forEach(card => {
            card.style.animationPlayState = 'running';
        });
    } else {
        // Page is hidden, pause animations for performance
        document.querySelectorAll('.project-card, .blog-card').forEach(card => {
            card.style.animationPlayState = 'paused';
        });
    }
});

// Error handling for failed image loads
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        // Replace failed image with placeholder
        e.target.src = 'https://via.placeholder.com/400x220/6c757d/ffffff?text=Image+Not+Found';
        e.target.alt = 'Image not available';
    }
}, true);

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        console.log('Performance Metrics:');
        console.log('- Page load time:', loadTime, 'ms');
        console.log('- DNS lookup:', perfData.domainLookupEnd - perfData.domainLookupStart, 'ms');
        console.log('- TCP connection:', perfData.connectEnd - perfData.connectStart, 'ms');
        console.log('- First paint:', perfData.responseStart - perfData.requestStart, 'ms');
        console.log('- DOM content loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
        
        // Log performance warnings
        if (loadTime > 3000) {
            console.warn('Page load time is above 3 seconds. Consider optimization.');
        }
        
        // Track Core Web Vitals if available
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'largest-contentful-paint') {
                        console.log('LCP (Largest Contentful Paint):', entry.startTime, 'ms');
                    }
                    
                    if (entry.entryType === 'first-input') {
                        console.log('FID (First Input Delay):', entry.processingStart - entry.startTime, 'ms');
                    }
                    
                    if (entry.entryType === 'layout-shift') {
                        console.log('CLS (Cumulative Layout Shift):', entry.value);
                    }
                }
            });
            
            try {
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (e) {
                console.log('Performance Observer not fully supported');
            }
        }
    });
}

// Memory usage monitoring (if available)
if ('memory' in performance) {
    setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
            console.warn('High memory usage detected:', {
                used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
                limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
            });
        }
    }, 30000); // Check every 30 seconds
}

// Network status monitoring
if ('connection' in navigator) {
    const connection = navigator.connection;
    console.log('Network Info:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink + 'Mbps',
        rtt: connection.rtt + 'ms'
    });
    
    connection.addEventListener('change', () => {
        console.log('Network changed:', connection.effectiveType);
        
        // Adjust image quality based on connection
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            document.documentElement.classList.add('slow-connection');
        } else {
            document.documentElement.classList.remove('slow-connection');
        }
    });
}

// Battery status monitoring (if available)
if ('getBattery' in navigator) {
    navigator.getBattery().then((battery) => {
        const updateBatteryInfo = () => {
            if (battery.level < 0.2) {
                // Reduce animations when battery is low
                document.documentElement.classList.add('low-battery');
            } else {
                document.documentElement.classList.remove('low-battery');
            }
        };
        
        updateBatteryInfo();
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
    });
}

// Frosted Glass Effect Utilities
class FrostedGlassManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.preserveGlassEffects();
        this.setupGlassHovers();
        this.handleReducedMotion();
    }
    
    preserveGlassEffects() {
        // Ensure glass effects are applied consistently
        const glassElements = document.querySelectorAll(`
            .skill-card, .project-card, .blog-card, .stat-card,
            .main-nav, .theme-toggle, .btn, .filter-btn,
            .contact-item, .social-link
        `);
        
        glassElements.forEach(element => {
            // Preserve backdrop-filter
            const computedStyle = window.getComputedStyle(element);
            if (!computedStyle.backdropFilter || computedStyle.backdropFilter === 'none') {
                element.style.backdropFilter = 'var(--glass-blur) var(--glass-saturation)';
            }
            
            // Ensure proper z-index for glass effects
            if (!element.style.position || element.style.position === 'static') {
                element.style.position = 'relative';
            }
        });
    }
    
    setupGlassHovers() {
        // Enhanced glass hover effects
        const hoverElements = document.querySelectorAll('.skill-card, .project-card, .blog-card');
        
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.backdropFilter = 'blur(15px) saturate(130%)';
                element.style.borderColor = 'var(--glass-border-highlight)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.backdropFilter = 'var(--glass-blur) var(--glass-saturation)';
                element.style.borderColor = 'var(--glass-border-primary)';
            });
        });
    }
    
    handleReducedMotion() {
        // Respect user's motion preferences while preserving glass effects
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            document.documentElement.classList.add('reduced-motion');
            
            // Disable backdrop-filter animations but keep the effect
            const style = document.createElement('style');
            style.textContent = `
                .reduced-motion * {
                    transition-duration: 0.01ms !important;
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                }
                
                .reduced-motion .skill-card,
                .reduced-motion .project-card,
                .reduced-motion .blog-card {
                    backdrop-filter: var(--glass-blur) var(--glass-saturation) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Resource loading optimization
class ResourceOptimizer {
    constructor() {
        this.init();
    }
    
    init() {
        this.lazyLoadImages();
        this.preloadCriticalResources();
        this.optimizeForConnection();
    }
    
    lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    preloadCriticalResources() {
        // Preload fonts
        const fonts = [
            '/fonts/sf-pro-display.woff2',
            '/fonts/sf-pro-text.woff2'
        ];
        
        fonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = font;
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
        
        // Preload critical images
        const criticalImages = [
            '/images/profile_photo.png',
            '/images/hero-background.jpg'
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = src;
            link.as = 'image';
            document.head.appendChild(link);
        });
    }
    
    optimizeForConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // Disable heavy animations on slow connections
                document.documentElement.classList.add('slow-connection');
                
                // Reduce backdrop-filter intensity
                const style = document.createElement('style');
                style.textContent = `
                    .slow-connection .skill-card,
                    .slow-connection .project-card,
                    .slow-connection .blog-card,
                    .slow-connection .main-nav {
                        backdrop-filter: blur(5px) !important;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
}

// Error tracking and logging
class ErrorTracker {
    constructor() {
        this.errors = [];
        this.init();
    }
    
    init() {
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
        });
    }
    
    logError(type, error, details = {}) {
        const errorInfo = {
            type,
            message: error?.message || error,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...details
        };
        
        this.errors.push(errorInfo);
        console.error('Error logged:', errorInfo);
        
        // In production, you might want to send this to an error tracking service
        // this.sendErrorToService(errorInfo);
    }
    
    getErrors() {
        return this.errors;
    }
}

// Initialize all managers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize frosted glass manager
    window.frostedGlassManager = new FrostedGlassManager();
    
    // Initialize resource optimizer
    window.resourceOptimizer = new ResourceOptimizer();
    
    // Initialize error tracker
    window.errorTracker = new ErrorTracker();
    
    console.log('Portfolio utilities initialized');
});

// Service Worker registration for caching (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
           
