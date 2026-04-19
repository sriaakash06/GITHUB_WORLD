export const PALETTE = {
    grass: ['#7ba342', '#86af49', '#95c057'],
    stone: '#b0ada3',
    stoneDark: '#4e4e4e',
    wood: '#a68069',
    building: '#f4f1ea', // Off-white for walls
    trim: '#d9d2c5',
    roof: '#e2725b', // Terracotta
    window: '#fce38a',
    gold: '#ffd700',
    road: '#555555',
    black: '#111111'
};

export const LANG_COLORS = {
    'JavaScript': '#f7df1e',
    'Python': '#4584b6',
    'Go': '#00add8',
    'Rust': '#ef642a',
    'TypeScript': '#3178c6',
    'C++': '#f34b7d',
    'Java': '#b07219',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Default': '#9e9e9e'
};

export const GET_STYLIZED_COLOR_FOR_LANG = (lang) => {
    return LANG_COLORS[lang] || LANG_COLORS['Default'];
};
