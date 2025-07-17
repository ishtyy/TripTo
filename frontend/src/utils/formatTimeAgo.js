/**
 * Converts a date string or Date object into a relative time string (e.g., "5 hours ago").
 * @param {string | Date} date - The date to format.
 * @returns {string} The formatted relative time string.
 */
export function formatTimeAgo(date) {
    if (!date) return '';

    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    if (seconds < 10) return "just now";
    
    return Math.floor(seconds) + " seconds ago";
}