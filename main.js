// GitHub World - Main Logic
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);

// Camera setup (Orthographic for Isometric view)
const aspect = window.innerWidth / window.innerHeight;
const d = 25; // View size
const camera = new THREE.OrthographicCamera(
    -d * aspect, d * aspect, d, -d, 1, 1000
);

// Standard Isometric position
camera.position.set(50, 50, 50);
camera.lookAt(0, 0, 0);

const canvas = document.querySelector('#world-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableRotate = true; 
controls.maxPolarAngle = Math.PI / 2; // Keep above ground
controls.minPolarAngle = 0;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
scene.add(directionalLight);

// Constants & Colors
const PALETTE = {
    grass: [0x558b2f, 0x689f38, 0x7cb342, 0x8bc34a],
    autumn: [0xb71c1c, 0xc62828, 0xd32f2f, 0xe53935, 0xef5350, 0xf44336, 0xc62828, 0xef6c00, 0xf57c00, 0xf9a825],
    road: 0x37474f,
    roadMark: 0xe0e0e0,
    building: 0xefefef,
    window: 0xffeb3b,
    gold: 0xffd700
};

const LANG_COLORS = {
    'JavaScript': 0xf7df1e,
    'Python': 0x3776ab,
    'Go': 0x00add8,
    'Rust': 0xdea584,
    'TypeScript': 0x3178c6,
    'Default': 0x71717a
};

// World State
let repos = [];
let meshes = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

// -- WORLD GENERATION FUNCTIONS --

function createGround() {
    const size = 10;
    const spacing = 4;
    
    for (let x = -size/2; x < size/2; x++) {
        for (let z = -size/2; z < size/2; z++) {
            const color = PALETTE.grass[Math.floor(Math.random() * PALETTE.grass.length)];
            const geometry = new THREE.BoxGeometry(spacing - 0.2, 0.5, spacing - 0.2);
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                flatShading: true
            });
            const tile = new THREE.Mesh(geometry, material);
            tile.position.set(x * spacing, -0.25, z * spacing);
            tile.receiveShadow = true;
            scene.add(tile);
        }
    }

    // Add some roads
    createRoads(size, spacing);
}

function createRoads(size, spacing) {
    const roadWidth = 2;
    // Main cross road
    const hRoadGeo = new THREE.PlaneGeometry(size * spacing, roadWidth);
    const roadMat = new THREE.MeshPhongMaterial({ color: PALETTE.road, flatShading: true });
    
    const hRoad = new THREE.Mesh(hRoadGeo, roadMat);
    hRoad.rotation.x = -Math.PI / 2;
    hRoad.position.y = 0.05; // Slightly above ground
    hRoad.receiveShadow = true;
    scene.add(hRoad);

    const vRoad = new THREE.Mesh(hRoadGeo, roadMat);
    vRoad.rotation.x = -Math.PI / 2;
    vRoad.rotation.z = Math.PI / 2;
    vRoad.position.y = 0.06;
    vRoad.receiveShadow = true;
    scene.add(vRoad);

    // Road Markings (Dashed lines)
    const markGeo = new THREE.PlaneGeometry(0.8, 0.1);
    const markMat = new THREE.MeshBasicMaterial({ color: PALETTE.roadMark });
    
    for (let i = -size/2 * spacing; i < size/2 * spacing; i += 2) {
        // Horizontal road marks
        const hMark = new THREE.Mesh(markGeo, markMat);
        hMark.rotation.x = -Math.PI / 2;
        hMark.position.set(i + 0.5, 0.07, 0);
        scene.add(hMark);

        // Vertical road marks
        const vMark = new THREE.Mesh(markGeo, markMat);
        vMark.rotation.x = -Math.PI / 2;
        vMark.rotation.z = Math.PI / 2;
        vMark.position.set(0, 0.08, i + 0.5);
        scene.add(vMark);
    }
}

