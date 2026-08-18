// made by Mikronix0(Miko)
//https://hellacafe.nekoweb.org/ <-- my site you can look if you want to 
//Hellooo and thanks for the using my widget I write everything you need :p

(function () {
    const currentScript = document.currentScript;
    let element = currentScript ? currentScript.parentElement : null;

    let settings = {};
    if (currentScript && currentScript.dataset && currentScript.dataset.settings) {
        try {
            settings = JSON.parse(decodeURIComponent(currentScript.dataset.settings));
        } catch (e) {
            console.warn('WidgetStar settings parse error:', e);
        }
    }

    // cantainer
    const container = document.createElement('div');
    container.id = 'coffee-widget';
    
    // style
    const style = document.createElement('style');
    style.innerHTML = `
        #coffee-widget {
            position: relative;
            margin: 5px; 
            width: 300px;
            font-family: 'Verdana', 'Arial', sans-serif;
            user-select: none;
        }

        #coffee-widget .game-box {
            position: relative;
            width: 300px;
            height: 390px;
            background: #fff8f0;
            border: 3px solid #5c3d2e;
            border-radius: 12px;
            overflow: hidden;
            cursor: crosshair;
        }

        #coffee-widget canvas {
            background: #fff0f3;
            display: block;
        }

        #coffee-widget .overlay {
            position: absolute;
            top: 0; left: 0;
            width: 100%; 
            height: 100%; 
            background: #fff0f3;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #5c3d2e;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
            z-index: 10;
            cursor: default;
        }

        #coffee-widget .hidden { display: none !important; }

        #coffee-widget button {
            background: #ffb3c6;
            border: 2px solid #5c3d2e;
            color: #5c3d2e;
            padding: 8px 18px;
            font-family: 'Verdana', 'Arial', sans-serif;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 8px;
            font-size: 13px;
            white-space: nowrap !important;
            width: 30px !important;
            height: 35px !important;
            min-width: 120px !important;
            display: inline-block !important;
            box-sizing: border-box !important;
            line-height: normal !important;
        }

        #coffee-widget button:hover {
            background: #ffcbf2;
        }

        #coffee-widget button:active {
            background: #ff9ebb;
        }

        /* --- footer for the mini game --- */
        #coffee-widget .coffee-footer {
            background: transparent;
            margin-top: 6px;
            padding: 0 4px;
            text-align: left;
            font-size: 10px;
            color: #ff66b2;
            font-weight: bold;
            cursor: default;
            text-transform: uppercase;
            white-space: nowrap;
            text-shadow: none !important;
            filter: none !important;
        }

        #coffee-widget .coffee-footer a {
            color: #ff66b2;
            text-decoration: none;
            text-shadow: none !important;
            filter: none !important;
        }

        #coffee-widget .coffee-footer a:hover {
            text-decoration: underline;
            color: #ff3399;
        }
    `;

    container.innerHTML = `
        <div class="game-box">
            <canvas id="gameCanvas" width="300" height="390"></canvas>
            <div id="game-ui-overlay" class="overlay hidden">
                <h2 id="game-ui-title" style="margin: 0; font-size: 18px; text-transform: uppercase;">CONGRATULATIONS!!</h2>
                <p id="game-ui-msg" style="margin: 8px 0; font-size: 12px; color: #8d5b4c;">CONGRATULATIONS you win!!</p>
                <button id="game-ui-btn">Play again?</button>
            </div>
        </div>
        <div class="coffee-footer">
            MADE BY <a href="https://hellacafe.nekoweb.org/" target="_blank">MIKO</a> &lt;3
        </div>
    `;

    document.head.appendChild(style);

    
    const customTarget = document.getElementById('coffee-game-container');
    if (element) {
        element.appendChild(container); 
    } else if (customTarget) {
        customTarget.appendChild(container); 
    } else if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(container, currentScript);
    } else {
        document.body.appendChild(container);
    }

    // variables and basic definitions
    const canvas = container.querySelector('#gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = container.querySelector('#game-ui-overlay');
    const btn = container.querySelector('#game-ui-btn');

    let level = 1;
    const maxLevels = 3;
    const baseCupSpeed = 2.0; 
    const speedMultiplier = 0.15;

    let isPouring = false;
    let isGameOver = true;
    let isWon = false;

    const machine = { x: canvas.width / 2, y: 0, width: 64, height: 45 };
    const cup = { x: 50, y: 315, width: 52, height: 42, speed: baseCupSpeed, direction: 1, fill: 0, scale: 1 };

    let spilledCoffeeHeight = 0;
    const maxSpillHeight = 60;
    let particles = [];

    // mouse and touch events
    window.addEventListener('mousedown', () => { if (!isGameOver) isPouring = true; });
    window.addEventListener('mouseup', () => isPouring = false);
    window.addEventListener('touchstart', (e) => { if (!isGameOver) isPouring = true; e.preventDefault(); }, {passive: false});
    window.addEventListener('touchend', () => isPouring = false);

    container.addEventListener('mousemove', (e) => {
        if (!isGameOver) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            machine.x = Math.max(machine.width/2, Math.min(canvas.width - machine.width/2, mouseX));
        }
    });

    container.addEventListener('touchmove', (e) => {
        if (!isGameOver) {
            const rect = canvas.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            machine.x = Math.max(machine.width/2, Math.min(canvas.width - machine.width/2, touchX));
            e.preventDefault();
        }
    }, {passive: false});

    btn.addEventListener('click', handleBtnClick);

    // reset or start level
    function startLevel(lvl) {
        level = lvl;
        cup.fill = 0;
        cup.x = 50;
        cup.scale = 1;
        cup.y = 315;
        cup.speed = baseCupSpeed + (level - 1) * speedMultiplier; 
        spilledCoffeeHeight = 0;
        machine.x = canvas.width / 2;
        isGameOver = false;
        isWon = false;
        particles = [];
        overlay.classList.add('hidden');
        animate();
    }

    // button click logic
    function handleBtnClick() {
        if (isWon && level < maxLevels) {
            startLevel(level + 1);
        } else {
            startLevel(1);
        }
    }

    // win particles
    function Particlescreate() {
        for (let i = 0; i < 35; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 6,
                speed: Math.random() * 2.5 + 1.5,
                type: Math.random() > 0.5 ? 'heart' : 'sparkle'
            });
        }
    }

    // the game speed 
    function update() {
        if (isGameOver) return;

        if (!isWon) {
            cup.x += cup.speed * cup.direction;
            if (cup.x <= 10 || cup.x + cup.width >= canvas.width - 10) {
                cup.direction *= -1;
            }
        }

        if (isPouring && !isWon) {
            const cupCenter = cup.x + cup.width / 2;
            if (Math.abs(machine.x - cupCenter) < cup.width / 2) {
                cup.fill += 1.0;
            } else {
                spilledCoffeeHeight += 0.35;
            }
        }

        if (spilledCoffeeHeight >= maxSpillHeight && !isWon) {
            isGameOver = true;
            showUI("ohh I really want that coffee :c", `you fail in Level ${level}`, "Try again");
        }

        if (cup.fill >= 100 && !isWon) {
            isWon = true;
            Particlescreate();
            setTimeout(() => {
                isGameOver = true;
                if (level < maxLevels) {
                    showUI(`Level ${level} Complete!`, "You doin great ( •̀ ω •́ )✧", "Next level");
                } else {
                    showUI("CONGRATULATIONS!!", "you did all the levels!!", "Play again?");
                }
            }, 1600);
        }
    }

    // render frames
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // spilled coffee and floor
        if (spilledCoffeeHeight > 0) {
            ctx.fillStyle = "#6d4c41";
            ctx.fillRect(0, canvas.height - spilledCoffeeHeight, canvas.width, spilledCoffeeHeight);
            ctx.fillStyle = "#8d5b4c";
            ctx.fillRect(0, canvas.height - spilledCoffeeHeight, canvas.width, 3);
        }

        // draw coffee machine
        ctx.save();
        ctx.translate(machine.x - machine.width / 2, machine.y);
        ctx.fillStyle = "#ffccd5";
        ctx.beginPath();
        ctx.roundRect(0, 0, machine.width, machine.height, [0, 0, 10, 10]);
        ctx.fill();

        ctx.fillStyle = "#ffb3c6";
        ctx.beginPath();
        ctx.roundRect(0, 0, machine.width, 10, [0, 0, 0, 0]);
        ctx.fill();

        ctx.fillStyle = "#5c3d2e";
        ctx.beginPath();
        ctx.roundRect(machine.width/2 - 12, machine.height, 24, 10, [0, 0, 4, 4]);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(16, 25, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isPouring && !isGameOver && !isWon ? "#ff4d6d" : "#ffb3c6";
        ctx.beginPath();
        ctx.arc(48, 25, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // coffee pour stream 
        if (isPouring && !isGameOver && !isWon) {
            ctx.fillStyle = "#6d4c41";
            ctx.fillRect(machine.x - 3.5, machine.height + 10, 7, canvas.height - machine.height - 10 - spilledCoffeeHeight);
            ctx.fillStyle = "#8d5b4c";
            ctx.fillRect(machine.x - 1, machine.height + 10, 2, canvas.height - machine.height - 10 - spilledCoffeeHeight);
        }

        // the win animation
        if (isWon) {
            particles.forEach(p => {
                if (p.type === 'heart') {
                    ctx.fillStyle = "#ff7b9c";
                    ctx.font = `${p.size}px Verdana, sans-serif`;
                    ctx.fillText("☕", p.x, p.y);
                } else {
                    ctx.fillStyle = "#ffcbf2";
                    ctx.font = `${p.size}px Verdana, sans-serif`;
                    ctx.fillText("\(@^0^@)/", p.x, p.y);
                }
                p.y += p.speed;
                if (p.y > canvas.height) p.y = 0;
            });

            if (cup.scale < 1.4) cup.scale += 0.01;
            if (cup.x < canvas.width / 2 - cup.width / 2) cup.x += 1;
            if (cup.x > canvas.width / 2 - cup.width / 2) cup.x -= 1;
            if (cup.y > 180) cup.y -= 1;
        }

        // cup drawing
        ctx.save();
        ctx.translate(cup.x, cup.y);
        ctx.scale(cup.scale, cup.scale);

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(0, 0, cup.width, cup.height, [0, 0, 10, 10]);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cup.width + 4, cup.height / 2, 8, 0, Math.PI * 2);
        ctx.stroke();

        if (cup.fill > 0) {
            const currentFillHeight = (cup.height - 8) * (Math.min(cup.fill, 100) / 100);
            ctx.fillStyle = "#6d4c41";
            ctx.fillRect(4, cup.height - 4 - currentFillHeight, cup.width - 8, currentFillHeight);
            ctx.fillStyle = "#fff0f3";
            ctx.fillRect(4, cup.height - 4 - currentFillHeight, cup.width - 8, 4);
        }

        // the face on the cup
        ctx.fillStyle = "rgba(255, 123, 156, 0.6)";
        ctx.beginPath();
        ctx.arc(10, 22, 4, 0, Math.PI * 2);
        ctx.arc(cup.width - 10, 22, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#19092d";
        ctx.beginPath();
        ctx.arc(17, 18, 2.5, 0, Math.PI * 2);
        ctx.arc(cup.width - 17, 18, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#19092d";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cup.width / 2, 20, 3.5, 0, Math.PI);
        ctx.stroke();

        ctx.restore();

        // render level info
        ctx.fillStyle = "#8d5b4c";
        ctx.font = "bold 12px Verdana, sans-serif";
        ctx.fillText(`Level: ${level} / ${maxLevels}`, 15, 25);

        if (!isGameOver && !isWon) {
            ctx.fillStyle = "#8d5b4c";
            ctx.font = "10px Verdana, sans-serif";
            ctx.fillText("click or hold for filling the coffee", 20, canvas.height - 10);
        }
    }

    // show ui overlay
    function showUI(title, msg, btnText) {
        container.querySelector('#game-ui-title').innerText = title;
        container.querySelector('#game-ui-msg').innerText = msg;
        btn.innerText = btnText;
        overlay.classList.remove('hidden');
    }

    // main game loop
    function animate() {
        update();
        draw();
        if (!isGameOver || isWon) {
            requestAnimationFrame(animate);
        }
    }

    draw();
    showUI("TASTYLE COFFEE", "Ready to make some coffee?", "Start Game");
})();

    draw();
    showUI("tastyle coffee", "Ready to make some coffee?", "Start Game");
})();
