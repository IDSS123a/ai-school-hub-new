import React, { useState, useEffect } from 'react';
import { Facebook, Check, X, Loader2, AlertCircle, Eye, EyeOff, FileText, Shield, KeyRound } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user?: UserProfile) => void;
}

declare global {
  interface Window {
    google: any;
    FB: any;
    fbAsyncInit: () => void;
  }
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.067-2.067 2.72-5.027 2.72-7.533 0-.747-.067-1.48-.187-2.293h-10.587z" />
  </svg>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation State
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Legal Modals State
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Helper to generate a consistent "member since" date based on email hash or random
  const getMockMemberDate = () => {
    // Return a date roughly 6 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.getTime();
  };

  // Initialize Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID', // Replace with real ID
        cookie     : true,
        xfbml      : true,
        version    : 'v18.0'
      });
    };
  }, []);

  // Validation Logic
  const validateEmail = (val: string) => {
    if (!val) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') setEmailError(validateEmail(email));
    if (field === 'password') setPasswordError(validatePassword(password));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Real-time validation if already touched
    if (touched.email) setEmailError(validateEmail(e.target.value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Real-time validation if already touched
    if (touched.password) setPasswordError(validatePassword(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields on submit
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    
    setEmailError(eErr);
    setPasswordError(pErr);
    setTouched({ email: true, password: true });
    
    if (eErr || pErr) return;

    setIsLoggingIn(true);
    // Simulate login delay
    setTimeout(() => {
        // Check for specific admin email simulation
        const isAdmin = email.includes('admin') || email.includes('school.ba');
        
        onLogin({
            name: "Teacher User",
            email: email,
            picture: "https://ui-avatars.com/api/?name=Teacher+User&background=2563eb&color=fff",
            memberSince: getMockMemberDate(),
            role: isAdmin ? 'admin' : 'teacher',
            status: 'active'
        });
    }, 800);
  };

  // BACKDOOR FOR ADMIN TESTING
  const handleAdminLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
        onLogin({
            name: "System Admin",
            email: "admin@school.ba",
            picture: "https://ui-avatars.com/api/?name=Admin&background=1e293b&color=fff",
            memberSince: getMockMemberDate(),
            role: 'admin',
            status: 'active'
        });
    }, 800);
  };

  const handleForgotEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForgotEmail(e.target.value);
    if (forgotEmailError) setForgotEmailError(validateEmail(e.target.value));
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(forgotEmail);
    if (err) {
      setForgotEmailError(err);
      return; 
    }
    setForgotEmailError('');
    setResetStatus('sending');
    setTimeout(() => {
      setResetStatus('success');
    }, 1500);
  };

  const resetForgotState = () => {
    setShowForgotModal(false);
    setResetStatus('idle');
    setForgotEmail('');
    setForgotEmailError('');
  };

  const handleFacebookLogin = () => {
    setIsLoggingIn(true);

    // Environment Check for Preview/Localhost mismatch
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // Fallback if FB SDK not loaded or no App ID configured (Development Mode)
    const checkAndFallback = () => {
        if (!window.FB || !process.env.FACEBOOK_APP_ID && !isLocalhost) {
             console.warn("Facebook SDK not ready or configured. Using Demo User.");
             setTimeout(() => {
                onLogin({
                    name: "Facebook Demo User",
                    email: "facebook.user@idss.ba",
                    picture: "https://ui-avatars.com/api/?name=Facebook+User&background=1877F2&color=fff",
                    given_name: "Facebook User",
                    memberSince: getMockMemberDate(),
                    role: 'teacher',
                    status: 'active'
                });
             }, 1000);
             return true;
        }
        return false;
    };

    if (checkAndFallback()) return;

    try {
        window.FB.login((response: any) => {
            if (response.authResponse) {
                window.FB.api('/me', { fields: 'name, email, picture' }, (userInfo: any) => {
                    onLogin({
                        name: userInfo.name,
                        email: userInfo.email,
                        picture: userInfo.picture?.data?.url || "https://ui-avatars.com/api/?name=FB&background=1877F2&color=fff",
                        given_name: userInfo.name.split(' ')[0],
                        memberSince: getMockMemberDate(),
                        role: 'teacher',
                        status: 'active'
                    });
                });
            } else {
                console.log('User cancelled login or did not fully authorize.');
                setIsLoggingIn(false);
            }
        }, { scope: 'public_profile,email' });
    } catch (e) {
        console.error("FB Login Error", e);
        // Force fallback if unexpected error
        checkAndFallback();
    }
  };

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);

    // --- ENVIRONMENT CHECK FOR PREVIEW MODE ---
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // NOTE: In a real production app, you would add your real domain to this check.
    if (!isLocalhost) {
        console.warn("Detected Preview Environment (Non-Localhost). Bypassing real Google OAuth to prevent 'Access Blocked' error.");
        
        setTimeout(() => {
            onLogin({
                name: "Google Demo User",
                email: "demo.teacher@idss.ba",
                picture: "https://ui-avatars.com/api/?name=Google+User&background=db4437&color=fff",
                given_name: "Google User",
                memberSince: getMockMemberDate(),
                role: 'teacher',
                status: 'active'
            });
        }, 1000); 
        return;
    }

    // --- REAL GOOGLE LOGIN (For Localhost / Production) ---
    if (window.google && window.google.accounts) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: '503379546964-aas5arpvjh4plbs8rl6kv5lii91sr5jj.apps.googleusercontent.com', 
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: {
                    'Authorization': `Bearer ${tokenResponse.access_token}`
                  }
                });
                
                if (userInfoResponse.ok) {
                  const userData = await userInfoResponse.json();
                  const fullUser: UserProfile = {
                      ...userData,
                      memberSince: getMockMemberDate(),
                      role: 'teacher',
                      status: 'active'
                  };
                  console.log("Google Login Success, User:", fullUser);
                  onLogin(fullUser);
                } else {
                  console.error("Failed to fetch user info");
                  setIsLoggingIn(false);
                }
              } catch (err) {
                console.error("Error fetching user info:", err);
                setIsLoggingIn(false);
              }
            }
          },
          error_callback: (error: any) => {
             console.error("Google Login Error:", error);
             alert("Google Login failed. Using Demo Login instead.");
             onLogin({
                name: "Google Demo User",
                email: "demo.teacher@idss.ba",
                picture: "https://ui-avatars.com/api/?name=Google+User&background=db4437&color=fff",
                memberSince: getMockMemberDate(),
                role: 'teacher',
                status: 'active'
             });
          }
        });
        
        client.requestAccessToken();
        
      } catch (error) {
        console.error("GSI initialization exception", error);
        setIsLoggingIn(false);
      }
    } else {
      console.error("Google Identity Services script not loaded");
      // Fallback if script blocked
      onLogin({
        name: "Google Demo User",
        email: "demo.teacher@idss.ba",
        picture: "https://ui-avatars.com/api/?name=Google+User&background=db4437&color=fff",
        memberSince: getMockMemberDate(),
        role: 'teacher',
        status: 'active'
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f2f2f2] p-4 font-['Poppins']">
      
      {/* Terms of Use Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Terms of Use</h3>
              </div>
              <button 
                onClick={() => setShowTerms(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none text-slate-700">
              <p className="text-sm text-slate-500">Last Updated: October 26, 2023</p>

              <h4 className="text-lg font-bold mt-6 mb-2">1. Acceptance of Terms</h4>
              <p className="mb-4">By accessing and using AI School Hub, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>

              <h4 className="text-lg font-bold mt-6 mb-2">2. AI-Powered Services</h4>
              <p className="mb-4">Our platform utilizes Google Gemini AI technology to generate educational content. By using this service, you acknowledge that:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                  <li>AI-generated content may contain inaccuracies, errors, or biases. It is provided "as is" without warranty of any kind.</li>
                  <li>You are responsible for reviewing, editing, and verifying all AI-generated materials before using them in an educational setting.</li>
                  <li>You must not use the AI to generate content that promotes hate speech, violence, or illegal activities.</li>
              </ul>

              <h4 className="text-lg font-bold mt-6 mb-2">3. Intellectual Property Rights</h4>
              <p className="mb-4">
                  <strong>User Content:</strong> You retain ownership of any inputs you provide.
                  <br/>
                  <strong>Generated Content:</strong> Subject to Google's GenAI terms, you are granted a non-exclusive right to use, modify, and distribute the content generated for your personal or professional educational purposes.
                  <br/>
                  <strong>Platform Assets:</strong> The AI School Hub interface, logo, and code are the property of IDSS.
              </p>

              <h4 className="text-lg font-bold mt-6 mb-2">4. User Conduct</h4>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                  <li>Share your account credentials with unauthorized users.</li>
                  <li>Use the platform for academic dishonesty or plagiarism.</li>
                  <li>Attempt to reverse engineer or disrupt the service.</li>
              </ul>

              <h4 className="text-lg font-bold mt-6 mb-2">5. Limitation of Liability</h4>
              <p className="mb-4">AI School Hub shall not be liable for any damages arising out of the use or inability to use the materials on the website, even if notified orally or in writing of the possibility of such damage.</p>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setShowTerms(false)}
                  className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <Shield size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Privacy Policy</h3>
                 </div>
                 <button 
                    onClick={() => setShowPrivacy(false)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                 >
                    <X size={24} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none text-slate-700">
                <p className="text-sm text-slate-500">Last Updated: October 26, 2023</p>

                <h4 className="text-lg font-bold mt-6 mb-2">1. Information We Collect</h4>
                <p className="mb-4">We collect information to provide better services to all our users:</p>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                    <li><strong>Account Information:</strong> When you sign up, we collect your name, email address, and profile picture (if provided via social login).</li>
                    <li><strong>Usage Data:</strong> We collect data on how you interact with the prompts and templates to improve our tool recommendations.</li>
                    <li><strong>Input Data:</strong> The text prompts you enter are processed to generate results.</li>
                </ul>

                <h4 className="text-lg font-bold mt-6 mb-2">2. How We Use Your Data</h4>
                <p className="mb-4">Your information is used to:</p>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                    <li>Authenticate your identity and manage your account.</li>
                    <li>Generate educational content via the Google Gemini API.</li>
                    <li>Save your history and templates for your convenience.</li>
                </ul>
                <p className="mb-4 bg-yellow-50 p-3 rounded border border-yellow-100 text-sm">
                    <strong>Note on AI Processing:</strong> Your input data is sent to Google's Gemini API for processing. We do not sell your personal data to third parties.
                </p>

                <h4 className="text-lg font-bold mt-6 mb-2">3. Data Security</h4>
                <p className="mb-4">We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet is 100% secure.</p>

                <h4 className="text-lg font-bold mt-6 mb-2">4. Third-Party Services</h4>
                <p className="mb-4">We may use third-party services (like Google Firebase for authentication and database storage) which utilize their own privacy policies regarding data handling.</p>

                <h4 className="text-lg font-bold mt-6 mb-2">5. Your Rights</h4>
                <p className="mb-4">You have the right to request access to your personal data, request correction of inaccurate data, or request deletion of your account at any time via the "Settings" menu.</p>
                
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button 
                      onClick={() => setShowPrivacy(false)}
                      className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Close
                    </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
            <button 
              onClick={resetForgotState}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h3>
            
            {resetStatus === 'success' ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
                </div>
                <h4 className="text-xl font-semibold text-slate-800 mb-2">Check your email</h4>
                <p className="text-lg text-slate-600 mb-6">We've sent a password reset link to <span className="font-semibold">{forgotEmail}</span></p>
                <button 
                  onClick={resetForgotState}
                  className="w-full bg-slate-900 text-white text-lg py-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p className="text-lg text-slate-500 mb-6">Enter your email address and we'll send you a link to reset your password.</p>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="reset-email" className="block text-base font-semibold text-slate-700 mb-2">Email Address</label>
                    <input 
                      id="reset-email"
                      type="email" 
                      value={forgotEmail}
                      onChange={handleForgotEmailChange}
                      placeholder="name@example.com"
                      className={`w-full p-4 text-lg border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                        ${forgotEmailError ? 'border-red-500' : 'border-slate-300'}`}
                      autoFocus
                    />
                    {forgotEmailError && (
                      <div className="flex items-center gap-1 text-red-500 text-sm mt-2">
                        <AlertCircle size={16} />
                        <span>{forgotEmailError}</span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={resetStatus === 'sending'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium py-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {resetStatus === 'sending' ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        Sending Link...
                      </>
                    ) : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-white rounded-[20px] shadow-lg overflow-hidden w-full max-w-[1100px] flex flex-col md:flex-row min-h-[700px]">
        {/* Left Side */}
        <div className="hidden md:block md:w-1/2 relative">
          <img 
            src="https://i.postimg.cc/sX5zbH5T/web_app_background_image_A.png" 
            alt="School workspace" 
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-blue-900/30 mix-blend-multiply"></div>
          <div className="absolute bottom-12 left-12 text-white p-8 z-10">
            <h2 className="text-4xl font-bold mb-3">AI School Hub</h2>
            <p className="text-white/90 text-xl">Empowering educators with next-generation tools.</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-white">
          <h2 className="text-4xl font-bold text-[#333] mb-12">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-10" noValidate>
            <div className="group">
              <label htmlFor="email-input" className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Username or Email</label>
              <input 
                id="email-input"
                type="email" 
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                placeholder="Your email address"
                className={`w-full border-b-2 py-3 text-lg text-[#333] placeholder-slate-400 outline-none transition-colors
                  ${emailError ? 'border-red-500 focus:border-red-500' : 'border-[#e5e7eb] focus:border-blue-600'}`}
                required
              />
              {emailError && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-2">
                  <AlertCircle size={16} />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            <div className="group relative">
              <label htmlFor="password-input" className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input 
                  id="password-input"
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Your password"
                  className={`w-full border-b-2 py-3 pr-10 text-lg text-[#333] placeholder-slate-400 outline-none transition-colors
                    ${passwordError ? 'border-red-500 focus:border-red-500' : 'border-[#e5e7eb] focus:border-blue-600'}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-2">
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
               <label className="flex items-center cursor-pointer relative group">
                 <input 
                    type="checkbox" 
                    checked={remember} 
                    onChange={(e) => setRemember(e.target.checked)}
                    className="sr-only peer"
                    id="remember-me"
                 />
                 <div className={`w-6 h-6 border-2 rounded transition-all flex items-center justify-center group-focus-within:ring-2 group-focus-within:ring-blue-200
                    ${remember ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-transparent hover:border-slate-400'}`}>
                    {remember && <Check size={18} className="text-white" strokeWidth={3} />}
                 </div>
                 <span className="ml-3 text-base text-slate-600 select-none">Remember me</span>
               </label>
               
               <button 
                 type="button" 
                 onClick={() => setShowForgotModal(true)}
                 className="text-base text-slate-500 hover:text-blue-600 transition-colors focus:outline-none focus:underline"
               >
                 Forgot Password?
               </button>
            </div>

            <div className="pt-4 flex gap-4">
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 px-8 rounded-md transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
              >
                {isLoggingIn ? 'Signing in...' : 'Log in'}
              </button>
              
              <button
                type="button"
                onClick={handleAdminLogin}
                title="Test Admin Access"
                className="bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-md shadow-md hover:shadow-lg transition-all"
              >
                <KeyRound size={24} />
              </button>
            </div>
          </form>

          <div className="mt-12">
            <p className="text-base text-slate-500 mb-4">Or login with</p>
            <div className="flex gap-4">
              <button onClick={handleGoogleLogin} className="flex-1 flex items-center justify-center gap-3 px-6 py-3 text-base font-medium text-white bg-[#db4437] rounded hover:bg-[#c53929] transition-all shadow-sm hover:shadow-md">
                 <GoogleIcon /> Google
              </button>
              <button onClick={handleFacebookLogin} className="flex-1 flex items-center justify-center gap-3 px-6 py-3 text-base font-medium text-white bg-[#1877F2] rounded hover:bg-[#166fe5] transition-all shadow-sm hover:shadow-md">
                <Facebook size={20} fill="currentColor" /> Facebook
              </button>
            </div>
          </div>

          <div className="mt-10 text-center md:text-left space-y-4">
            <div>
              <span className="text-base text-slate-500">Don't have an account? </span>
              <button className="text-base text-blue-600 font-bold hover:text-blue-800 hover:underline cursor-pointer transition-colors">Create an account</button>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-400">
              <button onClick={() => setShowTerms(true)} className="hover:text-slate-600 hover:underline">Terms of Use</button>
              <span>•</span>
              <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-600 hover:underline">Privacy Policy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;