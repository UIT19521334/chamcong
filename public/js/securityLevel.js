// Utility to get security level from cookie
export function getSecurityLevel() {
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
    return getCookie('SECURITY_LEVEL') || 'low';
}
