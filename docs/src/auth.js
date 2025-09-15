import { markActivity } from "./session.js";

export const sanitizeToken = t => (t ?? '').replace(/^"|"$/g, '').trim() || null;

export async function login(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const encoded = btoa(`${username}:${password}`);
  console.log("Attempting login for user:", username);

  try {
    const res = await fetch("https://learn.reboot01.com/api/auth/signin", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
      },
    });

    if (!res.ok) {
      let message = "Login failed";
      try {
        const errorData = await res.json();
        message = errorData?.message || message;
      } catch {}
      console.error("Login failed with status:", res.status);
      const err = new Error(res.status === 401 ? "Invalid username or password" : message);
      // expose status for callers that want to branch on it
      err.status = res.status;
      throw err;
    }

    // Get the response as text and decode it
    const rawToken = await res.text();
    // Remove any quotes if they exist
    const token = rawToken.replace(/^"|"$/g, '');
    console.log("Received token:", token.substring(0, 20) + "...");

    if (!token) {
      throw new Error("No token received from server");
    }

    console.log("Login successful, storing token");
    localStorage.setItem("token", token);
    markActivity(); //reset idle timer
    return token;
    
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}



export function logout() {
  console.log("Logging out, removing token");
  localStorage.removeItem("token");
}

export function getToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token found in localStorage");
    logout();
    return null;
  }
  // Remove any quotes if they exist when retrieving
  return token.replace(/^"|"$/g, '');
}
