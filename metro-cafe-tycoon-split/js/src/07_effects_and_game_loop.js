// 알림 효과 · 자동 저장 · 게임 루프 · HTML onclick 호환
    function showToast(msg, tone = "amber") {
      const container = document.getElementById("toastContainer");
      const el = document.createElement("div");
      const colors = {
        amber: "bg-stone-900/95 border-amber-500/60 text-amber-100",
        emerald: "bg-stone-900/95 border-emerald-500/60 text-emerald-200",
        sky: "bg-stone-900/95 border-sky-500/60 text-sky-200",
        rose: "bg-stone-900/95 border-rose-500/60 text-rose-200",
        purple: "bg-stone-900/95 border-purple-500/60 text-purple-200"
      };
      el.className = `${colors[tone] || colors.amber} border backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl text-center transition-all`;
      el.textContent = msg;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 350);
      }, 3000);
    }

    function spawnFloatingText(text, x, y, color) {
      const el = document.createElement("div");
      el.className = "floating-coin text-xs sm:text-sm";
      el.style.left = `${Math.min(window.innerWidth - 110, Math.max(16, x - 35))}px`;
      el.style.top = `${y}px`;
      el.style.color = color;
      el.textContent = text;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }

    (async function tryAutoRestore() {
      const savedSession = localStorage.getItem("metroCafeSession");
      if (!savedSession) return;
      try {
        const { playerId, pin } = JSON.parse(savedSession);
        if (db && playerId && pin) {
          const snap = await getDoc(doc(db, "cafeUsers", playerId));
          if (snap.exists() && snap.data().pin === pin && snap.data().saveState) {
            state = { ...state, ...JSON.parse(snap.data().saveState) };
            selectedMapLocId = state.hqLocationId;
            document.getElementById("onboardingModal").classList.add("hidden");
            updateHUD();
            return;
          }
        }
        const localBackup = localStorage.getItem("metroCafeLocalSave");
        if (localBackup) {
          state = { ...state, ...JSON.parse(localBackup) };
          document.getElementById("onboardingModal").classList.add("hidden");
          updateHUD();
        }
      } catch (e) {
        console.warn("Session restore skipped:", e);
      }
    })();

    let secondCounter = 0;
    setInterval(() => {
      if (!state.playerId) return;
      secondCounter++;

      state.minuteOfDay += 8;
      if (state.minuteOfDay >= 1440) {
        state.minuteOfDay = 0;
        advanceDayAndWeather();
      }

      const interiorLv = state.upgrades.find(u => u.id === "interior")?.level || 0;
      let trafficBoost = 1.0;
      state.regulars.forEach(regId => {
        const v = VISITOR_POOL.find(item => item.id === regId);
        if (v && v.bonusType === "traffic") trafficBoost += v.bonusVal;
      });
      const spawnChance = Math.min(0.22, (0.025 + state.reputation * 0.001 + interiorLv * 0.015) * trafficBoost);
      if (Math.random() < spawnChance) {
        spawnCustomer();
      }

      if (secondCounter % 3 === 0) {
        tickAutoBrew();
      }

      if (secondCounter % 10 === 0) {
        state.stocks.forEach(s => {
          const chg = 1 + (Math.random() - 0.49) * 0.04;
          s.price = Math.max(5000, Math.round(s.price * chg));
        });
        state.coins.forEach(c => {
          const chg = 1 + (Math.random() - 0.49) * 0.12;
          c.price = Math.max(50, Math.round(c.price * chg));
        });
      }

      if (secondCounter % 25 === 0) {
        saveCloudProgress(false);
      }

      updateHUD();
    }, 1000);

    let lastFrameTime = performance.now();
    function mainLoop(now) {
      const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
      lastFrameTime = now;
      updateCustomers(dt);
      cafeRenderer.draw(now);
      requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);


// Preserve compatibility with the existing HTML onclick="..." handlers.
Object.assign(window, {
  updateAudioUI,
  spawnCustomer,
  updateCustomers,
  getCurrentLocation,
  calculateMenuSalePrice,
  tickAutoBrew,
  processCustomerOrder,
  advanceDayAndWeather,
  getWeatherLabel,
  updateHUD,
  renderPosModal,
  renderPhoneApp,
  applyMapTransform,
  renderMetroPins,
  updateSelectedLocationPanel,
  calculateNetWorth,
  renderLedgerModal,
  saveCloudProgress,
  loadRankings,
  showToast,
  spawnFloatingText,
  mainLoop
});
