export const PALETTE = {
    grass: ['#d1ff82', '#b8e667', '#a2d14d'],
    grassDark: '#8ab33d',
    stone: '#ecf0f1',
    stoneDark: '#bdc3c7',
    wood: '#f39c12',
    building: '#81ecec', // Light blue walls
    trim: '#ffffff',
    roof: '#ff7675', // Terracotta/pinkish roof
    window: '#dfe6e9',
    door: '#e67e22',
    road: '#dfe6e9',
    pink: '#fab1a0',
    blossom: '#fd79a8',
    cloud: '#ffffff',
    black: '#2d3436'
};

export const LANG_COLORS = {
    'JavaScript': '#f7df1e',
    'Python': '#3776ab',
    'Go': '#00add8',
    'Rust': '#dea584',
    'TypeScript': '#3178c6',
    'C++': '#f34b7d',
    'Java': '#b07219',
    'HTML': '#e34c26',
    'CSS': '#1572b6',
    'Default': '#cfd8dc'
};

export const GET_STYLIZED_COLOR_FOR_LANG = (lang) => {
    return LANG_COLORS[lang] || LANG_COLORS['Default'];
};

