// 계정 · Firebase Firestore 직접 저장/불러오기 · 랭킹 (4자리 PIN 방식)
    function escapeHtml(value) {
      return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]);
    }

    function normalizedCafeNameKey(cafeName) {
      return String(cafeName || "").trim().replace(/\s+/g, "").toLowerCase();
    }

    function calculateNetWorth() {
      let total = state.cash;
      state.branches.forEach(id => {
        const l = METRO_LOCATIONS.find(x => x.id === id);
        if (l) total += l.branchPrice;
      });
      state.buildings.forEach(id => {
        const l = METRO_LOCATIONS.find(x => x.id === id);
        if (l) total += l.buildingPrice;
      });
      state.stocks.forEach(s => { total += s.price * s.owned; });
      state.coins.forEach(c => { total += Math.round(c.price * c.owned); });
      return Math.round(total);
    }

    function renderLedgerModal() {
      const loc = getCurrentLocation();
      const ownsHqBuilding = state.buildings.includes(state.hqLocationId);
      document.getElementById("ledgerPlayerId").textContent = state.playerId || "-";
      document.getElementById("ledgerNickname").textContent = state.nickname || "-";
      document.getElementById("ledgerCash").textContent = `${state.cash.toLocaleString()}원`;
      document.getElementById("ledgerNetWorth").textContent = `${calculateNetWorth().toLocaleString()}원`;
      document.getElementById("ledgerRent").textContent = ownsHqBuilding ? "0원 (자가 건물)" : `-${loc.rent.toLocaleString()}원`;
    }

    window.switchOnboardTab = (tab) => {
      const isNew = tab === "new";
      document.getElementById("onboardNewForm").classList.toggle("hidden", !isNew);
      document.getElementById("onboardLoadForm").classList.toggle("hidden", isNew);
      document.getElementById("tabNewBtn").className = isNew
        ? "py-2 rounded-xl text-xs font-extrabold bg-amber-600 text-white transition"
        : "py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition";
      document.getElementById("tabLoadBtn").className = !isNew
        ? "py-2 rounded-xl text-xs font-extrabold bg-sky-600 text-white transition"
        : "py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition";
    };

    window.fillRandomCafeName = () => {
      const adj = ["달빛", "연남", "오후세시", "구름", "한강뷰", "골목길", "창가자리", "버터크림", "소금빵", "노을빛"];
      const noun = ["로스터스", "커피방앗간", "다방", "에스프레소바", "산책카페", "테라스", "브루잉하우스"];
      const name = `${adj[Math.floor(Math.random() * adj.length)]} ${noun[Math.floor(Math.random() * noun.length)]}`;
      document.getElementById("regCafeName").value = name;
    };

    window.handleVerifyAndOpenMap = async () => {
      const playerId = document.getElementById("regPlayerId").value.trim().toLowerCase();
      const nickname = document.getElementById("regNickname").value.trim();
      const pin = document.getElementById("regPin").value.trim();
      const cafeName = document.getElementById("regCafeName").value.trim();
      const errEl = document.getElementById("onboardNewError");
      const btn = document.getElementById("createCafeBtn");

      if (!/^[a-z0-9_]{4,16}$/.test(playerId)) {
        errEl.textContent = "고유 아이디는 영문 소문자·숫자·밑줄(_) 4~16자로 입력하세요.";
        return;
      }
      if (!nickname || nickname.length < 2) {
        errEl.textContent = "사장님 닉네임을 2글자 이상 입력하세요.";
        return;
      }
      if (!/^[0-9]{4}$/.test(pin)) {
        errEl.textContent = "4자리 숫자 PIN을 입력하세요.";
        return;
      }
      if (!cafeName || cafeName.length < 2) {
        errEl.textContent = "카페 상호명을 2글자 이상 입력하세요.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "아이디 및 상호명 중복 확인 중...";
      errEl.textContent = "";

      try {
        if (db) {
          const userSnap = await getDoc(doc(db, "cafeUsers", playerId));
          if (userSnap.exists()) {
            errEl.textContent = "이미 사용 중인 사장님 아이디입니다. 다른 아이디를 입력해 주세요.";
            return;
          }
          const nameKey = normalizedCafeNameKey(cafeName);
          const nameSnap = await getDoc(doc(db, "cafeNames", nameKey));
          if (nameSnap.exists()) {
            errEl.textContent = "이미 등록된 카페 상호명입니다. 다른 이름을 입력해 주세요.";
            return;
          }
        }

        pendingSignupData = { playerId, nickname, pin, cafeName };
        isInitialLocationSelection = true;
        selectedMapLocId = "incheon_guwol";

        document.getElementById("onboardingModal").classList.add("hidden");
        document.getElementById("initialMapBanner").classList.remove("hidden");
        document.getElementById("mapCloseBtn").classList.add("hidden");
        openModal("mapModal");
        focusMapRegion("all");
      } catch (e) {
        console.error(e);
        errEl.textContent = `중복 확인 중 오류가 발생했습니다: ${e && e.message ? e.message : "Firebase 설정을 확인하세요."}`;
      } finally {
        btn.disabled = false;
        btn.textContent = "중복 확인 후 지도에서 상권 고르기 →";
      }
    };

    window.confirmInitialLocation = async (locId) => {
      if (!pendingSignupData) return;
      const locObj = METRO_LOCATIONS.find(l => l.id === locId);
      if (!locObj || locObj.deposit > 8000000) {
        return showToast("초기 자본금(800만 원) 이내의 상권을 선택해 주세요!", "rose");
      }

      const { playerId, nickname, pin, cafeName } = pendingSignupData;
      state.playerId = playerId;
      state.nickname = nickname;
      state.pin = pin;
      state.cafeName = cafeName;
      state.hqLocationId = locObj.id;
      state.activeViewLocationId = locObj.id;
      state.cash = 8000000 - locObj.deposit;
      state.minuteOfDay = 480;
      selectedMapLocId = locObj.id;

      try {
        if (db) {
          const nameKey = normalizedCafeNameKey(cafeName);
          await setDoc(doc(db, "cafeNames", nameKey), {
            playerId,
            cafeName,
            createdAt: Date.now()
          }, { merge: true });
          await saveCloudProgress(false);
        } else {
          setCloudStatus("기기 로컬 저장 중 · Firebase 설정이 필요합니다.", "not-configured");
        }
      } catch (e) {
        console.error("Initial cloud save failed:", e);
        setCloudStatus("매장은 열었지만 Firebase 저장에 실패했습니다.", "error");
      }

      localStorage.setItem("metroCafeSession", JSON.stringify({ playerId }));
      localStorage.setItem("metroCafeLocalSave", JSON.stringify(state));
      isInitialLocationSelection = false;
      pendingSignupData = null;

      document.getElementById("initialMapBanner").classList.add("hidden");
      document.getElementById("mapCloseBtn").classList.remove("hidden");
      closeModal("mapModal");

      updateHUD();
      showToast(`🎉 '${locObj.region} ${locObj.name}'에 '${state.cafeName}' 개업 완료!`, "amber");
      if (typeof openTutorialModal === "function") {
        openTutorialModal(false);
      }
      setTimeout(() => spawnCustomer(), 2500);
    };

    window.handleLoadCafe = async () => {
      const playerId = document.getElementById("loginPlayerId").value.trim().toLowerCase();
      const pin = document.getElementById("loginPin").value.trim();
      const errEl = document.getElementById("onboardLoadError");
      const btn = document.getElementById("loadCafeBtn");

      if (!/^[a-z0-9_]{4,16}$/.test(playerId) || !/^[0-9]{4}$/.test(pin)) {
        errEl.textContent = "사장님 아이디와 4자리 숫자 PIN을 정확히 입력하세요.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "클라우드 매장 확인 중...";
      errEl.textContent = "";

      try {
        let loaded = null;
        if (db) {
          const snap = await getDoc(doc(db, "cafeUsers", playerId));
          if (!snap.exists()) {
            errEl.textContent = "존재하지 않는 사장님 아이디입니다.";
            return;
          }
          const data = snap.data();
          if (String(data.pin || "") !== pin) {
            errEl.textContent = "4자리 PIN 번호가 일치하지 않습니다.";
            return;
          }
          loaded = data.saveState ? JSON.parse(data.saveState) : null;
        } else {
          const localRaw = localStorage.getItem("metroCafeLocalSave");
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            if (parsed.playerId === playerId && String(parsed.pin || "") === pin) {
              loaded = parsed;
            }
          }
        }

        if (!loaded) {
          errEl.textContent = "저장된 매장 데이터를 찾을 수 없습니다. Firebase 설정을 확인하세요.";
          return;
        }

        state = { ...state, ...loaded, playerId, pin };
        state.marketPriceVersion = Number(loaded.marketPriceVersion) || 0;
        if (!state.branchConcepts || typeof state.branchConcepts !== "object") state.branchConcepts = {};
        if (!state.ownedFurniture) state.ownedFurniture = ["table_wood_2"];
        if (!state.placedFurniture) {
          state.placedFurniture = { slotLeft: "table_wood_2", slotCenter: "table_wood_2", slotRight: "table_wood_2", decorLeft: null, decorRight: null };
        }
        if (state.minuteOfDay < 480 || state.minuteOfDay >= 1380) {
          state.minuteOfDay = 480;
        }
        selectedMapLocId = state.hqLocationId;

        localStorage.setItem("metroCafeSession", JSON.stringify({ playerId }));
        localStorage.setItem("metroCafeLocalSave", JSON.stringify(state));
        document.getElementById("onboardingModal").classList.add("hidden");
        SoundEngine.syncWeatherAudio();
        updateHUD();
        setCloudStatus("클라우드 저장을 불러왔습니다.", "synced");
        showToast(`☁️ '${state.cafeName}' 매장 데이터를 성공적으로 불러왔습니다!`, "sky");
      } catch (e) {
        console.error(e);
        setCloudStatus("매장 불러오기 실패 · Firebase 설정을 확인하세요.", "error");
        errEl.textContent = `불러오기 실패: ${e && e.message ? e.message : "아이디와 PIN을 확인하세요."}`;
      } finally {
        btn.disabled = false;
        btn.textContent = "☁️ 클라우드에서 매장 불러오기";
      }
    };

    async function saveCloudProgress(notify = false) {
      if (!state.playerId) return;
      localStorage.setItem("metroCafeLocalSave", JSON.stringify(state));

      if (!db) {
        setCloudStatus("기기에 저장됨 · Firebase 설정 후 클라우드 동기화 가능", "not-configured");
        if (notify) showToast("💾 이 기기에 저장했습니다. js/firebase-config.js 설정 시 클라우드 동기화됩니다.", "amber");
        return;
      }
      try {
        setCloudStatus("Firebase에 저장 중...", "saving");
        const netWorth = calculateNetWorth();
        await setDoc(doc(db, "cafeUsers", state.playerId), {
          playerId: state.playerId,
          pin: state.pin || "",
          nickname: state.nickname,
          cafeName: state.cafeName,
          saveState: JSON.stringify(state),
          updatedAt: Date.now()
        }, { merge: true });

        await setDoc(doc(db, "rankings", state.playerId), {
          playerId: state.playerId,
          nickname: state.nickname,
          cafeName: state.cafeName,
          hqLocationId: state.hqLocationId,
          netWorth,
          updatedAt: Date.now()
        }, { merge: true });

        setCloudStatus(`최근 클라우드 동기화: ${new Date().toLocaleTimeString()}`, "synced");
        if (notify) showToast("☁️ 클라우드에 안전하게 저장되었습니다!", "emerald");
      } catch (e) {
        console.error("Cloud save failed:", e);
        setCloudStatus("클라우드 저장 실패 · 기기 저장은 유지됩니다.", "error");
        if (notify) showToast("⚠️ 클라우드 저장에 실패했습니다. 네트워크와 Firestore 규칙을 확인하세요.", "rose");
      }
    }

    window.manualCloudSave = () => saveCloudProgress(true);

    window.logoutAndSwitchAccount = () => {
      localStorage.removeItem("metroCafeSession");
      closeModal("ledgerModal");
      document.getElementById("onboardingModal").classList.remove("hidden");
      switchOnboardTab("load");
    };

    async function loadRankings() {
      const listEl = document.getElementById("rankingList");
      listEl.innerHTML = `<div class="text-center text-stone-400 py-8">실시간 수도권 랭킹 불러오는 중...</div>`;
      try {
        if (!db) throw new Error("No DB");
        const snap = await getDocs(collection(db, "rankings"));
        const rows = [];
        snap.forEach(d => rows.push(d.data()));
        rows.sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0));

        if (rows.length === 0) {
          listEl.innerHTML = `<div class="text-center text-stone-400 py-8">아직 등록된 랭킹이 없습니다.</div>`;
          return;
        }

        listEl.innerHTML = rows.slice(0, 30).map((r, idx) => {
          const isMe = r.playerId === state.playerId;
          const loc = METRO_LOCATIONS.find(l => l.id === r.hqLocationId);
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}위`;
          return `
            <div class="bg-stone-950 border ${isMe ? "border-amber-500" : "border-stone-800"} rounded-2xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="font-black text-amber-300 w-7 text-center shrink-0">${medal}</span>
                <div class="truncate">
                  <div class="font-extrabold text-white truncate">${escapeHtml(r.cafeName)} ${isMe ? "<span class='text-amber-400'>(나)</span>" : ""}</div>
                  <div class="text-[11px] text-stone-400">${escapeHtml(r.nickname)} · ${loc ? escapeHtml(loc.name) : "수도권"}</div>
                </div>
              </div>
              <div class="font-black text-emerald-400 shrink-0">${(r.netWorth || 0).toLocaleString()}원</div>
            </div>
          `;
        }).join("");
      } catch (e) {
        console.error("Ranking load failed:", e);
        setCloudStatus("랭킹 불러오기 실패 · 네트워크와 Firestore 규칙을 확인하세요.", "error");
        listEl.innerHTML = `<div class="text-center text-rose-400 py-6">랭킹을 불러오지 못했습니다.</div>`;
      }
    }
