export const PALETTE = {
    grass: ['#86c18a', '#96d19a', '#a6e1aa'],
    grassDark: '#5e9462',
    stone: '#e5e5e5',
    stoneDark: '#333333',
    wood: '#795548',
    building: '#ffffff',
    trim: '#dcdcdc',
    roof: '#ff5722',
    window: '#e0f7fa',
    door: '#5d4037',
    road: '#37474f',
    roadLine: '#ffffff',
    cloud: '#ffffff',
    black: '#111111'
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

