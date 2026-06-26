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
                        // Incorrect code
                        alert("Authentication Failed: " + result.message);
                        btnText.textContent = "VERIFY & TRANSMIT";
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