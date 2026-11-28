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

    // 주소 접속 시 자동 로그인을 건너뛰고 항상 로그인/개업 화면부터 시작하도록 설정
    (function initAlwaysLoginScreen() {
      try {
        localStorage.removeItem("metroCafeSession");
      } catch (e) {
        console.warn("Session clear warning:", e);
      }
      const onboardEl = document.getElementById("onboardingModal");
      if (onboardEl) {
        onboardEl.classList.remove("hidden");
      }
      if (typeof switchOnboardTab === "function") {
        switchOnboardTab("load");
      }
    })();

    let secondCounter = 0;
    let simAccumulator = 0;

    function runOneSimStep() {
      secondCounter++;

      if ((state.snsViralBoostTicks || 0) > 0) {
        state.snsViralBoostTicks = Math.max(0, state.snsViralBoostTicks - 1);
      }

      if ((state.pendingDeliveries || []).length > 0) {
        const arrived = economy.tickDeliveries();
        if (activePhoneApp === "market" && !document.getElementById("phoneModal").classList.contains("hidden")) {
          renderPhoneApp();
        }
        if (arrived && activePosTab === "menu" && !document.getElementById("posModal").classList.contains("hidden")) {
          renderPosModal();
        }
      }

      const interiorLv = state.upgrades.find(u => u.id === "interior")?.level || 0;
      let trafficBoost = 1.0;
      if ((state.snsViralBoostTicks || 0) > 0) trafficBoost += 0.25;
      if (state.employees && state.employees.marketing) trafficBoost += 0.08;

      const spawnChance = Math.min(0.26, (0.028 + state.reputation * 0.001 + interiorLv * 0.015) * trafficBoost);
      if (Math.random() < spawnChance) {
        spawnCustomer();
      }

      if (secondCounter % 3 === 0) {
        tickAutoBrew();
      }
      if (typeof window.tickAutoSubscriptions === "function") window.tickAutoSubscriptions();
      if (typeof runEmployeeAutomation === "function") runEmployeeAutomation();

      // 손님 자발적 카페그램 후기 생성 (가끔씩 피드가 살아 숨쉬듯 갱신)
      if (secondCounter % 38 === 0 && state.reputation >= 12) {
        const loc = getCurrentLocation();
        const unlocked = state.menus.filter(m => m.unlocked);
        const m = unlocked[Math.floor(Math.random() * unlocked.length)] || state.menus[0];
        const handles = ["@seoul_cafe_log", "@incheon_foodie", "@gg_coffee_trip", "@latte_art_kr", "@weekend_brunch"];
        const reviews = [
          `${loc.name}에서 제일 아늑한 카페 발견! '${m.name}' 밸런스가 진짜 좋네요 ☕`,
          `통유리 창밖 보면서 멍때리기 최고인 ${state.cafeName}… 재방문 의사 200% ✨`,
          `사장님이 원두 관리에 진심이신 듯! ${m.name} 향이 너무 깊어요 👍`
        ];
        state.snsPosts.unshift({
          user: handles[Math.floor(Math.random() * handles.length)],
          badge: "손님 방문후기",
          mood: `☕ ${m.name} 인증샷`,
          photoTheme: "coffee",
          timeLabel: "방금 전",
          tag: `#${loc.name.replace(/\s/g, "")}맛집 #${state.cafeName.replace(/\s/g, "")}`,
          text: reviews[Math.floor(Math.random() * reviews.length)],
          likes: Math.floor(Math.random() * 28) + 8,
          comments: [],
          liked: false,
          replied: false
        });
        if (state.snsPosts.length > 15) state.snsPosts.pop();
        state.snsFollowers = (state.snsFollowers || 128) + Math.floor(Math.random() * 8) + 3;
        if (activePhoneApp === "sns" && !document.getElementById("phoneModal").classList.contains("hidden")) {
          renderPhoneApp();
        }
      }

      marketTick();

      // 주기적으로 문자 이벤트 수신 (개업 첫 문자는 빠르게, 이후 수신 간격은 완화)
      if ((secondCounter === 16 || (secondCounter > 20 && secondCounter % 105 === 0)) && typeof triggerRandomSmsEvent === "function") {
        triggerRandomSmsEvent();
      }

      // 단체 납품 의뢰 기한 초과 체크
      if (state.activeCateringOrder && state.activeCateringOrder.status === "accepted" && state.day > state.activeCateringOrder.dueDay) {
        const expired = state.activeCateringOrder;
        const msgObj = (state.messages || []).find(m => m.id === expired.msgId);
        if (msgObj) {
          msgObj.resolved = true;
          msgObj.resultText = "⏰ 납품 기한 초과로 의뢰 취소됨 (평판 -2)";
        }
        addReputation(-2);
        showToast(`⏰ 단체 납품 의뢰('${expired.menuName}') 기한이 지나 취소되었습니다. (평판 -2)`, "rose");
        state.activeCateringOrder = null;
      }

      if (secondCounter % 25 === 0) {
        saveCloudProgress(false);
      }

      updateHUD();
    }

    let isNightSkipping = false;
    let nightSkipTimer = 0;

    function triggerNightSkip() {
      if (isNightSkipping) return;
      isNightSkipping = true;
      nightSkipTimer = 0;
      // 마감 시 홀 손님 모두 퇴장 처리
      activeCustomers.forEach(c => {
        c.state = "leaving";
        c.isSipping = false;
        c.targetX = 0.05;
        c.targetYRatio = 0.68;
        c.bubbleText = "마감 시간이네요! 수고하세요 🌙";
      });
      const overlay = document.getElementById("nightSkipOverlay");
      const iconEl = document.getElementById("nightSkipIcon");
      const titleEl = document.getElementById("nightSkipTitle");
      const subEl = document.getElementById("nightSkipSub");
      if (overlay) {
        if (iconEl) iconEl.textContent = "🌙✨";
        if (titleEl) titleEl.textContent = "PM 11:00 영업 마감 · 새벽 시간 자동 스킵";
        if (subEl) subEl.textContent = "야경에서 아침 햇살로 빠르게 넘어가는 중...";
        overlay.classList.remove("hidden");
      }
    }

    let lastFrameTime = performance.now();
    function mainLoop(now) {
      const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      if (state.playerId) {
        const spd = typeof gameSpeed === "number" ? gameSpeed : 1;

        if (isNightSkipping) {
          nightSkipTimer += dt;
          // 1.6초 동안 밤 23:00(1380) -> 자정(1440) -> 다음 날 오전 08:00(480)까지 빠르게 하늘 연출 전환
          state.minuteOfDay += 340 * dt;
          if (state.minuteOfDay >= 1440) {
            state.minuteOfDay -= 1440;
            advanceDayAndWeather();
            const iconEl = document.getElementById("nightSkipIcon");
            const subEl = document.getElementById("nightSkipSub");
            if (iconEl) iconEl.textContent = "🌅☕";
            if (subEl) subEl.textContent = `${state.day}일차 오전 08:00 오픈 준비 완료!`;
          }
          if (nightSkipTimer >= 1.6 && state.minuteOfDay >= 480 && state.minuteOfDay < 1380) {
            state.minuteOfDay = 480;
            isNightSkipping = false;
            nightSkipTimer = 0;
            activeCustomers.length = 0;
            const overlay = document.getElementById("nightSkipOverlay");
            if (overlay) overlay.classList.add("hidden");
            updateHUD();
          }
        } else {
          if (state.minuteOfDay < 480) state.minuteOfDay = 480;
          // 영업시간(AM 08:00 ~ PM 23:00) 진행
          state.minuteOfDay += 8 * dt * spd;
          if (state.minuteOfDay >= 1380) {
            state.minuteOfDay = 1380;
            triggerNightSkip();
          }

          simAccumulator += dt * spd;
          while (simAccumulator >= 1.0) {
            simAccumulator -= 1.0;
            runOneSimStep();
          }
        }
      }

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
  marketTick,
  renderMarketApp,
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
