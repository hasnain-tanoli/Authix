// Check if we can access the profile endpoint to determine auth status
// Since we can't check cookies directly from JS (httpOnly), we'll try a lightweight request
// or just rely on the dashboard redirecting back if not auth.
// For index, we can try to fetch profile, if success -> dashboard.

(async () => {
    try {
        const res = await fetch('/profile');
        if (res.ok) {
            window.location.href = "/dashboard.html";
        }
    } catch (e) {
        // Not authenticated, stay here
    }
})();
