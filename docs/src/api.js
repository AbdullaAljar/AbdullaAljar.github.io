import { isSessionExpired, markActivity } from './session.js';
import { getToken, logout, sanitizeToken } from './auth.js';


const API_URL = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

//helper everytime we run a graphql request it does the following
export async function gqlRequest(query, variables = {}) {

  //validate input early
  if (typeof query !== 'string' || !query.trim()) {
    throw new Error('gqlRequest: query must be a non-empty string')
  }

  //before getting token, check if session expired and logout if it is
  if (isSessionExpired()) {
    logout();
    throw new Error('Session Expired');
  }


  // mark activity, rest timer
  markActivity()
  
  const token = getToken();
  
  if (!token) {
    throw new Error("No authentication token found");
  }

  // Clean the token and ensure it's properly formatted
  const cleanToken = sanitizeToken(getToken());
  console.log("Making GraphQL request with token:", cleanToken.substring(0, 20) + "...");

  //timeout 
  function withTimeout(ms) {
    const ctrl = new  AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return {signal: ctrl.signal, done: () => clearTimeout(id)};
  }

  //use it
  const t = withTimeout(15000);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cleanToken}`
      },
      body: JSON.stringify({ query, variables }),
      signal: t.signal,
    });
    t.done();

    if (!res.ok) {
      console.error("HTTP error:", res.status);
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error('Unauthorized. Please Sign In Again.')
    }

    const data = await res.json();
    
    if (data.errors?.length) {
      const e = data.errors[0];
      //include more context if present basically
      const msg = [e.message, e.extensions?.code, e.path?.join('.')].filter(Boolean).join(' | ');
      throw new Error(msg || 'GrapghQl Error');
    }

    return data.data;
  } catch (error) {
    console.error("GraphQL request failed:", error);
    throw error;
  }
}

