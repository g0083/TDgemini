// ==========================================
// MAP & GRID SYSTEM
// ==========================================
import { COLORS, GRID_COLS, GRID_ROWS } from './constants.js';

export class GameMap {
  constructor(mapData) {
    this.data = mapData;
    this.cols = mapData.gridWidth || GRID_COLS;
    this.rows = mapData.gridHeight || GRID_ROWS;
    this.cellWidth = 0;
    this.cellHeight = 0;
    this.width = 0;
    this.height = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    // Grid states: 0 = empty/buildable, 1 = path (cannot build), 2 = occupied by tower, 3 = nexus
    this.grid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
    this.pathSegments = [];
    this.pulseOffset = 0;

    this.initPaths();
  }

  initPaths() {
    // Reset grid
    this.grid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
    this.pathSegments = [];

    // Mark path cells and build polyline segments
    for (const path of this.data.paths) {
      const segments = [];
      let totalLength = 0;

      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];

        // Mark grid cells along this segment
        const dx = Math.sign(p2.x - p1.x);
        const dy = Math.sign(p2.y - p1.y);
        let cx = p1.x;
        let cy = p1.y;

        while (true) {
          if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
            this.grid[Math.floor(cy)][Math.floor(cx)] = 1;
          }
          if (cx === p2.x && cy === p2.y) break;
          cx += dx;
          cy += dy;
        }

        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        segments.push({ p1, p2, length: len, startDist: totalLength });
        totalLength += len;
      }
      this.pathSegments.push({ segments, totalLength });
    }

    // Mark Nexus
    const nx = Math.floor(this.data.nexus.x);
    const ny = Math.floor(this.data.nexus.y);
    if (ny >= 0 && ny < this.rows && nx >= 0 && nx < this.cols) {
      this.grid[ny][nx] = 3;
    }
  }

  resize(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    // Keep aspect ratio 16:10 or fit nicely
    const aspect = this.cols / this.rows;
    let w = viewportWidth;
    let h = viewportWidth / aspect;

    if (h > viewportHeight) {
      h = viewportHeight;
      w = viewportHeight * aspect;
    }

    this.width = w;
    this.height = h;
    this.cellWidth = w / this.cols;
    this.cellHeight = h / this.rows;
    this.offsetX = (viewportWidth - w) / 2;
    this.offsetY = (viewportHeight - h) / 2;
  }

  // Convert grid coord (col, row) to world pixel coord (center of cell)
  gridToPixel(col, row) {
    return {
      x: this.offsetX + (col + 0.5) * this.cellWidth,
      y: this.offsetY + (row + 0.5) * this.cellHeight
    };
  }

  // Convert world pixel to grid cell
  pixelToGrid(pixelX, pixelY) {
    const col = Math.floor((pixelX - this.offsetX) / this.cellWidth);
    const row = Math.floor((pixelY - this.offsetY) / this.cellHeight);
    return { col, row };
  }

  isValidGrid(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  canBuild(col, row) {
    if (!this.isValidGrid(col, row)) return false;
    return this.grid[row][col] === 0;
  }

  occupyCell(col, row) {
    if (this.isValidGrid(col, row)) {
      this.grid[row][col] = 2;
    }
  }

  freeCell(col, row) {
    if (this.isValidGrid(col, row)) {
      this.grid[row][col] = 0;
    }
  }

  // Get pixel position along path at distance
  getPointOnPath(pathIndex, distance) {
    const pathData = this.pathSegments[pathIndex % this.pathSegments.length];
    if (!pathData) return { x: 0, y: 0, reachedEnd: true, angle: 0 };

    if (distance >= pathData.totalLength) {
      const lastSeg = pathData.segments[pathData.segments.length - 1];
      const endPixel = this.gridToPixel(lastSeg.p2.x, lastSeg.p2.y);
      const angle = Math.atan2(lastSeg.p2.y - lastSeg.p1.y, lastSeg.p2.x - lastSeg.p1.x);
      return { x: endPixel.x, y: endPixel.y, reachedEnd: true, angle };
    }

    // Find active segment
    for (const seg of pathData.segments) {
      if (distance >= seg.startDist && distance <= seg.startDist + seg.length) {
        const segDist = distance - seg.startDist;
        const t = seg.length > 0 ? segDist / seg.length : 0;
        const curCol = seg.p1.x + (seg.p2.x - seg.p1.x) * t;
        const curRow = seg.p1.y + (seg.p2.y - seg.p1.y) * t;
        const pixel = this.gridToPixel(curCol, curRow);
        const angle = Math.atan2(seg.p2.y - seg.p1.y, seg.p2.x - seg.p1.x);
        return { x: pixel.x, y: pixel.y, reachedEnd: false, angle };
      }
    }

    const lastSeg = pathData.segments[pathData.segments.length - 1];
    const endPixel = this.gridToPixel(lastSeg.p2.x, lastSeg.p2.y);
    return { x: endPixel.x, y: endPixel.y, reachedEnd: true, angle: 0 };
  }

  update(dt) {
    this.pulseOffset = (this.pulseOffset + dt * 45) % 100;
  }

  draw(ctx, baseHp, maxBaseHp, previewGrid = null, previewCanBuild = false) {
    ctx.save();

    // 1. Viewport Outer Background Fill
    if (this.viewportWidth && this.viewportHeight) {
      ctx.fillStyle = '#060912';
      ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
    }

    // Map Board Background Fill
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(this.offsetX, this.offsetY, this.width, this.height);

    // Glowing Board Outer Border
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.offsetX, this.offsetY, this.width, this.height);
    ctx.restore();

    // 2. Cyber Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.gridLine;
    for (let c = 0; c <= this.cols; c++) {
      const x = this.offsetX + c * this.cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, this.offsetY);
      ctx.lineTo(x, this.offsetY + this.height);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      const y = this.offsetY + r * this.cellHeight;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, y);
      ctx.lineTo(this.offsetX + this.width, y);
      ctx.stroke();
    }

    // 3. Path base tiles & Circuit lines
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === 1) {
          const px = this.offsetX + c * this.cellWidth;
          const py = this.offsetY + r * this.cellHeight;
          ctx.fillStyle = COLORS.pathBase;
          ctx.fillRect(px + 1, py + 1, this.cellWidth - 2, this.cellHeight - 2);

          // Subtle dot in center
          ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
          ctx.fillRect(px + this.cellWidth / 2 - 2, py + this.cellHeight / 2 - 2, 4, 4);
        }
      }
    }

    // 4. Glowing Path Centerline with Cyber Pulse
    for (const path of this.data.paths) {
      if (path.length < 2) continue;

      // Glow Underlay
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = Math.min(this.cellWidth, this.cellHeight) * 0.45;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const startPixel = this.gridToPixel(path[0].x, path[0].y);
      ctx.moveTo(startPixel.x, startPixel.y);
      for (let i = 1; i < path.length; i++) {
        const pt = this.gridToPixel(path[i].x, path[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Sharp Core Line with dash animation
      ctx.strokeStyle = COLORS.pathGlow;
      ctx.shadowColor = COLORS.pathGlow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 16]);
      ctx.lineDashOffset = -this.pulseOffset;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Spawn Indicators
    for (const sp of this.data.spawnPoints) {
      const p = this.gridToPixel(sp.x, sp.y);
      ctx.save();
      ctx.strokeStyle = COLORS.danger;
      ctx.shadowColor = COLORS.danger;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.min(this.cellWidth, this.cellHeight) * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Small pulsing inner core
      ctx.fillStyle = COLORS.danger;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Nexus (Base Core)
    const np = this.gridToPixel(this.data.nexus.x, this.data.nexus.y);
    const nexusRadius = Math.min(this.cellWidth, this.cellHeight) * 0.42;
    const hpRatio = Math.max(0, baseHp / maxBaseHp);
    const nexusColor = hpRatio > 0.3 ? COLORS.nexus : COLORS.danger;

    ctx.save();
    // Outer rotating shield
    const angle = Date.now() * 0.002;
    ctx.strokeStyle = nexusColor;
    ctx.shadowColor = nexusColor;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = angle + (i * Math.PI) / 3;
      const hx = np.x + Math.cos(a) * nexusRadius;
      const hy = np.y + Math.sin(a) * nexusRadius;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // Core glow
    ctx.fillStyle = nexusColor;
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(Date.now() * 0.005);
    ctx.beginPath();
    ctx.arc(np.x, np.y, nexusRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Core Center
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(np.x, np.y, nexusRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // HP Arc above nexus
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(np.x, np.y, nexusRadius + 8, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();

    ctx.strokeStyle = nexusColor;
    ctx.beginPath();
    ctx.arc(np.x, np.y, nexusRadius + 8, Math.PI * 0.8, Math.PI * 0.8 + (Math.PI * 1.4 * hpRatio));
    ctx.stroke();
    ctx.restore();

    // 7. Preview Grid Cell (when placing a tower)
    if (previewGrid) {
      const { col, row } = previewGrid;
      if (this.isValidGrid(col, row)) {
        const px = this.offsetX + col * this.cellWidth;
        const py = this.offsetY + row * this.cellHeight;
        ctx.save();
        ctx.fillStyle = previewCanBuild ? 'rgba(0, 255, 157, 0.25)' : 'rgba(255, 46, 99, 0.35)';
        ctx.strokeStyle = previewCanBuild ? COLORS.success : COLORS.danger;
        ctx.lineWidth = 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;
        ctx.fillRect(px + 2, py + 2, this.cellWidth - 4, this.cellHeight - 4);
        ctx.strokeRect(px + 2, py + 2, this.cellWidth - 4, this.cellHeight - 4);
        ctx.restore();
      }
    }

    ctx.restore();
  }
}
