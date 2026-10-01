// ==========================================
// MAIN ENTRY POINT & INPUT CONTROLLER
// ==========================================
import './style.css';
import { GameEngine } from './game.js';
import { UIManager } from './ui.js';
import { audio } from './audio.js';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(
      (reg) => console.log('PWA ServiceWorker registered with scope:', reg.scope),
      (err) => console.warn('ServiceWorker registration failed:', err)
    );
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const game = new GameEngine(canvas);
  const ui = new UIManager(game);

  // Resize canvas to fill available game-viewport
  function handleResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w <= 0 || h <= 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    game.resize(w, h);
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => setTimeout(handleResize, 150));

  const container = document.getElementById('canvas-container');
  if (container && window.ResizeObserver) {
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(container);
  }

  handleResize();
  setTimeout(handleResize, 50);
  setTimeout(handleResize, 200);

  // Load initial map
  game.loadStage('nexus_prime');

  // Helper to translate client coords to game canvas coords
  function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  // Pointer / Touch Handlers
  function handlePointerDown(e) {
    audio.ensureContext();
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const grid = game.map.pixelToGrid(x, y);

    // 1. Orbital Strike Skill Targeting
    if (game.activeSkillTargeting === 'orbital') {
      game.activateSkill('orbital', { x, y });
      return;
    }

    // 2. Tower Building Mode
    if (game.buildingType) {
      if (game.map.canBuild(grid.col, grid.row)) {
        game.buildTower(grid.col, grid.row);
      } else {
        // If tapped existing tower while in build mode, cancel build and select that tower
        const clickedTower = game.towers.find((t) => t.col === grid.col && t.row === grid.row);
        if (clickedTower) {
          game.selectTower(clickedTower);
        } else {
          game.setBuildingType(null);
        }
      }
      return;
    }

    // 3. Tower Selection
    const clickedTower = game.towers.find((t) => {
      const dist = Math.hypot(t.x - x, t.y - y);
      return dist <= 24;
    });

    if (clickedTower) {
      game.selectTower(clickedTower);
    } else {
      // Tap on empty space deselects
      game.selectTower(null);
    }
  }

  function handlePointerMove(e) {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const grid = game.map.pixelToGrid(x, y);
    game.pointerGrid = grid;
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerleave', () => {
    game.pointerGrid = null;
  });

  // Main Loop
  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    game.update(dt);
    game.render();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
