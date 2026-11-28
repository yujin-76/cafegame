// 손님 생성 · 이동 · 주문 · 퇴장 (6개 홀 테이블 동선)
    const HALL_SEAT_SLOTS = [
      { id: "slotLeft", x: 0.23, yRatio: 0.615, label: "창가 왼쪽 자리" },
      { id: "slotCenter", x: 0.50, yRatio: 0.615, label: "창가 중앙 자리" },
      { id: "slotRight", x: 0.77, yRatio: 0.615, label: "창가 오른쪽 자리" },
      { id: "slotFrontLeft", x: 0.25, yRatio: 0.785, label: "홀 앞쪽 왼쪽 자리" },
      { id: "slotFrontCenter", x: 0.50, yRatio: 0.785, label: "홀 앞쪽 중앙 자리" },
      { id: "slotFrontRight", x: 0.75, yRatio: 0.785, label: "홀 앞쪽 오른쪽 자리" }
    ];

    function getActiveSeatSlots() {
      const placed = state.placedFurniture || {};
      const active = HALL_SEAT_SLOTS.filter(s => Boolean(placed[s.id]));
      return active.length ? active : HALL_SEAT_SLOTS.slice(0, 3);
    }

    function spawnCustomer() {
      const availableSeats = getActiveSeatSlots();
      const maxCap = Math.min(5, availableSeats.length);
      if (activeCustomers.length >= maxCap) return;

      const unlockedMenus = state.menus.filter(m => m.unlocked);
      // 재료가 준비된 메뉴 우선 + 맛/트렌드 인기도(popularity)에 따른 가중치 선택 (맛없는 괴식 메뉴는 거의 안 시킴!)
      const availableMenus = unlockedMenus.filter(m => typeof economy !== "undefined" ? economy.canMakeMenu(m) : true);
      const candidateMenus = availableMenus.length > 0 ? availableMenus : unlockedMenus;
      const weightedPool = candidateMenus.map(m => {
        let w = typeof m.popularity === "number" ? m.popularity : 1.0;
        if (m.isTrending) w *= 2.1; // SNS 유행 중이면 손님 주문 폭주!
        if (typeof economy !== "undefined" && economy.getSeasonalMenuBonus(m) > 0) w *= 1.35;
        return { menu: m, weight: Math.max(0.05, w) };
      });
      const totalWeight = weightedPool.reduce((s, x) => s + x.weight, 0);
      let rPick = Math.random() * totalWeight;
      let chosenMenu = weightedPool[0]?.menu || state.menus[0];
      for (const item of weightedPool) {
        rPick -= item.weight;
        if (rPick <= 0) {
          chosenMenu = item.menu;
          break;
        }
      }

      // 수도권의 수많은 일반 시민 손님(82%)과 단골 후보 손님(18%)이 자연스럽게 섞여 방문
      const isSpecialCandidate = Math.random() < 0.18;
      let visitor;
      if (isSpecialCandidate) {
        const candidates = VISITOR_POOL.filter(v => !activeCustomers.some(c => c.visitor.id === v.id));
        const pool = candidates.length ? candidates : VISITOR_POOL;
        visitor = pool[Math.floor(Math.random() * pool.length)];
      } else {
        // 현재 홀에 이미 있는 손님들과 겹치지 않는 외형을 우선 선택
        const usedLabels = new Set(activeCustomers.map(c => c.visitor?.name));
        const unusedApps = CROWD_APPEARANCES.filter(a => !usedLabels.has(a.label));
        const appPool = unusedApps.length > 0 ? unusedApps : CROWD_APPEARANCES;
        const app = appPool[Math.floor(Math.random() * appPool.length)];
        const appIdx = CROWD_APPEARANCES.indexOf(app);
        visitor = {
          id: `general_crowd_${appIdx >= 0 ? appIdx : Math.floor(Math.random() * 12)}`,
          appearanceIndex: appIdx >= 0 ? appIdx : 0,
          isGeneral: true,
          name: app.label,
          hairStyle: app.hairStyle,
          hairColor: app.hairColor,
          skinColor: app.skinColor,
          topColor: app.topColor,
          accessory: app.accessory
        };
      }

      // 비어 있는 테이블 슬롯 우선 배정
      const freeSlots = availableSeats.filter(s => !activeCustomers.some(c => c.slotId === s.id));
      const chosenSlot = (freeSlots.length ? freeSlots : availableSeats)[Math.floor(Math.random() * (freeSlots.length ? freeSlots.length : availableSeats.length))];

      const entranceGreetings = [
        "안녕하세용! 입장 ✨",
        "홀 인테리어가 너무 예뻐요~ ☕",
        "오늘도 들렀어요! 😊",
        "넓은 홀 자리 잡을게요! 🪑"
      ];

      activeCustomers.push({
        visitor,
        menu: chosenMenu,
        x: 0.06,
        yRatio: 0.68,
        targetX: chosenSlot.x,
        targetYRatio: chosenSlot.yRatio,
        seatX: chosenSlot.x,
        seatYRatio: chosenSlot.yRatio,
        slotId: chosenSlot.id,
        state: "entering", // entering -> ordering -> sitting -> leaving
        timer: 0,
        orderOrdered: false,
        isSipping: false,
        sipTimer: 0,
        mood: "happy",
        bubbleText: entranceGreetings[Math.floor(Math.random() * entranceGreetings.length)]
      });
    }

    function updateCustomers(rawDt) {
      const dt = rawDt * (typeof gameSpeed === "number" ? gameSpeed : 1);
      for (let i = activeCustomers.length - 1; i >= 0; i--) {
        const c = activeCustomers[i];
        c.timer += dt * (state.employees && state.employees.barista ? 1.3 : 1);
        if (typeof c.yRatio !== "number") c.yRatio = 0.62;
        if (typeof c.seatYRatio !== "number") c.seatYRatio = 0.62;

        if (c.state === "entering") {
          c.isSipping = false;
          const dx = c.targetX - c.x;
          const dy = (c.targetYRatio || c.seatYRatio) - c.yRatio;
          const dist = Math.hypot(dx, dy);
          if (dist <= 0.012) {
            c.x = c.targetX;
            c.yRatio = c.targetYRatio || c.seatYRatio;
            c.state = "ordering";
            c.timer = 0;
            c.mood = "excited";
            c.bubbleText = `${c.menu.name} 주문할게요! 🧾`;
          } else {
            c.x += (dx / dist) * 0.085 * dt;
            c.yRatio += (dy / dist) * 0.085 * dt;
          }
        } else if (c.state === "ordering") {
          c.isSipping = false;
          if (!c.orderOrdered && c.timer >= 1.8) {
            c.orderOrdered = true;
            processCustomerOrder(c);
          }
          if (c.timer >= 3.6) {
            c.state = "sitting";
            c.targetX = c.seatX;
            c.yRatio = c.seatYRatio;
            c.timer = 0;
            c.mood = "happy";
            c.bubbleText = "테이블에서 여유롭게 한 모금 ☕";
          }
        } else if (c.state === "sitting") {
          c.x = c.seatX;
          c.yRatio = c.seatYRatio;
          const cycle = c.timer % 4.5;
          c.isSipping = cycle > 1.5 && cycle < 3.3;

          if (c.timer > 6.5 && c.timer < 6.7) {
            c.mood = "love";
            const seasonComments = [
              "벚꽃 바람 보며 마시니 최고 🌸",
              "시원한 여름 하늘에 힐링돼요 🌿",
              "단풍 물든 창밖이 그림 같네요 🍁",
              "따뜻한 커피가 몸을 녹여줘요 ❄️"
            ];
            const weatherComments = {
              rain: "빗소리 들으며 마시는 커피 낭만 🌧️",
              snow: "눈 내리는 풍경이랑 딱이네요 ☃️",
              cloudy: "인테리어 가구가 아늑해서 좋아요 🕯️",
              clear: seasonComments[state.seasonIdx] || "창밖 풍경이랑 딱이네요 😊"
            };
            c.bubbleText = weatherComments[state.weather] || "인테리어가 정말 감성적이네요 😊";
          } else if (c.timer > 13.5 && c.timer < 13.7) {
            c.mood = "happy";
            c.bubbleText = `${c.menu.name} 풍미가 깊어요 😋`;
          }

          if (c.timer >= 19) {
            c.state = "leaving";
            c.isSipping = false;
            c.targetX = 0.05;
            c.targetYRatio = 0.68;
            c.timer = 0;
            c.mood = "happy";
            c.bubbleText = "잘 마셨습니다! 다음에 또 올게요 👋";
          }
        } else if (c.state === "leaving") {
          c.isSipping = false;
          const dx = c.targetX - c.x;
          const dy = (c.targetYRatio || 0.68) - c.yRatio;
          const dist = Math.hypot(dx, dy);
          if (dist <= 0.015) {
            activeCustomers.splice(i, 1);
          } else {
            c.x += (dx / dist) * 0.085 * dt;
            c.yRatio += (dy / dist) * 0.085 * dt;
          }
        }
      }
    }