function createBuilding(repo, x, z) {
    const height = Math.log2((repo.commits || 10) + 1) * 2;
    const width = 1.5 + Math.random() * 0.5;
    
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    // Building Body
    const bodyGeo = new THREE.BoxGeometry(width, height, width);
    // Face colors simulation via light variation
    const bodyMat = new THREE.MeshPhongMaterial({ 
        color: PALETTE.building,
        flatShading: true
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Roof
    const roofColor = LANG_COLORS[repo.language] || LANG_COLORS['Default'];
    const roofGeo = new THREE.BoxGeometry(width + 0.1, 0.2, width + 0.1);
    const roofMat = new THREE.MeshPhongMaterial({ color: roofColor, flatShading: true });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + 0.1;
    group.add(roof);

    // Windows
    const windowGeo = new THREE.PlaneGeometry(0.2, 0.3);
    const windowMat = new THREE.MeshBasicMaterial({ color: PALETTE.window });
    
    for (let i = 0; i < 4; i++) {
        const sideWindows = Math.floor(height / 1);
        for (let j = 0; j < sideWindows; j++) {
            if (Math.random() > 0.4) {
                const win = new THREE.Mesh(windowGeo, windowMat);
                // Position on faces
                if (i === 0) { win.position.set(width/2 + 0.01, j + 1, (Math.random()-0.5) * (width-0.5)); win.rotation.y = Math.PI/2; }
                if (i === 1) { win.position.set(-width/2 - 0.01, j + 1, (Math.random()-0.5) * (width-0.5)); win.rotation.y = -Math.PI/2; }
                if (i === 2) { win.position.set((Math.random()-0.5) * (width-0.5), j + 1, width/2 + 0.01); }
                if (i === 3) { win.position.set((Math.random()-0.5) * (width-0.5), j + 1, -width/2 - 0.01); win.rotation.y = Math.PI; }
                group.add(win);
            }
        }
    }

    // Golden Spire for high stars
    if (repo.stargazers_count > 50) {
        const spireGeo = new THREE.ConeGeometry(0.1, 1, 4);
        const spireMat = new THREE.MeshPhongMaterial({ color: PALETTE.gold, flatShading: true });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = height + 0.6;
        group.add(spire);

        const ballGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const ball = new THREE.Mesh(ballGeo, spireMat);
        ball.position.y = height + 1.1;
        group.add(ball);

        // Rotating Star/Diamond
        const starGeo = new THREE.OctahedronGeometry(0.2, 0);
        const star = new THREE.Mesh(starGeo, spireMat);
        star.position.y = height + 1.6;
        group.add(star);
        
        // Add to animation
        gsap.to(star.rotation, {
            y: Math.PI * 2,
            duration: 2,
            repeat: -1,
            ease: "none"
        });
        
        gsap.to(star.position, {
            y: "+=0.2",
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }

    // Data for raycasting
    body.userData = { 
        isBuilding: true, 
        name: repo.name, 
        language: repo.language || 'Unknown', 
        stars: repo.stargazers_count,
        url: repo.html_url
    };

    group.scale.y = 0.01;
    scene.add(group);
    meshes.push(group);

    // Entrance animation
    gsap.to(group.scale, {
        y: 1,
        duration: 1.5,
        delay: Math.random() * 2,
        ease: "elastic.out(1, 0.5)"
    });
}

function createTree(x, z) {
    const type = Math.random() > 0.5 ? 'cone' : 'sphere';
    const color = PALETTE.autumn[Math.floor(Math.random() * PALETTE.autumn.length)];
    const height = 1 + Math.random() * 1.5;
    
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 6);
    const trunkMat = new THREE.MeshPhongMaterial({ color: 0x4e342e, flatShading: true });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.3;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage
    let foliage;
    if (type === 'cone') {
        const foliageGeo = new THREE.ConeGeometry(0.6, height, 6);
        const foliageMat = new THREE.MeshPhongMaterial({ color: color, flatShading: true });
        foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.y = 0.6 + height/2;
    } else {
        const foliageGeo = new THREE.SphereGeometry(0.5, 6, 6);
        const foliageMat = new THREE.MeshPhongMaterial({ color: color, flatShading: true });
        foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.y = 1;
        foliage.scale.set(1, 1.2, 1);
    }
    foliage.castShadow = true;
    group.add(foliage);

    group.scale.set(0,0,0);
    scene.add(group);
    
    gsap.to(group.scale, {
        x: 1, y: 1, z: 1,
        duration: 1,
        delay: Math.random() * 1,
        ease: "back.out(1.7)"
    });
}

function createVehicle(isVertical = false) {
    const colors = [0xff5252, 0x448aff, 0xffeb3b, 0x4caf50];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const group = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4);
    const bodyMat = new THREE.MeshPhongMaterial({ color: color, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    group.add(body);

    const topGeo = new THREE.BoxGeometry(0.4, 0.3, 0.35);
    const top = new THREE.Mesh(topGeo, bodyMat);
    top.position.set(-0.1, 0.5, 0);
    group.add(top);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8);
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(
            i < 2 ? 0.25 : -0.25,
            0.1,
            i % 2 === 0 ? 0.2 : -0.2
        );
        group.add(wheel);
    }

    if (isVertical) {
        group.rotation.y = Math.PI / 2;
        group.position.set(0, 0.1, (Math.random()-0.5) * 40);
    } else {
        group.position.set((Math.random()-0.5) * 40, 0.1, 0);
    }
    
    scene.add(group);
    meshes.push(group);

    // Movement
    const speed = (0.05 + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1);
    
    return {
        mesh: group,
        update: () => {
            const dir = isVertical ? 'z' : 'x';
            group.position[dir] += speed;
            if (group.position[dir] > 25) group.position[dir] = -25;
            if (group.position[dir] < -25) group.position[dir] = 25;
        }
    };
}

let activeVehicles = [];

// -- API LOGIC --

async function fetchRepos(username) {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=60`);
    if (!response.ok) throw new Error('User not found');
    const data = await response.json();
    
    // Fetch stars total
    const totalStars = data.reduce((acc, r) => acc + r.stargazers_count, 0);
    
    // We can't easily get commit counts for all repos without many API calls.
    // Let's use stargazers + size as a proxy for height, or just random activity simulation.
    return {
        repos: data.map(r => ({
            name: r.name,
            language: r.language,
            stargazers_count: r.stargazers_count,
            commits: Math.floor(Math.random() * 100) + r.stargazers_count, // Mock activity
            html_url: r.html_url
        })),
        user: {
            username: username,
            avatar: data[0]?.owner.avatar_url || '',
            repoCount: data.length,
            starCount: totalStars
        }
    };
}

// -- INTERACTION --

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    let found = false;
    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData && obj.userData.isBuilding) {
            tooltip.classList.remove('hidden');
            document.getElementById('tooltip-name').textContent = obj.userData.name;
            document.getElementById('tooltip-lang').textContent = `Language: ${obj.userData.language}`;
            document.getElementById('tooltip-stars').textContent = `Stars: ${obj.userData.stars}`;
            
            // Highlight & Scale
            if (!obj.userData.hovered) {
                obj.userData.hovered = true;
                gsap.to(obj.parent.scale, { x: 1.1, z: 1.1, duration: 0.3, ease: "power2.out" });
                if (obj.material.emissive) obj.material.emissive.setHex(0x333333);
            }
            
            found = true;
            break;
        }
    }

    if (!found) {
        tooltip.classList.add('hidden');
        canvas.style.cursor = 'default';
        // Reset all
        scene.traverse(child => {
            if (child.isMesh && child.userData.isBuilding && child.userData.hovered) {
                child.userData.hovered = false;
                gsap.to(child.parent.scale, { x: 1, z: 1, duration: 0.3, ease: "power2.out" });
                if (child.material.emissive) child.material.emissive.setHex(0x000000);
            }
        });
    } else {
        canvas.style.cursor = 'pointer';
    }
}

function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData && obj.userData.isBuilding && obj.userData.url) {
            window.open(obj.userData.url, '_blank');
            break;
        }
    }
}

// -- INIT & LISTENERS --

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const loading = document.getElementById('loading');
    const loginScreen = document.getElementById('login-screen');
    const hud = document.getElementById('hud');

    loading.classList.remove('hidden');

    try {
        const data = await fetchRepos(username);
        
        // Update HUD
        document.getElementById('user-avatar').src = data.user.avatar;
        document.getElementById('hud-username').textContent = `@${data.user.username}`;
        document.getElementById('repo-count').textContent = data.user.repoCount;
        document.getElementById('star-count').textContent = data.user.starCount;

        // Clear existing (not needed for first load but good practice)
        meshes.forEach(m => scene.remove(m));
        meshes = [];

        // Build World
        createGround();
        
        // Place buildings in a spiral or grid
        const spacing = 4;
        const gridSide = Math.ceil(Math.sqrt(data.repos.length));
        
        data.repos.forEach((repo, i) => {
            const x = (i % gridSide - gridSide/2) * spacing;
            const z = (Math.floor(i / gridSide) - gridSide/2) * spacing;
            createBuilding(repo, x, z);
            
            // Scatter trees nearby
            if (Math.random() > 0.6) {
                createTree(x + (Math.random()-0.5)*3, z + (Math.random()-0.5)*3);
            }
        });

        // Scatter trees randomly outside center roads
        for(let i=0; i<40; i++) {
            const tx = (Math.random()-0.5)*45;
            const tz = (Math.random()-0.5)*45;
            if (Math.abs(tx) > 2 && Math.abs(tz) > 2) { // Avoid roads
                createTree(tx, tz);
            }
        }

        // Create Vehicles
        activeVehicles = [];
        for (let i = 0; i < 4; i++) {
            activeVehicles.push(createVehicle(false)); // Horizontal
            activeVehicles.push(createVehicle(true));  // Vertical
        }

        isCinematic = false;
        gsap.to(camera.position, {
            x: 50, y: 50, z: 50,
            duration: 2,
            ease: "power3.inOut"
        });

        loginScreen.classList.add('hidden');
        hud.classList.remove('hidden');
        
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        loading.classList.add('hidden');
    }
});

document.getElementById('reset-cam').addEventListener('click', () => {
    gsap.to(camera.position, {
        x: 50, y: 50, z: 50,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => camera.lookAt(0,0,0)
    });
});

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onClick);

// Final Polish: Initial Ground setup (empty world)
createGround();
for(let i=0; i<30; i++) {
    const tx = (Math.random()-0.5)*50;
    const tz = (Math.random()-0.5)*50;
    if (Math.abs(tx) > 2 && Math.abs(tz) > 2) createTree(tx, tz);
}

// Cinematic Login Animation
let isCinematic = true;
const cinematicTimeline = gsap.to(camera.position, {
    x: 70 * Math.cos(0),
    z: 70 * Math.sin(0),
    duration: 20,
    repeat: -1,
    ease: "none",
    onUpdate: () => {
        if (!isCinematic) return;
        const time = Date.now() * 0.0001;
        camera.position.x = 60 * Math.cos(time);
        camera.position.z = 60 * Math.sin(time);
        camera.lookAt(0, 0, 0);
    }
});

function animate() {
    requestAnimationFrame(animate);
    
    if (!isCinematic) {
        controls.update();
    }
    
    // Update vehicles
    activeVehicles.forEach(v => v.update());
    
    renderer.render(scene, camera);
}

animate();
