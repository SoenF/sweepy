// Consistent color generation for members with better contrast
export const getMemberColor = (name) => {
    if (!name) return 'hsl(var(--primary))';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate Hue: 0-360, with better distribution to ensure variety
    const hue = Math.abs(hash % 360);

    // Use higher saturation and varied lightness for better contrast on mobile
    // Prevent 100% lightness (white). Adjusted to 45% - 75% range for visibility.
    const lightness = (Math.abs(hash % 3) * 15) + 45;

    return `hsl(${hue}, 85%, ${lightness}%)`;
};
