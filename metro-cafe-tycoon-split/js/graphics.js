// Cafe scene rendering only. Game state is supplied by game.js through getters.
export function createCafeRenderer({ canvas, getState, getScenicMode, getCustomers }) {
  const ctx = canvas.getContext("2d");
  let scenicZoom = 1.0;
  const particles = Array.from({ length: 42 }, () => ({
    x: Math.random(), y: Math.random() * 0.65, size: Math.random() * 3.5 + 2,
    speedY: Math.random() * 0.0022 + 0.0012, speedX: (Math.random() - 0.5) * 0.0005,
    phase: Math.random() * Math.PI * 2
  }));

    function drawIllustratedCharacter(ctx, cx, cy, visitor, isWalking, isSitting, phase) {
      const bobY = isWalking ? Math.abs(Math.sin(phase * 9)) * 4 : (isSitting ? 6 : Math.sin(phase * 2.5) * 1.2);
      const y = cy - bobY;

      ctx.save();

      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 25, isSitting ? 16 : 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      if (isSitting) {
        ctx.beginPath();
        ctx.moveTo(cx - 5, y + 12);
        ctx.lineTo(cx - 7, y + 23);
        ctx.moveTo(cx + 5, y + 12);
        ctx.lineTo(cx + 7, y + 23);
        ctx.stroke();
      } else {
        const stride = isWalking ? Math.sin(phase * 9) * 6 : 0;
        ctx.beginPath();
        ctx.moveTo(cx - 4, y + 10);
        ctx.lineTo(cx - 4 - stride, y + 23);
        ctx.moveTo(cx + 4, y + 10);
        ctx.lineTo(cx + 4 + stride, y + 23);
        ctx.stroke();
      }

      ctx.fillStyle = visitor.hairColor;
      if (visitor.hairStyle === "long") {
        ctx.beginPath();
        ctx.roundRect(cx - 14, y - 22, 28, 28, 12);
        ctx.fill();
      } else if (visitor.hairStyle === "bob") {
        ctx.beginPath();
        ctx.roundRect(cx - 14, y - 22, 28, 21, 10);
        ctx.fill();
      }

      ctx.fillStyle = visitor.topColor;
      ctx.beginPath();
      ctx.roundRect(cx - 12, y - 5, 24, 19, [8, 8, 4, 4]);
      ctx.fill();

      if (visitor.accessory === "apron") {
        ctx.fillStyle = "#44403c";
        ctx.fillRect(cx - 8, y - 2, 16, 16);
      }

      ctx.fillStyle = visitor.skinColor;
      ctx.fillRect(cx - 3, y - 8, 6, 5);
      ctx.beginPath();
      ctx.arc(cx, y - 16, 11.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(244, 114, 182, 0.35)";
      ctx.beginPath();
      ctx.arc(cx - 6.5, y - 14, 2.3, 0, Math.PI * 2);
      ctx.arc(cx + 6.5, y - 14, 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(cx - 4, y - 16.5, 1.4, 0, Math.PI * 2);
      ctx.arc(cx + 4, y - 16.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, y - 13.5, 2.8, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = visitor.hairColor;
      ctx.beginPath();
      ctx.arc(cx, y - 18.5, 11.8, Math.PI, Math.PI * 2);
      ctx.fill();

      if (visitor.hairStyle === "messy") {
        ctx.beginPath();
        ctx.arc(cx - 5, y - 25, 5, 0, Math.PI * 2);
        ctx.arc(cx + 3, y - 26, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visitor.accessory === "beret") {
        ctx.fillStyle = "#b91c1c";
        ctx.beginPath();
        ctx.ellipse(cx + 2, y - 27, 12, 4.5, -0.18, 0, Math.PI * 2);
        ctx.fill();
      } else if (visitor.accessory === "glasses") {
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 1.3;
        ctx.strokeRect(cx - 7.5, y - 19, 6, 4.5);
        ctx.strokeRect(cx + 1.5, y - 19, 6, 4.5);
        ctx.beginPath();
        ctx.moveTo(cx - 1.5, y - 17);
        ctx.lineTo(cx + 1.5, y - 17);
        ctx.stroke();
      } else if (visitor.accessory === "beard") {
        ctx.fillStyle = "#292524";
        ctx.beginPath();
        ctx.arc(cx, y - 11.5, 5.5, 0, Math.PI);
        ctx.fill();
      } else if (visitor.accessory === "ribbon") {
        ctx.fillStyle = "#f472b6";
        ctx.beginPath();
        ctx.arc(cx + 9, y - 24, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isSitting) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx + 10, y - 3, 7, 8);
        ctx.fillStyle = "#d97706";
        ctx.fillRect(cx + 10, y - 1, 7, 3);
      }

      ctx.restore();
    }

    function draw(timestamp) {
      const state = getState();
      const scenicMode = getScenicMode();
      const activeCustomers = getCustomers();
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;

      const targetZoom = scenicMode ? 1.03 : 1.0;
      scenicZoom += (targetZoom - scenicZoom) * 0.06;

      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.scale(scenicZoom, scenicZoom);
      ctx.translate(-w * 0.5, -h * 0.5);

      const hour = Math.floor(state.minuteOfDay / 60);
      let skyTop = "#1e3a8a", skyBot = "#93c5fd";
      if (hour >= 5 && hour < 8) { skyTop = "#312e81"; skyBot = "#fda4af"; }
      else if (hour >= 8 && hour < 17) { skyTop = "#0284c7"; skyBot = "#bae6fd"; }
      else if (hour >= 17 && hour < 20) { skyTop = "#4c1d95"; skyBot = "#fb923c"; }
      else { skyTop = "#090d16"; skyBot = "#1e293b"; }

      if (state.weather === "rain" || state.weather === "cloudy") {
        skyTop = "#1e293b";
        skyBot = "#475569";
      }

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      skyGrad.addColorStop(0, skyTop);
      skyGrad.addColorStop(1, skyBot);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.65);

      const horizonY = h * 0.53;
      ctx.fillStyle = hour >= 19 || hour < 6 ? "#0f172a" : "#334155";
      for (let bx = 0; bx < w; bx += 68) {
        const bh = 55 + ((bx * 17) % 75);
        ctx.fillRect(bx, horizonY - bh, 54, bh + 30);
        if (hour >= 18 || hour < 6) {
          ctx.fillStyle = "#fef08a";
          ctx.fillRect(bx + 12, horizonY - bh + 15, 8, 8);
          ctx.fillRect(bx + 32, horizonY - bh + 32, 8, 8);
          ctx.fillStyle = "#0f172a";
        }
      }

      ctx.fillStyle = state.weather === "snow" ? "#e2e8f0" : "#1e293b";
      ctx.fillRect(0, horizonY, w, h * 0.14);

      const treeColors = ["#f472b6", "#16a34a", "#ea580c", "#cbd5e1"];
      const treeColor = treeColors[state.seasonIdx];
      [0.24, 0.76].forEach(txRatio => {
        const tx = w * txRatio;
        ctx.fillStyle = "#451a03";
        ctx.fillRect(tx - 6, horizonY - 45, 12, 50);
        ctx.beginPath();
        ctx.arc(tx, horizonY - 58, 38, 0, Math.PI * 2);
        ctx.fillStyle = treeColor;
        ctx.fill();
      });

      particles.forEach(p => {
        if (state.weather !== "rain" && state.weather !== "snow") return;

        p.y += p.speedY * (state.weather === "rain" ? 3.2 : 0.75);
        p.x += Math.sin(timestamp * 0.0008 + p.phase) * 0.0006 + p.speedX;
        if (p.y > 0.65) { p.y = 0.02; p.x = Math.random(); }
        if (p.x > 1) p.x = 0;
        if (p.x < 0) p.x = 1;

        const px = p.x * w;
        const py = p.y * h;

        if (state.weather === "rain") {
          ctx.strokeStyle = "rgba(186, 230, 253, 0.5)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - 2.5, py + 12);
          ctx.stroke();
        } else if (state.weather === "snow") {
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.beginPath();
          ctx.arc(px, py, p.size * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const winLeft = w * 0.15;
      const winRight = w * 0.85;
      const winTop = h * 0.14;
      const winBot = h * 0.55;

      ctx.fillStyle = "#241710";
      ctx.fillRect(0, 0, w, winTop);
      ctx.fillRect(0, winTop, winLeft, h - winTop);
      ctx.fillRect(winRight, winTop, w - winRight, h - winTop);

      ctx.fillStyle = "#5c3419";
      ctx.fillRect(winRight + 8, h * 0.21, w - winRight - 16, 6);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(winRight + 16, h * 0.21 - 14, 10, 14);
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.arc(winRight + 40, h * 0.21 - 12, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#3f2212";
      ctx.lineWidth = 10;
      ctx.strokeRect(winLeft, winTop, winRight - winLeft, winBot - winTop);
      ctx.lineWidth = 4;
      [0.38, 0.62].forEach(divRatio => {
        ctx.beginPath();
        ctx.moveTo(w * divRatio, winTop);
        ctx.lineTo(w * divRatio, winBot);
        ctx.stroke();
      });

      [0.27, 0.5, 0.73].forEach(lxRatio => {
        const lx = w * lxRatio;
        ctx.strokeStyle = "#1c1917";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, winTop + 22);
        ctx.stroke();

        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.arc(lx, winTop + 26, 13, Math.PI, 0);
        ctx.fill();

        const bulbGlow = ctx.createRadialGradient(lx, winTop + 30, 2, lx, winTop + 30, 75);
        bulbGlow.addColorStop(0, "rgba(253, 224, 71, 0.48)");
        bulbGlow.addColorStop(1, "rgba(253, 224, 71, 0)");
        ctx.fillStyle = bulbGlow;
        ctx.beginPath();
        ctx.arc(lx, winTop + 30, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(lx, winTop + 28, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 왼쪽 벽면: 우드 2단 감성 선반 (원두 병 & 드리퍼 & 벽걸이 커피 액자)
      const leftPad = Math.max(8, winLeft * 0.14);
      const leftItemW = Math.max(24, winLeft - leftPad * 2);

      // 감성 빈티지 커피 일러스트 액자
      ctx.fillStyle = "#78350f";
      ctx.fillRect(leftPad + leftItemW * 0.15, h * 0.19, leftItemW * 0.7, h * 0.11);
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(leftPad + leftItemW * 0.15 + 3, h * 0.19 + 3, leftItemW * 0.7 - 6, h * 0.11 - 6);
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.arc(leftPad + leftItemW * 0.5, h * 0.245, Math.min(10, leftItemW * 0.16), 0, Math.PI * 2);
      ctx.fill();

      // 우드 2단 선반 & 원두 캐니스터
      [0.37, 0.48].forEach((shelfRatio, sIdx) => {
        const sy = h * shelfRatio;
        ctx.fillStyle = "#5c3419";
        ctx.fillRect(leftPad, sy, leftItemW, 5);
        // 원두 유리병 2개
        ctx.fillStyle = sIdx === 0 ? "#b45309" : "#78350f";
        ctx.beginPath();
        ctx.roundRect(leftPad + 4, sy - 16, Math.min(14, leftItemW * 0.28), 16, 3);
        ctx.fill();
        ctx.fillStyle = "#d6d3d1";
        ctx.fillRect(leftPad + 5, sy - 19, Math.min(12, leftItemW * 0.24), 3);

        // 미니 화분 & 머그컵
        ctx.fillStyle = sIdx === 0 ? "#15803d" : "#ea580c";
        ctx.beginPath();
        ctx.arc(leftPad + leftItemW * 0.68, sy - 9, Math.min(8, leftItemW * 0.18), 0, Math.PI * 2);
        ctx.fill();
      });

      // 오른쪽 벽면: 아늑한 카페 북쉘프(책장) & 플로어 스탠딩 화분
      const rightStart = winRight + Math.max(8, (w - winRight) * 0.14);
      const rightW = Math.max(24, w - rightStart - 8);

      // 원목 벽면 책장 프레임
      ctx.fillStyle = "#3b2110";
      ctx.fillRect(rightStart, h * 0.28, rightW, h * 0.23);
      ctx.strokeStyle = "#6b3e1e";
      ctx.lineWidth = 3;
      ctx.strokeRect(rightStart, h * 0.28, rightW, h * 0.23);

      // 책장 중간 선반 및 알록달록 책들
      const midShelfY = h * 0.39;
      ctx.fillStyle = "#6b3e1e";
      ctx.fillRect(rightStart, midShelfY, rightW, 4);

      const bookColors = ["#d97706", "#0284c7", "#059669", "#dc2626", "#ca8a04"];
      for (let b = 0; b < 4; b++) {
        const bx = rightStart + 5 + b * (rightW * 0.21);
        if (bx + 6 < rightStart + rightW - 4) {
          ctx.fillStyle = bookColors[b % bookColors.length];
          ctx.fillRect(bx, midShelfY - 18, Math.max(4, rightW * 0.15), 18);
        }
      }
      // 책장 하단 칸: 잡지 & 작은 조명 오브제
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(rightStart + rightW * 0.35, h * 0.47, Math.min(7, rightW * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a8a29e";
      ctx.fillRect(rightStart + rightW * 0.6, h * 0.45, Math.max(6, rightW * 0.22), 14);

      // 바닥 스탠딩 세라믹 화분 & 잎사귀
      const potX = rightStart + rightW * 0.5;
      const potY = h * 0.60;
      ctx.fillStyle = "#d6d3d1";
      ctx.beginPath();
      ctx.roundRect(potX - 10, potY - 14, 20, 18, [2, 2, 6, 6]);
      ctx.fill();
      ctx.fillStyle = "#166534";
      ctx.beginPath();
      ctx.ellipse(potX - 6, potY - 22, 6, 11, -0.35, 0, Math.PI * 2);
      ctx.ellipse(potX + 6, potY - 22, 6, 11, 0.35, 0, Math.PI * 2);
      ctx.ellipse(potX, potY - 26, 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1c120c";
      ctx.fillRect(0, winBot, w, h - winBot);

      [0.60, 0.76].forEach(seatRatio => {
        const sx = w * seatRatio;
        const sy = h * 0.615;
        ctx.fillStyle = "#451a03";
        ctx.fillRect(sx - 12, sy + 14, 24, 5);
        ctx.fillRect(sx - 8, sy + 19, 3, 12);
        ctx.fillRect(sx + 5, sy + 19, 3, 12);
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.roundRect(sx + 14, sy + 2, 26, 5, 2);
        ctx.fill();
        ctx.fillRect(sx + 25, sy + 7, 4, 24);
      });

      activeCustomers.forEach(c => {
        const cx = c.x * w;
        const cy = h * 0.615;
        const isWalking = c.state === "entering" || c.state === "leaving" || (c.state === "sitting" && Math.abs(c.targetX - c.x) > 0.01);
        const isSitting = c.state === "sitting" && !isWalking;

        drawIllustratedCharacter(ctx, cx, cy, c.visitor, isWalking, isSitting, c.timer);

        ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
        ctx.textAlign = "center";
        const textW = ctx.measureText(c.bubbleText).width + 16;
        ctx.fillStyle = "rgba(28, 25, 23, 0.92)";
        ctx.beginPath();
        ctx.roundRect(cx - textW / 2, cy - 62, textW, 22, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#fef3c7";
        ctx.fillText(c.bubbleText, cx, cy - 47);
      });

      const barY = h * 0.655;
      ctx.fillStyle = "#92400e";
      ctx.fillRect(0, barY - 6, w, 9);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(0, barY - 6, w, 3);

      const barGrad = ctx.createLinearGradient(0, barY + 3, 0, h * 0.84);
      barGrad.addColorStop(0, "#5c3216");
      barGrad.addColorStop(1, "#261308");
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, barY + 3, w, h * 0.20);

      ctx.strokeStyle = "rgba(24, 12, 5, 0.55)";
      ctx.lineWidth = 2;
      for (let lx = 14; lx < w; lx += 18) {
        ctx.beginPath();
        ctx.moveTo(lx, barY + 5);
        ctx.lineTo(lx, h * 0.83);
        ctx.stroke();
      }

      const posX = w * 0.16;
      ctx.fillStyle = "#334155";
      ctx.fillRect(posX + 10, barY - 14, 8, 8);
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(posX, barY - 30, 28, 18, 3);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(posX + 3, barY - 27, 22, 12);

      const machX = w * 0.36;
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(machX - 24, barY - 24, 16, 18);
      ctx.fillStyle = "rgba(120, 53, 15, 0.85)";
      ctx.beginPath();
      ctx.moveTo(machX - 23, barY - 34);
      ctx.lineTo(machX - 9, barY - 34);
      ctx.lineTo(machX - 13, barY - 24);
      ctx.lineTo(machX - 19, barY - 24);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#e7e5e4";
      ctx.beginPath();
      ctx.roundRect(machX, barY - 32, 54, 26, [6, 6, 0, 0]);
      ctx.fill();
      ctx.fillStyle = "#292524";
      ctx.fillRect(machX + 7, barY - 20, 40, 14);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(machX + 22, barY - 12, 8, 6);

      const steamOffset = Math.sin(timestamp * 0.004) * 3.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(machX + 26, barY - 36);
      ctx.quadraticCurveTo(machX + 26 + steamOffset, barY - 48, machX + 24, barY - 60);
      ctx.stroke();

      const caseX = w * 0.62;
      ctx.fillStyle = "rgba(186, 230, 253, 0.22)";
      ctx.strokeStyle = "#d6d3d1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(caseX, barY - 28, 56, 22, [6, 6, 0, 0]);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fda4af";
      ctx.beginPath();
      ctx.arc(caseX + 16, barY - 11, 5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.fillRect(caseX + 32, barY - 16, 12, 8);

      ctx.restore();
    }


  return { draw };
}
