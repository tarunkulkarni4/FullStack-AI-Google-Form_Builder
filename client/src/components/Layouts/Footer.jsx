import React from 'react';

const Footer = () => {
    return (
        <footer className="border-t border-[var(--border-light)] py-6 sm:py-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] text-center">
                    &copy; {new Date().getFullYear()} AI Form Builder. All rights reserved.
                </div>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    <a href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-[var(--primary)] transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-[var(--primary)] transition-colors">Contact Support</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
