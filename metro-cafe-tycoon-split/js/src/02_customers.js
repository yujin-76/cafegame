// 손님 생성 · 이동 · 주문 · 퇴장
    // ==================== 손님 출입·주문·착석·퇴장 동선 ====================
    function spawnCustomer() {
      if (activeCustomers.length >= 3) return;
      const unlockedMenus = state.menus.filter(m => m.unlocked);
      const chosenMenu = unlockedMenus[Math.floor(Math.random() * unlockedMenus.length)] || state.menus[0];

      // 단골 후보 중 아직 매장에 없는 손님 우선 선택
      const candidates = VISITOR_POOL.filter(v => !activeCustomers.some(c => c.visitor.id === v.id));
      const visitor = (candidates.length ? candidates : VISITOR_POOL)[Math.floor(Math.random() * (candidates.length ? candidates.length : VISITOR_POOL.length))];
      const seatX = activeCustomers.some(c => Math.abs(c.seatX - 0.60) < 0.08) ? 0.76 : 0.60;

      activeCustomers.push({
        visitor,
        menu: chosenMenu,
        x: 0.07,
        targetX: 0.36,
        seatX,
        state: "entering", // entering -> ordering -> sitting -> leaving
        timer: 0,
        orderOrdered: false,
        bubbleText: "안녕하세용! 입장 ✨"
      });
    }

    function updateCustomers(dt) {
      for (let i = activeCustomers.length - 1; i >= 0; i--) {
        const c = activeCustomers[i];
        c.timer += dt;

        if (c.state === "entering") {
          const dir = Math.sign(c.targetX - c.x);
          c.x += dir * 0.055 * dt;
          if (Math.abs(c.targetX - c.x) <= 0.008) {
            c.x = c.targetX;
            c.state = "ordering";
            c.timer = 0;
            c.bubbleText = `${c.menu.name} 주세요!`;
          }
        } else if (c.state === "ordering") {
          if (!c.orderOrdered && c.timer >= 2.2) {
            c.orderOrdered = true;
            processCustomerOrder(c);
          }
          if (c.timer >= 4.2) {
            c.state = "sitting";
            c.targetX = c.seatX;
            c.timer = 0;
            c.bubbleText = "창가 자리에서 한 모금 ☕";
          }
        } else if (c.state === "sitting") {
          if (Math.abs(c.targetX - c.x) > 0.008) {
            c.x += Math.sign(c.targetX - c.x) * 0.05 * dt;
          } else {
            c.x = c.targetX;
            if (c.timer > 8 && c.timer < 8.2) {
              c.bubbleText = "창밖 풍경이랑 딱이네요 😊";
            }
            if (c.timer >= 20) {
              c.state = "leaving";
              c.targetX = 0.06;
              c.timer = 0;
              c.bubbleText = "잘 마셨습니다! 다음에 또 올게요 👋";
            }
          }
        } else if (c.state === "leaving") {
          c.x += Math.sign(c.targetX - c.x) * 0.055 * dt;
          if (Math.abs(c.targetX - c.x) <= 0.012) {
            activeCustomers.splice(i, 1);
          }
        }
      }
    }

    // ==================== 게임 로직 & 수익 계산 ====================
