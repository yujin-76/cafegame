// 수도권 지도 · 본점 · 지점 · 건물
    // ==================== 수도권 지도 핀치 줌 & 드래그 ====================
    const MAP_BASE_W = 1200;
    const MAP_BASE_H = 900;

    const mapState = {
      x: -140,
      y: -120,
      scale: 0.78,
      isDragging: false,
      startX: 0,
      startY: 0,
      lastPinchDist: 0
    };

    function getMinMapScale() {
      const vp = document.getElementById("metroMapViewport");
      const vw = (vp && vp.clientWidth) || window.innerWidth || 800;
      const vh = (vp && vp.clientHeight) || (window.innerHeight * 0.62) || 500;
      // 화면의 약 72% 이상을 채우도록 최소 축소 배율 제한 (너무 작게 축소되는 현상 방지)
      const fitScale = Math.max((vw * 0.72) / MAP_BASE_W, (vh * 0.72) / MAP_BASE_H);
      const floorScale = vw < 640 ? 0.58 : 0.72;
      return Math.min(1.4, Math.max(floorScale, Number(fitScale.toFixed(2))));
    }

    function getMaxMapScale() {
      return 2.0;
    }

    function clampMapPosition(scale) {
      const vp = document.getElementById("metroMapViewport");
      const vw = (vp && vp.clientWidth) || window.innerWidth || 800;
      const vh = (vp && vp.clientHeight) || (window.innerHeight * 0.62) || 500;
      const scaledW = MAP_BASE_W * scale;
      const scaledH = MAP_BASE_H * scale;
      const padX = Math.min(140, vw * 0.25);
      const padY = Math.min(110, vh * 0.22);

      if (scaledW <= vw) {
        mapState.x = (vw - scaledW) / 2;
      } else {
        const minX = vw - scaledW - padX;
        const maxX = padX;
        mapState.x = Math.min(maxX, Math.max(minX, mapState.x));
      }

      if (scaledH <= vh) {
        mapState.y = (vh - scaledH) / 2;
      } else {
        const minY = vh - scaledH - padY;
        const maxY = padY;
        mapState.y = Math.min(maxY, Math.max(minY, mapState.y));
      }
    }

    function snapPx(val) {
      return Math.round(val * 2) / 2;
    }

    function applyMapTransform() {
      const minScale = getMinMapScale();
      const maxScale = getMaxMapScale();
      mapState.scale = Math.min(maxScale, Math.max(minScale, mapState.scale));
      clampMapPosition(mapState.scale);

      const el = document.getElementById("metroMapTransform");
      if (!el) return;

      // 확대 시 글씨가 덜 뭉개지도록 핀 스케일은 과도하게 키우거나 줄이지 않고 깔끔한 범위 유지
      const pinScale = Math.max(0.78, Math.min(1.08, 1 / Math.pow(mapState.scale, 0.35)));
      const sx = snapPx(mapState.x);
      const sy = snapPx(mapState.y);
      const sc = Number(mapState.scale.toFixed(3));
      el.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${sc})`;

      document.querySelectorAll(".metro-pin-btn").forEach(btn => {
        const isSel = btn.dataset.selected === "1";
        const pScale = Number((pinScale * (isSel ? 1.08 : 1)).toFixed(3));
        btn.style.transform = `translate(-50%, -50%) scale(${pScale})`;
      });
    }

    window.zoomMapBy = (delta) => {
      const vp = document.getElementById("metroMapViewport");
      const cx = (vp && vp.clientWidth ? vp.clientWidth : window.innerWidth) / 2;
      const cy = (vp && vp.clientHeight ? vp.clientHeight : window.innerHeight * 0.65) / 2;
      const minScale = getMinMapScale();
      const maxScale = getMaxMapScale();
      const prevScale = mapState.scale;
      const nextScale = Math.min(maxScale, Math.max(minScale, prevScale + delta));
      if (Math.abs(nextScale - prevScale) < 0.0001) return;

      mapState.x = cx - ((cx - mapState.x) / prevScale) * nextScale;
      mapState.y = cy - ((cy - mapState.y) / prevScale) * nextScale;
      mapState.scale = nextScale;
      applyMapTransform();
    };

    window.focusMapRegion = (region) => {
      const vp = document.getElementById("metroMapViewport");
      const vw = (vp && vp.clientWidth) || window.innerWidth;
      const vh = (vp && vp.clientHeight) || window.innerHeight * 0.65;
      const minScale = getMinMapScale();

      const presets = {
        all: { tx: 520, ty: 440, s: Math.max(minScale, vw < 640 ? 0.62 : 0.8) },
        seoul: { tx: 550, ty: 385, s: vw < 640 ? 1.15 : 1.38 },
        incheon: { tx: 270, ty: 420, s: vw < 640 ? 1.0 : 1.25 },
        gyeonggi_south: { tx: 580, ty: 575, s: vw < 640 ? 0.95 : 1.2 },
        gyeonggi_north: { tx: 560, ty: 290, s: vw < 640 ? 0.95 : 1.2 }
      };
      const p = presets[region] || presets.all;
      mapState.scale = Math.max(minScale, p.s);
      mapState.x = vw / 2 - p.tx * mapState.scale;
      mapState.y = vh / 2 - p.ty * mapState.scale;
      applyMapTransform();
    };

    (function initMapGestures() {
      const vp = document.getElementById("metroMapViewport");

      vp.addEventListener("mousedown", e => {
        if (e.target.closest("button")) return;
        mapState.isDragging = true;
        mapState.startX = e.clientX - mapState.x;
        mapState.startY = e.clientY - mapState.y;
      });
      window.addEventListener("mousemove", e => {
        if (!mapState.isDragging) return;
        mapState.x = e.clientX - mapState.startX;
        mapState.y = e.clientY - mapState.startY;
        applyMapTransform();
      });
      window.addEventListener("mouseup", () => { mapState.isDragging = false; });

      vp.addEventListener("wheel", e => {
        e.preventDefault();
        zoomMapBy(e.deltaY < 0 ? 0.14 : -0.14);
      }, { passive: false });

      vp.addEventListener("touchstart", e => {
        if (e.touches.length === 1) {
          mapState.isDragging = true;
          mapState.startX = e.touches[0].clientX - mapState.x;
          mapState.startY = e.touches[0].clientY - mapState.y;
        } else if (e.touches.length === 2) {
          mapState.isDragging = false;
          mapState.lastPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      vp.addEventListener("touchmove", e => {
        e.preventDefault();
        if (e.touches.length === 1 && mapState.isDragging) {
          mapState.x = e.touches[0].clientX - mapState.startX;
          mapState.y = e.touches[0].clientY - mapState.startY;
          applyMapTransform();
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (mapState.lastPinchDist > 0) {
            const diff = (dist - mapState.lastPinchDist) * 0.004;
            zoomMapBy(diff);
          }
          mapState.lastPinchDist = dist;
        }
      }, { passive: false });

      vp.addEventListener("touchend", () => {
        mapState.isDragging = false;
        mapState.lastPinchDist = 0;
      });

      window.addEventListener("resize", () => {
        applyMapTransform();
      });
    })();

    function renderMetroPins() {
      const layer = document.getElementById("metroPinsLayer");
      layer.innerHTML = METRO_LOCATIONS.map(loc => {
        const isHq = state.hqLocationId === loc.id;
        const isBranch = state.branches.includes(loc.id);
        const isBld = state.buildings.includes(loc.id);
        const isSel = selectedMapLocId === loc.id;
        const isRecStart = isInitialLocationSelection && RECOMMENDED_START_IDS.includes(loc.id);

        let badgeBg = "bg-stone-900/95 border-stone-500 text-stone-100";
        let icon = "📍";
        if (isRecStart) {
          badgeBg = "bg-amber-950/95 border-amber-400 text-amber-200 font-extrabold pin-recommend-glow";
          icon = "✨";
        } else if (!isInitialLocationSelection && isHq) {
          badgeBg = "bg-amber-500 border-white text-stone-950 font-black";
          icon = "👑";
        } else if (!isInitialLocationSelection && isBld) {
          badgeBg = "bg-purple-600 border-purple-200 text-white";
          icon = "🏢";
        } else if (!isInitialLocationSelection && isBranch) {
          badgeBg = "bg-emerald-600 border-emerald-200 text-white";
          icon = "🏪";
        }

        return `
          <button onclick="selectMapLocation('${loc.id}')"
            data-selected="${isSel ? "1" : "0"}"
            style="left:${loc.x}px; top:${loc.y}px;"
            class="metro-pin-btn absolute px-1.5 py-0.5 rounded-full border shadow-md text-[10px] leading-none whitespace-nowrap transition-colors ${badgeBg} ${isSel ? "ring-2 ring-white z-30" : isRecStart ? "z-20" : "z-10"}">
            ${icon} ${loc.name} <span class="opacity-80 text-[9px]">${loc.mult}x</span>
          </button>
        `;
      }).join("");
      applyMapTransform();
    }

    window.selectMapLocation = (locId) => {
      selectedMapLocId = locId;
      renderMetroPins();
      updateSelectedLocationPanel();
    };

    function updateSelectedLocationPanel() {
      const loc = METRO_LOCATIONS.find(l => l.id === selectedMapLocId) || METRO_LOCATIONS[0];
      const isHq = state.hqLocationId === loc.id;
      const isBranch = state.branches.includes(loc.id);
      const isBld = state.buildings.includes(loc.id);
      const isRecStart = isInitialLocationSelection && RECOMMENDED_START_IDS.includes(loc.id);

      document.getElementById("selLocRegion").textContent = loc.region;
      document.getElementById("selLocName").textContent = loc.name;
      document.getElementById("selLocOwned").textContent = isInitialLocationSelection
        ? (isRecStart ? "✨ 추천 초기 상권" : loc.deposit <= 8000000 ? "✅ 개업 가능 상권" : "🔒 초기 자본 초과")
        : (isHq ? "👑 본점 운영중" : isBld ? "🏢 건물주 소유" : isBranch ? "🏪 직영점 운영" : "미진출 상권");
      document.getElementById("selLocStats").textContent =
        `매출배율 ${loc.mult}배 · 보증금 ${(loc.deposit/10000).toLocaleString()}만 · 월세 ${(loc.rent/10000).toLocaleString()}만 · 지점인수 ${(loc.branchPrice/10000).toLocaleString()}만 · 통매입 ${(loc.buildingPrice/10000).toLocaleString()}만`;

      const actBox = document.getElementById("selLocActions");
      if (isInitialLocationSelection) {
        const canAfford = loc.deposit <= 8000000;
        const remainCash = 8000000 - loc.deposit;
        actBox.innerHTML = canAfford
          ? `<button onclick="confirmInitialLocation('${loc.id}')" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-stone-950 text-xs sm:text-sm font-black shadow-lg">
              ✨ 이 상권에서 카페 개업하기 (보증금 ${(loc.deposit/10000).toLocaleString()}만 · 잔여 ${(remainCash/10000).toLocaleString()}만)
             </button>`
          : `<span class="px-3 py-2 rounded-xl bg-stone-800 text-rose-400 text-xs font-bold">
              보증금 부족 (초기 자본 800만 원 이하 상권을 선택하세요)
             </span>`;
        return;
      }

      const currentViewId = state.activeViewLocationId || state.hqLocationId;
      let btns = "";
      if ((isHq || isBranch) && currentViewId !== loc.id) {
        btns += `<button onclick="visitStoreView('${loc.id}')" class="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold">🪟 이 매장 창밖 보기</button>`;
      }
      if (!isHq) {
        btns += `<button onclick="moveHq('${loc.id}')" class="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold">본점 이사 (${(loc.deposit/10000).toLocaleString()}만)</button>`;
      }
      if (!isHq && !isBranch) {
        btns += `<button onclick="buyBranch('${loc.id}')" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold">지점 인수 (${(loc.branchPrice/10000).toLocaleString()}만)</button>`;
      }
      if (!isBld) {
        btns += `<button onclick="buyBuilding('${loc.id}')" class="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold">건물 통매입 (${(loc.buildingPrice/10000).toLocaleString()}만)</button>`;
      }
      actBox.innerHTML = btns;
    }

    window.visitStoreView = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (!loc) return;
      state.activeViewLocationId = locId;
      closeModal("mapModal");
      updateHUD();
      showToast(`🪟 '${loc.region} ${loc.name}' 매장 창밖 풍경으로 전환했습니다!`, "sky");
    };

    window.moveHq = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (state.cash < loc.deposit) return showToast("이사 보증금이 부족합니다!", "rose");
      state.cash -= loc.deposit;
      state.hqLocationId = locId;
      state.activeViewLocationId = locId;
      showToast(`🚚 '${loc.region} ${loc.name}' 상권으로 본점을 이전했습니다! 창밖 풍경이 바뀝니다.`, "amber");
      updateHUD();
      renderMetroPins();
      updateSelectedLocationPanel();
      saveCloudProgress(false);
    };

    window.buyBranch = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (state.cash < loc.branchPrice) return showToast("지점 인수 자금이 부족합니다!", "rose");
      state.cash -= loc.branchPrice;
      state.branches.push(locId);
      showToast(`🏪 '${loc.name}' 직영 지점을 오픈했습니다!`, "emerald");
      updateHUD();
      renderMetroPins();
      updateSelectedLocationPanel();
      saveCloudProgress(false);

      if (typeof window.showPurchaseConfirmModal === "function") {
        window.showPurchaseConfirmModal({
          icon: "🏪",
          title: `'${loc.region} ${loc.name}' 직영 지점 인수 완료!`,
          summary: `인수 금액: <b>-${loc.branchPrice.toLocaleString()}원</b><br/>매 16일 정산마다 지점 수익이 자동 입금됩니다.`,
          promptText: "수도권 다른 상권의 지점이나 건물도 계속 추가 매입하시겠습니까?",
          stayLabel: "🗺️ 지도에서 추가 매입",
          doneLabel: "매장으로 돌아가기",
          onDone: () => closeModal("mapModal")
        });
      }
    };

    window.buyBuilding = (locId) => {
      const loc = METRO_LOCATIONS.find(l => l.id === locId);
      if (state.cash < loc.buildingPrice) return showToast("건물 매입 자금이 부족합니다!", "rose");
      state.cash -= loc.buildingPrice;
      state.buildings.push(locId);
      showToast(`🏢 '${loc.name}' 상가 건물주가 되었습니다!`, "purple");
      updateHUD();
      renderMetroPins();
      updateSelectedLocationPanel();
      saveCloudProgress(false);

      if (typeof window.showPurchaseConfirmModal === "function") {
        window.showPurchaseConfirmModal({
          icon: "🏢",
          title: `'${loc.region} ${loc.name}' 상가 건물 매입 완료!`,
          summary: `매입 금액: <b>-${loc.buildingPrice.toLocaleString()}원</b><br/>월세 면제 및 16일 주기 임대수익이 발생합니다.`,
          promptText: "다른 상권의 부동산이나 지점도 계속 추가 매입하시겠습니까?",
          stayLabel: "🗺️ 지도에서 추가 매입",
          doneLabel: "매장으로 돌아가기",
          onDone: () => closeModal("mapModal")
        });
      }
    };
