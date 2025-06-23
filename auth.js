import { supabase } from "./api.js";

import {
  updateUIForAuthorizedUser,
  updateUIForUnauthorizedUser,
  showNotification,
} from "./ui.js";

// Authentication variables
let currentUser = null;
let isAuthorized = false;

// Auth state listener - automatically updates when user signs in/out
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event);

  if (event === "SIGNED_IN" && session) {
    console.log("User signed in:", session.user);
    currentUser = session.user.email;
    isAuthorized = true;
    updateUIForAuthorizedUser();
    showNotification("Logged in successfully.", "success");
  } else if (event === "SIGNED_OUT") {
    console.log("User signed out");
    currentUser = null;
    isAuthorized = false;
    updateUIForUnauthorizedUser();
    showNotification("Logged out successfully.", "info");
  }
});

/*
// Optional: Functions to handle UI updates after auth changes
function onUserSignedIn(user) {
  // Update your UI to show authenticated state
  console.log('Welcome back,', user.email)
}

function onUserSignedOut() {
  // Update your UI to show unauthenticated state
  console.log('User logged out')
}
*/

// promptForEmail function
async function promptForEmail() {
  const email = prompt("Please enter your email:");
  if (!email || !email.trim()) return;

  const password = prompt("Please enter your password:");
  if (!password || !password.trim()) return;

  showNotification("Signing in...", "info");

  // Try to sign in first
  const signInResult = await signIn(email.trim().toLowerCase(), password);

  if (signInResult.success) {
    // Success! The auth state listener will handle UI updates
    return;
  }

  // If sign in failed, offer to create account
  const createAccount = confirm(
    `Sign in failed: ${signInResult.error}\n\nWould you like to create a new account with this email?`,
  );

  if (createAccount) {
    showNotification("Creating account...", "info");
    const signUpResult = await signUp(email.trim().toLowerCase(), password);

    if (signUpResult.success) {
      showNotification(
        "Account created! Please check your email to verify your account, then try signing in again.",
        "success",
      );
    } else {
      showNotification(
        "Failed to create account: " + signUpResult.error,
        "error",
      );
    }
  }
}

// Core Supabase auth functions
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error("Sign up error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error("Sign in error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function logout() {
  showNotification("Signing out...", "info");
  await signOut();
}

async function promptForLogin() {
  const email = prompt("Please enter your email to save:");
  if (!email || !email.trim()) return false;

  const password = prompt("Please enter your password:");
  if (!password || !password.trim()) return false;

  showNotification("Signing in...", "info");
  const signInResult = await signIn(email.trim().toLowerCase(), password);

  if (signInResult.success) {
    return true; // Success - can proceed with save
  } else {
    showNotification("Sign in failed: " + signInResult.error, "error");
    return false; // Failed - don't proceed with save
  }
}

export function getCurrentUser() {
  return currentUser;
}

export function getIsAuthorized() {
  return isAuthorized;
}

export { promptForEmail, promptForLogin, signUp, signIn, signOut, logout };
