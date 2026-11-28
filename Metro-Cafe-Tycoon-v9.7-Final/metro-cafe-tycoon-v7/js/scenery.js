// Location-specific outdoor window scenery for all 35 Metro Cafe Tycoon locations.
// Imported by graphics.js to keep scene rendering clean and modular.

const LOCATION_SCENERY_CONFIGS = {
  // ==================== 인천 (6개 상권) ====================
  incheon_guwol: {
    theme: "rodeo_plaza",
    groundDay: "#334155", groundNight: "#1e293b",
    accentColor: "#f43f5e", secondaryColor: "#fbbf24",
    skylineStyle: "commercial_mid",
    landmark: "guwol_rodeo",
    waterfront: false,
    treeCount: 2,
    extra: "banner_street"
  },
  incheon_bupyeong: {
    theme: "underground_neon",
    groundDay: "#292524", groundNight: "#1c1917",
    accentColor: "#ec4899", secondaryColor: "#38bdf8",
    skylineStyle: "dense_signage",
    landmark: "bupyeong_station",
    waterfront: false,
    treeCount: 1,
    extra: "neon_arcade"
  },
  incheon_songdo: {
    theme: "futuristic_waterfront",
    groundDay: "#0f766e", groundNight: "#042f2e",
    accentColor: "#38bdf8", secondaryColor: "#a7f3d0",
    skylineStyle: "songdo_skyscrapers",
    landmark: "songdo_tribowl",
    waterfront: "canal",
    treeCount: 3,
    extra: "water_taxi"
  },
  incheon_cheongna: {
    theme: "canal_tower",
    groundDay: "#1e3a5f", groundNight: "#0f172a",
    accentColor: "#06b6d4", secondaryColor: "#fde047",
    skylineStyle: "modern_apt",
    landmark: "cheongna_citytower",
    waterfront: "canal",
    treeCount: 2,
    extra: "canal_bridge"
  },
  incheon_yeongjong: {
    theme: "west_sea_beach",
    groundDay: "#d6b88d", groundNight: "#44403c",
    accentColor: "#0284c7", secondaryColor: "#fb923c",
    skylineStyle: "coastal_low",
    landmark: "incheon_bridge_seagulls",
    waterfront: "ocean",
    treeCount: 0,
    extra: "pine_beach"
  },
  incheon_ganghwa: {
    theme: "vintage_mill_island",
    groundDay: "#57534e", groundNight: "#292524",
    accentColor: "#b45309", secondaryColor: "#84cc16",
    skylineStyle: "countryside_hills",
    landmark: "joyang_textile_mill",
    waterfront: false,
    treeCount: 4,
    extra: "brick_chimney"
  },

  // ==================== 서울 (18개 상권) ====================
  seoul_hongdae: {
    theme: "indie_busking",
    groundDay: "#3f3f46", groundNight: "#18181b",
    accentColor: "#a855f7", secondaryColor: "#f472b6",
    skylineStyle: "hongdae_brick",
    landmark: "hongdae_busking_stage",
    waterfront: false,
    treeCount: 2,
    extra: "murals_and_lights"
  },
  seoul_seongsu: {
    theme: "redbrick_warehouse",
    groundDay: "#44403c", groundNight: "#1c1917",
    accentColor: "#dc2626", secondaryColor: "#f59e0b",
    skylineStyle: "seongsu_brick_loft",
    landmark: "seongsu_daelim_warehouse",
    waterfront: false,
    treeCount: 2,
    extra: "rooftop_steel"
  },
  seoul_gangnam: {
    theme: "teheran_finance",
    groundDay: "#1e293b", groundNight: "#090d16",
    accentColor: "#3b82f6", secondaryColor: "#eab308",
    skylineStyle: "gangnam_mega_towers",
    landmark: "gangnam_gt_tower",
    waterfront: false,
    treeCount: 1,
    extra: "traffic_headlights"
  },
  seoul_apgujeong: {
    theme: "luxury_flagship",
    groundDay: "#334155", groundNight: "#0f172a",
    accentColor: "#f59e0b", secondaryColor: "#fef3c7",
    skylineStyle: "designer_boutiques",
    landmark: "apgujeong_galleria",
    waterfront: false,
    treeCount: 2,
    extra: "gold_facade"
  },
  seoul_jamsil: {
    theme: "lake_lotte_tower",
    groundDay: "#1e3a5f", groundNight: "#0b132b",
    accentColor: "#60a5fa", secondaryColor: "#f472b6",
    skylineStyle: "jamsil_skyline",
    landmark: "lotte_world_tower",
    waterfront: "lake",
    treeCount: 4,
    extra: "seokchon_lake"
  },
  seoul_yeouido: {
    theme: "han_river_finance",
    groundDay: "#1e3a8a", groundNight: "#0a1128",
    accentColor: "#38bdf8", secondaryColor: "#fbbf24",
    skylineStyle: "yeouido_parc1",
    landmark: "yeouido_63_and_parc1",
    waterfront: "river",
    treeCount: 2,
    extra: "han_river_cruise"
  },
  seoul_itaewon: {
    theme: "namsan_hillside",
    groundDay: "#3f3f46", groundNight: "#18181b",
    accentColor: "#fb7185", secondaryColor: "#34d399",
    skylineStyle: "hillside_terraces",
    landmark: "n_seoul_tower",
    waterfront: false,
    treeCount: 3,
    extra: "terrace_string_lights"
  },
  seoul_ikseon: {
    theme: "hanok_alley",
    groundDay: "#57534e", groundNight: "#292524",
    accentColor: "#d97706", secondaryColor: "#fef08a",
    skylineStyle: "hanok_roofs",
    landmark: "ikseon_hanok_courtyard",
    waterfront: false,
    treeCount: 2,
    extra: "paper_lanterns"
  },
  seoul_euljiro: {
    theme: "hipjiro_retro",
    groundDay: "#292524", groundNight: "#141210",
    accentColor: "#10b981", secondaryColor: "#f43f5e",
    skylineStyle: "old_print_shops",
    landmark: "euljiro_retro_neon",
    waterfront: false,
    treeCount: 0,
    extra: "hidden_signboards"
  },
  seoul_bukchon: {
    theme: "palace_hill_hanok",
    groundDay: "#44403c", groundNight: "#1c1917",
    accentColor: "#059669", secondaryColor: "#fde68a",
    skylineStyle: "layered_hanok",
    landmark: "bukchon_gyeongbok_gate",
    waterfront: false,
    treeCount: 3,
    extra: "stone_wall_path"
  },
  seoul_kondae: {
    theme: "campus_lake_youth",
    groundDay: "#334155", groundNight: "#1e293b",
    accentColor: "#2563eb", secondaryColor: "#38bdf8",
    skylineStyle: "container_and_campus",
    landmark: "kondae_common_ground",
    waterfront: "pond",
    treeCount: 3,
    extra: "blue_containers"
  },
  seoul_sinchon: {
    theme: "university_avenue",
    groundDay: "#3f3f46", groundNight: "#18181b",
    accentColor: "#e11d48", secondaryColor: "#fde047",
    skylineStyle: "campus_clocktower",
    landmark: "sinchon_red_periscope",
    waterfront: false,
    treeCount: 3,
    extra: "ivy_campus"
  },
  seoul_magok: {
    theme: "botanic_greenhouse",
    groundDay: "#166534", groundNight: "#052e16",
    accentColor: "#22c55e", secondaryColor: "#bae6fd",
    skylineStyle: "rd_glass_buildings",
    landmark: "seoul_botanic_dome",
    waterfront: "pond",
    treeCount: 5,
    extra: "glass_conservatory"
  },
  seoul_mokdong: {
    theme: "hyperion_stadium",
    groundDay: "#334155", groundNight: "#0f172a",
    accentColor: "#0ea5e9", secondaryColor: "#f97316",
    skylineStyle: "residential_towers",
    landmark: "mokdong_hyperion_and_sbs",
    waterfront: false,
    treeCount: 3,
    extra: "broadcast_antenna"
  },
  seoul_sillim: {
    theme: "sharosu_gwanak",
    groundDay: "#3f3f46", groundNight: "#1c1917",
    accentColor: "#f59e0b", secondaryColor: "#4ade80",
    skylineStyle: "cozy_bistro_row",
    landmark: "gwanaksan_ridge",
    waterfront: false,
    treeCount: 3,
    extra: "mountain_backdrop"
  },
  seoul_nowon: {
    theme: "bukhansan_plaza",
    groundDay: "#334155", groundNight: "#1e293b",
    accentColor: "#14b8a6", secondaryColor: "#facc15",
    skylineStyle: "apt_and_plaza",
    landmark: "suraksan_bukhansan_peaks",
    waterfront: false,
    treeCount: 3,
    extra: "granite_peaks"
  },
  seoul_hyehwa: {
    theme: "daehakro_theater",
    groundDay: "#44403c", groundNight: "#1c1917",
    accentColor: "#dc2626", secondaryColor: "#fbbf24",
    skylineStyle: "redbrick_theaters",
    landmark: "marronnier_naksan_wall",
    waterfront: false,
    treeCount: 3,
    extra: "theater_posters"
  },
  seoul_garosu: {
    theme: "ginkgo_boulevard",
    groundDay: "#44403c", groundNight: "#1c1917",
    accentColor: "#eab308", secondaryColor: "#fef08a",
    skylineStyle: "chic_ateliers",
    landmark: "garosu_ginkgo_avenue",
    waterfront: false,
    treeCount: 4,
    extra: "ginkgo_trees"
  },

  // ==================== 경기 (11개 상권) ====================
  gg_suwon: {
    theme: "hwaseong_fortress",
    groundDay: "#57534e", groundNight: "#292524",
    accentColor: "#d97706", secondaryColor: "#fde68a",
    skylineStyle: "fortress_low",
    landmark: "suwon_hwaseong_paldalmun",
    waterfront: false,
    treeCount: 3,
    extra: "fortress_rampart"
  },
  gg_pangyo: {
    theme: "techno_valley",
    groundDay: "#1e293b", groundNight: "#090d16",
    accentColor: "#06b6d4", secondaryColor: "#818cf8",
    skylineStyle: "glass_tech_campus",
    landmark: "pangyo_skybridge",
    waterfront: false,
    treeCount: 2,
    extra: "holo_billboards"
  },
  gg_bundang: {
    theme: "jeongja_cafe_terrace",
    groundDay: "#334155", groundNight: "#1e293b",
    accentColor: "#10b981", secondaryColor: "#fbbf24",
    skylineStyle: "european_terrace_apt",
    landmark: "tanchon_park_bridge",
    waterfront: "stream",
    treeCount: 4,
    extra: "parasol_terrace"
  },
  gg_ilsan: {
    theme: "ilsan_lake_park",
    groundDay: "#155e75", groundNight: "#083344",
    accentColor: "#38bdf8", secondaryColor: "#f472b6",
    skylineStyle: "kintex_and_park",
    landmark: "ilsan_lake_fountain",
    waterfront: "lake",
    treeCount: 4,
    extra: "singing_fountain"
  },
  gg_bucheon: {
    theme: "central_park_towers",
    groundDay: "#334155", groundNight: "#1e293b",
    accentColor: "#8b5cf6", secondaryColor: "#38bdf8",
    skylineStyle: "bucheon_midrise",
    landmark: "bucheon_cartoon_arch",
    waterfront: false,
    treeCount: 3,
    extra: "park_promenade"
  },
  gg_anyang: {
    theme: "beomgye_rodeo_art",
    groundDay: "#3f3f46", groundNight: "#18181b",
    accentColor: "#f97316", secondaryColor: "#38bdf8",
    skylineStyle: "station_plaza",
    landmark: "anyang_art_pavilion",
    waterfront: false,
    treeCount: 2,
    extra: "sculpture_plaza"
  },
  gg_hanam: {
    theme: "misa_rowing_river",
    groundDay: "#1d4ed8", groundNight: "#0f172a",
    accentColor: "#38bdf8", secondaryColor: "#4ade80",
    skylineStyle: "misa_riverfront",
    landmark: "hanam_starfield_and_geomdansan",
    waterfront: "river",
    treeCount: 3,
    extra: "mountain_and_river"
  },
  gg_namyangju: {
    theme: "paldang_riverside",
    groundDay: "#1e40af", groundNight: "#0a1128",
    accentColor: "#22c55e", secondaryColor: "#bae6fd",
    skylineStyle: "country_villas",
    landmark: "paldang_dam_and_bukhangang",
    waterfront: "river",
    treeCount: 5,
    extra: "scenic_hills_river"
  },
  gg_uijeongbu: {
    theme: "dobongsan_happy_street",
    groundDay: "#3f3f46", groundNight: "#1c1917",
    accentColor: "#f43f5e", secondaryColor: "#fbbf24",
    skylineStyle: "northern_downtown",
    landmark: "dobongsan_rock_peaks",
    waterfront: false,
    treeCount: 3,
    extra: "rocky_mountain"
  },
  gg_gimpo: {
    theme: "laveniche_venice_canal",
    groundDay: "#0369a1", groundNight: "#082f49",
    accentColor: "#38bdf8", secondaryColor: "#f59e0b",
    skylineStyle: "venetian_canal_shops",
    landmark: "gimpo_laveniche_moonboat",
    waterfront: "canal",
    treeCount: 2,
    extra: "moon_boats"
  },
  gg_yongin: {
    theme: "bojeong_fairy_lights",
    groundDay: "#44403c", groundNight: "#1c1917",
    accentColor: "#fbbf24", secondaryColor: "#fb7185",
    skylineStyle: "european_brick_alley",
    landmark: "bojeong_cafe_street_arch",
    waterfront: "stream",
    treeCount: 4,
    extra: "canopy_fairy_lights"
  }
};

