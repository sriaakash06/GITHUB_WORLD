export const PALETTE = {
    // Terrain
    grass:      ['#6dbf5e', '#5cb04e', '#74c864'],
    grassLight: '#85d475',
    grassDark:  '#4a9a3d',
    hexBase:    '#4a9a3d',
    hexEdge:    '#3a7a2e',

    // Roads / Paths
    road:       '#c8aa7a',
    roadDark:   '#b89660',

    // Building materials
    wall:       '#f5e6d0',
    wallAlt:    '#e8d5b5',
    stone:      '#d4c5a8',
    stoneDark:  '#b8a888',
    wood:       '#d2691e',   // orange trunk
    trim:       '#ffffff',

    // Roofs – varied for houses
    roofOrange: '#e8832a',
    roofBlue:   '#4a90d9',
    roofRed:    '#d94a4a',
    roofYellow: '#f0c030',
    roofPink:   '#e87ca8',
    roofGreen:  '#5aaa60',
    roofPurple: '#9b59b6',
    roofTeal:   '#16a085',

    // Town Hall
    townHallWall:   '#f0e4cc',
    townHallBase:   '#d4c09a',
    townHallRoof:   '#e8832a',
    townHallAccent: '#c0392b',

    // Trees
    foliage:    '#5fbe52',
    foliageDark:'#4aa040',
    trunk:      '#d2691e',

    // Clouds
    cloud:      '#ffffff',

    // Window / door
    window:     '#7ec8e3',
    door:       '#8b4513',

    // Misc
    chimney:    '#9e8e78',
    black:      '#2d3436',
};

// House roof color cycle for variety in rings
export const ROOF_COLORS = [
    '#e8832a', // orange
    '#4a90d9', // blue
    '#d94a4a', // red
    '#f0c030', // yellow
    '#e87ca8', // pink
    '#5aaa60', // green
    '#9b59b6', // purple
    '#16a085', // teal
];

export const LANG_COLORS = {
    'JavaScript':   '#f7df1e',
    'TypeScript':   '#3178c6',
    'Python':       '#3776ab',
    'Go':           '#00add8',
    'Rust':         '#dea584',
    'C++':          '#f34b7d',
    'C':            '#a8b9cc',
    'Java':         '#b07219',
    'HTML':         '#e34c26',
    'CSS':          '#1572b6',
    'Shell':        '#89e051',
    'Ruby':         '#cc342d',
    'PHP':          '#4f5d95',
    'Swift':        '#fa7343',
    'Kotlin':       '#7F52FF',
    'Default':      '#c4a868',
};

export const GET_STYLIZED_COLOR_FOR_LANG = (lang) => {
    return LANG_COLORS[lang] || LANG_COLORS['Default'];
};
