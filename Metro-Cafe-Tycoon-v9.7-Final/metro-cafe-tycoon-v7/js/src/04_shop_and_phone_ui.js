// 매장 UI · POS · 배팡 스타일 카페파트너스 가구몰 · 스마트폰 앱 · 홍보
    let shopState = {
      category: "all",       // all | table | decor | rug
      search: "",
      sort: "recommended",   // recommended | priceAsc | priceDesc | bonusDesc
      rocketOnly: false,
      unownedOnly: false,
      showPlacementDrawer: false,
      selectedProductId: null
    };

    let customMenuDraft = {
      open: false,
      name: "",
      useCoffee: true,
      selectedIngredients: [],
      customPrice: ""
    };

    let marketUiState = {
      category: "all",       // all | base | syrup | fruit | topping
      search: "",
      subTab: "shop"         // shop | stock | delivery
    };

    window.toggleScenicMode = (enable) => {
      scenicMode = enable;
      document.body.classList.toggle("scenic-mode", enable);
    };

    window.openModal = (id) => {
      document.getElementById(id).classList.remove("hidden");
      if (id === "posModal") renderPosModal();
      if (id === "phoneModal") {
        if (typeof clearPhoneAppAlert === "function") clearPhoneAppAlert(activePhoneApp);
        renderPhoneApp();
      }
      if (id === "mapModal") {
        renderMetroPins();
        updateSelectedLocationPanel();
      }
      if (id === "ledgerModal") renderLedgerModal();
      if (id === "rankModal") loadRankings();
    };

    window.closeModal = (id) => {
      document.getElementById(id).classList.add("hidden");
    };

    window.switchPosTab = (tab) => {
      activePosTab = tab;
      ["menu", "staff", "regulars"].forEach(t => {
        const btn = document.getElementById(`posTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        btn.className = t === tab ? "py-2 rounded-xl bg-amber-600 text-white" : "py-2 rounded-xl text-stone-400";
      });
      renderPosModal();
    };

    window.setShopCategory = (cat) => {
      shopState.category = cat;
      renderPosModal();
    };

    window.setShopSearch = (val) => {
      shopState.search = val;
      renderPosModal();
      const inp = document.getElementById("baepangSearchInput");
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    };

    window.setShopSort = (val) => {
      shopState.sort = val;
      renderPosModal();
    };

    window.toggleShopFilter = (key) => {
      shopState[key] = !shopState[key];
      renderPosModal();
    };

    window.togglePlacementDrawer = () => {
      shopState.showPlacementDrawer = !shopState.showPlacementDrawer;
      renderPosModal();
    };

    window.openProductDetail = (fid) => {
      shopState.selectedProductId = fid;
      renderPosModal();
    };

    window.closeProductDetail = () => {
      shopState.selectedProductId = null;
      renderPosModal();
    };

    function renderStarRating(rating) {
      const full = Math.floor(rating);
      return "★".repeat(full) + (rating - full >= 0.5 ? "½" : "");
    }

    function renderBaepangFurnitureMall() {
      ensureFurnitureState();

      const ownedTables = FURNITURE_CATALOG.filter(f => f.category === "table" && state.ownedFurniture.includes(f.id));
      const ownedDecors = FURNITURE_CATALOG.filter(f => f.category === "decor" && state.ownedFurniture.includes(f.id));
      const ownedRugs = FURNITURE_CATALOG.filter(f => f.category === "rug" && state.ownedFurniture.includes(f.id));

      // 필터 및 정렬 적용
      let filtered = FURNITURE_CATALOG.filter(item => {
        if (shopState.category !== "all" && item.category !== shopState.category) return false;
        if (shopState.rocketOnly && !item.rocket) return false;
        if (shopState.unownedOnly && state.ownedFurniture.includes(item.id)) return false;
        if (shopState.search.trim()) {
          const q = shopState.search.trim().toLowerCase();
          const hay = `${item.name} ${item.brand || ""} ${item.desc} ${item.badge || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      if (shopState.sort === "priceAsc") {
        filtered = [...filtered].sort((a, b) => a.price - b.price);
      } else if (shopState.sort === "priceDesc") {
        filtered = [...filtered].sort((a, b) => b.price - a.price);
      } else if (shopState.sort === "bonusDesc") {
        filtered = [...filtered].sort((a, b) => b.tipBonus - a.tipBonus);
      }

      const detailItem = shopState.selectedProductId
        ? FURNITURE_CATALOG.find(f => f.id === shopState.selectedProductId)
        : null;

      // 상품 상세 모달 뷰 (배팡 상품 상세페이지 감성)
      const detailOverlayHtml = detailItem ? (() => {
        const owned = state.ownedFurniture.includes(detailItem.id);
        const catName = detailItem.category === "table" ? "테이블·소파" : detailItem.category === "decor" ? "조명·플랜트·오브제" : "홀 러그·카펫";
        return `
          <div class="bg-white text-slate-900 rounded-2xl border-2 border-[#346aff] shadow-xl overflow-hidden mb-3">
            <div class="bg-[#346aff] text-white px-3.5 py-2 flex items-center justify-between">
              <span class="text-xs font-black tracking-tight">Baepang <span class="text-amber-300">카페파트너스</span> 상품상세</span>
              <button onclick="closeProductDetail()" class="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full font-bold">← 목록으로</button>
            </div>
            <div class="p-3.5 space-y-2.5">
              <div class="flex gap-3 items-start">
                <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-amber-50 border border-slate-200 flex flex-col items-center justify-center shrink-0 relative">
                  <span class="text-3xl">${detailItem.icon || "🛋️"}</span>
                  <span class="text-[9px] font-extrabold text-slate-500 mt-1">${catName}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] font-bold text-[#346aff]">${detailItem.brand || "메트로리빙"} &gt;</span>
                    ${detailItem.badge ? `<span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">${detailItem.badge}</span>` : ""}
                  </div>
                  <h4 class="font-black text-sm text-slate-900 mt-0.5 leading-snug">${detailItem.name}</h4>
                  <div class="flex items-center gap-1.5 text-[11px] mt-1">
                    <span class="text-amber-400 font-black">${renderStarRating(detailItem.rating || 4.8)}</span>
                    <span class="font-bold text-slate-700">${(detailItem.rating || 4.8).toFixed(1)}</span>
                    <span class="text-slate-400">(${(detailItem.reviews || 120).toLocaleString()}개 상품평)</span>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                ${detailItem.price > 0 ? `
                  <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span class="font-extrabold text-rose-600">${detailItem.discountRate || 20}%</span>
                    <span class="line-through">${(detailItem.originalPrice || Math.round(detailItem.price * 1.25)).toLocaleString()}원</span>
                    <span class="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">와우회원가</span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-lg font-black text-[#ae0000]">${detailItem.price.toLocaleString()}<span class="text-xs font-bold">원</span></span>
                    <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#e8f1ff] text-[#0073e9] text-[10px] font-black">🚀 로켓설치 · 내일(새벽) 도착보장</span>
                  </div>
                ` : `
                  <div class="text-base font-black text-emerald-700">0원 (개업 기본 제공 상품)</div>
                `}
                <div class="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-200 text-[11px]">
                  <div class="bg-white rounded-lg px-2 py-1 border border-slate-200">
                    <span class="text-slate-500">메뉴 단가 보너스</span>
                    <div class="font-black text-[#0073e9]">+${Math.round((detailItem.tipBonus || 0) * 100)}% 상승</div>
                  </div>
                  <div class="bg-white rounded-lg px-2 py-1 border border-slate-200">
                    <span class="text-slate-500">매장 평판 상승</span>
                    <div class="font-black text-amber-600">+${detailItem.rep || 0} 점</div>
                  </div>
                </div>
              </div>

              <p class="text-xs text-slate-700 leading-relaxed bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5">
                📋 <b>상품 요약:</b> ${detailItem.desc}
              </p>

              <div class="flex gap-2">
                ${owned
                  ? `<button disabled class="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs">✅ 구매 완료 (창고 보유중 · 배치 가능)</button>`
                  : `<button onclick="buyFurniture('${detailItem.id}', event)" class="flex-1 py-2.5 rounded-xl bg-[#346aff] hover:bg-[#2356e8] text-white font-black text-xs shadow">🚀 로켓설치 바로구매 (${detailItem.price.toLocaleString()}원)</button>`
                }
              </div>
            </div>
          </div>
        `;
      })() : "";

      // 홀 가구 배치 패널 (접이식 토글)
      const placementPanelHtml = shopState.showPlacementDrawer ? `
        <div class="bg-slate-900 text-white border-2 border-[#346aff] rounded-2xl p-3 space-y-2.5 mb-3 shadow-lg">
          <div class="flex items-center justify-between gap-2">
            <span class="font-extrabold text-amber-300 text-xs">🏠 내 카페 홀 실시간 가구 배치 (총 11개 구역)</span>
            <button onclick="autoFillBestFurniture()" class="px-2.5 py-1 rounded-lg bg-[#346aff] hover:bg-blue-500 text-[10px] font-black text-white shrink-0">✨ 보유 최고급 자동배치</button>
          </div>

          <div class="text-[10px] text-slate-300 font-bold">🪟 안쪽 창가 라인 테이블 (3개 존)</div>
          <div class="grid grid-cols-3 gap-1.5 text-[11px]">
            ${[
              { key: "slotLeft", label: "창가 왼쪽" },
              { key: "slotCenter", label: "창가 중앙" },
              { key: "slotRight", label: "창가 오른쪽" }
            ].map(s => `
              <div class="bg-slate-800 border border-slate-700 rounded-xl p-2">
                <div class="text-slate-400 text-[10px] mb-1">${s.label}</div>
                <select onchange="placeFurniture('${s.key}', this.value)" class="w-full bg-slate-950 border border-slate-600 rounded-lg px-1.5 py-1 text-[11px] text-amber-100 outline-none">
                  <option value="">(비워두기)</option>
                  ${ownedTables.map(t => `<option value="${t.id}" ${state.placedFurniture[s.key] === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
                </select>
              </div>
            `).join("")}
          </div>

          <div class="text-[10px] text-slate-300 font-bold">🪑 앞쪽 홀 플로어 테이블 (3개 존)</div>
          <div class="grid grid-cols-3 gap-1.5 text-[11px]">
            ${[
              { key: "slotFrontLeft", label: "앞쪽 왼쪽" },
              { key: "slotFrontCenter", label: "앞쪽 중앙" },
              { key: "slotFrontRight", label: "앞쪽 오른쪽" }
            ].map(s => `
              <div class="bg-slate-800 border border-slate-700 rounded-xl p-2">
                <div class="text-slate-400 text-[10px] mb-1">${s.label}</div>
                <select onchange="placeFurniture('${s.key}', this.value)" class="w-full bg-slate-950 border border-slate-600 rounded-lg px-1.5 py-1 text-[11px] text-amber-100 outline-none">
                  <option value="">(비워두기)</option>
                  ${ownedTables.map(t => `<option value="${t.id}" ${state.placedFurniture[s.key] === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
                </select>
              </div>
            `).join("")}
          </div>

          <div class="text-[10px] text-slate-300 font-bold">🌿 코너 소품·조명·오브제 (4개 존) & 메인 러그</div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px]">
            ${[
              { key: "decorLeft", label: "안쪽 좌측 코너" },
              { key: "decorRight", label: "안쪽 우측 코너" },
              { key: "decorFrontLeft", label: "앞쪽 좌측 포인트" },
              { key: "decorFrontRight", label: "앞쪽 우측 포인트" }
            ].map(s => `
              <div class="bg-slate-800 border border-slate-700 rounded-xl p-2">
                <div class="text-slate-400 text-[10px] mb-1">${s.label}</div>
                <select onchange="placeFurniture('${s.key}', this.value)" class="w-full bg-slate-950 border border-slate-600 rounded-lg px-1.5 py-1 text-[11px] text-emerald-200 outline-none">
                  <option value="">(비워두기)</option>
                  ${ownedDecors.map(d => `<option value="${d.id}" ${state.placedFurniture[s.key] === d.id ? "selected" : ""}>${d.name}</option>`).join("")}
                </select>
              </div>
            `).join("")}
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-2 text-[11px]">
            <div class="text-slate-400 text-[10px] mb-1">🧶 홀 중앙 메인 러그 · 카펫</div>
            <select onchange="placeFurniture('hallRug', this.value)" class="w-full bg-slate-950 border border-slate-600 rounded-lg px-2 py-1 text-[11px] text-sky-200 outline-none">
              <option value="">(러그 없이 원목 마루만 표시)</option>
              ${ownedRugs.map(r => `<option value="${r.id}" ${state.placedFurniture.hallRug === r.id ? "selected" : ""}>${r.name}</option>`).join("")}
            </select>
          </div>
        </div>
      ` : "";

      // 배팡 헤더 & 검색바 & 카테고리 바
      const baepangHeaderHtml = `
        <div class="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-md overflow-hidden mb-3">
          <!-- 상단 로고 & 보유가구 배치 버튼 -->
          <div class="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-slate-100">
            <div class="flex items-center gap-1.5">
              <span class="font-black text-base tracking-tighter">
                <span class="text-[#5c2d16]">Bae</span><span class="text-[#e60012]">p</span><span class="text-[#ff9900]">a</span><span class="text-[#8cc63f]">n</span><span class="text-[#00a0e9]">g</span>
              </span>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#346aff] text-white">카페파트너스</span>
              <span class="text-[10px] text-slate-500 font-bold hidden sm:inline">보유 ${state.ownedFurniture.length}/${FURNITURE_CATALOG.length}종</span>
            </div>
            <button onclick="togglePlacementDrawer()"
              class="px-2.5 py-1.5 rounded-xl ${shopState.showPlacementDrawer ? "bg-slate-900 text-amber-300" : "bg-[#346aff] hover:bg-blue-600 text-white"} text-[11px] font-black flex items-center gap-1 shadow-sm transition">
              <span>🏠</span>
              <span>${shopState.showPlacementDrawer ? "배치창 닫기" : `홀 가구배치 (${state.ownedFurniture.length}보유)`}</span>
            </button>
          </div>

          <!-- 배팡 블루 검색창 -->
          <div class="px-3 py-2 bg-slate-50">
            <div class="flex items-center bg-white border-2 border-[#346aff] rounded-xl px-2.5 py-1.5 shadow-inner">
              <span class="text-[#346aff] text-sm mr-1.5">🔍</span>
              <input id="baepangSearchInput" type="text" value="${shopState.search.replace(/"/g, "&quot;")}"
                oninput="setShopSearch(this.value)"
                placeholder="카페 인테리어 가구 215종 검색 (예: 마블, 소파, 피아노, 벚꽃...)"
                class="w-full text-xs text-slate-900 placeholder-slate-400 outline-none bg-transparent font-medium" />
              ${shopState.search ? `<button onclick="setShopSearch('')" class="text-slate-400 hover:text-slate-700 text-xs font-bold px-1">✕</button>` : ""}
            </div>
          </div>

          <!-- 카테고리 탭 -->
          <div class="grid grid-cols-4 border-t border-slate-200 bg-white text-[11px] font-extrabold">
            ${[
              { id: "all", label: `전체 (${FURNITURE_CATALOG.length})` },
              { id: "table", label: `테이블·소파 (${FURNITURE_CATALOG.filter(f => f.category === "table").length})` },
              { id: "decor", label: `조명·소품 (${FURNITURE_CATALOG.filter(f => f.category === "decor").length})` },
              { id: "rug", label: `러그·카펫 (${FURNITURE_CATALOG.filter(f => f.category === "rug").length})` }
            ].map(c => `
              <button onclick="setShopCategory('${c.id}')"
                class="py-2 text-center border-b-2 transition ${shopState.category === c.id ? "border-[#346aff] text-[#346aff] bg-blue-50/50" : "border-transparent text-slate-600 hover:bg-slate-50"}">
                ${c.label}
              </button>
            `).join("")}
          </div>

          <!-- 로켓 필터 & 정렬 바 -->
          <div class="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1.5 flex-wrap text-[11px]">
            <div class="flex items-center gap-1.5">
              <button onclick="toggleShopFilter('rocketOnly')"
                class="px-2 py-1 rounded-full border font-extrabold transition ${shopState.rocketOnly ? "bg-[#e8f1ff] border-[#0073e9] text-[#0073e9]" : "bg-white border-slate-300 text-slate-600"}">
                🚀 로켓설치만
              </button>
              <button onclick="toggleShopFilter('unownedOnly')"
                class="px-2 py-1 rounded-full border font-extrabold transition ${shopState.unownedOnly ? "bg-amber-100 border-amber-500 text-amber-800" : "bg-white border-slate-300 text-slate-600"}">
                🛒 미보유만
              </button>
            </div>
            <select onchange="setShopSort(this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none">
              <option value="recommended" ${shopState.sort === "recommended" ? "selected" : ""}>배팡 랭킹순</option>
              <option value="priceAsc" ${shopState.sort === "priceAsc" ? "selected" : ""}>낮은 가격순</option>
              <option value="priceDesc" ${shopState.sort === "priceDesc" ? "selected" : ""}>높은 가격순</option>
              <option value="bonusDesc" ${shopState.sort === "bonusDesc" ? "selected" : ""}>매출보너스 높은순</option>
            </select>
          </div>
        </div>
      `;

      // 배팡 2열 그리드 상품 카드 리스트
      const productGridHtml = filtered.length === 0 ? `
        <div class="bg-white text-slate-600 rounded-2xl p-6 text-center text-xs font-bold border border-slate-200">
          검색 조건에 맞는 가구가 없습니다. 검색어나 필터를 초기화해 보세요!
        </div>
      ` : `
        <div class="grid grid-cols-2 gap-2.5">
          ${filtered.map(f => {
            const owned = state.ownedFurniture.includes(f.id);
            const bonusPct = Math.round((f.tipBonus || 0) * 100);
            const catLabel = f.category === "table" ? "테이블" : f.category === "decor" ? "소품·조명" : "러그";
            return `
              <div class="bg-white text-slate-900 rounded-2xl border ${owned ? "border-emerald-500 ring-1 ring-emerald-400/40" : "border-slate-200 hover:border-[#346aff]"} shadow-sm overflow-hidden flex flex-col justify-between transition">
                <!-- 상품 썸네일 영역 (터치 시 상세보기) -->
                <div onclick="openProductDetail('${f.id}')" class="cursor-pointer">
                  <div class="relative h-24 bg-gradient-to-br from-slate-100 via-amber-50/60 to-slate-100 flex items-center justify-center border-b border-slate-100">
                    <span class="text-4xl drop-shadow-sm">${f.icon || "🛋️"}</span>
                    ${f.badge ? `<span class="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-sm">${f.badge}</span>` : ""}
                    <span class="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-white">${catLabel}</span>
                    ${bonusPct > 0 ? `<span class="absolute bottom-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">단가 +${bonusPct}%</span>` : ""}
                  </div>

                  <!-- 상품 정보 영역 -->
                  <div class="p-2.5 pb-1.5">
                    <div class="text-[10px] text-slate-400 font-bold truncate">${f.brand || "메트로홈"}</div>
                    <div class="font-extrabold text-xs text-slate-900 line-clamp-2 leading-snug min-h-[2rem] mt-0.5">${f.name}</div>

                    <!-- 할인율 & 배팡가 -->
                    <div class="mt-1">
                      ${f.price > 0 ? `
                        <div class="flex items-center gap-1 text-[10px] leading-none">
                          <span class="font-black text-rose-600">${f.discountRate || 20}%</span>
                          <span class="text-slate-400 line-through">${(f.originalPrice || Math.round(f.price * 1.25)).toLocaleString()}원</span>
                        </div>
                        <div class="font-black text-sm text-[#ae0000] leading-tight mt-0.5">
                          ${f.price.toLocaleString()}<span class="text-[11px] font-bold">원</span>
                        </div>
                      ` : `
                        <div class="font-black text-sm text-emerald-700 leading-tight mt-1">기본 무료제공</div>
                      `}
                    </div>

                    <!-- 로켓설치 배지 -->
                    <div class="flex items-center gap-1 mt-1">
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e8f1ff] text-[#0073e9] text-[9px] font-black">🚀 로켓설치</span>
                      <span class="text-[9px] text-emerald-700 font-bold">내일 도착</span>
                    </div>

                    <!-- 별점 & 리뷰 수 -->
                    <div class="flex items-center gap-1 text-[10px] mt-1">
                      <span class="text-amber-400 font-black">★★★★★</span>
                      <span class="text-slate-500 font-semibold">(${(f.reviews || 100).toLocaleString()})</span>
                    </div>
                  </div>
                </div>

                <!-- 하단 구매/배치 버튼 -->
                <div class="px-2.5 pb-2.5 pt-1">
                  ${owned
                    ? `<button onclick="openQuickPlaceFor('${f.id}')" class="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition">✅ 보유중 · 홀에 배치</button>`
                    : `<button onclick="buyFurniture('${f.id}', event)" class="w-full py-1.5 rounded-xl bg-[#346aff] hover:bg-blue-600 text-white text-[11px] font-black shadow-sm transition">🛒 로켓설치 구매</button>`
                  }
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;

      economy.ensureStorageUpgradeEntry();
      // 매장 설비 업그레이드 섹션
      const upgradesHtml = `
        <div class="bg-stone-950 border border-stone-800 rounded-2xl p-3 mt-3 space-y-2">
          <div class="font-extrabold text-xs text-sky-300">⚙️ 매장 자동화 · 추출 설비 업그레이드</div>
          ${state.upgrades.map((u, idx) => {
            const cost = Math.round(u.baseCost * Math.pow(1.45, u.level));
            const isMax = u.level >= u.max;
            return `
              <div class="bg-stone-900 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div>
                  <div class="font-extrabold text-white text-xs">${u.name} <span class="text-amber-400 text-[11px]">Lv.${u.level}/${u.max}</span></div>
                  <div class="text-[11px] text-stone-400 mt-0.5">${u.desc}</div>
                </div>
                ${isMax
                  ? `<span class="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-400 text-[11px] font-bold shrink-0">MAX</span>`
                  : `<button onclick="buyUpgrade(${idx})" class="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-extrabold shrink-0">${cost.toLocaleString()}원</button>`
                }
              </div>
            `;
          }).join("")}
        </div>
      `;

      return baepangHeaderHtml + detailOverlayHtml + placementPanelHtml + productGridHtml + upgradesHtml;
    }

    window.openQuickPlaceFor = (fid) => {
      ensureFurnitureState();
      const item = FURNITURE_CATALOG.find(f => f.id === fid);
      if (!item) return;
      if (item.category === "table") {
        const tableKeys = ["slotLeft", "slotCenter", "slotRight", "slotFrontLeft", "slotFrontCenter", "slotFrontRight"];
        const empty = tableKeys.find(k => !state.placedFurniture[k]);
        if (empty) {
          state.placedFurniture[empty] = fid;
          showToast(`🚀 '${item.name}' 빈 테이블 구역에 즉시 배치 완료!`, "emerald");
          updateHUD();
          renderPosModal();
          saveCloudProgress(false);
          return;
        }
      } else if (item.category === "decor") {
        const decorKeys = ["decorLeft", "decorRight", "decorFrontLeft", "decorFrontRight"];
        const empty = decorKeys.find(k => !state.placedFurniture[k]);
        if (empty) {
          state.placedFurniture[empty] = fid;
          showToast(`🚀 '${item.name}' 코너 포인트에 즉시 배치 완료!`, "emerald");
          updateHUD();
          renderPosModal();
          saveCloudProgress(false);
          return;
        }
      } else if (item.category === "rug") {
        state.placedFurniture.hallRug = fid;
        showToast(`🚀 '${item.name}' 홀 중앙 러그로 교체 완료!`, "emerald");
        updateHUD();
        renderPosModal();
        saveCloudProgress(false);
        return;
      }
      shopState.showPlacementDrawer = true;
      renderPosModal();
      const box = document.getElementById("posContent");
      if (box) box.scrollTop = 0;
      showToast("🏠 상단 배치창에서 원하는 구역을 선택해 교체하세요!", "sky");
    };

    function renderPosModal() {
      const box = document.getElementById("posContent");
      const subSwitcher = document.getElementById("mobilePosSubSwitcher");
      if (subSwitcher) {
        subSwitcher.style.display = activePosTab === "menu" ? "" : "none";
      }
      if (activePosTab === "menu") {
        economy.ensureIngredientState();
        const previewEval = customMenuDraft.selectedIngredients.length > 0
          ? evaluateCustomRecipe(customMenuDraft.selectedIngredients, customMenuDraft.useCoffee)
          : null;

        const builderHtml = `
          <div class="bg-gradient-to-br from-stone-950 via-amber-950/25 to-stone-950 border border-amber-500/50 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
                  <span>🧪 나만의 시그니처 메뉴 레시피 연구소</span>
                </div>
                <div class="text-[11px] text-stone-400 mt-0.5">원두는 항상 상시 구비! 재료를 조합해 출시하면 SNS 대박 유행 또는 혹평 판매부진이 갈립니다.</div>
              </div>
              <button onclick="toggleCustomMenuBuilder()"
                class="px-3 py-1.5 rounded-xl ${customMenuDraft.open ? "bg-stone-800 text-stone-300" : "bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950"} text-xs font-black shrink-0 shadow">
                ${customMenuDraft.open ? "접기 ▲" : "+ 직접 만들기"}
              </button>
            </div>

            ${customMenuDraft.open ? `
              <div class="pt-2 border-t border-stone-800 space-y-2.5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] font-bold text-amber-200 mb-1">1. 신메뉴 이름</label>
                    <input id="customMenuNameInput" type="text" maxlength="18"
                      value="${customMenuDraft.name.replace(/"/g, "&quot;")}"
                      oninput="setCustomMenuName(this.value)"
                      placeholder="예: 소금크림 피스타치오 라떼"
                      class="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-amber-200 mb-1">2. 기본 에스프레소 원두</label>
                    <button type="button" onclick="toggleCustomMenuCoffee()"
                      class="w-full py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-between transition ${customMenuDraft.useCoffee ? "bg-amber-950/60 border-amber-500 text-amber-200" : "bg-stone-900 border-stone-700 text-stone-400"}">
                      <span>☕ 에스프레소 샷 ${customMenuDraft.useCoffee ? "포함 (상시무료)" : "미포함 (논커피)"}</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-black/40">${customMenuDraft.useCoffee ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[11px] font-bold text-amber-200">3. 들어갈 재료 선택 (최대 4가지 · 보유 재고 표시)</label>
                    <span class="text-[10px] text-stone-400">${customMenuDraft.selectedIngredients.length}/4개 선택됨</span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    ${INGREDIENT_CATALOG.map(ing => {
                      const picked = customMenuDraft.selectedIngredients.includes(ing.id);
                      const stockQty = state.ingredientStock[ing.id] || 0;
                      return `
                        <button type="button" onclick="toggleCustomIngredient('${ing.id}')"
                          class="p-2 rounded-xl border text-left transition flex items-center justify-between gap-1 ${picked ? "bg-amber-500/20 border-amber-400 text-amber-100" : "bg-stone-900/90 border-stone-800 hover:border-stone-600 text-stone-300"}">
                          <div class="min-w-0">
                            <div class="text-[11px] font-extrabold truncate">${ing.icon} ${ing.name}</div>
                            <div class="text-[10px] ${stockQty > 0 ? "text-emerald-400" : "text-rose-400"}">창고 ${stockQty}잔</div>
                          </div>
                          <span class="text-xs font-black shrink-0">${picked ? "✓" : "+"}</span>
                        </button>
                      `;
                    }).join("")}
                  </div>
                </div>

                ${previewEval ? `
                  <div class="bg-stone-900/95 border ${previewEval.tier === "hit" ? "border-emerald-500/60" : previewEval.tier === "flop" ? "border-rose-500/60" : "border-sky-500/50"} rounded-xl p-2.5 space-y-1.5">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <span class="text-xs font-black ${previewEval.tier === "hit" ? "text-emerald-300" : previewEval.tier === "flop" ? "text-rose-300" : "text-sky-300"}">
                        🔬 시음 테스트 결과: ${previewEval.badge}
                      </span>
                      <span class="text-[11px] font-bold text-stone-400">잔당 원가 약 ${previewEval.unitCost.toLocaleString()}원</span>
                    </div>
                    <p class="text-[11px] text-stone-300 leading-relaxed">${previewEval.summary}</p>
                    <div class="flex items-center gap-2 pt-1">
                      <label class="text-[11px] font-bold text-amber-200 shrink-0">판매가 설정:</label>
                      <input id="customMenuPriceInput" type="number" step="100" min="1500" max="15000"
                        value="${customMenuDraft.customPrice || previewEval.suggestedPrice}"
                        oninput="setCustomMenuPrice(this.value)"
                        class="w-28 bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs font-extrabold text-emerald-300 outline-none" />
                      <span class="text-[10px] text-stone-400">(추천 ${previewEval.suggestedPrice.toLocaleString()}원)</span>
                    </div>
                  </div>
                ` : `
                  <div class="text-[11px] text-stone-400 bg-stone-900/70 rounded-xl p-2.5 text-center">
                    위에서 재료를 1~4가지 터치하면 바리스타 시음 예상과 추천 판매가가 즉시 분석됩니다!
                  </div>
                `}

                <div id="customMenuFeedback" class="hidden rounded-xl border border-rose-500/60 bg-rose-950/80 px-3 py-2 text-xs font-bold text-rose-200"></div>

                <button type="button" onclick="submitCustomMenu()"
                  class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 transition text-stone-950 font-black text-xs shadow-lg">
                  ✨ 레시피 확정 및 신메뉴 출시하기 (개발비 150,000원)
                </button>
              </div>
            ` : ""}
          </div>
        `;

        const menuListHtml = state.menus.map((m, idx) => {
          const realPrice = calculateMenuSalePrice(m);
          const reqs = m.ingredients || [];
          const canMake = economy.canMakeMenu(m);
          const reqBadges = reqs.length === 0
            ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/40">☕ 상시 원두만 사용</span>`
            : reqs.map(ingId => {
                const info = getIngredientById(ingId);
                const qty = state.ingredientStock[ingId] || 0;
                return `<button onclick="selectOrderIngredient('${ingId}')" class="text-[10px] px-1.5 py-0.5 rounded ${qty > 0 ? "bg-stone-900 text-stone-200 border border-stone-700" : "bg-rose-950/80 text-rose-300 border border-rose-600/50"}">${info ? info.icon + info.name : ingId} (${qty}잔) · 발주</button>`;
              }).join(" ");

          return `
            <div class="bg-stone-950 border ${m.isTrending ? "border-pink-500/70 ring-1 ring-pink-500/30" : m.tier === "flop" ? "border-rose-900/60" : "border-stone-800"} rounded-2xl p-3 space-y-1.5">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-extrabold text-amber-200 flex items-center gap-1.5 flex-wrap">
                    <span>${m.name}</span>
                    ${m.unlocked ? `<span class="text-emerald-400 text-xs">(${realPrice.toLocaleString()}원)</span>` : ""}
                    ${m.isTrending ? `<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-black">🔥 SNS 유행중</span>` : ""}
                    ${m.isCustom && m.tierBadge ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">${m.tierBadge}</span>` : ""}
                  </div>
                  <div class="text-[11px] text-stone-400 mt-0.5">${m.desc}</div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  ${m.unlocked
                    ? `<span class="px-2.5 py-1 rounded-xl ${canMake ? "bg-emerald-950 text-emerald-300 border border-emerald-700/40" : "bg-rose-950 text-rose-300 border border-rose-700/40"} text-xs font-bold">${canMake ? "판매중" : "재료부족"}</span>`
                    : `<button onclick="unlockMenu(${idx})" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold">개발 ${m.cost.toLocaleString()}원</button>`
                  }
                  ${m.isCustom ? `<button onclick="deleteCustomMenu('${m.id}')" title="메뉴 내리기" class="px-2 py-1 rounded-xl bg-stone-800 hover:bg-rose-900 text-stone-400 hover:text-white text-xs font-bold">✕</button>` : ""}
                </div>
              </div>
              <div class="flex items-center justify-between flex-wrap gap-1 pt-1 border-t border-stone-900">
                <div class="flex flex-wrap gap-1">${reqBadges}</div>
                ${m.unlocked ? `<span class="text-[10px] text-stone-500">누적 판매 ${m.soldCount || 0}잔</span>` : ""}
              </div>
            </div>
          `;
        }).join("");

        box.innerHTML = `<div class="pos-management-grid"><div class="pos-menu-column">${builderHtml}${menuListHtml}</div>${renderPosOrderPanel()}</div>`;
      } else if (activePosTab === "staff") {
        box.innerHTML = renderBaepangFurnitureMall();
      } else if (activePosTab === "regulars") {
        box.innerHTML = renderCreatorReviewPanel();
      } else {
        box.innerHTML = `
          <div class="bg-stone-950 border border-amber-800/40 rounded-2xl p-3 text-xs text-stone-300 mb-2 leading-relaxed">
            수도권의 수많은 일반 손님 중 <b>① 누적 재방문 횟수</b>, <b>② 매장 최소 평판</b>, <b>③ 최애 시그니처 메뉴 개발</b> 조건을 모두 충족해야 VIP 단골로 승격됩니다. (보유 ${state.regulars.length}/8명)
          </div>
          ${VISITOR_POOL.map(v => {
            const visits = state.visitorCounts[v.id] || 0;
            const isReg = state.regulars.includes(v.id);
            const minRep = v.minRep || 30;
            const repOk = state.reputation >= minRep;
            const menuOk = !v.favMenuId || Boolean(state.menus.find(m => m.id === v.favMenuId && m.unlocked));
            return `
              <div class="bg-stone-950 border ${isReg ? "border-amber-500/60" : "border-stone-800"} rounded-2xl p-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="text-2xl shrink-0">${v.avatar}</span>
                  <div class="min-w-0">
                    <div class="font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                      <span>${v.name}</span>
                      ${isReg ? `<span class="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">💖 VIP 단골</span>` : ""}
                    </div>
                    <div class="text-[11px] text-amber-300/90 mt-0.5">${v.perk}</div>
                    <div class="flex flex-wrap gap-1 mt-1 text-[10px]">
                      <span class="px-1.5 py-0.5 rounded ${repOk ? "bg-emerald-950 text-emerald-300" : "bg-stone-900 text-stone-400"}">평판 ★${minRep} ${repOk ? "✓" : ""}</span>
                      <span class="px-1.5 py-0.5 rounded ${menuOk ? "bg-emerald-950 text-emerald-300" : "bg-stone-900 text-stone-400"}">${v.fav} ${menuOk ? "✓" : "미개발"}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-xs font-extrabold ${isReg ? "text-amber-300" : "text-sky-300"}">${visits} / ${v.neededVisits}회</div>
                  <div class="text-[10px] text-stone-500 mt-0.5">누적 방문</div>
                </div>
              </div>
            `;
          }).join("")}
        `;
      }
    }


    function ensureFurnitureState() {
      if (!state.ownedFurniture) state.ownedFurniture = ["table_wood_2", "rug_warm_amber"];
      if (!state.ownedFurniture.includes("rug_warm_amber")) state.ownedFurniture.push("rug_warm_amber");
      if (!state.placedFurniture) {
        state.placedFurniture = {
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
      }
      if (!("slotFrontLeft" in state.placedFurniture)) state.placedFurniture.slotFrontLeft = "table_wood_2";
      if (!("slotFrontCenter" in state.placedFurniture)) state.placedFurniture.slotFrontCenter = null;
      if (!("slotFrontRight" in state.placedFurniture)) state.placedFurniture.slotFrontRight = "table_wood_2";
      if (!("decorFrontLeft" in state.placedFurniture)) state.placedFurniture.decorFrontLeft = null;
      if (!("decorFrontRight" in state.placedFurniture)) state.placedFurniture.decorFrontRight = null;
      if (!("hallRug" in state.placedFurniture)) state.placedFurniture.hallRug = "rug_warm_amber";
    }


    // ==================== 인터랙티브 문자 이벤트 & 대응 처리 ====================

    // ==================== 초보자 튜토리얼 & '?' 도움말 시스템 ====================
    const TUTORIAL_STEPS = [
      {
        icon: "☕",
        badge: "기본 운영 · 상단 HUD",
        title: "1. 카페 개업과 매장 핵심 지표",
        summary: "손님이 찾아와 음료를 주문하면 자동으로 매출과 평판이 쌓입니다.",
        points: [
          { icon: "💰", title: "보유 자금 & 월말 정산", desc: "매 28일차마다 본점 월세가 빠져나가고, 지점·건물 임대수익과 주식 배당금이 정산됩니다." },
          { icon: "★", title: "매장 평판 (최대 ★1,000)", desc: "기본 음료만으로는 평판이 천천히 오릅니다. 시그니처·제철 메뉴와 좋은 리뷰를 쌓아 미식 평가단 심사를 열어보세요." },
          { icon: "⏩", title: "1x / 2x 배속 & 🪟 감상 모드", desc: "상단 버튼으로 시간 속도를 2배로 높이거나, UI를 숨기고 창밖 풍경과 카페를 감상할 수 있습니다." }
        ],
        tip: "초반에 지급되는 하우스 아메리카노는 본사 원두가 무료로 상시 공급되어 재료가 떨어지지 않습니다!"
      },
      {
        icon: "🧾",
        badge: "POS & 배팡 상점",
        title: "2. 신메뉴 개발 · 가구 배치 · 설비 강화",
        summary: "하단 [POS·메뉴]와 [배팡 상점]에서 카페의 수익성과 매력을 키우세요.",
        points: [
          { icon: "🍹", title: "기본 메뉴 해금 & 나만의 레시피", desc: "POS에서 라떼·아인슈페너를 열거나, 재료를 직접 조합해 나만의 신메뉴를 출시할 수 있습니다. 황금 레시피는 SNS 떡상 확률이 높습니다!" },
          { icon: "🪑", title: "가구 구매 & 홀 배치", desc: "배팡 상점에서 테이블·소품·러그를 구매해 배치하면 매장 평판과 팁 보너스가 올라갑니다." },
          { icon: "⚙️", title: "자동 추출 & 정밀 그라인더", desc: "브루잉 머신은 자동으로 수익을 벌어주고, 정밀 그라인더는 모든 메뉴 판매 단가를 올려줍니다." }
        ],
        tip: "궁합이 최악인 실패 레시피(flop)를 팔면 손님 혹평으로 평판이 깎이니 신중하게 조합해 보세요."
      },
      {
        icon: "📦",
        badge: "POS · 재료발주 & 자동 구독",
        title: "3. 메뉴와 식자재를 함께 운영",
        summary: "POS 우측 발주 패널에서 부족 재료를 바로 주문하고, 태블릿에서 자동 보충 구독을 설정하세요.",
        points: [
          { icon: "🧊", title: "전체 창고 한도 폐지", desc: "전체 용량 제한 없이 재료마다 최대 80잔까지 보유할 수 있습니다." },
          { icon: "🔁", title: "재료별 자동 보충 구독", desc: "태블릿 발주·구독 탭에서 기준 재고를 정하면 자동 주문합니다. 계절마다 구독료가 정산됩니다." },
          { icon: "🚚", title: "즉시 발주와 배송", desc: "POS에서 메뉴 재료 배지를 누르면 발주 패널이 해당 재료를 선택합니다. 결제하면 배송으로 입고됩니다." }
        ],
        tip: "3만 원 이상 한 번에 발주하면 배송비(2,500원)가 무료입니다."
      },
      {
        icon: "💬",
        badge: "스마트폰 · 문자함 & 카페그램",
        title: "4. 문자 이벤트 대응과 SNS 홍보",
        summary: "스마트폰 버튼 위에 뜨는 알림 라벨을 보고 새 소식에 바로 대응하세요.",
        points: [
          { icon: "🕵️", title: "문자 눈치게임 (선택형 보너스)", desc: "문자는 꼭 확인하지 않아도 불이익이 없지만, 발신번호와 내용을 보고 진짜 지원금과 사칭 스미싱을 구별하거나 단체 의뢰를 수락하면 쏠쏠한 보너스를 얻습니다." },
          { icon: "📦", title: "단체 납품 의뢰 & 쿠폰 답장", desc: "회사 단체 주문을 수락해 기한 내 판매량을 채우면 큰 보수를 받고, 손님 문의에 쿠폰을 보내면 평판 보너스를 얻습니다." },
          { icon: "📸", title: "카페그램 홍보 & 답글", desc: "홍보 캠페인(하루 최대 2회)을 열면 45초간 전 메뉴 판매 단가가 +15% 상승합니다." }
        ],
        tip: "알림 배지가 떠 있을 때 스마트폰 버튼을 누르면 해당 알림이 온 앱 탭으로 바로 열립니다."
      },
      {
        icon: "📈",
        badge: "태블릿 · 주식 & 코인",
        title: "5. 전 플레이어 공통 주식·코인 투자",
        summary: "모든 플레이어가 똑같은 실시간 시세와 속보를 보며 투자 경쟁을 펼칩니다.",
        points: [
          { icon: "🌐", title: "전 서버 실시간 동기화 시세", desc: "10초마다 갱신되는 가격, 최근 10분 차트, 속보와 루머가 모든 접속자에게 동일하게 적용됩니다." },
          { icon: "🔴", title: "차트 보는 법 (빨간점·파란점·노란선)", desc: "빨간점은 호재 뉴스, 파란점은 악재 뉴스 발생 시점입니다. 노란 가로 점선(내 평단)보다 현재가가 위에 있으면 수익 구간입니다." },
          { icon: "📣", title: "루머 주의", desc: "루머 뉴스는 사실로 밝혀지면 크게 움직이지만, 헛소문이면 반대로 급변할 수 있습니다." }
        ],
        tip: "배당주를 보유하면 매 28일차 월말 정산 때 배당금이 현금으로 들어옵니다."
      },
      {
        icon: "🗺️",
        badge: "상권 지도 · 경영장부 · 랭킹",
        title: "6. 수도권 확장과 실시간 순자산 랭킹",
        summary: "자금을 모아 수도권 주요 상권으로 확장하고 랭킹 상위권에 도전하세요.",
        points: [
          { icon: "🏢", title: "지점 개설 & 건물 매입", desc: "하단 [상권지도]에서 다른 역세권에 지점을 내거나 건물을 통째로 매입해 매달 임대 수익을 얻을 수 있습니다." },
          { icon: "⭐", title: "미식 평가단 & 크리에이터 심사", desc: "평판이 오르면 시그니처 메뉴·제철 메뉴·인테리어 미션이 열립니다. 심사를 완료해 보상과 평판을 받으세요." },
          { icon: "🏆", title: "실시간 랭킹 & 클라우드 저장", desc: "현금, 지점·건물 가치, 주식·코인 평가금액을 합산한 총 순자산으로 다른 사장님들과 순위를 겨룹니다." }
        ],
        tip: "언제든 상단 오른쪽 [?] 버튼을 누르면 이 가이드를 다시 열어볼 수 있습니다!"
      }
    ];

    let currentTutorialStep = 0;
    let isMandatoryOnboardingTutorial = false;

    function renderTutorialStep() {
      const step = TUTORIAL_STEPS[currentTutorialStep] || TUTORIAL_STEPS[0];
      const total = TUTORIAL_STEPS.length;

      const subEl = document.getElementById("tutStepSubtitle");
      if (subEl) {
        subEl.textContent = `STEP ${currentTutorialStep + 1} / ${total} · ${step.badge}`;
      }
      const counterEl = document.getElementById("tutCounterText");
      if (counterEl) {
        counterEl.textContent = `${currentTutorialStep + 1} / ${total}`;
      }

      const dotsEl = document.getElementById("tutStepDots");
      if (dotsEl) {
        dotsEl.innerHTML = TUTORIAL_STEPS.map((s, idx) => `
          <button onclick="goTutorialStep(${idx})"
            class="h-2 rounded-full transition-all ${idx === currentTutorialStep ? "w-7 bg-amber-400" : "w-2 bg-stone-700 hover:bg-stone-500"}"
            title="${s.title}"></button>
        `).join("");
      }

      const bodyEl = document.getElementById("tutBody");
      if (bodyEl) {
        bodyEl.innerHTML = `
          <div class="bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-900 border border-amber-500/40 rounded-2xl p-3.5 flex items-start gap-3">
            <div class="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
              ${step.icon}
            </div>
            <div>
              <div class="text-sm sm:text-base font-black text-white leading-snug">${step.title}</div>
              <p class="text-[11px] sm:text-xs text-amber-200/90 mt-1 leading-relaxed">${step.summary}</p>
            </div>
          </div>

          <div class="space-y-2">
            ${step.points.map(pt => `
              <div class="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex items-start gap-2.5">
                <span class="text-base sm:text-lg shrink-0 mt-0.5">${pt.icon}</span>
                <div>
                  <div class="text-xs font-extrabold text-amber-300">${pt.title}</div>
                  <div class="text-[11px] text-stone-300 leading-relaxed mt-0.5">${pt.desc}</div>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="bg-emerald-950/50 border border-emerald-700/50 rounded-2xl p-2.5 text-[11px] text-emerald-200 leading-relaxed">
            💡 <b>사장님 꿀팁:</b> ${step.tip}
          </div>
        `;
        bodyEl.scrollTop = 0;
      }

      const prevBtn = document.getElementById("tutPrevBtn");
      if (prevBtn) {
        prevBtn.disabled = currentTutorialStep === 0;
        prevBtn.className = currentTutorialStep === 0
          ? "px-3.5 py-2 rounded-xl bg-stone-900 text-stone-600 text-xs font-extrabold cursor-not-allowed"
          : "px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-extrabold transition";
      }

      const nextBtn = document.getElementById("tutNextBtn");
      const closeTopBtn = document.getElementById("tutCloseTopBtn");
      const isLast = currentTutorialStep === total - 1;
      if (nextBtn) {
        nextBtn.textContent = isLast ? "🎉 이해했어요! 시작하기" : "다음 →";
      }
      if (closeTopBtn) {
        // 처음 시작하는 필수 튜토리얼일 때는 끝까지 넘겨보도록 상단 닫기 숨김 (도움말 '?'로 연 경우엔 언제든 닫기 가능)
        closeTopBtn.classList.toggle("hidden", isMandatoryOnboardingTutorial && !isLast);
      }
    }

    window.openTutorialModal = (voluntary = true) => {
      isMandatoryOnboardingTutorial = !voluntary;
      currentTutorialStep = 0;
      renderTutorialStep();
      const modal = document.getElementById("tutorialModal");
      if (modal) modal.classList.remove("hidden");
    };

    window.closeTutorialModal = () => {
      if (isMandatoryOnboardingTutorial && currentTutorialStep < TUTORIAL_STEPS.length - 1) {
        return showToast("가이드 마지막 페이지까지 넘겨 확인해 주세요!", "amber");
      }
      isMandatoryOnboardingTutorial = false;
      const modal = document.getElementById("tutorialModal");
      if (modal) modal.classList.add("hidden");
      if (typeof state === "object" && state) {
        state.tutorialCompleted = true;
      }
    };

    window.goTutorialStep = (idx) => {
      currentTutorialStep = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, idx));
      renderTutorialStep();
    };

    window.prevTutorialStep = () => {
      if (currentTutorialStep > 0) {
        currentTutorialStep -= 1;
        renderTutorialStep();
      }
    };

    window.nextTutorialStep = () => {
      if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
        currentTutorialStep += 1;
        renderTutorialStep();
      } else {
        closeTutorialModal();
      }
    };

    window.resolveSmsAction = (msgId, action) => {
      const m = (state.messages || []).find(x => x.id === msgId);
      if (!m || m.resolved) return;

      if (action === "verify_open") {
        if (m.category === "scam") {
          const loss = Math.min(state.cash, m.scamLoss || 150000);
          state.cash = Math.max(0, state.cash - loss);
          m.resolved = true;
          m.resultText = `💸 피싱/사칭 사기 피해! (-${loss.toLocaleString()}원 인출됨)`;
          showToast(`🚨 사칭 링크/계좌에 속아 ${loss.toLocaleString()}원이 빠져나갔습니다!`, "rose");
        } else if (m.category === "legit_promo") {
          const bonus = m.rewardCash || 50000;
          state.cash += bonus;
          if (m.rewardRep) addReputation(m.rewardRep);
          m.resolved = true;
          m.resultText = `🎁 정상 지원·페이백 수령 완료 (+${bonus.toLocaleString()}원 입금)`;
          showToast(`🎁 정상 지원금/페이백 +${bonus.toLocaleString()}원이 입금되었습니다!`, "emerald");
        }
      } else if (action === "verify_block") {
        if (m.category === "scam") {
          const reward = 20000;
          state.cash += reward;
          addReputation(0.5);
          m.resolved = true;
          m.resultText = `🛡️ 피싱 사칭 간파 및 신고 포상 (+${reward.toLocaleString()}원)`;
          showToast(`🛡️ 사칭 문자를 정확히 걸러냈습니다! 신고 포상금 +${reward.toLocaleString()}원`, "emerald");
        } else if (m.category === "legit_promo") {
          m.resolved = true;
          m.resultText = "😅 정상 안내 문자를 차단해 혜택을 놓쳤습니다";
          showToast("앗, 실제 공식 지원금/거래처 안내 문자를 차단해 버렸습니다!", "amber");
        }
      } else if (action === "spam_delete") {
        state.messages = state.messages.filter(x => x.id !== msgId);
        showToast("🗑️ 광고 문자를 정리했습니다.", "sky");
      } else if (action === "order_accept") {
        if (state.activeCateringOrder && state.activeCateringOrder.status === "accepted") {
          return showToast("이미 진행 중인 단체 납품 의뢰가 있습니다! 먼저 완료해 주세요.", "rose");
        }
        const targetMenu = state.menus.find(x => x.id === m.menuId) || state.menus[0];
        if (!targetMenu.unlocked) {
          return showToast(`먼저 POS [메뉴 개발]에서 '${targetMenu.name}' 메뉴를 해금해야 수락할 수 있습니다!`, "rose");
        }
        state.activeCateringOrder = {
          msgId: m.id,
          menuId: targetMenu.id,
          menuName: targetMenu.name,
          targetQty: m.targetQty || 8,
          delivered: 0,
          rewardCash: m.rewardCash || 120000,
          rewardRep: m.rewardRep || 3,
          dueDay: state.day + 2,
          status: "accepted"
        };
        m.resolved = true;
        m.resultText = `✅ 의뢰 수락됨 (${targetMenu.name} ${m.targetQty}잔 판매 시 보수 +${(m.rewardCash || 120000).toLocaleString()}원)`;
        showToast(`📦 단체 의뢰 수락! '${targetMenu.name}' ${m.targetQty}잔을 판매하면 보수가 지급됩니다!`, "amber");
      } else if (action === "order_decline") {
        m.resolved = true;
        m.resultText = "패스함 (영향 없음)";
        showToast("단체 납품 의뢰를 넘겼습니다.", "sky");
      } else if (action === "claim_coupon") {
        const cost = 10000;
        if (state.cash < cost) return showToast("쿠폰 보상 자금(10,000원)이 부족합니다!", "rose");
        state.cash -= cost;
        addReputation(2);
        m.resolved = true;
        m.resultText = `🎟️ 쿠폰 발송 완료 (-10,000원 · 감사 후기로 평판 보너스!)`;
        showToast(`🎟️ 정중한 쿠폰 답장에 손님이 감동해 좋은 후기를 남겼습니다!`, "emerald");
      } else if (action === "claim_ignore") {
        m.resolved = true;
        m.resultText = "그냥 넘김 (변동 없음)";
        showToast("문자를 그냥 넘겼습니다.", "sky");
      }

      updateHUD();
      renderPhoneApp();
    };

    window.triggerRandomSmsEvent = () => {
      if (!Array.isArray(state.messages)) state.messages = [];
      const unlockedMenus = state.menus.filter(m => m.unlocked);
      const pickMenu = unlockedMenus[Math.floor(Math.random() * unlockedMenus.length)] || state.menus[0];

      const templates = [
        // 1) 사칭/피싱 (외부 단축 URL, 070 번호, 긴급 계좌변경 유도 등 단서가 본문 안에만 존재)
        () => ({
          category: "scam",
          sender: "070-8912-4410",
          shortAlert: "💬 새 문자 도착",
          scamLoss: 180000,
          text: "[국세청] 소상공인 부가세 과오납 환급금 482,000원 조회됨. 금일 18시까지 미확인 시 국고 환수: http://tax-refund-kr.site"
        }),
        () => ({
          category: "scam",
          sender: "010-9311-0824",
          shortAlert: "💬 새 문자 도착",
          scamLoss: 240000,
          text: "[카페 식자재 마켓] 전산 장애로 정산 입금 계좌가 긴급 변경되었습니다. 기존 계좌 입금 시 배송이 보류되니 안내 링크에서 확인해 주세요."
        }),
        // 2) 진짜 공식 지원금 / 진짜 거래처 페이백 (외부 수상한 링크 없음, 공식 대표번호/내부 정산)
        () => ({
          category: "legit_promo",
          sender: "1357 (중소기업통합콜센터)",
          shortAlert: "💬 새 문자 도착",
          rewardCash: 65000,
          rewardRep: 0.5,
          text: "[중소벤처기업부] 영세 소상공인 전기·가스요금 특별지원금 65,000원 지급 대상자로 선정되었습니다. 별도 사이트 접속 없이 즉시 계좌로 수령 가능합니다."
        }),
        () => ({
          category: "legit_promo",
          sender: "카페 식자재 마켓",
          shortAlert: "💬 새 문자 도착",
          rewardCash: 40000,
          rewardRep: 0,
          text: `[카페 식자재 마켓] '${state.cafeName}' 사장님, 우수 거래 매장 감사 페이백 40,000원이 적립되었습니다. 수령 버튼을 누르면 매장 자금으로 바로 입금됩니다.`
        }),
        // 3) 일반 광고 스팸 (누르든 말든 상관없는 배경 소음)
        () => ({
          category: "spam",
          sender: "(광고) 황금대출파트너",
          shortAlert: "💬 새 문자 도착",
          text: "(광고) 사장님! 서류 없이 5분 만에 최대 5천만 원 당일 승인! 무료수신거부 080-000-0000"
        }),
        // 4) 선택형 단체 납품 의뢰 (수락해서 달성하면 큰 이득, 패스해도 손해 없음)
        () => {
          const qty = 6 + Math.floor(Math.random() * 5);
          const reward = Math.round(pickMenu.price * qty * 1.65 / 1000) * 1000 + 35000;
          return {
            category: "order",
            sender: "인근 스타트업 총무팀",
            shortAlert: "💬 새 문자 도착",
            menuId: pickMenu.id,
            targetQty: qty,
            rewardCash: reward,
            rewardRep: 3,
            text: `안녕하세요 사장님! 저희 회사 회의 간식으로 '${pickMenu.name}' ${qty}잔 주문하고 싶습니다. 수락하시면 매장 판매 실적으로 집계 후 보수 +${reward.toLocaleString()}원을 드릴게요!`
          };
        },
        // 5) 손님 아쉬움 문자 (쿠폰 보내면 평판 보너스, 넘겨도 감점 없음)
        () => ({
          category: "claim",
          sender: "010-4821-7730",
          shortAlert: "💬 새 문자 도착",
          text: "방금 포장해 간 음료 얼음이 조금 많이 녹아서 싱거웠어요 ㅠㅠ 다음엔 얼음 조금만 덜 넣어주시면 감사하겠습니다!"
        }),
        // 6) 미식 평가단 방문 힌트
        () => {
          const reg = VISITOR_POOL[Math.floor(Math.random() * VISITOR_POOL.length)];
          return {
            category: "regular",
            sender: `${reg.avatar} ${reg.name}`,
            shortAlert: "💬 새 문자 도착",
            text: `사장님, 카페 리뷰 콘텐츠를 준비 중이에요. 평판 ★${reg.minRep}을 달성하고 시그니처 메뉴와 인테리어를 다듬으면 미식 평가단 심사가 열립니다.`
          };
        },
        () => {
          const tips = [
            "여의도 쪽 지인한테 들었는데 곧 '별다방홀딩스' 관련 얘기가 돌 거라네요. 물론 헛소문일 수도 있으니 태블릿 주식 탭에서 확인해 보세요!",
            "요즘 커뮤니티에서 '시바라떼코인'이 조용히 꿈틀댄다는 말이 있더라고요. 태블릿 코인 차트 흐름 한 번 체크해 보세요!"
          ];
          return {
            category: "tip",
            sender: "010-2940-XXXX",
            shortAlert: "💬 새 문자 도착",
            text: tips[Math.floor(Math.random() * tips.length)]
          };
        }
      ];

      // 단체 의뢰가 이미 진행 중이면 order 템플릿 제외
      const pool = (state.activeCateringOrder && state.activeCateringOrder.status === "accepted")
        ? templates.filter((_, i) => i !== 5)
        : templates;

      const built = pool[Math.floor(Math.random() * pool.length)]();
      const msgObj = {
        id: `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        unread: true,
        resolved: false,
        time: `${state.day}일차 ${formatAmPmTime(state.minuteOfDay)}`,
        ...built
      };

      state.messages.unshift(msgObj);
      if (state.messages.length > 25) state.messages.length = 25;

      if (typeof pushPhoneNotification === "function") {
        pushPhoneNotification("msg", built.shortAlert || "💬 새 문자 도착");
      }
    };

    window.showPurchaseConfirmModal = ({
      icon = "🛍️",
      title = "구매가 완료되었습니다!",
      summary = "",
      promptText = "다른 상품도 계속해서 추가 구매하시겠습니까?",
      stayLabel = "🛒 계속 추가 구매",
      doneLabel = "확인 (창 닫기)",
      onStay = null,
      onDone = null
    } = {}) => {
      const modal = document.getElementById("purchaseConfirmModal");
      if (!modal) return;
      const iconEl = document.getElementById("pcIcon");
      const titleEl = document.getElementById("pcTitle");
      const sumEl = document.getElementById("pcSummary");
      const balEl = document.getElementById("pcBalance");
      const promptEl = document.getElementById("pcPromptText");
      const stayBtn = document.getElementById("pcStayBtn");
      const doneBtn = document.getElementById("pcDoneBtn");

      if (iconEl) iconEl.textContent = icon;
      if (titleEl) titleEl.textContent = title;
      if (sumEl) sumEl.innerHTML = summary;
      if (balEl) balEl.textContent = `남은 보유 자금: ${(state.cash || 0).toLocaleString()}원`;
      if (promptEl) promptEl.textContent = promptText;
      if (stayBtn) stayBtn.textContent = stayLabel;
      if (doneBtn) doneBtn.textContent = doneLabel;

      if (stayBtn) {
        stayBtn.onclick = () => {
          modal.classList.add("hidden");
          if (typeof onStay === "function") onStay();
        };
      }
      if (doneBtn) {
        doneBtn.onclick = () => {
          modal.classList.add("hidden");
          if (typeof onDone === "function") onDone();
        };
      }
      modal.classList.remove("hidden");
    };

    window.buyFurniture = (fid, evt) => {
      const item = FURNITURE_CATALOG.find(f => f.id === fid);
      if (!item) return;
      ensureFurnitureState();
      if (state.ownedFurniture.includes(fid)) return;
      if (state.cash < item.price) return showToast("가구 구매 자금이 부족합니다!", "rose");
      state.cash -= item.price;
      state.ownedFurniture.push(fid);
      addReputation(item.rep);

      if (item.category === "table") {
        const tableKeys = ["slotLeft", "slotCenter", "slotRight", "slotFrontLeft", "slotFrontCenter", "slotFrontRight"];
        const targetSlot = tableKeys.find(k => !state.placedFurniture[k])
          || tableKeys.find(k => state.placedFurniture[k] === "table_wood_2")
          || "slotCenter";
        state.placedFurniture[targetSlot] = fid;
      } else if (item.category === "decor") {
        const decorKeys = ["decorLeft", "decorRight", "decorFrontLeft", "decorFrontRight"];
        const emptyDecor = decorKeys.find(k => !state.placedFurniture[k]) || "decorLeft";
        state.placedFurniture[emptyDecor] = fid;
      } else if (item.category === "rug") {
        state.placedFurniture.hallRug = fid;
      }

      showToast(`🚀 로켓설치 완료! '${item.name}' 홀 자동 배치 (평판 +${item.rep})`, "emerald");
      if (typeof window.flyToCartMotion === "function") {
        window.flyToCartMotion(evt, "#hudReputation", item.icon || "🪑", `+${item.rep}★`);
      }
      updateHUD();
      renderPosModal();
      saveCloudProgress(false);

      window.showPurchaseConfirmModal({
        icon: item.icon || "🪑",
        title: `'${item.name}' 구매 및 배치 완료!`,
        summary: `결제 금액: <b>-${item.price.toLocaleString()}원</b> · 매장 평판 <b>+${item.rep}</b> 상승<br/>카페 홀 슬롯에 자동으로 배치되었습니다.`,
        promptText: "배팡 상점에서 다른 가구나 인테리어를 계속 추가 구매하시겠습니까?",
        stayLabel: "🛒 계속 추가 구매",
        doneLabel: "홀 화면 보기",
        onStay: () => {
          shopState.detailId = null;
          renderPosModal();
        },
        onDone: () => {
          shopState.detailId = null;
          closeModal("posModal");
        }
      });
    };

    window.placeFurniture = (slotKey, fid) => {
      ensureFurnitureState();
      state.placedFurniture[slotKey] = fid || null;
      showToast("✨ 홀 가구 배치가 실시간 반영되었습니다!", "amber");
      updateHUD();
      saveCloudProgress(false);
    };

    window.autoFillBestFurniture = () => {
      ensureFurnitureState();
      const bestTables = FURNITURE_CATALOG
        .filter(f => f.category === "table" && state.ownedFurniture.includes(f.id))
        .sort((a, b) => b.tipBonus - a.tipBonus);
      const bestDecors = FURNITURE_CATALOG
        .filter(f => f.category === "decor" && state.ownedFurniture.includes(f.id))
        .sort((a, b) => b.tipBonus - a.tipBonus);
      const bestRugs = FURNITURE_CATALOG
        .filter(f => f.category === "rug" && state.ownedFurniture.includes(f.id))
        .sort((a, b) => b.tipBonus - a.tipBonus);

      const tableKeys = ["slotLeft", "slotCenter", "slotRight", "slotFrontLeft", "slotFrontCenter", "slotFrontRight"];
      tableKeys.forEach((k, idx) => {
        if (bestTables.length) {
          state.placedFurniture[k] = bestTables[idx % bestTables.length].id;
        }
      });

      const decorKeys = ["decorLeft", "decorRight", "decorFrontLeft", "decorFrontRight"];
      decorKeys.forEach((k, idx) => {
        state.placedFurniture[k] = bestDecors[idx] ? bestDecors[idx].id : (bestDecors[0] ? bestDecors[0].id : null);
      });

      if (bestRugs.length) state.placedFurniture.hallRug = bestRugs[0].id;
      showToast("✨ 보유한 최고급 가구로 홀 전체 배치를 완료했습니다!", "amber");
      updateHUD();
      renderPosModal();
      saveCloudProgress(false);
    };

    window.addIngredientWithFly = (id, delta, evt) => {
      const info = typeof getIngredientById === "function" ? getIngredientById(id) : null;
      economy.addToIngredientCart(id, delta);
      if (delta > 0 && typeof window.flyToCartMotion === "function") {
        window.flyToCartMotion(evt, "#tabletMarketCartBox", info ? info.icon : "🛒", "+1팩");
      }
    };

    window.unlockMenu = (idx) => {
      const m = state.menus[idx];
      const wasUnlocked = Boolean(m && m.unlocked);
      economy.unlockMenu(idx);
      if (m && !wasUnlocked && m.unlocked && typeof window.showPurchaseConfirmModal === "function") {
        window.showPurchaseConfirmModal({
          icon: m.icon || "☕",
          title: `'${m.name}' 신메뉴 개발 완료!`,
          summary: `개발 비용: <b>-${m.unlockCost.toLocaleString()}원</b> · 판매가 <b>${m.price.toLocaleString()}원</b><br/>지금부터 손님들이 해당 메뉴를 주문합니다.`,
          promptText: "다른 신메뉴나 식자재도 계속 추가 구매·개발하시겠습니까?",
          stayLabel: "☕ 계속 추가 개발",
          doneLabel: "매장 보기",
          onDone: () => closeModal("posModal")
        });
      }
    };
    window.buyUpgrade = (idx) => {
      const u = state.upgrades[idx];
      const prevLv = u ? (u.level || 0) : 0;
      economy.buyUpgrade(idx);
      if (u && (u.level || 0) > prevLv && typeof window.showPurchaseConfirmModal === "function") {
        window.showPurchaseConfirmModal({
          icon: "⚙️",
          title: `'${u.name}' Lv.${u.level} 업그레이드 완료!`,
          summary: `${u.desc}<br/>설비 성능이 매장 운영에 즉시 반영되었습니다.`,
          promptText: "다른 설비나 가구도 계속 추가 구매하시겠습니까?",
          stayLabel: "🛒 계속 추가 구매",
          doneLabel: "매장 보기",
          onDone: () => closeModal("posModal")
        });
      }
    };

    window.respondRegularOffer = (accept) => {
      if (accept && pendingRegularOffer && state.regulars.length < 8) {
        state.regulars.push(pendingRegularOffer.id);
        showToast(`💖 '${pendingRegularOffer.name}'님이 우리 카페 찐단골이 되었습니다!`, "amber");
        saveCloudProgress(false);
      }
      pendingRegularOffer = null;
      document.getElementById("regularOfferModal").classList.add("hidden");
      updateHUD();
    };

    window.switchPhoneApp = (app) => {
      if (activeDevice === "phone" && app !== "sns" && app !== "msg") {
        return window.openTabletApp(app === "market" ? "market" : app);
      }
      activePhoneApp = app;
      if (typeof clearPhoneAppAlert === "function") clearPhoneAppAlert(app);
      const body = document.getElementById(activeDevice === "tablet" ? "tabletBody" : "phoneBody");
      if (body) body.scrollTop = 0;
      const map = { market: "Market", sns: "Sns", msg: "Msg", stock: "Stock", coin: "Coin" };
      Object.entries(map).forEach(([k, suffix]) => {
        const el = document.getElementById(`${activeDevice === "tablet" ? "tApp" : "appBtn"}${suffix}`);
        if (el) el.className = k === app
          ? "py-1.5 rounded-xl flex flex-col items-center gap-0.5 bg-violet-600 text-white"
          : "py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-stone-400";
      });
      renderPhoneApp();
    };

    function renderPhoneApp() {
      const titleEl = document.getElementById(activeDevice === "tablet" ? "tabletAppTitle" : "phoneAppTitle");
      const bodyEl = document.getElementById(activeDevice === "tablet" ? "tabletBody" : "phoneBody");
      if (!titleEl || !bodyEl) return;

      if (activePhoneApp === "staff") {
        titleEl.textContent = "👥 직원 고용 · 급여 관리";
        bodyEl.innerHTML = renderStaffApp();
        return;
      } else if (activePhoneApp === "branch") {
        titleEl.textContent = "🏪 지점별 운영 컨셉 특화";
        bodyEl.innerHTML = typeof renderBranchConceptApp === "function" ? renderBranchConceptApp() : "";
        return;
      } else if (activePhoneApp === "report") {
        titleEl.textContent = "🧾 계절·월간 경영 정산";
        bodyEl.innerHTML = renderSeasonReports();
        return;
      }

      if (activePhoneApp === "market") {
        economy.ensureIngredientState();
        titleEl.textContent = "🛒 카페 식자재 마켓 · 배송";

        const cart = state.ingredientCart || [];
        const deliveries = state.pendingDeliveries || [];
        const cartCount = cart.reduce((s, c) => s + c.qty, 0);
        const cartSubtotal = cart.reduce((s, c) => {
          return s + economy.getIngredientPrice(c.id) * c.qty;
        }, 0);
        const deliveryFee = cartSubtotal === 0 ? 0 : (cartSubtotal >= 30000 ? 0 : 2500);
        const cartTotal = cartSubtotal + deliveryFee;

        // 배송 진행중 배너
        const deliveryBannerHtml = deliveries.length > 0 ? `
          <div class="bg-sky-950/80 border border-sky-500/60 rounded-2xl p-2.5 space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-extrabold text-sky-200">
              <span>🚚 식자재 냉장탑차 배송중 (${deliveries.length}건)</span>
              <span class="text-[10px] text-sky-400">도착 시 자동 입고</span>
            </div>
            ${deliveries.map(d => {
              const pct = Math.min(100, Math.max(8, Math.round(((d.totalSec - d.remainingSec) / d.totalSec) * 100)));
              const itemText = d.items.map(it => `${it.icon}${it.name}×${it.qty}`).join(", ");
              return `
                <div class="bg-stone-950/90 rounded-xl p-2 space-y-1">
                  <div class="flex justify-between text-[10px]">
                    <span class="text-stone-200 font-bold truncate max-w-[195px]">${itemText}</span>
                    <span class="text-amber-300 font-black shrink-0">약 ${d.remainingSec}초 후 도착</span>
                  </div>
                  <div class="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all" style="width:${pct}%"></div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        ` : "";

        economy.ensureStorageUpgradeEntry();
        const usedUnits = economy.getTotalIngredientUnits();
        const pendingUnits = economy.getPendingDeliveryUnits();
        const cartUnits = economy.getCartUnits();
        const maxCap = economy.getMaxIngredientCapacity();
        const committedUnits = usedUnits + pendingUnits + cartUnits;
        const fillPct = Math.min(100, Math.round((usedUnits / maxCap) * 100));
        const storageGaugeHtml = `
          <div class="bg-stone-900 border border-stone-800 rounded-2xl p-2.5 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-[11px] font-extrabold text-sky-300">🧊 재료별 개별 보관 상한</div>
                <div class="text-[10px] text-stone-400">전체 용량 제한 없음 · 재료당 최대 80잔 · 보유 <b class="text-white">${usedUnits}</b>잔${pendingUnits > 0 ? ` + 배송중 <b class="text-sky-300">${pendingUnits}</b>잔` : ""}${cartUnits > 0 ? ` + 장바구니 <b class="text-amber-300">${cartUnits}</b>잔` : ""}</div>
              </div>
              <span class="px-2 py-1 rounded-lg bg-stone-800 text-stone-300 text-[10px] font-bold shrink-0">상한 없음(전체)</span>
            </div>
            <div class="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div class="h-full ${fillPct >= 90 ? "bg-rose-500" : fillPct >= 70 ? "bg-amber-400" : "bg-emerald-500"} transition-all" style="width:${fillPct}%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-stone-400">
              <span>☕ 원두는 본사 상시 공급</span>
              <span>☕ 본점 원두는 상시 공급</span>
            </div>
          </div>
        `;

        // 상단 안내 & 서브탭 (재료쇼핑 / 창고재고)
        const topNavHtml = storageGaugeHtml + renderIngredientSubscriptions() + `
          <div class="bg-stone-900 border border-stone-800 rounded-2xl p-2 space-y-1.5">
            <div class="grid grid-cols-2 gap-1 bg-stone-950 p-1 rounded-xl text-[11px] font-extrabold">
              <button onclick="setMarketSubTab('shop')" class="py-1.5 rounded-lg transition ${marketUiState.subTab === "shop" ? "bg-emerald-600 text-white" : "text-stone-400"}">
                🛍️ 재료 장보기 (${INGREDIENT_CATALOG.length}종)
              </button>
              <button onclick="setMarketSubTab('stock')" class="py-1.5 rounded-lg transition ${marketUiState.subTab === "stock" ? "bg-amber-600 text-white" : "text-stone-400"}">
                🧊 창고 재고 (${usedUnits}/${maxCap}잔)
              </button>
            </div>
          </div>
        `;

        if (marketUiState.subTab === "stock") {
          bodyEl.innerHTML = deliveryBannerHtml + topNavHtml + `
            <div class="space-y-1.5">
              ${INGREDIENT_CATALOG.map(ing => {
                const qty = state.ingredientStock[ing.id] || 0;
                return `
                  <div class="bg-stone-900 border ${qty > 0 ? "border-stone-800" : "border-rose-900/50"} rounded-xl px-3 py-2 flex items-center justify-between">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-lg">${ing.icon}</span>
                      <div class="truncate">
                        <div class="text-xs font-bold text-white truncate">${ing.name}</div>
                        <div class="text-[10px] text-stone-400">1팩 ${ing.packUnits}잔분 · ${economy.getIngredientPrice(ing.id).toLocaleString()}원 · 상한 80잔</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs font-black ${qty > 5 ? "text-emerald-400" : qty > 0 ? "text-amber-300" : "text-stone-500"}">${qty}잔</span>
                      <button onclick="addIngredientWithFly('${ing.id}', 1, event)" class="px-2 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-extrabold active:scale-95 transition">+담기</button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          `;
          return;
        }

        // 카테고리 탭 + 검색
        const filteredIngs = INGREDIENT_CATALOG.filter(ing => {
          if (marketUiState.category !== "all" && ing.category !== marketUiState.category) return false;
          if (marketUiState.search.trim()) {
            const q = marketUiState.search.trim().toLowerCase();
            if (!`${ing.name} ${ing.desc}`.toLowerCase().includes(q)) return false;
          }
          return true;
        });

        const filterHtml = `
          <div class="space-y-1.5">
            <input id="marketSearchInput" type="text" value="${marketUiState.search.replace(/"/g, "&quot;")}"
              oninput="setMarketSearch(this.value)"
              placeholder="재료 검색 (우유, 말차, 딸기, 크림, 시럽...)"
              class="w-full bg-stone-900 border border-stone-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none" />
            <div class="flex gap-1 overflow-x-auto pb-0.5">
              ${INGREDIENT_CATEGORIES.map(c => `
                <button onclick="setMarketCategory('${c.id}')"
                  class="px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 transition ${marketUiState.category === c.id ? "bg-emerald-600 text-white" : "bg-stone-900 text-stone-400 border border-stone-800"}">
                  ${c.label}
                </button>
              `).join("")}
            </div>
          </div>
        `;

        // 재료 상품 리스트 (장바구니 수량 조절 버튼 포함)
        const catalogHtml = `
          <div class="space-y-1.5">
            ${filteredIngs.map(ing => {
              const inCart = cart.find(c => c.id === ing.id);
              const cartQty = inCart ? inCart.qty : 0;
              const stockQty = state.ingredientStock[ing.id] || 0;
              return `
                <div class="bg-stone-900 border ${cartQty > 0 ? "border-emerald-500/70" : "border-stone-800"} rounded-2xl p-2.5 flex items-center justify-between gap-2">
                  <div class="flex items-start gap-2 min-w-0">
                    <div class="w-9 h-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-lg shrink-0">${ing.icon}</div>
                    <div class="min-w-0">
                      <div class="text-xs font-extrabold text-white truncate">${ing.name}</div>
                      <div class="text-[10px] text-stone-400 line-clamp-1">${ing.desc}</div>
                      <div class="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span class="font-black text-emerald-300">${economy.getIngredientPrice(ing.id).toLocaleString()}원</span>
                        <span class="text-stone-500">(${ing.packUnits}잔분)</span>
                        <span class="text-sky-300 font-bold">보유 ${stockQty}잔</span>
                      </div>
                    </div>
                  </div>

                  <div class="shrink-0">
                    ${cartQty > 0 ? `
                      <div class="flex items-center gap-1 bg-stone-950 border border-emerald-500/50 rounded-xl px-1.5 py-1">
                        <button onclick="addToIngredientCart('${ing.id}', -1)" class="w-5 h-5 rounded-lg bg-stone-800 text-white font-black text-xs">−</button>
                        <span class="text-xs font-black text-emerald-300 w-4 text-center">${cartQty}</span>
                        <button onclick="addIngredientWithFly('${ing.id}', 1, event)" class="w-5 h-5 rounded-lg bg-emerald-600 text-white font-black text-xs active:scale-95 transition">+</button>
                      </div>
                    ` : `
                      <button onclick="addIngredientWithFly('${ing.id}', 1, event)"
                        class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow active:scale-95 transition">
                        + 담기
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;

        // 하단 장바구니 일괄 결제 카드
        const cartBoxHtml = `
          <div id="tabletMarketCartBox" class="sticky bottom-0 bg-stone-900/95 backdrop-blur-md border-2 ${cartCount > 0 ? "border-emerald-500" : "border-stone-800"} rounded-2xl p-3 space-y-2 shadow-2xl">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-white">🛒 발주 장바구니 (${cartCount}팩)</span>
              ${cartCount > 0 ? `<button onclick="clearIngredientCart()" class="text-[10px] text-rose-400 font-bold hover:underline">전체 비우기</button>` : ""}
            </div>

            ${cartCount > 0 ? `
              <div class="max-h-20 overflow-y-auto space-y-1 text-[11px] bg-stone-950/90 rounded-xl p-2 border border-stone-800">
                ${cart.map(c => {
                  const info = getIngredientById(c.id);
                  if (!info) return "";
                  return `
                    <div class="flex items-center justify-between">
                      <span class="text-stone-200 truncate">${info.icon} ${info.name} × ${c.qty}팩 (+${info.packUnits * c.qty}잔)</span>
                      <span class="font-bold text-emerald-300 shrink-0">${(economy.getIngredientPrice(info.id) * c.qty).toLocaleString()}원</span>
                    </div>
                  `;
                }).join("")}
              </div>
              <div class="flex items-center justify-between text-[11px] text-stone-400">
                <span>배송비 (${deliveryFee === 0 ? "3만원 이상 무료" : "3만원 미만"})</span>
                <span>${deliveryFee === 0 ? "0원" : `+${deliveryFee.toLocaleString()}원`}</span>
              </div>
              <button onclick="checkoutIngredientCart()"
                class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-stone-950 font-black text-xs shadow-lg">
                🚚 총 ${cartTotal.toLocaleString()}원 일괄 결제 및 배달 주문
              </button>
            ` : `
              <div class="text-[11px] text-stone-400 text-center py-1">
                필요한 재료를 여러 개 장바구니에 담아 한꺼번에 배달 주문하세요!
              </div>
            `}
          </div>
        `;

        bodyEl.innerHTML = deliveryBannerHtml + topNavHtml + filterHtml + catalogHtml + cartBoxHtml;
      } else if (activePhoneApp === "sns") {
        titleEl.textContent = "📸 카페그램 (CafeGram)";
        const followers = state.snsFollowers || 128;
        const viralSec = state.snsViralBoostTicks || 0;
        const loc = getCurrentLocation();
        const themeCards = {
          sunset: "from-amber-900/80 via-rose-900/70 to-purple-950",
          coffee: "from-stone-800 via-amber-950 to-stone-900",
          interior: "from-emerald-950 via-stone-900 to-amber-950",
          viral: "from-pink-900/80 via-purple-900/80 to-indigo-950"
        };
        bodyEl.innerHTML = `
          <!-- 카페 공식 계정 프로필 & 바이럴 현황 -->
          <div class="bg-stone-900 border border-pink-500/30 rounded-2xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5">
                  <div class="w-full h-full rounded-full bg-stone-950 flex items-center justify-center text-sm">☕</div>
                </div>
                <div>
                  <div class="text-xs font-black text-white flex items-center gap-1">
                    <span>@${escapeHtml(state.playerId || "cafe_owner")}</span>
                    <span class="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full">공식</span>
                  </div>
                  <div class="text-[10px] text-stone-400">${loc.region} ${loc.name} · ${escapeHtml(state.cafeName)}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs font-black text-pink-300">${followers.toLocaleString()}명</div>
                <div class="text-[10px] text-stone-400">팔로워</div>
              </div>
            </div>

            ${viralSec > 0 ? `
              <div class="bg-gradient-to-r from-pink-500/20 to-amber-500/20 border border-pink-400/40 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                <span class="font-extrabold text-pink-200">🔥 실시간 알고리즘 떡상중!</span>
                <span class="font-black text-amber-300">전 메뉴 단가 +15% (${viralSec}초)</span>
              </div>
            ` : `
              <div class="text-[10px] text-stone-400 bg-stone-950/80 rounded-xl px-2.5 py-1.5">
                💡 캠페인을 집행하면 팔로워가 늘고 <b>45초간 전 메뉴 판매 단가 +15%</b> 떡상 효과가 발동됩니다!
              </div>
            `}

            <div class="grid grid-cols-2 gap-1.5 pt-0.5">
              <button onclick="postPromoSns('mood')" class="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-600 to-pink-600 hover:brightness-110 text-white text-[11px] font-extrabold shadow">
                🌅 창밖 감성샷 피드<br><span class="text-[9px] font-normal opacity-90">-30,000원 · 팔로워↑ · 평판 소폭↑</span>
              </button>
              <button onclick="postPromoSns('reels')" class="py-2 px-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-[11px] font-extrabold shadow">
                🎬 숏폼 릴스 바이럴<br><span class="text-[9px] font-normal opacity-90">-80,000원 · 팔로워↑↑ · 평판↑</span>
              </button>
            </div>
            <div class="text-[10px] text-stone-400 text-right">오늘 홍보 집행: ${state.snsPromoDay === state.day ? (state.snsPromoCountToday || 0) : 0}/2회</div>
          </div>

          <!-- 피드 타임라인 -->
          <div class="space-y-2.5">
            ${state.snsPosts.map((p, i) => `
              <div class="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
                <div class="px-3 py-2 flex items-center justify-between border-b border-stone-800/70">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-extrabold text-pink-300">${escapeHtml(p.user)}</span>
                    ${p.badge ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">${escapeHtml(p.badge)}</span>` : ""}
                  </div>
                  <span class="text-[10px] text-stone-500">${escapeHtml(p.timeLabel || "방금 전")}</span>
                </div>

                <!-- 감성 스냅 배너 -->
                <div class="bg-gradient-to-r ${themeCards[p.photoTheme] || themeCards.coffee} px-3 py-2.5 flex items-center justify-between border-b border-stone-800/60">
                  <span class="text-xs font-bold text-amber-100">${escapeHtml(p.mood || "☕ 오늘의 한 잔")}</span>
                  <span class="text-[10px] text-white/80 font-semibold">📍 ${loc.name}</span>
                </div>

                <div class="p-3 space-y-1.5">
                  <p class="text-xs text-stone-200 leading-relaxed">${escapeHtml(p.text)}</p>
                  <div class="text-[11px] text-sky-400 font-medium">${escapeHtml(p.tag)}</div>

                  ${p.comments && p.comments.length ? `
                    <div class="bg-stone-950/80 rounded-xl p-2 space-y-1 text-[10px] text-stone-300 border border-stone-800/80">
                      ${p.comments.slice(0, 2).map(cm => `<div>💬 ${escapeHtml(cm)}</div>`).join("")}
                    </div>
                  ` : ""}

                  <div class="flex items-center justify-between pt-1">
                    <button onclick="toggleLikeSns(${i})" class="text-xs font-bold ${p.liked ? "text-rose-400" : "text-stone-400"}">
                      ${p.liked ? "❤️" : "🤍"} 좋아요 ${escapeHtml(p.likes)}개
                    </button>
                    <button onclick="replySnsPost(${i})" class="text-[10px] font-bold text-amber-300 hover:underline">
                      ✍️ 사장님 답글 (호감도↑)
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      } else if (activePhoneApp === "msg") {
        titleEl.textContent = "💬 사장님 문자 메시지함";
        if (typeof clearPhoneAppAlert === "function") clearPhoneAppAlert("msg");

        const catBanner = state.activeCateringOrder && state.activeCateringOrder.status === "accepted" ? (() => {
          const c = state.activeCateringOrder;
          const pct = Math.min(100, Math.round(((c.delivered || 0) / c.targetQty) * 100));
          return `
            <div class="bg-amber-950/80 border border-amber-500/60 rounded-2xl p-2.5 space-y-1.5">
              <div class="flex justify-between items-center text-[11px]">
                <span class="font-extrabold text-amber-200">📦 진행중 납품: ${c.menuName}</span>
                <span class="font-black text-emerald-300">${c.delivered || 0}/${c.targetQty}잔</span>
              </div>
              <div class="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 transition-all" style="width:${pct}%"></div>
              </div>
              <div class="text-[10px] text-stone-300 flex justify-between">
                <span>완료 보수: +${c.rewardCash.toLocaleString()}원</span>
                <span>마감: ${c.dueDay}일차까지</span>
              </div>
            </div>
          `;
        })() : "";

        const msgsHtml = (state.messages || []).map((m) => {
          let actionsHtml = "";
          if (m.resolved) {
            actionsHtml = `<div class="mt-2 pt-1.5 border-t border-stone-800 text-[11px] font-bold text-stone-400">${m.resultText || "처리 완료"}</div>`;
          } else if (m.category === "scam" || m.category === "legit_promo") {
            // 스미싱/사칭 문자와 실제 정부·거래처 혜택 문자가 완전히 동일한 버튼 UI를 가짐 (눈치게임!)
            actionsHtml = `
              <div class="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-stone-800">
                <button onclick="resolveSmsAction('${m.id}', 'verify_open')" class="py-1.5 px-2 rounded-xl bg-sky-900/70 hover:bg-sky-800 text-sky-100 text-[11px] font-extrabold">🔗 안내 확인 / 수령</button>
                <button onclick="resolveSmsAction('${m.id}', 'verify_block')" class="py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-extrabold">🛡️ 차단 / 신고</button>
              </div>`;
          } else if (m.category === "spam") {
            actionsHtml = `
              <div class="flex justify-end mt-2 pt-1.5 border-t border-stone-800">
                <button onclick="resolveSmsAction('${m.id}', 'spam_delete')" class="py-1 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 text-[10px] font-bold">🗑️ 지우기</button>
              </div>`;
          } else if (m.category === "order") {
            actionsHtml = `
              <div class="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-stone-800">
                <button onclick="resolveSmsAction('${m.id}', 'order_accept')" class="py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-[11px] font-black">✅ 의뢰 수락</button>
                <button onclick="resolveSmsAction('${m.id}', 'order_decline')" class="py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold">패스하기</button>
              </div>`;
          } else if (m.category === "claim") {
            actionsHtml = `
              <div class="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-stone-800">
                <button onclick="resolveSmsAction('${m.id}', 'claim_coupon')" class="py-1.5 px-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-[11px] font-extrabold">🎟️ 쿠폰 보내기 (-1만)</button>
                <button onclick="resolveSmsAction('${m.id}', 'claim_ignore')" class="py-1.5 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold">넘기기</button>
              </div>`;
          }

          return `
            <div class="bg-stone-900 border ${m.resolved ? "border-stone-800/80 opacity-80" : "border-stone-700"} rounded-2xl p-3 space-y-1">
              <div class="flex items-center justify-between gap-1 text-[11px]">
                <span class="font-extrabold text-amber-200 truncate">📩 ${m.sender}</span>
                <span class="text-stone-500 shrink-0">${m.time}</span>
              </div>
              <p class="text-xs text-stone-200 leading-relaxed whitespace-pre-line">${m.text}</p>
              ${actionsHtml}
            </div>
          `;
        }).join("");

        bodyEl.innerHTML = catBanner + (msgsHtml || `<div class="text-center text-xs text-stone-500 py-8">수신된 문자가 없습니다.</div>`);
      } else if (activePhoneApp === "stock") {
        titleEl.textContent = "📈 한국증권 (배당주 거래)";
        renderMarketApp("stock", bodyEl);
      } else if (activePhoneApp === "coin") {
        titleEl.textContent = "🪙 업비트코인 (초고변동)";
        renderMarketApp("coin", bodyEl);
      }
    }

    
    window.toggleCustomMenuBuilder = () => {
      customMenuDraft.open = !customMenuDraft.open;
      renderPosModal();
    };
    window.setCustomMenuName = (val) => {
      customMenuDraft.name = val;
    };
    window.toggleCustomMenuCoffee = () => {
      customMenuDraft.useCoffee = !customMenuDraft.useCoffee;
      renderPosModal();
    };
    window.toggleCustomIngredient = (ingId) => {
      const idx = customMenuDraft.selectedIngredients.indexOf(ingId);
      if (idx >= 0) {
        customMenuDraft.selectedIngredients.splice(idx, 1);
      } else {
        if (customMenuDraft.selectedIngredients.length >= 4) {
          return showToast("재료는 최대 4가지까지 조합할 수 있습니다!", "amber");
        }
        customMenuDraft.selectedIngredients.push(ingId);
      }
      customMenuDraft.customPrice = "";
      renderPosModal();
    };
    window.setCustomMenuPrice = (val) => {
      customMenuDraft.customPrice = val;
    };
    window.submitCustomMenu = () => {
      const nameEl = document.getElementById("customMenuNameInput");
      const priceEl = document.getElementById("customMenuPriceInput");
      const fbEl = document.getElementById("customMenuFeedback");
      const liveName = (nameEl ? nameEl.value : customMenuDraft.name) || "";
      const livePrice = priceEl ? priceEl.value : customMenuDraft.customPrice;
      customMenuDraft.name = liveName;
      customMenuDraft.customPrice = livePrice;

      const showInlineError = (msg, focusName = false) => {
        if (fbEl) {
          fbEl.textContent = "⚠️ " + msg;
          fbEl.classList.remove("hidden");
        }
        if (focusName && nameEl) {
          nameEl.focus();
          nameEl.classList.add("border-rose-500");
        }
      };

      const cleanName = liveName.trim();
      if (cleanName.length < 2) {
        showToast("신메뉴 이름을 2글자 이상 입력해 주세요!", "rose");
        return showInlineError("1번 항목에 신메뉴 이름을 2글자 이상 입력해 주세요!", true);
      }
      if (!customMenuDraft.selectedIngredients || customMenuDraft.selectedIngredients.length === 0) {
        showToast("최소 1가지 이상의 재료를 선택해 주세요!", "rose");
        return showInlineError("3번 항목에서 들어갈 재료를 1~4가지 선택해 주세요!");
      }
      if (state.menus.some(m => m.name === cleanName)) {
        showToast("이미 같은 이름의 메뉴가 존재합니다!", "rose");
        return showInlineError("이미 같은 이름의 메뉴가 있습니다. 다른 이름을 입력해 주세요!", true);
      }
      if ((state.cash || 0) < 150000) {
        showToast("신메뉴 레시피 개발비(150,000원)가 부족합니다!", "rose");
        return showInlineError("보유 자금이 부족합니다. (개발비 150,000원 필요)");
      }

      const ok = economy.createCustomMenu({
        name: cleanName,
        ingredientIds: customMenuDraft.selectedIngredients,
        useCoffee: customMenuDraft.useCoffee,
        customPrice: livePrice
      });
      if (ok) {
        const created = state.menus[0];
        customMenuDraft = { open: false, name: "", useCoffee: true, selectedIngredients: [], customPrice: "" };
        renderPosModal();
        saveCloudProgress(false);

        if (typeof window.showPurchaseConfirmModal === "function" && created) {
          window.showPurchaseConfirmModal({
            icon: "🧪",
            title: `'${created.name}' 시그니처 출시 완료!`,
            summary: `등급: <b>${created.tierBadge}</b> · 판매가 <b>${created.price.toLocaleString()}원</b> (개발비 -150,000원)<br/>메뉴판 최상단에 즉시 등록되어 손님 주문을 받기 시작합니다!`,
            promptText: "다른 시그니처 메뉴도 계속 추가로 만드시겠습니까?",
            stayLabel: "🧪 하나 더 만들기",
            doneLabel: "메뉴판 확인하기",
            onStay: () => {
              customMenuDraft.open = true;
              renderPosModal();
            }
          });
        }
      }
    };
    window.deleteCustomMenu = (menuId) => {
      economy.deleteCustomMenu(menuId);
      saveCloudProgress(false);
    };

    window.setMarketSubTab = (tab) => {
      marketUiState.subTab = tab;
      renderPhoneApp();
    };
    window.setMarketCategory = (cat) => {
      marketUiState.category = cat;
      renderPhoneApp();
    };
    window.setMarketSearch = (val) => {
      marketUiState.search = val;
      renderPhoneApp();
      const inp = document.getElementById("marketSearchInput");
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    };
    window.addToIngredientCart = (ingId, delta) => economy.addToIngredientCart(ingId, delta);
    window.clearIngredientCart = () => economy.clearIngredientCart();
    window.checkoutIngredientCart = () => economy.checkoutIngredientCart();
    window.upgradeWarehouse = () => economy.upgradeWarehouseFromPhone();


    window.postPromoSns = (mode = "mood") => {
      if (state.snsPromoDay !== state.day) {
        state.snsPromoDay = state.day;
        state.snsPromoCountToday = 0;
      }
      if ((state.snsPromoCountToday || 0) >= 2) {
        return showToast("📢 하루 최대 2회까지만 SNS 홍보 캠페인을 집행할 수 있습니다!", "rose");
      }

      const isReels = mode === "reels";
      const cost = isReels ? 80000 : 30000;
      const rawRepGain = isReels ? 4 : 1.5;
      const followerGain = isReels ? Math.floor(Math.random() * 90) + 75 : Math.floor(Math.random() * 35) + 20;

      if (state.cash < cost) {
        if (typeof window.showFundsWarning === "function") window.showFundsWarning(`카페그램 홍보비 ${cost.toLocaleString()}원이 부족합니다.`);
        return showToast("홍보비가 부족합니다!", "rose");
      }
      state.cash -= cost;
      state.snsPromoCountToday = (state.snsPromoCountToday || 0) + 1;
      const repGain = addReputation(rawRepGain);
      state.snsFollowers = (state.snsFollowers || 128) + followerGain;
      state.snsViralBoostTicks = Math.min(90, (state.snsViralBoostTicks || 0) + (isReels ? 45 : 25));

      const loc = getCurrentLocation();
      const season = SEASONS[state.seasonIdx];
      const unlocked = state.menus.filter(m => m.unlocked);
      const pickMenu = unlocked[Math.floor(Math.random() * unlocked.length)] || state.menus[0];

      state.snsPosts.unshift({
        user: `@${state.playerId || "cafe_owner"}`,
        badge: isReels ? "🔥 릴스 추천" : "사장님 피드",
        mood: isReels ? `🎬 ${pickMenu.name} 추출 ASMR` : `${season.icon} ${season.name} 통유리 채광맛집`,
        photoTheme: isReels ? "viral" : "sunset",
        timeLabel: "방금 전",
        tag: `#${loc.name.replace(/\s/g, "")} #${season.name}카페 #${state.cafeName.replace(/\s/g, "")} #카공추천`,
        text: isReels
          ? `크레마 쫀쫀하게 올라오는 '${pickMenu.name}' 한 잔! ${loc.name} 오시면 꼭 들러주세요 🔥`
          : `${season.icon} ${season.name} 하늘이 예쁜 오늘, ${state.cafeName} 창가 자리 비어있어요!`,
        likes: isReels ? Math.floor(Math.random() * 140) + 65 : Math.floor(Math.random() * 45) + 18,
        comments: isReels
          ? ["@coffee_holic: 와 크레마 미쳤다 당장 갈게요!", "@incheon_date: 여기 분위기 진짜 좋아요 강추!"]
          : ["@daily_latte: 창밖 풍경 보면서 힐링하기 딱이네요 ☕"],
        liked: true,
        replied: false
      });
      if (state.snsPosts.length > 15) state.snsPosts.pop();
      showToast(`📸 카페그램 게시 완료! 팔로워 +${followerGain}명${repGain > 0 ? ` · 평판 +${repGain}` : ""} · 떡상 보너스 발동!`, "amber");
      updateHUD();
      renderPhoneApp();
    };

    window.replySnsPost = (i) => {
      const post = state.snsPosts[i];
      if (!post) return;
      if (post.replied) return showToast("이미 정성스러운 사장님 답글을 남겼습니다!", "sky");
      post.replied = true;
      post.comments = post.comments || [];
      post.comments.push(`👑 ${state.cafeName}: 소중한 방문과 후기 진심으로 감사드립니다! ☕`);
      const gainedRep = addReputation(0.6);
      state.snsFollowers = (state.snsFollowers || 128) + 6;
      showToast(gainedRep > 0 ? `💬 진심 어린 답글로 단골 호감도와 평판(+${gainedRep})이 올랐습니다!` : "💬 진심 어린 답글로 단골 호감도와 팔로워가 올랐습니다!", "emerald");
      updateHUD();
      renderPhoneApp();
    };

    window.toggleLikeSns = (i) => {
      state.snsPosts[i].liked = !state.snsPosts[i].liked;
      state.snsPosts[i].likes += state.snsPosts[i].liked ? 1 : -1;
      renderPhoneApp();
    };

    window.tradeAsset = (type, idx, dir, amt) => economy.tradeAsset(type, idx, dir, amt);
