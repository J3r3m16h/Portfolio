document.addEventListener("DOMContentLoaded", () => {

    // 1. Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents event bubbling issues
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    // 2. Dynamic Year in Footer
    const yearSpan = document.getElementById("current-year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 3. Intersection Observer for Scroll Animations
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    
    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Stop observing after reveal
            }
        });
    }, revealOptions);

    revealElements.forEach(el => revealOnScroll.observe(el));

    // 4. Secure Contact Form Logic (Two-Step Verification)
    const contactForm = document.getElementById("contact-form");
    const otpSection = document.getElementById("otp-section");
    const otpInput = document.getElementById("otp");
    
    // Your Google Apps Script URL
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUl946dDN_ZkMkSDvLZhe2t-_PIIXhAUqB50gWn5fKaNDC-3-qQfZRZBojLqDyl8vn3w/exec"; 
    
    let isVerifyingState = false; 

    if (contactForm) {
        // This completely overrides any default submission or old code
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 
            
            const submitBtn = document.getElementById("submit-btn");
            if (!submitBtn) return;
            
            const btnText = submitBtn.querySelector("span") || submitBtn;
            const originalText = "SEND MESSAGE";
            
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const subject = document.getElementById("subject").value;
            const message = document.getElementById("message").value;

            // Prevent double-clicking
            submitBtn.classList.add("opacity-80", "cursor-wait");
            submitBtn.disabled = true; 
            
            if (!isVerifyingState) {
                // --- PHASE 1: Request Verification Code ---
                btnText.textContent = "REQUESTING CODE...";
                
                try {
                    const response = await fetch(SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ action: 'send_otp', email: email })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        isVerifyingState = true;
                        
                        // Smoothly show OTP section without any popups
                        otpSection.classList.remove('hidden');
                        otpSection.classList.add('flex');
                        
                        // Make email read-only so it can't be changed mid-process
                        const emailInput = document.getElementById("email");
                        emailInput.readOnly = true;
                        emailInput.classList.add("bg-gray-200", "cursor-not-allowed", "text-gray-500");
                        
                        btnText.textContent = "VERIFY & TRANSMIT";
                    } else {
                        alert("System Error: " + result.message);
                        btnText.textContent = originalText;
                    }
                } catch (error) {
                    alert("Network timeout. Please check your connection.");
                    btnText.textContent = originalText;
                }
            } else {
                // --- PHASE 2: Verify Code and Transmit Message ---
                const otp = otpInput.value;
                if (!otp) {
                    alert("Please enter the authentication code sent to your email.");
                    submitBtn.classList.remove("opacity-80", "cursor-wait");
                    submitBtn.disabled = false;
                    return;
                }
                
                btnText.textContent = "AUTHENTICATING...";
                
                try {
                    const response = await fetch(SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            action: 'verify_and_send',
                            email: email,
                            otp: otp,
                            name: name,
                            subject: subject,
                            message: message
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // 1. Hide the form completely for a clean look
                        contactForm.style.display = 'none';
                        
                        // 2. Show the success banner we added in HTML
                        const successBanner = document.getElementById('success-banner');
                        if (successBanner) {
                            successBanner.classList.remove('hidden');
                            successBanner.classList.add('flex');
                        }

                        // 3. Wait 3.5 seconds, then refresh the page
                        setTimeout(() => {
                            window.location.reload();
                        }, 3500);
                        
                    } else {
                        // 1. Show the Error Banner
                        const errorBanner = document.getElementById('error-banner');
                        const errorText = document.getElementById('error-text');
                        
                        if (errorBanner && errorText) {
                            errorText.textContent = "Authentication Failed: " + result.message;
                            errorBanner.classList.remove('hidden');
                            errorBanner.classList.add('flex');
                        }

                        // 2. Wait 3.5 seconds, then refresh the error state so they can try again
                        setTimeout(() => {
                            // Hide the error banner
                            if (errorBanner) {
                                errorBanner.classList.add('hidden');
                                errorBanner.classList.remove('flex');
                            }
                            // Clear the OTP input so they can re-type it
                            otpInput.value = '';
                            btnText.textContent = "VERIFY & TRANSMIT";
                            
                            // NOTE: If you truly want to wipe everything and do a full page reload instead, 
                            // delete the 6 lines above and uncomment the line below:
                            // window.location.reload();
                        }, 3500);
                    }
                } catch (error) {
                    alert("Network timeout during transmission.");
                    btnText.textContent = "VERIFY & TRANSMIT";
                }
            }
            // Re-enable the button
            submitBtn.classList.remove("opacity-80", "cursor-wait");
            submitBtn.disabled = false;
        });
    }

    // 5. Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === "#") return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});

// --- Brutalist Loader Logic ---
const loader = document.getElementById('brutalist-loader');
if (loader) {
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    
    // Cybersecurity-themed loading phases
    const loadingTexts = [
        "> Establishing secure connection...",
        "> Fetching case studies...",
        "> Bypassing firewalls...",
        "> Access Granted."
    ];

    let progress = 0;
    let textIndex = 0;

    // Simulate random loading progress
    const loadingInterval = setInterval(() => {
        // Random jump between 5% and 20%
        progress += Math.floor(Math.random() * 15) + 5; 
        if (progress > 100) progress = 100;
        
        // Update the width of the brutalist bar
        loaderBar.style.width = `${progress}%`;
        
        // Cycle through terminal text based on progress
        if (progress > 25 && textIndex === 0) { 
            textIndex++; loaderText.textContent = loadingTexts[textIndex]; 
        }
        if (progress > 60 && textIndex === 1) { 
            textIndex++; loaderText.textContent = loadingTexts[textIndex]; 
        }
        if (progress >= 95 && textIndex === 2) { 
            textIndex++; 
            loaderText.textContent = loadingTexts[textIndex];
            loaderBar.classList.remove('bg-rose-400');
            loaderBar.classList.add('bg-teal-400'); // Turn green on success
        }

        // When loading is complete
        if (progress === 100) {
            clearInterval(loadingInterval);
            
            // Wait a moment at 100%, then slide up
            setTimeout(() => {
                // Slide up animation using Tailwind's translate utility
                loader.style.transform = 'translateY(-100%)'; 
                
                // Remove from DOM after the transition finishes to free up memory
                setTimeout(() => loader.remove(), 700); 
            }, 600);
        }
    }, 150); // Speed of the progress updates
}