export function getLocationSceneryConfig(locationId) {
  return LOCATION_SCENERY_CONFIGS[locationId] || LOCATION_SCENERY_CONFIGS.incheon_guwol;
}

function drawMountainRange(ctx, w, horizonY, isNight, peaks, baseColorDay, baseColorNight, snowCap = false) {
  ctx.save();
  ctx.fillStyle = isNight ? baseColorNight : baseColorDay;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  peaks.forEach(([rx, rh]) => {
    ctx.lineTo(w * rx, horizonY - rh);
  });
  ctx.lineTo(w, horizonY);
  ctx.closePath();
  ctx.fill();

  if (snowCap) {
    ctx.fillStyle = isNight ? "rgba(226, 232, 240, 0.45)" : "rgba(255, 255, 255, 0.85)";
    peaks.forEach(([rx, rh], i) => {
      if (i % 2 === 1 && rh > 65) {
        const px = w * rx;
        const py = horizonY - rh;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 18, py + 22);
        ctx.lineTo(px - 6, py + 18);
        ctx.lineTo(px + 5, py + 24);
        ctx.lineTo(px + 18, py + 20);
        ctx.closePath();
        ctx.fill();
      }
    });
  }
  ctx.restore();
}

function drawHanokHouse(ctx, x, horizonY, width, height, isNight, litLanterns = true) {
  ctx.save();
  // 기단 & 벽체
  ctx.fillStyle = isNight ? "#292524" : "#d6d3d1";
  ctx.fillRect(x + 6, horizonY - height + 14, width - 12, height - 14);

  // 나무 기둥
  ctx.fillStyle = "#451a03";
  ctx.fillRect(x + 8, horizonY - height + 14, 4, height - 14);
  ctx.fillRect(x + width - 12, horizonY - height + 14, 4, height - 14);
  ctx.fillRect(x + width * 0.5 - 2, horizonY - height + 14, 4, height - 14);

  // 창호지 문
  ctx.fillStyle = isNight ? "#fef08a" : "#f5f5f4";
  ctx.fillRect(x + 16, horizonY - height + 20, width * 0.28, height - 26);
  ctx.fillRect(x + width * 0.56, horizonY - height + 20, width * 0.28, height - 26);

  // 곡선 기와 지붕
  ctx.fillStyle = isNight ? "#0f172a" : "#1e293b";
  ctx.beginPath();
  ctx.moveTo(x - 6, horizonY - height + 16);
  ctx.quadraticCurveTo(x + width * 0.5, horizonY - height - 6, x + width + 6, horizonY - height + 16);
  ctx.lineTo(x + width - 2, horizonY - height + 20);
  ctx.quadraticCurveTo(x + width * 0.5, horizonY - height + 4, x + 2, horizonY - height + 20);
  ctx.closePath();
  ctx.fill();

  if (litLanterns && (isNight || true)) {
    ctx.fillStyle = isNight ? "#fb923c" : "#ef4444";
    ctx.beginPath();
    ctx.arc(x + 10, horizonY - height + 22, 3.2, 0, Math.PI * 2);
    ctx.arc(x + width - 10, horizonY - height + 22, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawLocationWindowScenery(ctx, { w, h, horizonY, isNight, isSunset, seasonIdx, weather, sec, locationId }) {
  const cfg = getLocationSceneryConfig(locationId);
  const isSnow = weather === "snow" || seasonIdx === 3;

  ctx.save();

  // 1) 원경 배경 (산맥 / 바다 수평선 / 스카이라인 실루엣)
  if (cfg.landmark === "gwanaksan_ridge" || cfg.landmark === "suraksan_bukhansan_peaks" || cfg.landmark === "dobongsan_rock_peaks" || cfg.landmark === "hanam_starfield_and_geomdansan" || cfg.landmark === "paldang_dam_and_bukhangang") {
    drawMountainRange(
      ctx, w, horizonY, isNight,
      [[0.0, 25], [0.18, 95], [0.34, 55], [0.52, 118], [0.70, 62], [0.86, 102], [1.0, 35]],
      "#475569", "#0f172a", isSnow
    );
  } else if (cfg.theme === "vintage_mill_island") {
    drawMountainRange(
      ctx, w, horizonY, isNight,
      [[0.0, 20], [0.25, 62], [0.55, 38], [0.82, 70], [1.0, 25]],
      "#4d7c0f", "#142615", isSnow
    );
  }

  // 원경 건물군
  if (cfg.skylineStyle === "gangnam_mega_towers" || cfg.skylineStyle === "songdo_skyscrapers" || cfg.skylineStyle === "yeouido_parc1" || cfg.skylineStyle === "glass_tech_campus" || cfg.skylineStyle === "jamsil_skyline") {
    ctx.fillStyle = isNight ? "#090f1d" : "rgba(30, 41, 59, 0.52)";
    for (let bx = -10; bx < w; bx += 72) {
      const bh = 95 + ((bx * 29) % 105);
      ctx.fillRect(bx, horizonY - bh, 56, bh + 20);
      // 유리 커튼월 세로 라인
      ctx.fillStyle = isNight ? "rgba(56, 189, 248, 0.16)" : "rgba(224, 242, 254, 0.25)";
      ctx.fillRect(bx + 14, horizonY - bh + 8, 3, bh - 12);
      ctx.fillRect(bx + 36, horizonY - bh + 8, 3, bh - 12);
      ctx.fillStyle = isNight ? "#090f1d" : "rgba(30, 41, 59, 0.52)";
    }
  } else if (cfg.skylineStyle !== "coastal_low" && cfg.skylineStyle !== "countryside_hills" && cfg.skylineStyle !== "hanok_roofs" && cfg.skylineStyle !== "layered_hanok") {
    ctx.fillStyle = isNight ? "#0b1120" : "rgba(51, 65, 85, 0.42)";
    for (let bx = -20; bx < w; bx += 84) {
      const bh = 68 + ((bx * 23) % 75);
      ctx.fillRect(bx, horizonY - bh, 64, bh + 20);
    }
  }

  // 2) 중경: 상권별 고유 건물 & 핵심 랜드마크
  if (cfg.skylineStyle === "hanok_roofs" || cfg.skylineStyle === "layered_hanok" || cfg.skylineStyle === "fortress_low") {
    for (let hx = w * 0.14; hx < w * 0.86; hx += 112) {
      drawHanokHouse(ctx, hx, horizonY, 96, 46 + ((Math.floor(hx) % 3) * 8), isNight, true);
    }
  } else if (cfg.skylineStyle === "coastal_low") {
    // 영종도 바다 수평선 & 방파제 등대
    const seaGrad = ctx.createLinearGradient(0, horizonY - 26, 0, horizonY + 8);
    seaGrad.addColorStop(0, isNight ? "#082f49" : "#0284c7");
    seaGrad.addColorStop(1, isNight ? "#0c4a6e" : "#38bdf8");
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, horizonY - 24, w, 32);

    // 잔물결 반짝임
    ctx.strokeStyle = isNight ? "rgba(186, 230, 253, 0.25)" : "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.3;
    for (let wy = horizonY - 18; wy < horizonY; wy += 6) {
      const shift = Math.sin(sec * 1.8 + wy) * 14;
      ctx.beginPath();
      ctx.moveTo(w * 0.2 + shift, wy);
      ctx.lineTo(w * 0.36 + shift, wy);
      ctx.moveTo(w * 0.58 - shift, wy + 2);
      ctx.lineTo(w * 0.78 - shift, wy + 2);
      ctx.stroke();
    }
  } else {
    // 일반 상권 건물열 (상권별 컬러 포인트 적용)
    const isBrick = cfg.skylineStyle.includes("brick") || cfg.skylineStyle.includes("theater");
    ctx.fillStyle = isNight ? "#0f172a" : (isBrick ? "#7c2d12" : "#334155");
    for (let bx = 0; bx < w; bx += 72) {
      const bh = 48 + ((bx * 17) % 68);
      ctx.fillRect(bx, horizonY - bh, 58, bh + 25);

      if (isNight || isSunset) {
        ctx.fillStyle = cfg.secondaryColor || "#fef08a";
        ctx.fillRect(bx + 11, horizonY - bh + 13, 7, 7);
        ctx.fillRect(bx + 34, horizonY - bh + 26, 7, 7);
        if (bx % 144 === 0) {
          ctx.fillStyle = cfg.accentColor || "#38bdf8";
          ctx.fillRect(bx + 12, horizonY - bh + 40, 22, 4);
        }
        ctx.fillStyle = isNight ? "#0f172a" : (isBrick ? "#7c2d12" : "#334155");
      }
    }
  }

  // ==================== 상권별 시그니처 랜드마크 오브젝트 (중앙 랜드마크 존) ====================
  const cx = w * 0.5;

  if (cfg.landmark === "lotte_world_tower") {
    // 잠실 롯데월드타워 (초고층 뾰족 타워)
    const tx = w * 0.56;
    const topY = horizonY - 178;
    const grad = ctx.createLinearGradient(tx - 18, topY, tx + 18, horizonY);
    grad.addColorStop(0, isNight ? "#38bdf8" : "#bae6fd");
    grad.addColorStop(1, isNight ? "#1e3a8a" : "#64748b");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(tx, topY);
    ctx.lineTo(tx - 20, horizonY);
    ctx.lineTo(tx + 20, horizonY);
    ctx.closePath();
    ctx.fill();
    // 항공장애등 점멸
    ctx.fillStyle = `rgba(244, 63, 94, ${0.4 + 0.6 * Math.abs(Math.sin(sec * 3))})`;
    ctx.beginPath();
    ctx.arc(tx, topY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (cfg.landmark === "n_seoul_tower") {
    // 이태원·한남 N서울타워
    const tx = w * 0.52;
    ctx.fillStyle = isNight ? "#1e293b" : "#475569";
    ctx.beginPath();
    ctx.moveTo(tx - 55, horizonY);
    ctx.quadraticCurveTo(tx, horizonY - 58, tx + 55, horizonY);
    ctx.fill();
    ctx.fillStyle = isNight ? "#cbd5e1" : "#f8fafc";
    ctx.fillRect(tx - 4, horizonY - 125, 8, 82);
    ctx.fillStyle = isNight ? "#f43f5e" : "#334155";
    ctx.beginPath();
    ctx.roundRect(tx - 16, horizonY - 134, 32, 14, 4);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(tx - 1.5, horizonY - 162, 3, 28);
  } else if (cfg.landmark === "yeouido_63_and_parc1") {
    // 여의도 63스퀘어(황금빛) + 파크원(붉은 기둥)
    const x63 = w * 0.43;
    ctx.fillStyle = isNight ? "#d97706" : "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(x63 - 14, horizonY - 138);
    ctx.lineTo(x63 + 14, horizonY - 138);
    ctx.lineTo(x63 + 20, horizonY);
    ctx.lineTo(x63 - 20, horizonY);
    ctx.closePath();
    ctx.fill();

    const xp1 = w * 0.58;
    ctx.fillStyle = isNight ? "#1e293b" : "#64748b";
    ctx.fillRect(xp1 - 18, horizonY - 150, 36, 150);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.strokeRect(xp1 - 18, horizonY - 150, 36, 150);
  } else if (cfg.landmark === "songdo_tribowl") {
    // 송도 트라이보울 + 포스코타워
    const px = w * 0.62;
    ctx.fillStyle = isNight ? "#0f172a" : "#475569";
    ctx.fillRect(px - 18, horizonY - 145, 36, 145);
    const tb = w * 0.44;
    ctx.fillStyle = isNight ? "#38bdf8" : "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(tb - 34, horizonY - 24);
    ctx.lineTo(tb + 34, horizonY - 24);
    ctx.lineTo(tb + 22, horizonY - 4);
    ctx.lineTo(tb - 22, horizonY - 4);
    ctx.closePath();
    ctx.fill();
  } else if (cfg.landmark === "cheongna_citytower") {
    // 청라 시티타워
    const tx = w * 0.5;
    ctx.strokeStyle = isNight ? "#22d3ee" : "#0284c7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx - 16, horizonY);
    ctx.lineTo(tx - 4, horizonY - 155);
    ctx.lineTo(tx + 4, horizonY - 155);
    ctx.lineTo(tx + 16, horizonY);
    ctx.stroke();
  } else if (cfg.landmark === "incheon_bridge_seagulls") {
    // 영종도 인천대교 주탑 & 갈매기
    const bx = w * 0.52;
    ctx.strokeStyle = isNight ? "#94a3b8" : "#f8fafc";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, horizonY - 22);
    ctx.lineTo(w * 0.85, horizonY - 22);
    ctx.moveTo(bx - 22, horizonY - 8);
    ctx.lineTo(bx - 16, horizonY - 76);
    ctx.moveTo(bx + 22, horizonY - 8);
    ctx.lineTo(bx + 16, horizonY - 76);
    ctx.stroke();
    // 갈매기
    ctx.strokeStyle = isNight ? "#cbd5e1" : "#1e293b";
    ctx.lineWidth = 1.6;
    [0.34, 0.41, 0.67].forEach((gx, idx) => {
      const sy = horizonY - 65 - idx * 12 + Math.sin(sec * 3 + idx) * 3;
      ctx.beginPath();
      ctx.moveTo(w * gx - 6, sy);
      ctx.quadraticCurveTo(w * gx - 3, sy - 5, w * gx, sy);
      ctx.quadraticCurveTo(w * gx + 3, sy - 5, w * gx + 6, sy);
      ctx.stroke();
    });
  } else if (cfg.landmark === "joyang_textile_mill") {
    // 강화도 조양방직 붉은 벽돌 방직공장 & 굴뚝
    ctx.fillStyle = isNight ? "#451a03" : "#9a3412";
    ctx.fillRect(cx - 58, horizonY - 56, 116, 56);
    ctx.fillRect(cx + 38, horizonY - 105, 14, 105);
    ctx.fillStyle = isNight ? "#fef08a" : "#bae6fd";
    for (let wx = cx - 46; wx <= cx + 22; wx += 22) {
      ctx.fillRect(wx, horizonY - 42, 12, 24);
    }
  } else if (cfg.landmark === "suwon_hwaseong_paldalmun") {
    // 수원 화성 성곽 & 팔달문 누각
    ctx.fillStyle = isNight ? "#44403c" : "#78716c";
    ctx.fillRect(w * 0.16, horizonY - 34, w * 0.68, 34);
    drawHanokHouse(ctx, cx - 54, horizonY - 30, 108, 44, isNight, true);
  } else if (cfg.landmark === "seoul_botanic_dome") {
    // 마곡 서울식물원 유리 온실 돔
    ctx.fillStyle = isNight ? "rgba(16, 185, 129, 0.25)" : "rgba(186, 230, 253, 0.65)";
    ctx.strokeStyle = isNight ? "#34d399" : "#0284c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, horizonY, 76, 46, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else if (cfg.landmark === "kondae_common_ground") {
    // 건대 커먼그라운드 블루 컨테이너
    ctx.fillStyle = isNight ? "#1d4ed8" : "#2563eb";
    ctx.fillRect(cx - 64, horizonY - 46, 128, 22);
    ctx.fillRect(cx - 54, horizonY - 24, 108, 24);
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 64, horizonY - 46, 128, 22);
  } else if (cfg.landmark === "gangnam_gt_tower" || cfg.landmark === "pangyo_skybridge") {
    // 강남 테헤란로 / 판교 스카이브릿지 트윈타워
    ctx.fillStyle = isNight ? "#1e293b" : "#3b82f6";
    ctx.fillRect(cx - 56, horizonY - 128, 38, 128);
    ctx.fillRect(cx + 18, horizonY - 128, 38, 128);
    ctx.fillStyle = isNight ? "#38bdf8" : "#bae6fd";
    ctx.fillRect(cx - 18, horizonY - 92, 36, 14);
  } else if (cfg.landmark === "hongdae_busking_stage" || cfg.landmark === "euljiro_retro_neon" || cfg.landmark === "bupyeong_station" || cfg.landmark === "guwol_rodeo") {
    // 홍대/을지로/부평/구월 화려한 거리 네온 간판 아치
    const pulse = 0.72 + 0.28 * Math.sin(sec * 4.5);
    ctx.strokeStyle = cfg.accentColor;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 48, horizonY - 64, 96, 26);
    ctx.fillStyle = cfg.secondaryColor;
    ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
    ctx.textAlign = "center";
    const signLabel = cfg.landmark === "hongdae_busking_stage" ? "LIVE BUSKING"
      : (cfg.landmark === "euljiro_retro_neon" ? "을지로 힙지로"
      : (cfg.landmark === "bupyeong_station" ? "문화의거리" : "RODEO PLAZA"));
    ctx.fillText(signLabel, cx, horizonY - 47);
    ctx.globalAlpha = 1;
  } else if (cfg.landmark === "seongsu_daelim_warehouse") {
    // 성수동 대림창고 붉은 벽돌 창고 + 루프탑 철골 크레인
    ctx.fillStyle = isNight ? "#451a03" : "#9a3412";
    ctx.fillRect(cx - 68, horizonY - 62, 136, 62);
    ctx.strokeStyle = isNight ? "#fb923c" : "#fef3c7";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 56, horizonY - 48, 34, 34);
    ctx.strokeRect(cx + 22, horizonY - 48, 34, 34);
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(cx - 10, horizonY - 82, 4, 20);
    ctx.fillRect(cx - 24, horizonY - 82, 32, 3);
  } else if (cfg.landmark === "apgujeong_galleria") {
    // 압구정 갤러리아 명품관 비늘 미디어파사드
    ctx.fillStyle = isNight ? "#1e1b4b" : "#cbd5e1";
    ctx.beginPath();
    ctx.roundRect(cx - 64, horizonY - 78, 128, 78, [18, 18, 0, 0]);
    ctx.fill();
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        const hue = (row * 40 + col * 35 + Math.floor(sec * 50)) % 360;
        ctx.fillStyle = isNight ? `hsla(${hue}, 85%, 65%, 0.75)` : "rgba(254, 243, 195, 0.7)";
        ctx.beginPath();
        ctx.arc(cx - 48 + col * 16, horizonY - 62 + row * 15, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (cfg.landmark === "ikseon_hanok_courtyard") {
    // 종로 익선동 한옥 골목 유리온실 캐노피 & 청사초롱
    drawHanokHouse(ctx, cx - 72, horizonY, 68, 48, isNight, true);
    drawHanokHouse(ctx, cx + 4, horizonY, 68, 48, isNight, true);
    ctx.strokeStyle = "rgba(186, 230, 253, 0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, horizonY - 42);
    ctx.lineTo(cx, horizonY - 54);
    ctx.lineTo(cx + 12, horizonY - 42);
    ctx.stroke();
  } else if (cfg.landmark === "bukchon_gyeongbok_gate") {
    // 삼청동·북촌 경복궁 광화문 돌담길과 2층 누각
    ctx.fillStyle = isNight ? "#44403c" : "#a8a29e";
    ctx.fillRect(cx - 68, horizonY - 32, 136, 32);
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(cx, horizonY, 16, Math.PI, 0);
    ctx.fill();
    drawHanokHouse(ctx, cx - 56, horizonY - 30, 112, 38, isNight, false);
  } else if (cfg.landmark === "sinchon_red_periscope") {
    // 신촌·이대 빨간 잠망경 조형물 & 대학 시계탑
    ctx.fillStyle = isNight ? "#7f1d1d" : "#991b1b";
    ctx.fillRect(cx + 18, horizonY - 96, 34, 96);
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.arc(cx + 35, horizonY - 74, 9, 0, Math.PI * 2);
    ctx.fill();
    // 신촌 빨간 잠망경 조형물
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - 28, horizonY);
    ctx.lineTo(cx - 28, horizonY - 48);
    ctx.lineTo(cx - 10, horizonY - 48);
    ctx.stroke();
  } else if (cfg.landmark === "mokdong_hyperion_and_sbs") {
    // 목동 하이페리온 초고층 트윈 & 방송국 송신탑
    ctx.fillStyle = isNight ? "#0f172a" : "#475569";
    ctx.fillRect(cx - 52, horizonY - 148, 32, 148);
    ctx.fillRect(cx - 12, horizonY - 132, 30, 132);
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx + 38, horizonY);
    ctx.lineTo(cx + 44, horizonY - 115);
    ctx.lineTo(cx + 50, horizonY);
    ctx.stroke();
  } else if (cfg.landmark === "marronnier_naksan_wall") {
    // 대학로 혜화 마로니에 붉은 벽돌 극장 & 낙산 성곽
    ctx.fillStyle = isNight ? "#451a03" : "#b91c1c";
    ctx.fillRect(cx - 54, horizonY - 68, 108, 68);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(cx - 38, horizonY - 54, 76, 16);
    ctx.fillStyle = "#1c1917";
    ctx.font = "bold 10px 'Noto Sans KR', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("THEATER", cx, horizonY - 42);
  } else if (cfg.landmark === "garosu_ginkgo_avenue") {
    // 신사 가로수길 황금 은행나무 가로수 아치 & 디자이너 쇼룸
    ctx.fillStyle = isNight ? "#1c1917" : "#f5f5f4";
    ctx.fillRect(cx - 48, horizonY - 66, 96, 66);
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 42, horizonY - 56, 84, 48);
  } else if (cfg.landmark === "tanchon_park_bridge") {
    // 분당 정자동 탄천 아치 보도교 & 유럽풍 테라스
    ctx.strokeStyle = isNight ? "#34d399" : "#f8fafc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, horizonY + 4, 58, Math.PI, 0);
    ctx.stroke();
  } else if (cfg.landmark === "ilsan_lake_fountain") {
    // 고양 일산호수공원 노래하는 분수대 물줄기
    const spray = 24 + Math.sin(sec * 5) * 8;
    ctx.strokeStyle = isNight ? "#38bdf8" : "#e0f2fe";
    ctx.lineWidth = 2;
    [-18, -6, 6, 18].forEach((ox, idx) => {
      ctx.beginPath();
      ctx.moveTo(cx + ox, horizonY + 8);
      ctx.quadraticCurveTo(cx + ox * 1.4, horizonY - spray - (idx % 2) * 10, cx + ox * 2.1, horizonY + 8);
      ctx.stroke();
    });
  } else if (cfg.landmark === "bucheon_cartoon_arch") {
    // 부천 상동 한국만화박물관 돔 & 컬러 아치
    ctx.fillStyle = isNight ? "#4c1d95" : "#8b5cf6";
    ctx.beginPath();
    ctx.arc(cx, horizonY, 44, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cx - 56, horizonY - 54, 112, 54);
  } else if (cfg.landmark === "anyang_art_pavilion") {
    // 안양 범계 파빌리온 조형물 & 역광장 시계탑
    ctx.strokeStyle = isNight ? "#fb923c" : "#f97316";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 46, horizonY);
    ctx.bezierCurveTo(cx - 20, horizonY - 68, cx + 20, horizonY - 18, cx + 46, horizonY - 56);
    ctx.stroke();
  } else if (cfg.landmark === "bojeong_cafe_street_arch") {
    // 용인 보정동 카페거리 유럽풍 웰컴 아치 & 전구 캐노피
    ctx.strokeStyle = isNight ? "#fbbf24" : "#b45309";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 52, horizonY);
    ctx.lineTo(cx - 52, horizonY - 56);
    ctx.quadraticCurveTo(cx, horizonY - 76, cx + 52, horizonY - 56);
    ctx.lineTo(cx + 52, horizonY);
    ctx.stroke();
  } else if (cfg.landmark === "gimpo_laveniche_moonboat") {
    // 김포 라베니체 초승달 보트
    const bx = cx + Math.sin(sec * 0.8) * 35;
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(bx, horizonY + 12, 11, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.fill();
  }

  // 3) 근경 바닥 / 수변(한강·호수·운하·바다·개천) 렌더링
  const groundColor = isSnow ? "#e2e8f0" : (isNight ? cfg.groundNight : cfg.groundDay);
  ctx.fillStyle = groundColor;
  ctx.fillRect(0, horizonY, w, h * 0.14);

  if (cfg.waterfront) {
    const waterGrad = ctx.createLinearGradient(0, horizonY + 2, 0, horizonY + 36);
    waterGrad.addColorStop(0, isNight ? "#0c4a6e" : "#0284c7");
    waterGrad.addColorStop(1, isNight ? "#082f49" : "#38bdf8");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, horizonY + 3, w, 30);

    // 물결 반사광
    ctx.fillStyle = isNight ? "rgba(253, 224, 71, 0.28)" : "rgba(255, 255, 255, 0.42)";
    for (let i = 0; i < 6; i++) {
      const rx = ((i * 150 + sec * 22) % (w * 0.8)) + w * 0.1;
      ctx.fillRect(rx, horizonY + 10 + (i % 3) * 6, 32, 2);
    }
  }

  // 용인 보정동 / 익선동 / 홍대 / 이태원 전구 스트링 조명
  if (cfg.extra === "canopy_fairy_lights" || cfg.extra === "terrace_string_lights" || cfg.extra === "paper_lanterns" || cfg.extra === "murals_and_lights") {
    ctx.strokeStyle = "rgba(28, 25, 23, 0.65)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, horizonY - 58);
    ctx.quadraticCurveTo(w * 0.5, horizonY - 40, w * 0.85, horizonY - 58);
    ctx.stroke();

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const lx = w * (0.15 + t * 0.70);
      const ly = horizonY - 58 + Math.sin(t * Math.PI) * 18;
      ctx.fillStyle = cfg.extra === "paper_lanterns"
        ? (i % 2 === 0 ? "#fb7185" : "#fbbf24")
        : (isNight ? "#fef08a" : "#fde047");
      ctx.beginPath();
      ctx.arc(lx, ly + 3, cfg.extra === "paper_lanterns" ? 4.2 : 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 가로등 (밤/노을/비)
  if (isNight || isSunset || weather === "rain") {
    [0.31, 0.69].forEach(lxR => {
      const slx = w * lxR;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(slx - 2, horizonY - 46, 4, 48);
      const lampGlow = ctx.createRadialGradient(slx, horizonY - 46, 2, slx, horizonY - 46, 42);
      lampGlow.addColorStop(0, "rgba(253, 224, 71, 0.65)");
      lampGlow.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(slx, horizonY - 46, 42, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 4) 계절별 가로수 (신사 가로수길은 은행나무 특화, 그 외 계절별 수목)
  const treePositions = cfg.treeCount === 0 ? []
    : (cfg.treeCount === 1 ? [0.22]
    : (cfg.treeCount === 2 ? [0.23, 0.77]
    : (cfg.treeCount === 3 ? [0.20, 0.50, 0.80]
    : [0.18, 0.36, 0.64, 0.82])));

  const treePalettes = cfg.extra === "ginkgo_trees"
    ? [
        { main: "#4ade80", sub: "#bbf7d0" },
        { main: "#16a34a", sub: "#86efac" },
        { main: "#eab308", sub: "#fef08a" }, // 가로수길 황금 은행잎
        { main: "#a8a29e", sub: "#f8fafc" }
      ]
    : [
        { main: "#f472b6", sub: "#fbcfe8" },
        { main: "#15803d", sub: "#4ade80" },
        { main: "#ea580c", sub: "#fbbf24" },
        { main: "#94a3b8", sub: "#f8fafc" }
      ];
  const treePal = treePalettes[seasonIdx] || treePalettes[0];

  treePositions.forEach(txRatio => {
    const tx = w * txRatio;
    const sway = Math.sin(sec * 1.5 + txRatio * 5) * 2.5;
    ctx.fillStyle = "#451a03";
    ctx.fillRect(tx - 5, horizonY - 42, 10, 46);
    ctx.fillStyle = treePal.main;
    ctx.beginPath();
    ctx.arc(tx + sway, horizonY - 54, 32, 0, Math.PI * 2);
    ctx.arc(tx - 18 + sway, horizonY - 45, 21, 0, Math.PI * 2);
    ctx.arc(tx + 18 + sway, horizonY - 45, 21, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = treePal.sub;
    ctx.beginPath();
    ctx.arc(tx - 7 + sway, horizonY - 62, 16, 0, Math.PI * 2);
    ctx.arc(tx + 11 + sway, horizonY - 52, 13, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
