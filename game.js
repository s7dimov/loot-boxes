const basePrizes = [
    { name: "Laptop", emoji: "💻", probability: 0.10, value: 1200 },
    { name: "Smartphone", emoji: "📱", probability: 0.10, value: 900 },
    { name: "Tablet", emoji: "🖥️", probability: 0.10, value: 600 },
    { name: "Smartwatch", emoji: "⌚", probability: 0.10, value: 400 },
    { name: "Wireless Earbuds", emoji: "🎧", probability: 0.10, value: 200 },
    { name: "VR Headset", emoji: "🕶️", probability: 0.10, value: 350 },
    { name: "Bluetooth Speaker", emoji: "🔊", probability: 0.10, value: 150 },
    { name: "Camera", emoji: "📷", probability: 0.05, value: 800 },
    { name: "Game Console", emoji: "🎮", probability: 0.05, value: 700 },
    { name: "Drone", emoji: "🛸", probability: 0.05, value: 1000 },
    { name: "Printer", emoji: "🖨️", probability: 0.05, value: 300 },
    { name: "USB Drive", emoji: "💾", probability: 0.05, value: 100 }
];
const prizes = [...basePrizes, ...basePrizes, ...basePrizes];

const config = {
    width: 900,
    height: 350,
    itemWidth: 140,
    itemHeight: 180,
    visibleCount: 7,
    spinDuration: 4000,
    cardSpacing: 60,
    centerCardScale: 1.18
};

let isSpinning = false;
let selectedIndex = basePrizes.length * 1 + 0;
let items = [];
let prizeLabel = null;
let topArrow = null;
let bottomArrow = null;
let winEffectTimeout = null;

const app = new PIXI.Application({
    width: config.width,
    height: config.height,
    backgroundColor: 0x181B23,
    antialias: true
});
document.getElementById('game-container').innerHTML = '';
document.getElementById('game-container').appendChild(app.view);

const carousel = new PIXI.Container();
carousel.y = config.height / 2;
app.stage.addChild(carousel);

function createCarouselItems() {
    items = [];
    carousel.removeChildren();
    for (let i = 0; i < prizes.length; i++) {
        const prize = prizes[i];
        const item = new PIXI.Container();
        item.x = i * (config.itemWidth + config.cardSpacing);
        const shadow = new PIXI.Graphics();
        shadow.beginFill(0x000000, 0.18);
        shadow.drawRoundedRect(8, 0, config.itemWidth, config.itemHeight, 22);
        shadow.endFill();
        item.addChild(shadow);
        const bg = new PIXI.Graphics();
        bg.beginFill(0x23263A);
        bg.lineStyle(3, 0xFFC72C, 0.18);
        bg.drawRoundedRect(0, 0, config.itemWidth, config.itemHeight, 22);
        bg.endFill();
        bg.alpha = 0.98;
        item.addChild(bg);
        const emoji = new PIXI.Text(prize.emoji, {
            fontFamily: 'Segoe UI Emoji',
            fontSize: 48,
            align: 'center',
        });
        emoji.anchor.set(0.5);
        emoji.x = config.itemWidth / 2;
        emoji.y = 60;
        item.addChild(emoji);
        const text = new PIXI.Text(prize.name, {
            fontFamily: 'Montserrat',
            fontSize: 16,
            fill: 0xFFC72C,
            align: 'center',
            fontWeight: 'bold',
        });
        text.anchor.set(0.5);
        text.x = config.itemWidth / 2;
        text.y = 120;
        item.addChild(text);
        item.y = -config.itemHeight / 2;
        items.push(item);
        carousel.addChild(item);
    }
}

function updateCarouselPosition(offset = 0, centerIdx = null) {
    const centerIndex = Math.floor(config.visibleCount / 2);
    let startIdx = centerIdx !== null ? centerIdx - centerIndex : selectedIndex - centerIndex + offset;
    const scaledWidth = config.itemWidth * config.centerCardScale;
    const centerX = config.width / 2 - scaledWidth / 2;
    carousel.x = centerX - centerIndex * (config.itemWidth + config.cardSpacing);
    for (let i = 0; i < items.length; i++) {
        const pos = ((i - startIdx) + prizes.length) % prizes.length;
        items[i].visible = false;
        if (pos >= 0 && pos < config.visibleCount) {
            items[i].visible = true;
            items[i].x = pos * (config.itemWidth + config.cardSpacing);
            const dist = Math.abs(pos - centerIndex);
            if (dist === 0) {
                items[i].alpha = 1;
                items[i].scale.set(config.centerCardScale);
            } else if (dist === 1) {
                items[i].alpha = 0.7;
                items[i].scale.set(0.95);
            } else if (dist === 2) {
                items[i].alpha = 0.45;
                items[i].scale.set(0.8);
            } else {
                items[i].alpha = 0.2;
                items[i].scale.set(0.7);
            }
            if (items[i].glow) {
                items[i].removeChild(items[i].glow);
                items[i].glow = null;
            }
            if (centerIdx !== null && i === centerIdx) {
                const glow = new PIXI.Graphics();
                glow.beginFill(0xFFC72C, 0.25);
                glow.drawRoundedRect(-12, -12, config.itemWidth+24, config.itemHeight+24, 28);
                glow.endFill();
                glow.filters = [new PIXI.filters.BlurFilter(10)];
                items[i].addChildAt(glow, 0);
                items[i].glow = glow;
            }
        }
    }
}

