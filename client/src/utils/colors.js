// Consistent color generation for members
export const getMemberColor = (name) => {
    if (!name) return 'hsl(var(--primary))';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate Hue: 0-360
    const hue = Math.abs(hash % 360);
    // Soft pastel colors: Saturation 70%, Lightness 60%
    return `hsl(${hue}, 70%, 60%)`;
};
