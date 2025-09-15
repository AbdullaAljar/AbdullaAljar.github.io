import { gqlRequest } from './api.js';

export async function loadProfile() {
  try {
    const loginForm = document.getElementById("login-form");
    const logoutBtn = document.getElementById("logout-btn");
    
    if (loginForm) {
      loginForm.style.display = "none";
    }
    if (logoutBtn) {
      logoutBtn.style.display = "block";
    }

    const userAttsQuery = `
      query {
        user {
          attrs
          login
        }
      }
    `;

    // Execute the query
    const userAtts = await gqlRequest(userAttsQuery);
    console.log("User data received:", userAtts);

    // Handle the response
    const user = Array.isArray(userAtts.user) ? userAtts.user[0] : userAtts.user;
    
    const attrs = user.attrs || {};
    const login = user.login || "";
    const gender = attrs.gender || "N/A";
    const country = attrs.country || "N/A";
    const jobTitle = attrs.jobtitle || "N/A";
    const CPRnumber = attrs.CPRnumber || "N/A";
    const firstName = attrs.firstName || "";
    const lastName = attrs.lastName || "";
    const PhoneNumber = attrs.PhoneNumber || "N/A";
    const addressCity = attrs.addressCity || "N/A";

    // Update UI with the data
    const outputElement = document.getElementById("output");
    const firstNameElement = document.getElementById("first-name");
    if (firstNameElement) {
      firstNameElement.textContent = firstName;
    }
    // Inject login into header, to the left of the logout button
    const headerInner = document.querySelector('.header-inner');
    if (headerInner && login) {
      let loginEl = document.getElementById('user-login');
      if (!loginEl) {
        loginEl = document.createElement('div');
        loginEl.id = 'user-login';
        loginEl.className = 'user-login';
        const logoutBtnEl = document.getElementById('logout-btn');
        if (logoutBtnEl && logoutBtnEl.parentNode === headerInner) {
          headerInner.insertBefore(loginEl, logoutBtnEl);
        } else {
          headerInner.appendChild(loginEl);
        }
      }
      loginEl.textContent = `${login}`;
    }
    if (outputElement) {
      outputElement.innerHTML = `
        <ul>
          <li><strong>Gender:</strong> ${gender}</li>
          <li><strong>Country:</strong> ${country}</li>
          <li><strong>Job title:</strong> ${jobTitle}</li>
          <li><strong>CPR number:</strong> ${CPRnumber}</li>
          <li><strong>First and last name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Phone number:</strong> ${PhoneNumber}</li>
          <li><strong>Address city:</strong> ${addressCity}</li>
        </ul>
      `;
    }

    const fullNameElement = document.getElementById("full-name");
    if (fullNameElement) {
      fullNameElement.textContent = (attrs.firstName || "") + " " + (attrs.lastName || "");
    }

    const genderElement = document.getElementById("gender");
    if (genderElement) {
      genderElement.textContent = attrs.gender || "";
    }

    const countryElement = document.getElementById("country");
    if (countryElement) {
      countryElement.textContent = attrs.country || "";
    }

    const jobTitleElement = document.getElementById("job-title");
    if (jobTitleElement) {
      jobTitleElement.textContent = attrs.jobtitle || "";
    }

    const cprNumberElement = document.getElementById("cpr-number");
    if (cprNumberElement) {
      cprNumberElement.textContent = attrs.CPRnumber || "";
    }

    const phoneNumberElement = document.getElementById("phone-number");
    if (phoneNumberElement) {
      phoneNumberElement.textContent = attrs.PhoneNumber || "";
    }

    const addressCityElement = document.getElementById("address-city");
    if (addressCityElement) {
      addressCityElement.textContent = attrs.addressCity || "";
    }

  } catch (err) {
    console.error("userAttributesQuery error:", err);
    const outputElement = document.getElementById("output");
    if (outputElement) {
      outputElement.textContent = `Error userAttributesQuery: ${err.message}`;
    }
  }
}