function selectPrizeIndex() {
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < basePrizes.length; i++) {
        cumulative += basePrizes[i].probability;
        if (random <= cumulative) return i;
    }
    return basePrizes.length - 1;
}

function showPrizeLabel() {
    if (prizeLabel) {
        app.stage.removeChild(prizeLabel);
        prizeLabel = null;
    }
    if (topArrow) { app.stage.removeChild(topArrow); topArrow = null; }
    if (bottomArrow) { app.stage.removeChild(bottomArrow); bottomArrow = null; }
    const winningItem = items[selectedIndex];
    if (winningItem) {
        let t = 0;
        let up = true;
        const originalAlpha = winningItem.alpha;
        if (winEffectTimeout) cancelAnimationFrame(winEffectTimeout);
        function animateWinEffect() {
            if (up && t < 8) {
                winningItem.scale.set(config.centerCardScale + 0.18 * (t / 8));
                winningItem.alpha = originalAlpha - 0.2 * (t / 8);
                t++;
                winEffectTimeout = requestAnimationFrame(animateWinEffect);
            } else if (up) {
                up = false;
                t = 8;
                winEffectTimeout = requestAnimationFrame(animateWinEffect);
            } else if (!up && t > 0) {
                winningItem.scale.set(config.centerCardScale + 0.18 * (t / 8));
                winningItem.alpha = originalAlpha - 0.2 * (t / 8);
                t--;
                winEffectTimeout = requestAnimationFrame(animateWinEffect);
            } else {
                winningItem.scale.set(config.centerCardScale);
                winningItem.alpha = originalAlpha;
            }
        }
        animateWinEffect();
    }
    const prize = prizes[selectedIndex];
    prizeLabel = new PIXI.Text(`${prize.emoji} ${prize.name} ($${prize.value})`, {
        fontFamily: 'Montserrat',
        fontSize: 22,
        fill: '#FFC72C',
        fontWeight: 'bold',
        align: 'center',
        dropShadow: true,
        dropShadowColor: '#23263A',
        dropShadowBlur: 6
    });
    prizeLabel.anchor.set(0.5);
    prizeLabel.x = config.width / 2;
    prizeLabel.y = config.height / 2 + config.itemHeight / 2 + 70;
    app.stage.addChild(prizeLabel);
}

function spin(isDemo = false) {
    if (isSpinning) return;
    isSpinning = true;
    document.getElementById('spin-button').disabled = true;
    document.getElementById('demo-button').disabled = true;
    const centerIndex = Math.floor(config.visibleCount / 2);
    const logicalWin = basePrizes.length + selectPrizeIndex();
    const cycles = 4;
    const totalShifts = logicalWin - centerIndex + prizes.length * cycles;
    let currentShift = 0;
    const startTime = Date.now();
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / config.spinDuration, 1);
        const ease = easeOutQuart(progress);
        currentShift = Math.floor(ease * totalShifts);
        updateCarouselPosition(currentShift % prizes.length);
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            const centerX = config.width / 2;
            let minDist = Infinity;
            let centerItemIdx = 0;
            for (let i = 0; i < items.length; i++) {
                if (!items[i].visible) continue;
                const itemGlobal = items[i].getGlobalPosition();
                const dist = Math.abs(itemGlobal.x + config.itemWidth / 2 - centerX);
                if (dist < minDist) {
                    minDist = dist;
                    centerItemIdx = i;
                }
            }
            selectedIndex = centerItemIdx;
            isSpinning = false;
            document.getElementById('spin-button').disabled = false;
            document.getElementById('demo-button').disabled = false;
            showPrizeLabel();
        }
    }
    animate();
}

document.getElementById('spin-button').onclick = () => {
    if (prizeLabel) { app.stage.removeChild(prizeLabel); prizeLabel = null; }
    if (topArrow) { app.stage.removeChild(topArrow); topArrow = null; }
    if (bottomArrow) { app.stage.removeChild(bottomArrow); bottomArrow = null; }
    if (winEffectTimeout) cancelAnimationFrame(winEffectTimeout);
    spin(false);
};
document.getElementById('demo-button').onclick = () => {
    if (prizeLabel) { app.stage.removeChild(prizeLabel); prizeLabel = null; }
    if (topArrow) { app.stage.removeChild(topArrow); topArrow = null; }
    if (bottomArrow) { app.stage.removeChild(bottomArrow); bottomArrow = null; }
    if (winEffectTimeout) cancelAnimationFrame(winEffectTimeout);
    spin(true);
};

createCarouselItems();
updateCarouselPosition(); 