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
    // Use alternating lightness values to ensure enough difference between colors
    const lightness = (Math.abs(hash % 3) * 30) + 40; // Alternates between 40%, 70%, and 100%

    return `hsl(${hue}, 85%, ${lightness}%)`;
};
