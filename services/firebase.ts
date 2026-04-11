
// Mock implementation to replace missing/broken firebase module
// Providing a dummy implementation to allow the app to run in "offline" or "demo" mode.

const app = {
  name: "[DEFAULT]",
};

const auth = {
  currentUser: null,
};

const db = {};

const googleProvider = {};
const facebookProvider = {};

// Mock functions to replace firebase/auth imports
export const signInAnonymously = async (authInstance: any) => {
    console.warn("Using mock signInAnonymously");
    return {
        user: {
            uid: "mock-user-123",
            isAnonymous: true
        }
    };
};

export const signOut = async (authInstance: any) => {
    console.warn("Using mock signOut");
    return;
};

export { app, auth, db, googleProvider, facebookProvider };
