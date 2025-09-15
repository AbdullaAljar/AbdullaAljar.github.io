import { login, logout, getToken } from './src/auth.js';
import { loadProfile } from './src/profileAtts.js';
import { loadAuditRatioChart } from './src/chartUtils/auditCharts.js';
import { loadXpOverTimeChart } from './src/chartUtils/xpOverTime.js';
import { loadSkillsHistogram } from './src/chartUtils/skills.js';
import { loadXpPerProjectPodiumChart } from './src/chartUtils/xpPerProject.js';
import { loadRecentActivities } from './src/chartUtils/activities.js';
import { loadRecentAuditsTable } from './src/chartUtils/recentAudits.js';
import { loadLevelCard } from './src/chartUtils/level.js';
import { enforceSession } from './src/session.js';


// run on every page load
enforceSession()

document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the login page (support index.html as login)
  const path = window.location.pathname || '';
  const isLoginPage = path.endsWith('login.html') || path.endsWith('index.html') || path.endsWith('/') || path.endsWith('/docs');
  
  // If we have a token and we're on the login page, redirect to home
  if (getToken() && isLoginPage) {
    window.location.href = 'home.html';
    return;
  }
  
  // If we don't have a token and we're not on the login page, redirect to login
  if (!getToken() && !isLoginPage) {
    window.location.href = 'index.html';
    return;
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      try {
        const token = await login(username, password);
        console.log("Login successful, token received:", token);
        window.location.href = 'home.html';
      } catch (err) {
        console.error("Login error:", err);
        let outputElement = document.getElementById("output");
        // If not present in DOM, create it just after the form for visibility
        if (!outputElement) {
          const el = document.createElement('div');
          el.id = 'output';
          const form = document.getElementById('login-form');
          if (form) form.insertAdjacentElement('afterend', el);
          outputElement = el;
        }
        if (outputElement) {
          const msg = err?.status === 401 ? "Invalid username or password" : (err?.message || "Login failed");
          outputElement.textContent = msg;
          outputElement.classList.add('error');
        }
      }
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      window.location.href = 'index.html';
    });
  }

  // Load profile and charts if we're on the home page
  if (!isLoginPage) {
    loadProfile();
    loadAuditRatioChart().catch(console.error);
    loadXpOverTimeChart().catch(console.error);
    loadSkillsHistogram().catch(console.error);
    loadXpPerProjectPodiumChart().catch(console.error);
    loadRecentActivities().catch(console.error);
    loadRecentAuditsTable().catch(console.error);
    loadLevelCard().catch(console.error);
    }
});
