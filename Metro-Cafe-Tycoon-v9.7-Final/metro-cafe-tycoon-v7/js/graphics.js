// Cafe scene rendering only. Game state is supplied by game.js through getters.
import { getFurnitureById } from "./furniture.js";
import { drawLocationWindowScenery } from "./scenery.js";

export function createCafeRenderer({ canvas, getState, getScenicMode, getCustomers }) {
  const ctx = canvas.getContext("2d");
  let scenicZoom = 1.0;

  // ==================== 픽셀 아트 스프라이트 에셋 로더 (하이브리드 그래픽) ====================
  const SPRITE_FILES = {
    espresso_counter: "assets/sprites/espresso_counter.png",
    barista: "assets/sprites/barista.png",
    table_wood: "assets/sprites/table_wood.png",
    table_marble: "assets/sprites/table_marble.png",
    table_lounge: "assets/sprites/table_lounge.png",
    chair_left: "assets/sprites/chair_left.png",
    chair_right: "assets/sprites/chair_right.png",
    decor_plant: "assets/sprites/decor_plant.png",
    decor_lamp: "assets/sprites/decor_lamp.png",
    cust_0: "assets/sprites/cust_0.png",
    cust_1: "assets/sprites/cust_1.png",
    cust_2: "assets/sprites/cust_2.png",
    cust_3: "assets/sprites/cust_3.png"
  };

  const sprites = {};
  Object.entries(SPRITE_FILES).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    sprites[key] = img;
  });

  function isSpriteReady(key) {
    const img = sprites[key];
    return Boolean(img && img.complete && img.naturalWidth > 0);
  }

  function drawSpriteCentered(ctx, key, cx, cy, targetWidth, bobY = 0) {
    if (!isSpriteReady(key)) return false;
    const img = sprites[key];
    const ratio = img.naturalHeight / img.naturalWidth;
    const drawW = targetWidth;
    const drawH = targetWidth * ratio;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(cx - drawW * 0.5), Math.round(cy - drawH * 0.72 + bobY), Math.round(drawW), Math.round(drawH));
    ctx.restore();
    return true;
  }

  function resolveTableSpriteKey(styleId) {
    if (!styleId) return "table_wood";
    const id = String(styleId).toLowerCase();
    if (id.includes("marble") || id.includes("gold") || id.includes("royal") || id.includes("velvet") || id.includes("luxury")) {
      return "table_marble";
    }
    if (id.includes("sofa") || id.includes("lounge") || id.includes("booth") || id.includes("cozy") || id.includes("bar")) {
      return "table_lounge";
    }
    return "table_wood";
  }

  function drawHybridBarCounter(ctx, w, h, winBot, sec) {
    const cx = w * 0.50;
    const cy = winBot + Math.max(24, h * 0.048);
    const barW = Math.min(290, Math.max(185, w * 0.31));
    const baristaBob = Math.sin(sec * 2.4) * 1.5;

    // 바리스타 스프라이트 (카운터 뒤쪽)
    drawSpriteCentered(ctx, "barista", cx - barW * 0.22, cy - 8, Math.min(58, barW * 0.23), baristaBob);

    // 카운터 바닥 그림자
    ctx.save();
    ctx.fillStyle = "rgba(10, 5, 2, 0.42)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, barW * 0.52, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 에스프레소 & 베이커리 쇼케이스 카운터 스프라이트
    drawSpriteCentered(ctx, "espresso_counter", cx, cy + 12, barW, 0);

    // 에스프레소 머신에서 피어오르는 은은한 스팀 김
    ctx.save();
    for (let s = 0; s < 3; s++) {
      const st = ((sec * 0.7 + s * 0.33) % 1);
      const sx = cx - barW * 0.23 + Math.sin(sec * 2 + s) * 3;
      const sy = cy - 32 - st * 16;
      ctx.fillStyle = `rgba(255, 251, 235, ${(0.35 * (1 - st)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.4 + st * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }


  // 날씨 입자 (비/눈)
  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.65,
    size: Math.random() * 3.5 + 2,
    speedY: Math.random() * 0.0022 + 0.0012,
    speedX: (Math.random() - 0.5) * 0.0005,
    phase: Math.random() * Math.PI * 2
  }));

  // 계절별 창밖 부유 입자 (봄 벚꽃잎, 여름 반짝이/나뭇잎, 가을 낙엽)
  const seasonalParticles = Array.from({ length: 24 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.56,
    size: Math.random() * 4 + 3,
    speedY: Math.random() * 0.0007 + 0.0004,
    speedX: Math.random() * 0.0008 + 0.0003,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.04,
    phase: Math.random() * Math.PI * 2
  }));

  // 떠다니는 먼지/조명 빛방울
  const warmDust = Array.from({ length: 28 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.78,
    r: Math.random() * 1.8 + 0.7,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.0004 + 0.00015
  }));

  // 구름 객체
  const clouds = Array.from({ length: 4 }, (_, i) => ({
    x: i * 0.28 + 0.08,
    y: 0.16 + (i % 2) * 0.06,
    scale: 0.85 + (i % 3) * 0.25,
    speed: 0.000012 + (i % 2) * 0.000006
  }));

  function drawCloud(ctx, cx, cy, scale, isDark) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.arc(20, -4, 26, 0, Math.PI * 2);
    ctx.arc(44, 0, 20, 0, Math.PI * 2);
    ctx.arc(22, 8, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawIllustratedCharacter(ctx, cx, cy, customer, phase) {
    const visitor = customer.visitor;
    const isWalking = customer.state === "entering" || customer.state === "leaving";
    const isSitting = customer.state === "sitting" || customer.state === "ordering";
    const isSipping = Boolean(customer.isSipping && customer.state === "sitting");
    const facingDir = customer.state === "leaving" ? -1 : 1;

    const walkCycle = phase * 9.5;
    const bobY = isWalking
      ? Math.abs(Math.sin(walkCycle)) * 4.5
      : (isSitting ? 6 + Math.sin(phase * 2.2) * 0.8 : Math.sin(phase * 2.8) * 1.4);

    // 손님 고유 외형 데이터 기반 렌더링 (20종: 일반 시민 12종 + VIP 단골 8종 각각의 헤어·의상·액세서리 완벽 반영)
    const hairStyle = visitor?.hairStyle || "short";
    const hairColor = visitor?.hairColor || "#1c1917";
    const skinColor = visitor?.skinColor || "#fed7aa";
    const topColor = visitor?.topColor || "#2563eb";
    const accessory = visitor?.accessory || "none";
    const isVip = Boolean(visitor && !visitor.isGeneral);
    const y = cy - bobY;
    const headTilt = isSipping ? -0.14 : (isWalking ? Math.sin(walkCycle) * 0.04 : Math.sin(phase * 1.8) * 0.025);

    ctx.save();

    // 1. 부드러운 바닥 접지 그림자
    const shadowGrad = ctx.createRadialGradient(cx, cy + 28, 2, cx, cy + 28, isSitting ? 22 : 18);
    shadowGrad.addColorStop(0, "rgba(18, 9, 4, 0.48)");
    shadowGrad.addColorStop(1, "rgba(18, 9, 4, 0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 28, isSitting ? 22 : 18, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 다리 & 신발
    ctx.lineCap = "round";
    if (isSitting) {
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 4, y + 12);
      ctx.lineTo(cx + 5, y + 17);
      ctx.lineTo(cx + 4, y + 26);
      ctx.moveTo(cx + 4, y + 12);
      ctx.lineTo(cx + 12, y + 17);
      ctx.lineTo(cx + 11, y + 26);
      ctx.stroke();

      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(cx + 6, y + 27, 5, 2.7, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 13, y + 27, 5, 2.7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const stride = isWalking ? Math.sin(walkCycle) * 7.5 : 0;
      const liftL = isWalking ? Math.max(0, -Math.sin(walkCycle)) * 3 : 0;
      const liftR = isWalking ? Math.max(0, Math.sin(walkCycle)) * 3 : 0;

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 4, y + 11);
      ctx.lineTo(cx - 4 - stride, y + 26 - liftL);
      ctx.moveTo(cx + 4, y + 11);
      ctx.lineTo(cx + 4 + stride, y + 26 - liftR);
      ctx.stroke();

      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(cx - 4 - stride + facingDir * 1.5, y + 27 - liftL, 5, 2.6, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 4 + stride + facingDir * 1.5, y + 27 - liftR, 5, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 뒷머리
    ctx.fillStyle = hairColor;
    if (hairStyle === "long") {
      ctx.beginPath();
      ctx.roundRect(cx - 15.5, y - 24, 31, 31, 14);
      ctx.fill();
    } else if (hairStyle === "bob") {
      ctx.beginPath();
      ctx.roundRect(cx - 15.5, y - 24, 31, 22, 12);
      ctx.fill();
    }

    // 4. 뒤쪽 팔
    if (isWalking) {
      const armSwing = Math.sin(walkCycle) * 6;
      ctx.strokeStyle = skinColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(cx - 11, y - 2);
      ctx.lineTo(cx - 13 + armSwing, y + 10);
      ctx.stroke();
    }

    // 5. 상의
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.roundRect(cx - 13.5, y - 5, 27, 21, [10, 10, 5, 5]);
    ctx.fill();

    ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
    ctx.beginPath();
    ctx.roundRect(cx - 13.5, y + 8, 27, 8, [0, 0, 5, 5]);
    ctx.fill();

    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.moveTo(cx - 4.5, y - 5);
    ctx.lineTo(cx, y - 1);
    ctx.lineTo(cx + 4.5, y - 5);
    ctx.closePath();
    ctx.fill();

    // 직업·유형별 의상 포인트 (넥타이 / 후드끈 / 크로스백 스트랩)
    if ((visitor?.name || "").includes("직장인") || (visitor?.name || "").includes("비즈니스맨")) {
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(cx - 1.5, y - 1);
      ctx.lineTo(cx + 1.5, y - 1);
      ctx.lineTo(cx + 2.2, y + 7);
      ctx.lineTo(cx, y + 9.5);
      ctx.lineTo(cx - 2.2, y + 7);
      ctx.closePath();
      ctx.fill();
    } else if (hairStyle === "long" || accessory === "ribbon" || accessory === "beret") {
      // 크로스백 가방끈
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 9, y - 4);
      ctx.lineTo(cx + 9, y + 12);
      ctx.stroke();
    }

    if (accessory === "apron") {
      ctx.fillStyle = "#44403c";
      ctx.beginPath();
      ctx.roundRect(cx - 9, y - 2, 18, 17.5, 2);
      ctx.fill();
      ctx.strokeStyle = "#78716c";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 6.5, y + 4.5, 13, 6.5);
    }

    // 6. 머리
    ctx.save();
    ctx.translate(cx, y - 16);
    ctx.rotate(headTilt);

    ctx.fillStyle = visitor.skinColor;
    ctx.fillRect(-3.4, 6, 6.8, 6);
    ctx.beginPath();
    ctx.arc(0, -1, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(180, 83, 9, 0.08)";
    ctx.beginPath();
    ctx.arc(0, 0.5, 12.2, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();

    ctx.fillStyle = isSipping ? "rgba(244, 114, 182, 0.52)" : "rgba(244, 114, 182, 0.36)";
    ctx.beginPath();
    ctx.ellipse(-7.2, 1.3, 2.9, 1.9, 0, 0, Math.PI * 2);
    ctx.ellipse(7.2, 1.3, 2.9, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isSipping || customer.mood === "love") {
      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-4.5, -1, 2.3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4.5, -1, 2.3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(-4.5, -1.5, 1.7, 0, Math.PI * 2);
      ctx.arc(4.5, -1.5, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-5.0, -2.1, 0.6, 0, Math.PI * 2);
      ctx.arc(4.0, -2.1, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.6;
    if (isSipping) {
      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.arc(0, 2.3, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (customer.state === "ordering") {
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(0, 2.1, 2.3, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 1.6, 3.1, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(0, -3.8, 13.2, Math.PI, Math.PI * 2);
    ctx.fill();

    // 앞머리 스타일별 디테일 차별화 (short / messy / bob / long / silver)
    if (hairStyle === "messy") {
      ctx.beginPath();
      ctx.arc(-5.2, -10.5, 5.5, 0, Math.PI * 2);
      ctx.arc(3.8, -11.5, 6.0, 0, Math.PI * 2);
      ctx.arc(9.2, -8.5, 4.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (hairStyle === "bob") {
      // 단발 사이드 뱅 & 안쪽으로 말린 끝선
      ctx.beginPath();
      ctx.roundRect(-14.2, -6.5, 4.5, 13, 2.5);
      ctx.roundRect(9.7, -6.5, 4.5, 13, 2.5);
      ctx.fill();
    } else if (hairStyle === "long") {
      // 긴 생머리 사이드 스트랜드
      ctx.beginPath();
      ctx.roundRect(-14.5, -6.0, 4.4, 21, 2.5);
      ctx.roundRect(10.1, -6.0, 4.4, 21, 2.5);
      ctx.fill();
    } else if (hairStyle === "silver") {
      // 은발 가르마 하이라이트
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-2, -6.5, 8.5, Math.PI * 1.15, Math.PI * 1.75);
      ctx.stroke();
    }

    // VIP 단골 캐릭터 머리 위 은은한 골드 왕관/별 배지
    if (isVip) {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, -19.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (accessory === "beret") {
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.ellipse(2, -13, 13, 5, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#991b1b";
      ctx.beginPath();
      ctx.arc(3, -17, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (accessory === "glasses") {
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8.2, -4.2, 6.6, 4.8);
      ctx.strokeRect(1.6, -4.2, 6.6, 4.8);
      ctx.beginPath();
      ctx.moveTo(-1.6, -2.1);
      ctx.lineTo(1.6, -2.1);
      ctx.stroke();
    } else if (accessory === "beard") {
      ctx.fillStyle = "#292524";
      ctx.beginPath();
      ctx.arc(0, 3.8, 6.0, 0, Math.PI);
      ctx.fill();
    } else if (accessory === "ribbon") {
      ctx.fillStyle = "#f472b6";
      ctx.beginPath();
      ctx.arc(10, -9.5, 3.4, 0, Math.PI * 2);
      ctx.arc(13, -8, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 7. 앞쪽 팔 & 커피잔
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 4.6;
    if (isWalking) {
      const armSwing = -Math.sin(walkCycle) * 6;
      ctx.beginPath();
      ctx.moveTo(cx + 11, y - 2);
      ctx.lineTo(cx + 13 + armSwing, y + 10);
      ctx.stroke();
    } else if (customer.state === "ordering") {
      const wave = Math.sin(phase * 8) * 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + 11, y - 2);
      ctx.lineTo(cx + 17, y - 11 + wave);
      ctx.stroke();
    } else if (customer.state === "sitting") {
      const cupX = isSipping ? cx + 7 : cx + 17;
      const cupY = isSipping ? y - 10 : y - 1;

      ctx.beginPath();
      ctx.moveTo(cx + 10, y - 1);
      ctx.lineTo(cupX - 1, cupY + 4);
      ctx.stroke();

      ctx.fillStyle = "#fffbeb";
      ctx.beginPath();
      ctx.roundRect(cupX - 4, cupY - 4.5, 8, 9, 1.8);
      ctx.fill();
      ctx.fillStyle = "#b45309";
      ctx.fillRect(cupX - 4, cupY - 1.5, 8, 3.8);
      ctx.fillStyle = "#292524";
      ctx.fillRect(cupX - 4.5, cupY - 5.8, 9, 1.8);

      const cupSteam = Math.sin(phase * 5) * 1.8;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(cupX, cupY - 8);
      ctx.quadraticCurveTo(cupX + cupSteam, cupY - 13, cupX - 1, cupY - 18);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawIsoFace(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fill();
  }

  function drawIsoBox(ctx, cx, topY, width, depth, height, topColor, leftColor, rightColor) {
    const north = [cx, topY];
    const east = [cx + width / 2, topY + depth / 2];
    const south = [cx, topY + depth];
    const west = [cx - width / 2, topY + depth / 2];
    const lower = point => [point[0], point[1] + height];
    drawIsoFace(ctx, [west, south, lower(south), lower(west)], leftColor);
    drawIsoFace(ctx, [south, east, lower(east), lower(south)], rightColor);
    drawIsoFace(ctx, [north, east, south, west], topColor);
    return { north, east, south, west };
  }

  function drawIsometricTable(ctx, sx, sy, item, idx, sec, style) {
    const pal = item.palette || {};
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(sx + 5, sy + 38, 42, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (style === "iso_corner_booth") {
      drawIsoBox(ctx, sx - 24, sy - 9, 42, 22, 10, pal.seat || "#9a5a45", pal.seatSide || "#64372f", pal.seatFront || "#7b4338");
      drawIsoBox(ctx, sx - 24, sy - 25, 42, 13, 16, pal.back || "#b96e55", pal.backSide || "#713d33", pal.backFront || "#8f4e3e");
      ctx.fillStyle = pal.leg || "#33251e";
      ctx.fillRect(sx - 39, sy + 1, 3, 15);
      ctx.fillRect(sx - 10, sy + 1, 3, 15);
      [-17, 18].forEach(offset => {
        ctx.fillRect(sx + offset, sy + 8, 3.5, 28);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(sx + offset, sy + 8, 1, 26);
        ctx.fillStyle = pal.leg || "#33251e";
      });
      drawIsoBox(ctx, sx + 8, sy - 3, 58, 29, 6, pal.top || "#d6a86a", pal.left || "#80502e", pal.right || "#a36a3d");
      ctx.strokeStyle = "rgba(255,255,255,0.36)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy + 11);
      ctx.lineTo(sx + 8, sy + 21);
      ctx.lineTo(sx + 30, sy + 10);
      ctx.stroke();
      ctx.fillStyle = pal.accent || "#f3d9b8";
      ctx.beginPath();
      ctx.ellipse(sx + 8, sy + 12, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.prop || "#7c4a34";
      ctx.beginPath();
      ctx.arc(sx + 8, sy + 10, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.gold || "#d4a84e";
      ctx.beginPath();
      ctx.arc(sx + 20, sy + 5 + Math.sin(sec * 1.5 + idx) * 0.6, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = pal.base || "#5b4334";
      ctx.beginPath();
      ctx.ellipse(sx + 2, sy + 34, 13, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.column || "#a47945";
      ctx.beginPath();
      ctx.moveTo(sx - 4, sy + 31);
      ctx.lineTo(sx - 3, sy + 6);
      ctx.lineTo(sx + 4, sy + 6);
      ctx.lineTo(sx + 6, sy + 31);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(sx - 2, sy + 9, 2, 20);
      drawIsoBox(ctx, sx + 1, sy - 3, 56, 30, 7, pal.top || "#6e4733", pal.left || "#39241e", pal.right || "#513329");
      ctx.fillStyle = pal.seat || "#315b4a";
      ctx.beginPath();
      ctx.ellipse(sx - 31, sy + 23, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(sx - 34, sy + 24, 2.5, 10);
      ctx.fillRect(sx - 29, sy + 24, 2.5, 10);
      ctx.fillStyle = pal.accent || "#e9d8b8";
      ctx.beginPath();
      ctx.ellipse(sx + 4, sy + 10, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.prop || "#e0a45f";
      ctx.beginPath();
      ctx.arc(sx + 4, sy + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==================== 가구 데이터 기반 테이블 세트 렌더링 ====================
  function drawTableSet(ctx, sx, sy, styleId, idx, sec) {
    const item = getFurnitureById(styleId);
    const rStyle = item?.renderStyle || "wood_2";
    const pal = item?.palette || { primary: "#92400e", secondary: "#b45309", accent: "#fef3c7", leg: "#291509", prop: "napkin" };

    const tblSpriteKey = resolveTableSpriteKey(rStyle + "_" + styleId);
    if (isSpriteReady(tblSpriteKey) && isSpriteReady("chair_left") && isSpriteReady("chair_right")) {
      const tx = sx + 22;
      ctx.save();
      ctx.fillStyle = "rgba(10, 5, 2, 0.36)";
      ctx.beginPath();
      ctx.ellipse(tx, sy + 35, 34, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSpriteCentered(ctx, "chair_left", tx - 28, sy + 33, 34, 0);
      drawSpriteCentered(ctx, "chair_right", tx + 28, sy + 33, 34, 0);
      drawSpriteCentered(ctx, tblSpriteKey, tx, sy + 34, tblSpriteKey === "table_lounge" ? 84 : 68, 0);
      ctx.restore();
      return;
    }

    if (rStyle === "iso_corner_booth" || rStyle === "iso_pedestal") {
      drawIsometricTable(ctx, sx, sy, item, idx, sec, rStyle);
      return;
    }

    ctx.save();

    if (rStyle === "marble_round") {
      // 라운드 테이블 + 골드/모던 체어 (비앙코 마블, 테라조, 파리 비스트로, 블랙 오닉스 등)
      ctx.fillStyle = pal.leg;
      ctx.beginPath();
      ctx.roundRect(sx - 16, sy + 2, 6, 19, 3);
      ctx.fill();
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(sx - 15, sy + 15, 28, 7, 3);
      ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(sx - 11, sy + 22, 3.5, 16);
      ctx.fillRect(sx + 7, sy + 22, 3.5, 16);

      const tx = sx + 34;
      ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
      ctx.beginPath();
      ctx.ellipse(tx, sy + 37, 20, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.accent;
      ctx.fillRect(tx - 2.5, sy + 6, 5, 31);
      ctx.beginPath();
      ctx.ellipse(tx, sy + 36, 13, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(tx - 22, sy, 44, 7, 3.5);
      ctx.fill();
      ctx.strokeStyle = pal.secondary;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(tx - 15, sy + 2);
      ctx.lineTo(tx + 10, sy + 5);
      ctx.stroke();

      // 트레이 & 포인트 소품
      ctx.fillStyle = pal.accent;
      ctx.fillRect(tx + 4, sy - 4, 8, 4);
      ctx.fillStyle = pal.prop === "macaron" ? "#f472b6" : pal.prop === "croissant" ? "#d97706" : pal.prop === "gold_tier" ? "#fde047" : "#fb7185";
      ctx.beginPath();
      ctx.arc(tx + 8, sy - 7, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (rStyle === "velvet_lounge") {
      // 라운지 소파 + 로우 테이블 (카멜 벨벳, 세이지 부클레, 구름 모듈 등)
      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      ctx.beginPath();
      ctx.ellipse(sx + 10, sy + 38, 34, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(sx - 22, sy + 2, 36, 24, [8, 8, 3, 3]);
      ctx.fill();
      ctx.fillStyle = pal.secondary;
      ctx.beginPath();
      ctx.roundRect(sx - 20, sy + 14, 34, 12, 4);
      ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.roundRect(sx - 17, sy + 6, 11, 10, 3);
      ctx.fill();
      ctx.fillStyle = pal.leg;
      ctx.fillRect(sx - 18, sy + 26, 4, 11);
      ctx.fillRect(sx + 8, sy + 26, 4, 11);

      const tx = sx + 36;
      ctx.fillStyle = pal.leg;
      ctx.beginPath();
      ctx.roundRect(tx - 19, sy + 11, 38, 6.5, 3);
      ctx.fill();
      ctx.fillRect(tx - 14, sy + 17.5, 3.5, 19);
      ctx.fillRect(tx + 10.5, sy + 17.5, 3.5, 19);

      ctx.fillStyle = "#fffbeb";
      ctx.beginPath();
      ctx.ellipse(tx, sy + 10, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.prop === "matcha_cake" ? "#22c55e" : pal.prop === "berry_cake" ? "#fb7185" : "#f59e0b";
      ctx.beginPath();
      ctx.arc(tx, sy + 7.5, 4, Math.PI, 0);
      ctx.fill();
    } else if (rStyle === "window_bar") {
      // 하이 바 테이블 & 스툴 (창가 캔들, 을지로 인더스트리얼, 홍대 네온 등)
      ctx.fillStyle = pal.leg;
      ctx.fillRect(sx - 10, sy + 16, 3.5, 22);
      ctx.fillRect(sx + 6.5, sy + 16, 3.5, 22);
      ctx.fillStyle = pal.secondary;
      ctx.beginPath();
      ctx.roundRect(sx - 13, sy + 11, 26, 6, 3);
      ctx.fill();

      const tx = sx + 32;
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(tx, sy + 37, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.leg;
      ctx.fillRect(tx - 18, sy + 2, 3.5, 35);
      ctx.fillRect(tx + 14.5, sy + 2, 3.5, 35);
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(tx - 24, sy - 4, 48, 7, 3);
      ctx.fill();
      ctx.fillStyle = pal.secondary;
      ctx.fillRect(tx - 22, sy - 4, 44, 2);

      const flicker = 0.7 + 0.3 * Math.sin(sec * 7 + idx);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(tx + 8, sy - 10, 5, 6);
      ctx.fillStyle = pal.prop === "neon_sign" ? `rgba(244, 114, 182, ${flicker})` : `rgba(251, 191, 36, ${flicker})`;
      ctx.beginPath();
      ctx.arc(tx + 10.5, sy - 12, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (rStyle === "oak_4") {
      // 패밀리 4인 롱테이블 (화이트오크, 블랙월넛 라이브러리, 익선동 소반 등)
      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      ctx.beginPath();
      ctx.ellipse(sx + 18, sy + 38, 36, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.secondary;
      ctx.fillRect(sx - 18, sy + 4, 5, 32);
      ctx.fillRect(sx - 18, sy + 16, 16, 5);
      ctx.fillRect(sx + 50, sy + 4, 5, 32);
      ctx.fillRect(sx + 38, sy + 16, 16, 5);

      const tx = sx + 18;
      ctx.fillStyle = pal.leg;
      ctx.fillRect(tx - 24, sy + 8, 4.5, 29);
      ctx.fillRect(tx + 19.5, sy + 8, 4.5, 29);
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(tx - 30, sy + 1, 60, 7.5, 3);
      ctx.fill();
      ctx.fillStyle = pal.secondary;
      ctx.fillRect(tx - 28, sy + 1, 56, 2.5);

      ctx.fillStyle = pal.accent;
      ctx.fillRect(tx - 15, sy - 6, 12, 7);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(tx - 17, sy, 16, 1.8);
      ctx.fillStyle = pal.leg;
      ctx.beginPath();
      ctx.arc(tx + 12, sy - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (rStyle === "booth_leather") {
      // 퀼팅 부스석 (레트로 브라운, 에메랄드 호텔, 체스터필드 등)
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 38, 36, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(sx - 23, sy - 4, 34, 30, [8, 8, 2, 2]);
      ctx.fill();
      ctx.fillStyle = pal.secondary;
      ctx.beginPath();
      ctx.roundRect(sx - 21, sy + 12, 32, 14, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1.2;
      [-13, -5, 3].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(sx + ox, sy - 1);
        ctx.lineTo(sx + ox, sy + 11);
        ctx.stroke();
      });

      const tx = sx + 34;
      ctx.fillStyle = pal.leg;
      ctx.fillRect(tx - 2.5, sy + 5, 5, 31);
      ctx.beginPath();
      ctx.ellipse(tx, sy + 35, 13, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.roundRect(tx - 21, sy, 42, 6.5, 3);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(tx - 20, sy + 0.5, 40, 5.5);

      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.arc(tx + 7, sy - 6, 5.5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(tx + 6, sy - 6, 2, 6);
    } else {
      // 기본 / 자작나무 2인 테이블 세트 (wood_2)
      ctx.fillStyle = pal.secondary;
      ctx.beginPath();
      ctx.roundRect(sx - 16, sy + 2, 6, 19, 2.5);
      ctx.fill();
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(sx - 15, sy + 15, 28, 6.5, 2.5);
      ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(sx - 12, sy + 13.5, 22, 2.8);
      ctx.fillStyle = pal.leg;
      ctx.fillRect(sx - 11, sy + 21.5, 3.5, 16);
      ctx.fillRect(sx + 7, sy + 21.5, 3.5, 16);

      const tx = sx + 32;
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(tx, sy + 37, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.leg;
      ctx.fillRect(tx - 2.5, sy + 6, 5, 31);
      ctx.fillRect(tx - 12, sy + 34.5, 24, 3.5);
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.roundRect(tx - 19, sy, 38, 6.5, 3);
      ctx.fill();
      ctx.fillStyle = pal.secondary;
      ctx.fillRect(tx - 18, sy, 36, 2);

      ctx.fillStyle = pal.accent;
      ctx.fillRect(tx + 5, sy - 5.5, 6, 5.5);
      if (idx % 2 === 1 || pal.prop === "flower_yellow") {
        ctx.fillStyle = pal.prop === "flower_yellow" ? "#facc15" : "#f472b6";
        ctx.beginPath();
        ctx.arc(tx + 8, sy - 8, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ==================== 가구 데이터 기반 소품/조명 렌더링 ====================
  function drawDecorItem(ctx, dx, dy, decorId, sec) {
    if (!decorId) return;
    const item = getFurnitureById(decorId);
    const rStyle = item?.renderStyle || decorId;
    const pal = item?.palette || {};

    if (String(rStyle).startsWith("plant") && isSpriteReady("decor_plant")) {
      ctx.save();
      ctx.fillStyle = "rgba(12, 6, 2, 0.38)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 35, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSpriteCentered(ctx, "decor_plant", dx, dy + 34, 52, 0);
      ctx.restore();
      return;
    }
    if (String(rStyle).startsWith("lamp") && isSpriteReady("decor_lamp")) {
      ctx.save();
      const glow = ctx.createRadialGradient(dx, dy - 16, 4, dx, dy - 16, 56);
      glow.addColorStop(0, pal.glow || "rgba(254, 240, 138, 0.45)");
      glow.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dx, dy - 16, 56, 0, Math.PI * 2);
      ctx.fill();
      drawSpriteCentered(ctx, "decor_lamp", dx, dy + 34, 46, 0);
      ctx.restore();
      return;
    }

    ctx.save();

    if (rStyle === "plant_monstera") {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 36, 16, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.pot || "#f5f5f4";
      ctx.beginPath();
      ctx.roundRect(dx - 12, dy + 12, 24, 23, [3, 3, 8, 8]);
      ctx.fill();
      ctx.fillStyle = pal.leaf1 || "#15803d";
      ctx.beginPath();
      ctx.ellipse(dx - 9, dy + 2, 8, 14, -0.4, 0, Math.PI * 2);
      ctx.ellipse(dx + 9, dy + 2, 8, 14, 0.4, 0, Math.PI * 2);
      ctx.ellipse(dx, dy - 4, 7, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (rStyle === "lamp_arch" || rStyle === "lamp_floor_arch") {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 36, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 35, 11, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.stem || "#d97706";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dx, dy + 34);
      ctx.quadraticCurveTo(dx - 4, dy - 22, dx + 14, dy - 26);
      ctx.stroke();

      const glow = ctx.createRadialGradient(dx + 14, dy - 20, 2, dx + 14, dy - 20, 48);
      glow.addColorStop(0, pal.glow || "rgba(254, 240, 138, 0.55)");
      glow.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dx + 14, dy - 20, 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.shade || "#fef3c7";
      ctx.beginPath();
      ctx.arc(dx + 14, dy - 24, 8, Math.PI, 0);
      ctx.fill();
    } else if (rStyle === "shelf_vinyl" || rStyle === "shelf_vinyl_book") {
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(dx - 20, dy + 34, 40, 4);
      ctx.fillStyle = pal.wood || "#451a03";
      ctx.beginPath();
      ctx.roundRect(dx - 18, dy - 8, 36, 43, 3);
      ctx.fill();
      ctx.strokeStyle = pal.trim || "#92400e";
      ctx.lineWidth = 2;
      ctx.strokeRect(dx - 18, dy - 8, 36, 43);
      ctx.fillRect(dx - 16, dy + 12, 32, 3);
      ctx.fillStyle = pal.deck || "#d6d3d1";
      ctx.fillRect(dx - 12, dy - 14, 24, 6);
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.ellipse(dx, dy - 14, 9, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      const colors = ["#f59e0b", "#38bdf8", "#fb7185", "#34d399"];
      colors.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(dx - 13 + i * 6.5, dy + 17, 4.5, 15);
      });
    } else if (rStyle === "coffee_cart" || rStyle === "coffee_station_cart") {
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 37, 24, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.wood || "#78350f";
      ctx.beginPath();
      ctx.roundRect(dx - 20, dy + 4, 40, 26, 3);
      ctx.fill();
      ctx.fillStyle = pal.top || "#b45309";
      ctx.fillRect(dx - 22, dy + 2, 44, 4);
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(dx - 14, dy + 33, 4, 0, Math.PI * 2);
      ctx.arc(dx + 14, dy + 33, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(224, 242, 254, 0.7)";
      ctx.beginPath();
      ctx.roundRect(dx - 14, dy - 9, 11, 11, 2);
      ctx.fill();
      ctx.fillStyle = pal.accent || "#451a03";
      ctx.fillRect(dx - 13, dy - 4, 9, 5);
      ctx.fillStyle = "#fda4af";
      ctx.beginPath();
      ctx.arc(dx + 9, dy - 3, 6.5, Math.PI, 0);
      ctx.fill();
    } else if (rStyle === "dessert_showcase" || rStyle === "dessert_showcase_mini") {
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 37, 25, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.wood || "#5c3216";
      ctx.beginPath();
      ctx.roundRect(dx - 21, dy + 10, 42, 26, 3);
      ctx.fill();
      ctx.fillStyle = pal.glass || "rgba(224, 242, 254, 0.35)";
      ctx.strokeStyle = "#bae6fd";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(dx - 19, dy - 10, 38, 20, [5, 5, 0, 0]);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(dx - 17, dy, 34, 2);
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.ellipse(dx - 8, dy - 3, 5.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff1f2";
      ctx.fillRect(dx + 3, dy - 6, 10, 6);
      ctx.fillStyle = pal.cake || "#f43f5e";
      ctx.beginPath();
      ctx.arc(dx + 8, dy - 7, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (rStyle === "olive_tree" || rStyle === "olive_tree_pot") {
      ctx.fillStyle = "rgba(0,0,0,0.36)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 37, 17, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.pot || "#d6d3d1";
      ctx.beginPath();
      ctx.roundRect(dx - 12, dy + 13, 24, 23, [3, 3, 9, 9]);
      ctx.fill();
      ctx.strokeStyle = "#5c3216";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(dx, dy + 14);
      ctx.quadraticCurveTo(dx - 3, dy - 4, dx + 2, dy - 18);
      ctx.stroke();
      const sway = Math.sin(sec * 1.4 + dx) * 1.5;
      ctx.fillStyle = pal.leaf1 || "#65a30d";
      ctx.beginPath();
      ctx.arc(dx - 8 + sway, dy - 12, 9, 0, Math.PI * 2);
      ctx.arc(dx + 9 + sway, dy - 10, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.leaf2 || "#a3e635";
      ctx.beginPath();
      ctx.arc(dx + sway, dy - 20, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (rStyle === "mirror_arch") {
      // 골드 아치 대형 포토존 거울
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 37, 18, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.frame || "#f59e0b";
      ctx.beginPath();
      ctx.roundRect(dx - 15, dy - 22, 30, 58, [15, 15, 3, 3]);
      ctx.fill();
      ctx.fillStyle = "#bae6fd";
      ctx.beginPath();
      ctx.roundRect(dx - 12, dy - 19, 24, 52, [12, 12, 2, 2]);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx - 7, dy - 10);
      ctx.lineTo(dx + 5, dy + 8);
      ctx.stroke();
    } else if (rStyle === "neon_stand") {
      // 빈티지 네온 입간판
      ctx.fillStyle = pal.frame || "#1c1917";
      ctx.beginPath();
      ctx.roundRect(dx - 14, dy - 8, 28, 44, 4);
      ctx.fill();
      const pulse = 0.75 + 0.25 * Math.sin(sec * 4);
      ctx.strokeStyle = pal.neon || "#fbbf24";
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = pulse;
      ctx.strokeRect(dx - 10, dy - 3, 20, 24);
      ctx.beginPath();
      ctx.arc(dx, dy + 9, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (rStyle === "fireplace") {
      // 대리석 LED 벽난로 콘솔
      ctx.fillStyle = pal.mantle || "#f5f5f4";
      ctx.beginPath();
      ctx.roundRect(dx - 22, dy - 4, 44, 40, 3);
      ctx.fill();
      ctx.fillStyle = pal.hearth || "#1c1917";
      ctx.beginPath();
      ctx.roundRect(dx - 13, dy + 8, 26, 28, [8, 8, 0, 0]);
      ctx.fill();
      const flk = 0.8 + 0.2 * Math.sin(sec * 9);
      ctx.fillStyle = pal.flame || "#f97316";
      ctx.beginPath();
      ctx.arc(dx, dy + 26, 7 * flk, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(dx, dy + 28, 4 * flk, 0, Math.PI * 2);
      ctx.fill();
    } else if (rStyle === "roaster_machine") {
      // 적동 로스터 머신
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(dx - 16, dy + 14, 32, 22);
      ctx.fillStyle = pal.copper || "#c2410c";
      ctx.beginPath();
      ctx.roundRect(dx - 14, dy - 4, 28, 20, 6);
      ctx.fill();
      ctx.fillStyle = pal.gold || "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(dx - 8, dy - 16);
      ctx.lineTo(dx + 8, dy - 16);
      ctx.lineTo(dx + 4, dy - 4);
      ctx.lineTo(dx - 4, dy - 4);
      ctx.closePath();
      ctx.fill();
    } else if (rStyle === "piano") {
      // 엔틱 업라이트 피아노
      ctx.fillStyle = pal.body || "#451a03";
      ctx.beginPath();
      ctx.roundRect(dx - 22, dy - 12, 44, 48, 3);
      ctx.fill();
      ctx.fillStyle = pal.keys || "#ffffff";
      ctx.fillRect(dx - 19, dy + 11, 38, 5);
      ctx.fillStyle = pal.brass || "#fbbf24";
      ctx.fillRect(dx - 14, dy - 4, 28, 2);
    } else if (rStyle === "iso_barista_station") {
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 36, 31, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      drawIsoBox(ctx, dx, dy + 2, 52, 24, 18, pal.counter || "#b9814b", pal.counterSide || "#69442e", pal.counterFront || "#875735");
      drawIsoBox(ctx, dx - 5, dy - 19, 30, 18, 19, pal.machine || "#40505a", pal.machineSide || "#202a32", pal.machineFront || "#303d46");
      ctx.fillStyle = pal.display || "#a7f3d0";
      ctx.fillRect(dx - 13, dy - 15, 11, 6);
      ctx.fillStyle = pal.metal || "#d1d5db";
      ctx.fillRect(dx - 1, dy - 10, 3, 12);
      ctx.fillStyle = "#292524";
      ctx.fillRect(dx - 8, dy - 3, 7, 2);
      ctx.fillStyle = pal.cup || "#fff7ed";
      ctx.beginPath();
      ctx.roundRect(dx + 13, dy - 8, 7, 9, 1.5);
      ctx.fill();
      ctx.fillStyle = pal.coffee || "#78350f";
      ctx.fillRect(dx + 13, dy - 5, 7, 3);
    } else if (rStyle === "iso_pendant_cluster") {
      const glow = ctx.createRadialGradient(dx, dy - 24, 2, dx, dy - 24, 42);
      glow.addColorStop(0, "rgba(255, 220, 145, 0.26)");
      glow.addColorStop(1, "rgba(255, 220, 145, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dx, dy - 24, 42, 0, Math.PI * 2);
      ctx.fill();
      [-15, 0, 15].forEach((offset, index) => {
        const lampY = dy - 16 + Math.abs(offset) * 0.16;
        ctx.strokeStyle = pal.cord || "#45352a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dx + offset, dy - 38);
        ctx.lineTo(dx + offset, lampY - 5);
        ctx.stroke();
        ctx.fillStyle = pal.shade || "#d6a75e";
        ctx.beginPath();
        ctx.moveTo(dx + offset - 6, lampY - 5);
        ctx.lineTo(dx + offset + 6, lampY - 5);
        ctx.lineTo(dx + offset + 4, lampY + 1);
        ctx.lineTo(dx + offset - 4, lampY + 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = index === 1 ? "#fff0bd" : "#ffd78a";
        ctx.beginPath();
        ctx.ellipse(dx + offset, lampY + 1, 3.5, 1.7, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (rStyle === "iso_planter_tripod") {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 35, 29, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      [-18, 0, 18].forEach((offset, index) => {
        const potY = dy + 14 + (index === 1 ? -5 : 0);
        ctx.strokeStyle = pal.stem || "#5b4632";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(dx + offset, potY + 2);
        ctx.lineTo(dx + offset + (index - 1) * 3, potY - 17);
        ctx.stroke();
        ctx.fillStyle = pal.leaf || "#4f8d59";
        ctx.beginPath();
        ctx.ellipse(dx + offset - 5, potY - 12, 6, 3, -0.5, 0, Math.PI * 2);
        ctx.ellipse(dx + offset + 5, potY - 15, 6, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
        drawIsoBox(ctx, dx + offset, potY, 15, 9, 12, pal.pot || "#d99b72", pal.potSide || "#805747", pal.potFront || "#a86e58");
      });
    }

    ctx.restore();
  }

  function drawCustomerBubble(ctx, cx, cy, customer, phase) {
    const floatY = Math.sin(phase * 3.2) * 2;
    const text = customer.bubbleText;
    ctx.save();
    ctx.font = "bold 11.5px 'Noto Sans KR', sans-serif";
    ctx.textAlign = "center";
    const textW = ctx.measureText(text).width + 22;
    const bx = cx - textW / 2;
    const by = cy - 72 + floatY;
    const bh = 24;

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.roundRect(bx, by + 2, textW, bh, 9);
    ctx.fill();

    ctx.fillStyle = "rgba(28, 19, 13, 0.94)";
    ctx.beginPath();
    ctx.roundRect(bx, by, textW, bh, 9);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - 5, by + bh);
    ctx.lineTo(cx, by + bh + 5);
    ctx.lineTo(cx + 5, by + bh);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = customer.isSipping
      ? "rgba(251, 191, 36, 0.85)"
      : (customer.state === "ordering" ? "rgba(52, 211, 153, 0.75)" : "rgba(245, 158, 11, 0.55)");
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(bx, by, textW, bh, 9);
    ctx.stroke();

    ctx.fillStyle = "#fef3c7";
    ctx.fillText(text, cx, by + 16);
    ctx.restore();
  }

  function draw(timestamp) {
    const state = getState();
    const scenicMode = getScenicMode();
    const activeCustomers = getCustomers();
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    const sec = timestamp * 0.001;

    const targetZoom = scenicMode ? 1.035 : 1.0;
    scenicZoom += (targetZoom - scenicZoom) * 0.06;

    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(scenicZoom, scenicZoom);
    ctx.translate(-w * 0.5, -h * 0.5);

    // ==================== 1. 파노라마 창밖 풍경 (시간·계절·날씨·해/달 매끄러운 궤적) ====================
    const mOfDay = state.minuteOfDay % 1440;
    const hourF = mOfDay / 60;
    const isNight = hourF >= 19.5 || hourF < 5.5;
    const isSunset = hourF >= 16.2 && hourF < 19.8;

    function lerpHex(hexA, hexB, t) {
      const k = Math.max(0, Math.min(1, t));
      const a = parseInt(hexA.slice(1), 16);
      const b = parseInt(hexB.slice(1), 16);
      const r = Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k);
      const g = Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k);
      const bl = Math.round((a & 255) * (1 - k) + (b & 255) * k);
      return `rgb(${r}, ${g}, ${bl})`;
    }

    // 시간대 키프레임 보간으로 하늘색과 해/달 전환이 뚝 끊기지 않고 매끄럽게 이어짐
    const skyKeys = [
      { h: 0.0,  top: "#070b14", mid: "#0f172a", bot: "#1e293b" },
      { h: 5.0,  top: "#0f172a", mid: "#1e1b4b", bot: "#312e81" },
      { h: 6.2,  top: "#312e81", mid: "#be185d", bot: "#fda4af" },
      { h: 8.0,  top: "#0369a1", mid: "#38bdf8", bot: "#e0f2fe" },
      { h: 15.8, top: "#0369a1", mid: "#38bdf8", bot: "#e0f2fe" },
      { h: 17.5, top: "#1d4ed8", mid: "#f97316", bot: "#fde047" },
      { h: 18.9, top: "#3b0764", mid: "#c2410c", bot: "#fb923c" },
      { h: 20.0, top: "#070b14", mid: "#0f172a", bot: "#1e293b" },
      { h: 24.0, top: "#070b14", mid: "#0f172a", bot: "#1e293b" }
    ];
    let k0 = skyKeys[0], k1 = skyKeys[skyKeys.length - 1];
    for (let i = 0; i < skyKeys.length - 1; i++) {
      if (hourF >= skyKeys[i].h && hourF <= skyKeys[i + 1].h) {
        k0 = skyKeys[i];
        k1 = skyKeys[i + 1];
        break;
      }
    }
    const segT = k1.h > k0.h ? (hourF - k0.h) / (k1.h - k0.h) : 0;
    let skyTop = lerpHex(k0.top, k1.top, segT);
    let skyMid = lerpHex(k0.mid, k1.mid, segT);
    let skyBot = lerpHex(k0.bot, k1.bot, segT);

    if (state.weather === "rain") {
      skyTop = isNight ? "#070b14" : "#1e293b";
      skyMid = isNight ? "#172033" : "#334155";
      skyBot = isNight ? "#283548" : "#64748b";
    } else if (state.weather === "cloudy") {
      skyTop = isNight ? "#0b1120" : "#475569";
      skyMid = isNight ? "#1e293b" : "#94a3b8";
      skyBot = isNight ? "#334155" : "#cbd5e1";
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.58);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(0.55, skyMid);
    skyGrad.addColorStop(1, skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.58);

    // 해(05:30 ~ 19:30)와 달(18:45 ~ 06:15)의 자연스러운 지평선 궤적
    const horizonLineY = h * 0.51;
    const skyApexY = h * 0.17;

    // 1) 해 렌더링: 아침에 떠올라 한낮 정점을 지나 저녁에 붉게 지평선 아래로 저묾
    if (hourF >= 5.3 && hourF <= 19.6 && state.weather !== "rain") {
      const sunT = (hourF - 5.3) / (19.6 - 5.3); // 0(일출) -> 0.5(정오) -> 1(일몰)
      const sunX = w * (0.20 + sunT * 0.62);
      const sunArc = Math.sin(sunT * Math.PI); // 0 -> 1 -> 0
      const sunY = (horizonLineY + 12) - sunArc * (horizonLineY - skyApexY);

      const lowFactor = Math.max(0, 1 - sunArc * 1.45); // 지평선 근처일수록 1에 가까움
      const cloudDim = state.weather === "cloudy" ? 0.35 : 1.0;

      ctx.save();
      // 해가 질 때 지평선 노을빛 확산
      if (lowFactor > 0.05 && state.weather === "clear") {
        const horizonGlow = ctx.createRadialGradient(sunX, horizonLineY, 10, sunX, horizonLineY, w * 0.36);
        horizonGlow.addColorStop(0, `rgba(251, 146, 60, ${0.42 * lowFactor})`);
        horizonGlow.addColorStop(0.55, `rgba(244, 63, 94, ${0.18 * lowFactor})`);
        horizonGlow.addColorStop(1, "rgba(251, 146, 60, 0)");
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, h * 0.12, w, h * 0.44);
      }

      // 태양 외부 광륜(코로나)
      const outerR = 78 + lowFactor * 28;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, outerR);
      if (lowFactor > 0.35) {
        sunGlow.addColorStop(0, `rgba(253, 186, 116, ${0.85 * cloudDim})`);
        sunGlow.addColorStop(0.45, `rgba(249, 115, 22, ${0.42 * cloudDim})`);
        sunGlow.addColorStop(1, "rgba(249, 115, 22, 0)");
      } else {
        sunGlow.addColorStop(0, `rgba(254, 249, 195, ${0.85 * cloudDim})`);
        sunGlow.addColorStop(0.45, `rgba(253, 224, 71, ${0.32 * cloudDim})`);
        sunGlow.addColorStop(1, "rgba(253, 224, 71, 0)");
      }
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, outerR, 0, Math.PI * 2);
      ctx.fill();

      // 선명한 태양 본체 원반
      const sunRadius = 17 + lowFactor * 4;
      const discGrad = ctx.createRadialGradient(sunX - 3, sunY - 3, 2, sunX, sunY, sunRadius);
      if (lowFactor > 0.35) {
        discGrad.addColorStop(0, `rgba(255, 247, 237, ${0.96 * cloudDim})`);
        discGrad.addColorStop(0.65, `rgba(251, 146, 60, ${0.95 * cloudDim})`);
        discGrad.addColorStop(1, `rgba(234, 88, 12, ${0.9 * cloudDim})`);
      } else {
        discGrad.addColorStop(0, `rgba(255, 255, 255, ${0.98 * cloudDim})`);
        discGrad.addColorStop(0.7, `rgba(254, 240, 138, ${0.95 * cloudDim})`);
        discGrad.addColorStop(1, `rgba(250, 204, 21, ${0.9 * cloudDim})`);
      }
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2) 별과 달 렌더링: 해가 진 뒤 지평선에서 서서히 떠오르는 초승달/보름달 연출
    const nightHours = hourF >= 18.7 ? (hourF - 18.7) : (hourF < 6.3 ? hourF + 5.3 : -1);
    if (nightHours >= 0 && state.weather !== "rain") {
      const moonT = Math.min(1, Math.max(0, nightHours / 11.6)); // 0(월출) -> 0.5(자정) -> 1(월몰)
      const moonArc = Math.sin(moonT * Math.PI);
      const moonAlpha = Math.min(1, moonArc * 2.4) * (state.weather === "cloudy" ? 0.35 : 1.0);

      if (state.weather === "clear" && moonAlpha > 0.15) {
        ctx.save();
        ctx.fillStyle = "rgba(254, 249, 195, 0.85)";
        for (let s = 0; s < 22; s++) {
          const sx = ((s * 197) % 100) * 0.01 * w;
          const sy = ((s * 83) % 34 + 12) * 0.01 * h;
          const twinkle = 0.45 + 0.55 * Math.sin(sec * 2.4 + s);
          ctx.globalAlpha = twinkle * moonAlpha * 0.85;
          ctx.beginPath();
          ctx.arc(sx, sy, (s % 2) + 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      const moonX = w * (0.24 + moonT * 0.54);
      const moonY = (horizonLineY + 10) - moonArc * (horizonLineY - (h * 0.19));

      ctx.save();
      ctx.globalAlpha = moonAlpha;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 54);
      moonGlow.addColorStop(0, "rgba(254, 249, 195, 0.55)");
      moonGlow.addColorStop(1, "rgba(254, 249, 195, 0)");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 54, 0, Math.PI * 2);
      ctx.fill();

      // 달 본체 + 오프스크린/배경색 마스크 대신 자연스러운 초승달/반달 쉐이딩
      ctx.fillStyle = "#fef9c3";
      ctx.beginPath();
      ctx.arc(moonX, moonY, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = skyMid;
      ctx.beginPath();
      ctx.arc(moonX + 5.5, moonY - 3, 12.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    clouds.forEach(cl => {
      cl.x += cl.speed;
      if (cl.x > 1.15) cl.x = -0.15;
      drawCloud(ctx, cl.x * w, cl.y * h, cl.scale, state.weather === "rain" || state.weather === "cloudy" || isNight);
    });

    const horizonY = h * 0.51;
    const activeLocId = state.activeViewLocationId || state.hqLocationId || "incheon_guwol";
    drawLocationWindowScenery(ctx, {
      w,
      h,
      horizonY,
      isNight,
      isSunset,
      seasonIdx: state.seasonIdx,
      weather: state.weather,
      sec,
      locationId: activeLocId
    });

    if (state.weather !== "rain" && state.weather !== "snow" && state.seasonIdx !== 3) {
      const leafColors = ["rgba(249, 168, 212, 0.85)", "rgba(74, 222, 128, 0.75)", "rgba(251, 146, 60, 0.85)"];
      const leafColor = leafColors[state.seasonIdx];
      seasonalParticles.forEach(sp => {
        sp.y += sp.speedY;
        sp.x += sp.speedX + Math.sin(sec * 1.4 + sp.phase) * 0.0005;
        sp.rot += sp.rotSpeed;
        if (sp.y > 0.54) { sp.y = 0.12; sp.x = Math.random(); }
        if (sp.x > 1) sp.x = 0;

        ctx.save();
        ctx.translate(sp.x * w, sp.y * h);
        ctx.rotate(sp.rot);
        ctx.fillStyle = leafColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, sp.size, sp.size * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    particles.forEach(p => {
      if (state.weather !== "rain" && state.weather !== "snow") return;

      const gust = Math.sin(sec * 0.7 + p.phase * 0.3) * (state.weather === "rain" ? 0.0014 : 0.0009);
      p.y += p.speedY * (state.weather === "rain" ? 2.85 : 0.68);
      p.x += Math.sin(timestamp * 0.0007 + p.phase) * 0.0005 + p.speedX + gust;
      if (p.y > 0.56) { p.y = 0.02; p.x = Math.random(); }
      if (p.x > 1) p.x = 0;
      if (p.x < 0) p.x = 1;

      const px = p.x * w;
      const py = p.y * h;

      if (state.weather === "rain") {
        ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 2.5, py + 12);
        ctx.stroke();
      } else if (state.weather === "snow") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // ==================== 2. 아늑한 우드톤 카페 실내 구조 ====================
    const winLeft = w * 0.13;
    const winRight = w * 0.87;
    const winTop = h * 0.13;
    const winBot = h * 0.53;
    const projectFloorX = (x, yRatio) => {
      const depth = Math.max(0, Math.min(1, (yRatio - 0.53) / 0.47));
      const perspective = 0.82 + depth * 0.18;
      return w * 0.5 + (x - w * 0.5) * perspective;
    };

    ctx.save();
    ctx.beginPath();
    ctx.rect(winLeft, winTop, winRight - winLeft, winBot - winTop);
    ctx.clip();

    const glassSheen = ctx.createLinearGradient(winLeft, winTop, winRight, winBot);
    glassSheen.addColorStop(0, "rgba(255, 251, 235, 0.08)");
    glassSheen.addColorStop(0.35, "rgba(255, 251, 235, 0.01)");
    glassSheen.addColorStop(0.55, "rgba(255, 251, 235, 0.07)");
    glassSheen.addColorStop(1, "rgba(255, 251, 235, 0.0)");
    ctx.fillStyle = glassSheen;
    ctx.fillRect(winLeft, winTop, winRight - winLeft, winBot - winTop);

    if (state.weather === "rain") {
      ctx.fillStyle = "rgba(224, 242, 254, 0.28)";
      for (let d = 0; d < 22; d++) {
        const dx = winLeft + ((d * 97) % Math.max(10, Math.floor(winRight - winLeft)));
        const dy = winTop + (((d * 53) + sec * 18) % Math.max(10, Math.floor(winBot - winTop)));
        ctx.beginPath();
        ctx.ellipse(dx, dy, 1.3, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    const wallGrad = ctx.createLinearGradient(0, 0, 0, winBot);
    wallGrad.addColorStop(0, "#2b180d");
    wallGrad.addColorStop(0.5, "#3d2213");
    wallGrad.addColorStop(1, "#26140a");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, winTop);
    ctx.fillRect(0, winTop, winLeft, h - winTop);
    ctx.fillRect(winRight, winTop, w - winRight, h - winTop);

    ctx.strokeStyle = "rgba(18, 8, 3, 0.35)";
    ctx.lineWidth = 1.5;
    for (let wx = 10; wx < winLeft - 6; wx += 14) {
      ctx.beginPath();
      ctx.moveTo(wx, winTop);
      ctx.lineTo(wx, winBot);
      ctx.stroke();
    }
    for (let wx = winRight + 10; wx < w - 6; wx += 14) {
      ctx.beginPath();
      ctx.moveTo(wx, winTop);
      ctx.lineTo(wx, winBot);
      ctx.stroke();
    }

    ctx.strokeStyle = "#4a2713";
    ctx.lineWidth = 11;
    ctx.strokeRect(winLeft, winTop, winRight - winLeft, winBot - winTop);
    ctx.strokeStyle = "#783f1d";
    ctx.lineWidth = 2;
    ctx.strokeRect(winLeft + 4, winTop + 4, winRight - winLeft - 8, winBot - winTop - 8);

    ctx.strokeStyle = "#4a2713";
    ctx.lineWidth = 5;
    [0.37, 0.63].forEach(divRatio => {
      ctx.beginPath();
      ctx.moveTo(w * divRatio, winTop);
      ctx.lineTo(w * divRatio, winBot);
      ctx.stroke();
    });

    ctx.fillStyle = "#6b3819";
    ctx.fillRect(winLeft - 6, winBot - 3, winRight - winLeft + 12, 8);
    ctx.fillStyle = "#92400e";
    ctx.fillRect(winLeft - 6, winBot - 3, winRight - winLeft + 12, 2.5);

    const sillPlantX = w * 0.43;
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.roundRect(sillPlantX - 7, winBot - 14, 14, 11, 2);
    ctx.fill();
    ctx.fillStyle = "#16a34a";
    ctx.beginPath();
    ctx.arc(sillPlantX - 3, winBot - 17, 5, 0, Math.PI * 2);
    ctx.arc(sillPlantX + 3, winBot - 16, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 천장 펜던트 조명 3개
    [0.24, 0.50, 0.76].forEach((lxRatio, idx) => {
      const lx = w * lxRatio;
      const swayX = Math.sin(sec * 1.1 + idx * 1.7) * 1.5;

      const coneGrad = ctx.createLinearGradient(lx, winTop + 26, lx, h * 0.75);
      coneGrad.addColorStop(0, "rgba(253, 224, 71, 0.16)");
      coneGrad.addColorStop(0.6, "rgba(251, 191, 36, 0.05)");
      coneGrad.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(lx - 14 + swayX, winTop + 26);
      ctx.lineTo(lx + 14 + swayX, winTop + 26);
      ctx.lineTo(lx + w * 0.13, h * 0.75);
      ctx.lineTo(lx - w * 0.13, h * 0.75);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx + swayX, winTop + 22);
      ctx.stroke();

      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.arc(lx + swayX, winTop + 26, 14, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx - 14 + swayX, winTop + 26);
      ctx.lineTo(lx + 14 + swayX, winTop + 26);
      ctx.stroke();

      const bulbGlow = ctx.createRadialGradient(lx + swayX, winTop + 30, 2, lx + swayX, winTop + 30, 82);
      bulbGlow.addColorStop(0, "rgba(254, 240, 138, 0.55)");
      bulbGlow.addColorStop(0.5, "rgba(251, 191, 36, 0.18)");
      bulbGlow.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = bulbGlow;
      ctx.beginPath();
      ctx.arc(lx + swayX, winTop + 30, 82, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fef9c3";
      ctx.beginPath();
      ctx.arc(lx + swayX, winTop + 28, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // ==================== 3. 좌우 벽면 인테리어 소품 ====================
    const leftPad = Math.max(8, winLeft * 0.14);
    const leftItemW = Math.max(22, winLeft - leftPad * 2);

    ctx.fillStyle = "#6b3819";
    ctx.beginPath();
    ctx.roundRect(leftPad + leftItemW * 0.12, h * 0.18, leftItemW * 0.76, h * 0.12, 4);
    ctx.fill();
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(leftPad + leftItemW * 0.12 + 3.5, h * 0.18 + 3.5, leftItemW * 0.76 - 7, h * 0.12 - 7);
    ctx.fillStyle = "#92400e";
    ctx.beginPath();
    ctx.arc(leftPad + leftItemW * 0.5, h * 0.24, Math.min(10, leftItemW * 0.16), 0, Math.PI);
    ctx.fill();

    [0.37, 0.47].forEach((shelfRatio, sIdx) => {
      const sy = h * shelfRatio;
      ctx.fillStyle = "#6b3819";
      ctx.fillRect(leftPad, sy, leftItemW, 5.5);
      ctx.fillStyle = sIdx === 0 ? "#b45309" : "#78350f";
      ctx.beginPath();
      ctx.roundRect(leftPad + 4, sy - 16, Math.min(14, leftItemW * 0.28), 16, 3);
      ctx.fill();
      ctx.fillStyle = sIdx === 0 ? "#15803d" : "#ea580c";
      ctx.beginPath();
      ctx.arc(leftPad + leftItemW * 0.68, sy - 9, Math.min(8, leftItemW * 0.18), 0, Math.PI * 2);
      ctx.fill();
    });

    const rightStart = winRight + Math.max(8, (w - winRight) * 0.14);
    const rightW = Math.max(22, w - rightStart - 8);
    ctx.fillStyle = "#3b2110";
    ctx.fillRect(rightStart, h * 0.24, rightW, h * 0.25);
    ctx.strokeStyle = "#783f1d";
    ctx.lineWidth = 3;
    ctx.strokeRect(rightStart, h * 0.24, rightW, h * 0.25);
    ctx.fillStyle = "#783f1d";
    ctx.fillRect(rightStart, h * 0.36, rightW, 4);

    // ==================== 4. 넓고 탁 트인 원목 마루 홀 바닥 ====================
    const floorGrad = ctx.createLinearGradient(0, winBot, 0, h);
    floorGrad.addColorStop(0, "#2a170c");
    floorGrad.addColorStop(0.55, "#1f1008");
    floorGrad.addColorStop(1, "#120904");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, winBot, w, h - winBot);

    // 원근이 있는 마름모형 마루 타일로 쿼터뷰 바닥을 구성합니다.
    const floorTopLeft = w * 0.16;
    const floorTopRight = w * 0.84;
    const floorBottomLeft = w * 0.015;
    const floorBottomRight = w * 0.985;
    const floorBottom = h * 0.97;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(floorTopLeft, winBot);
    ctx.lineTo(floorTopRight, winBot);
    ctx.lineTo(floorBottomRight, floorBottom);
    ctx.lineTo(floorBottomLeft, floorBottom);
    ctx.closePath();
    const isoFloor = ctx.createLinearGradient(0, winBot, 0, floorBottom);
    isoFloor.addColorStop(0, "rgba(120, 75, 43, 0.72)");
    isoFloor.addColorStop(1, "rgba(54, 29, 15, 0.88)");
    ctx.fillStyle = isoFloor;
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = "rgba(245, 196, 128, 0.13)";
    ctx.lineWidth = 1;
    for (let row = 1; row < 8; row++) {
      const t = row / 8;
      const y = winBot + (floorBottom - winBot) * t;
      const left = floorTopLeft + (floorBottomLeft - floorTopLeft) * t;
      const right = floorTopRight + (floorBottomRight - floorTopRight) * t;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }
    for (let col = 1; col < 12; col++) {
      const t = col / 12;
      ctx.beginPath();
      ctx.moveTo(floorTopLeft + (floorTopRight - floorTopLeft) * t, winBot);
      ctx.lineTo(floorBottomLeft + (floorBottomRight - floorBottomLeft) * t, floorBottom);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "rgba(12, 6, 2, 0.42)";
    ctx.beginPath();
    ctx.moveTo(floorBottomLeft, floorBottom);
    ctx.lineTo(floorBottomLeft + 8, floorBottom + 13);
    ctx.lineTo(floorBottomRight - 8, floorBottom + 13);
    ctx.lineTo(floorBottomRight, floorBottom);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#4a2713";
    ctx.fillRect(0, winBot, w, 6);
    ctx.strokeStyle = "rgba(12, 6, 2, 0.48)";
    ctx.lineWidth = 1.5;
    for (let fy = winBot + 16; fy < h * 0.86; fy += 16) {
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(w, fy);
      ctx.stroke();
    }

    // ==================== 5. 홀 중앙 러그 · 카펫 (8종 테마 지원) ====================
    const placed = state.placedFurniture || {
      slotLeft: "table_wood_2",
      slotCenter: "table_wood_2",
      slotRight: "table_wood_2",
      slotFrontLeft: "table_wood_2",
      slotFrontCenter: null,
      slotFrontRight: "table_wood_2",
      decorLeft: null,
      decorRight: null,
      decorFrontLeft: null,
      decorFrontRight: null,
      hallRug: "rug_warm_amber"
    };

    const rugItem = getFurnitureById(placed.hallRug);
    const rugStyle = rugItem?.renderStyle || "amber";
    if (placed.hallRug) {
      ctx.save();
      if (rugStyle === "persian") {
        ctx.fillStyle = "rgba(127, 29, 29, 0.44)";
        ctx.beginPath();
        ctx.roundRect(w * 0.17, h * 0.60, w * 0.66, h * 0.24, 18);
        ctx.fill();
        ctx.strokeStyle = "rgba(251, 191, 36, 0.48)";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(w * 0.185, h * 0.612, w * 0.63, h * 0.216);
      } else if (rugStyle === "check_cream") {
        ctx.fillStyle = "rgba(254, 243, 199, 0.17)";
        ctx.beginPath();
        ctx.roundRect(w * 0.18, h * 0.61, w * 0.64, h * 0.22, 16);
        ctx.fill();
        ctx.strokeStyle = "rgba(217, 119, 6, 0.38)";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (rugStyle === "nordic_blue") {
        ctx.fillStyle = "rgba(30, 64, 175, 0.34)";
        ctx.beginPath();
        ctx.roundRect(w * 0.18, h * 0.61, w * 0.64, h * 0.22, 18);
        ctx.fill();
        ctx.strokeStyle = "rgba(147, 197, 253, 0.42)";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (rugStyle === "forest_green") {
        ctx.fillStyle = "rgba(20, 83, 45, 0.42)";
        ctx.beginPath();
        ctx.roundRect(w * 0.17, h * 0.60, w * 0.66, h * 0.24, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(134, 239, 172, 0.35)";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (rugStyle === "terracotta") {
        ctx.fillStyle = "rgba(154, 52, 18, 0.38)";
        ctx.beginPath();
        ctx.roundRect(w * 0.17, h * 0.60, w * 0.66, h * 0.24, 18);
        ctx.fill();
        ctx.strokeStyle = "rgba(253, 186, 116, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (rugStyle === "royal_navy") {
        ctx.fillStyle = "rgba(15, 23, 42, 0.56)";
        ctx.beginPath();
        ctx.roundRect(w * 0.16, h * 0.595, w * 0.68, h * 0.25, 16);
        ctx.fill();
        ctx.strokeStyle = "rgba(250, 204, 21, 0.65)";
        ctx.lineWidth = 3;
        ctx.strokeRect(w * 0.175, h * 0.608, w * 0.65, h * 0.224);
      } else if (rugStyle === "silk_ivory") {
        ctx.fillStyle = "rgba(255, 251, 235, 0.26)";
        ctx.beginPath();
        ctx.roundRect(w * 0.16, h * 0.595, w * 0.68, h * 0.25, 22);
        ctx.fill();
        ctx.strokeStyle = "rgba(253, 224, 71, 0.55)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        const rugGrad = ctx.createRadialGradient(w * 0.5, h * 0.71, 20, w * 0.5, h * 0.71, w * 0.38);
        rugGrad.addColorStop(0, "rgba(180, 83, 9, 0.22)");
        rugGrad.addColorStop(0.75, "rgba(120, 53, 15, 0.14)");
        rugGrad.addColorStop(1, "rgba(120, 53, 15, 0)");
        ctx.fillStyle = rugGrad;
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.71, w * 0.38, h * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ==================== 5-B. 에스프레소 바 카운터 & 바리스타 스프라이트 ====================
    drawHybridBarCounter(ctx, w, h, winBot, sec);

    // ==================== 6. 안쪽(창가) 라인 소품 & 테이블 (3석) ====================
    drawDecorItem(ctx, projectFloorX(w * 0.10, 0.60), h * 0.60, placed.decorLeft, sec);
    drawDecorItem(ctx, projectFloorX(w * 0.90, 0.60), h * 0.60, placed.decorRight, sec);

    const backTableSlots = [
      { key: "slotLeft", xRatio: 0.23, yRatio: 0.615 },
      { key: "slotCenter", xRatio: 0.50, yRatio: 0.615 },
      { key: "slotRight", xRatio: 0.77, yRatio: 0.615 }
    ];
    backTableSlots.forEach((slot, idx) => {
      const styleId = placed[slot.key];
      if (!styleId) return;
      drawTableSet(ctx, projectFloorX(w * slot.xRatio, slot.yRatio), h * slot.yRatio, styleId, idx, sec);
    });

    activeCustomers
      .filter(c => (c.yRatio || 0.62) < 0.70)
      .forEach(c => {
        drawIllustratedCharacter(ctx, projectFloorX(c.x * w, c.yRatio || 0.615), h * (c.yRatio || 0.615), c, c.timer);
      });

    // ==================== 7. 앞쪽 홀 플로어 소품 & 추가 테이블 (3석) ====================
    drawDecorItem(ctx, projectFloorX(w * 0.11, 0.77), h * 0.77, placed.decorFrontLeft, sec);
    drawDecorItem(ctx, projectFloorX(w * 0.89, 0.77), h * 0.77, placed.decorFrontRight, sec);

    const frontTableSlots = [
      { key: "slotFrontLeft", xRatio: 0.25, yRatio: 0.785 },
      { key: "slotFrontCenter", xRatio: 0.50, yRatio: 0.785 },
      { key: "slotFrontRight", xRatio: 0.75, yRatio: 0.785 }
    ];
    frontTableSlots.forEach((slot, idx) => {
      const styleId = placed[slot.key];
      if (!styleId) return;
      drawTableSet(ctx, projectFloorX(w * slot.xRatio, slot.yRatio), h * slot.yRatio, styleId, idx + 3, sec);
    });

    activeCustomers
      .filter(c => (c.yRatio || 0.62) >= 0.70)
      .forEach(c => {
        drawIllustratedCharacter(ctx, projectFloorX(c.x * w, c.yRatio || 0.785), h * (c.yRatio || 0.785), c, c.timer);
      });

    // ==================== 8. 아늑한 공기 중 따뜻한 빛방울 부유 효과 ====================
    warmDust.forEach(d => {
      const dx = ((d.x + sec * d.speed) % 1) * w;
      const dy = (d.y + Math.sin(sec * 1.2 + d.phase) * 0.015) * h;
      const alpha = 0.12 + 0.14 * Math.sin(sec * 2 + d.phase);
      ctx.fillStyle = `rgba(254, 243, 199, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(dx, dy, d.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ==================== 9. 손님 말풍선 (최상단 레이어) ====================
    activeCustomers.forEach(c => {
      const cx = projectFloorX(c.x * w, c.yRatio || 0.615);
      const cy = h * (c.yRatio || 0.615);
      drawCustomerBubble(ctx, cx, cy, c, c.timer);
    });

    ctx.restore();
  }

  return { draw };
}
