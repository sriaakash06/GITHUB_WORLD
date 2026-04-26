export const PALETTE = {
    // Terrain
    grass:      ['#8ade5d', '#7ad64d', '#9af26e'],
    grassLight: '#a6f879',
    grassDark:  '#65b83d',
    hexBase:    '#7b5c42', // Dirt base for floating island
    hexEdge:    '#5a3f29', // Dark dirt

    // Roads / Paths (Cobblestone)
    road:       '#b2becd',
    roadDark:   '#93a0af',

    // Building materials
    wall:       '#ffffff',
    wallAlt:    '#f5f7fa',
    stone:      '#cbd5e1',
    stoneDark:  '#94a3b8',
    wood:       '#f59e0b',   // vibrant orange trunk
    trim:       '#ffffff',

    // Roofs – varied for houses
    roofOrange: '#ff8822',
    roofBlue:   '#44aaff',
    roofRed:    '#ff4444',
    roofYellow: '#ffcc00',
    roofPink:   '#ff77bb',
    roofGreen:  '#55cc66',
    roofPurple: '#b866ff',
    roofTeal:   '#22ccaa',

    // Town Hall
    townHallWall:   '#ffffff',
    townHallBase:   '#e2e8f0',
    townHallRoof:   '#ff8822',
    townHallAccent: '#ef4444',

    // Trees
    foliage:    '#70e040',
    foliageDark:'#58b030',
    trunk:      '#e68a00',

    // Clouds
    cloud:      '#ffffff',

    // Window / door
    window:     '#88eeff',
    door:       '#d97706',

    // River
    water:      '#33bbff',

    // Misc
    chimney:    '#9ca3af',
    black:      '#1f2937',
};

// House roof color cycle for variety in rings
export const ROOF_COLORS = [
    '#ff8822', // orange
    '#44aaff', // blue
    '#ff4444', // red
    '#ffcc00', // yellow
    '#ff77bb', // pink
    '#55cc66', // green
    '#b866ff', // purple
    '#22ccaa', // teal
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
