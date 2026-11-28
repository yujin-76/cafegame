// 시장 엔진: 전 플레이어 실시간 동기화 시세 · 차트 · 뉴스 이벤트 · 손익 색상 표시 (주식/코인 공용)
    // 한국 시장 색상 규칙: 상승/이익 = 빨강, 하락/손실 = 파랑

    const MARKET_TICK_SECONDS = 10;   // 전 세계 공통 10초 단위 틱
    const MARKET_HIST_LEN = 60;       // 차트에 남기는 가격 기록 개수 (60개 × 10초 = 최근 10분)
    const MARKET_BASE_PRICES = {
      stock: { STAR: 42000, BEAN: 18500, HAN: 65000 },
      coin:  { BTC: 85000000, CAFE: 18000, DOGE: 12000 }
    };
    const MARKET_CFG = {
      stock: { noise: 0.025, floor: 5000, revert: 0.022, rumorRate: 0.20, pct: [0.03, 0.065], macroPct: [0.015, 0.03] },
      coin:  { noise: 0.075, floor: 50, floorRatio: 0.10, revert: 0.018, rumorRate: 0.30, pct: [0.08, 0.18], macroPct: [0.04, 0.09] }
    };
    const MARKET_UNIT_SPLITS = { CAFE: 15, DOGE: 50 };
    const MARKET_RUMOR_TRUE_RATE = 0.55;
    const MARKET_RUMOR_FAIL_BACKLASH = 0.4;
    const MARKET_BETA = { BTC: 0.7, CAFE: 1.0, DOGE: 1.4 };

    const MARKET_NEWS = {
      stock: {
        STAR: {
          up: [
            { h: "별다방홀딩스, 겨울 신메뉴 출시 첫 주 매출 역대 최고", b: "신메뉴 효과로 전 지점 방문객이 늘었다는 분석입니다." },
            { h: "별다방홀딩스 3분기 영업이익, 시장 예상치 상회", b: "어닝 서프라이즈에 기관 매수세가 몰릴 수 있습니다." },
            { h: "별다방, 해외 100호점 계약 체결", b: "해외 확장 모멘텀이 부각되고 있습니다." }
          ],
          down: [
            { h: "별다방 매장 위생 논란 확산… SNS 불매 움직임", b: "단기 매출 감소 우려가 커지고 있습니다." },
            { h: "별다방홀딩스, 원가 상승에 4분기 실적 하향 전망", b: "증권사들이 목표주가를 잇따라 낮추고 있습니다." }
          ]
        },
        BEAN: {
          up: [
            { h: "브라질 원두 대풍작… 대한원두유통 매입 단가 급락", b: "원가 절감으로 마진 개선이 기대됩니다." },
            { h: "대한원두유통, 대형 프랜차이즈와 독점 납품 계약", b: "안정적인 매출처를 확보했습니다." }
          ],
          down: [
            { h: "에티오피아 가뭄으로 원두 수급 비상", b: "조달 비용이 급등해 수익성이 악화될 수 있습니다." },
            { h: "대한원두유통 평택 물류창고 화재", b: "출하 차질과 보상 비용이 우려됩니다." }
          ]
        },
        HAN: {
          up: [
            { h: "한강변 재개발 확정… 한강리츠 보유 자산 가치 재평가", b: "자산가치 상승으로 배당 여력이 커질 전망입니다." },
            { h: "한강리츠부동산, 오피스 공실률 역대 최저", b: "임대 수익이 안정적으로 늘고 있습니다." }
          ],
          down: [
            { h: "정부, 부동산 대출 규제 강화 발표", b: "리츠 투자심리가 위축될 수 있습니다." },
            { h: "한강리츠, 핵심 임차인 계약 해지 통보", b: "공실 확대 가능성이 제기됩니다." }
          ]
        },
        ALL: {
          up: [
            { h: "한국은행 기준금리 인하… 증시 전반 훈풍 기대", b: "유동성 확대 기대로 주식 전반이 강세를 보일 수 있습니다." },
            { h: "외국인 3일 연속 순매수… 코스피 강세", b: "수급 개선이 전 종목에 우호적입니다." }
          ],
          down: [
            { h: "미국 증시 급락 여파… 국내 증시 하락 출발 전망", b: "위험 회피 심리가 확산되고 있습니다." },
            { h: "원/달러 환율 급등, 외국인 매도세 우려", b: "증시 전반의 변동성이 커질 수 있습니다." }
          ]
        }
      },
      coin: {
        BTC: {
          up: [
            { h: "미국 현물 ETF에 대규모 자금 유입… 비트코인 신고가 도전", b: "기관 자금이 들어오며 매수 심리가 살아났습니다." },
            { h: "글로벌 기관, 비트코인 추가 매수 공시", b: "대형 투자자의 매수는 가격 지지선이 되곤 합니다." }
          ],
          down: [
            { h: "대형 거래소 해킹 의혹… 비트코인 투매 우려", b: "보안 불안이 커지며 매도 물량이 쏟아질 수 있습니다." },
            { h: "채굴업체 보유 물량 대량 이체 포착… 매도 압박 우려", b: "거래소 입금은 매도 신호로 해석됩니다." }
          ]
        },
        CAFE: {
          up: [
            { h: "카페토큰, 전국 프랜차이즈 결제 도입 발표", b: "실사용처가 늘어 수요 증가가 기대됩니다." },
            { h: "카페토큰, 대형 거래소 신규 상장 임박", b: "상장 직전에는 기대감에 가격이 오르는 경우가 많습니다." }
          ],
          down: [
            { h: "카페토큰 개발팀 지갑서 대량 이동 포착… 먹튀 의혹", b: "팀 물량 매도 가능성에 투자자들이 동요하고 있습니다." },
            { h: "카페토큰 스테이킹 보상 대폭 축소 공지", b: "보유 매력이 떨어져 이탈이 늘 수 있습니다." }
          ]
        },
        DOGE: {
          up: [
            { h: "유명 인플루언서, 시바라떼코인 언급… 거래량 폭증", b: "밈코인은 화제성에 따라 급등락이 큽니다." },
            { h: "시바라떼코인 '라떼아트 밈', SNS에서 대유행", b: "개인 투자자의 관심이 급격히 몰리고 있습니다." }
          ],
          down: [
            { h: "시바라떼코인 고래 지갑에서 대규모 매도 물량 출회", b: "큰손의 매도는 단기 급락으로 이어지기 쉽습니다." },
            { h: "밈코인 열풍 식는다… 시바라떼코인 거래량 급감", b: "관심이 빠지면 가격도 빠르게 식습니다." }
          ]
        },
        ALL: {
          up: [
            { h: "글로벌 가상자산 규제 완화 기대감 확산", b: "코인 시장 전반에 훈풍이 불 수 있습니다." },
            { h: "미 연준 금리 인하 시사… 위험자산 선호 회복", b: "위험자산인 코인에 자금이 유입될 수 있습니다." }
          ],
          down: [
            { h: "정부, 가상자산 과세 강화 검토 소식", b: "세금 부담 우려로 매도세가 나올 수 있습니다." },
            { h: "글로벌 거래소 출금 지연 사태… 투자심리 급랭", b: "코인 시장 전반이 흔들릴 수 있습니다." }
          ]
        }
      }
    };

    function marketList(kind) { return kind === "stock" ? state.stocks : state.coins; }

    function migrateMarketPriceUnits() {
      if ((Number(state.marketPriceVersion) || 0) >= 2) return;
      state.coins.forEach(asset => {
        const split = MARKET_UNIT_SPLITS[asset.code];
        if (!split) return;

        // Reverse-split old low-priced coin units without changing their invested cost.
        const oldPrice = Number(asset.price) || MARKET_BASE_PRICES.coin[asset.code] / split;
        const oldOwned = Number(asset.owned) || 0;
        const oldCost = Number.isFinite(asset.cost) ? asset.cost : oldPrice * oldOwned;
        asset.owned = oldOwned / split;
        asset.cost = oldCost;
        asset.price = oldPrice * split;
        asset.base = MARKET_BASE_PRICES.coin[asset.code];
        if (Array.isArray(asset.hist)) asset.hist = asset.hist.map(price => price * split);
      });
      state.marketPriceVersion = 2;
    }

    // 전 플레이어 동일 난수 생성기 (Mulberry32)
    function createSeededRng(seed) {
      let a = (seed >>> 0) || 1;
      return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function getGlobalMarketTick() {
      return Math.floor(Date.now() / (MARKET_TICK_SECONDS * 1000));
    }

    // 모든 플레이어에게 공통으로 적용되는 글로벌 시뮬레이션 엔진
    // 1시간(360틱) 단위로 기준가에서 출발해 현재 글로벌 틱까지 동일 시드로 계산하므로
    // 어떤 기기/계정에서 접속해도 100% 똑같은 시세, 차트, 속보, 루머 결과를 보게 됩니다.
    let sharedMarketCache = {
      computedTick: -1,
      announcedNewsIds: new Set(),
      announcedRumorResultIds: new Set(),
      snapshot: null
    };

    function computeSharedMarketSnapshot(targetTick) {
      if (sharedMarketCache.computedTick === targetTick && sharedMarketCache.snapshot) {
        return sharedMarketCache.snapshot;
      }

      const epochLen = 360; // 1시간(3600초) 주기 시드 리셋
      const startTick = Math.max(1, targetTick - (targetTick % epochLen));
      const prices = {
        stock: { ...MARKET_BASE_PRICES.stock },
        coin: { ...MARKET_BASE_PRICES.coin }
      };
      const hist = {
        stock: {
          STAR: [prices.stock.STAR],
          BEAN: [prices.stock.BEAN],
          HAN: [prices.stock.HAN]
        },
        coin: {
          BTC: [prices.coin.BTC],
          CAFE: [prices.coin.CAFE],
          DOGE: [prices.coin.DOGE]
        }
      };

      const news = [];
      let nid = 1;
      let lastNewsTick = startTick - 5;

      function spawnDeterministicEvent(t, rng, forceKind = null) {
        const kind = forceKind || (rng() < 0.5 ? "stock" : "coin");
        const cfg = MARKET_CFG[kind];
        const busy = new Set(news.filter(n => n.status !== "done" && n.kind === kind).map(n => n.code));
        const baseCodes = Object.keys(MARKET_BASE_PRICES[kind]).filter(c => !busy.has(c));
        if (!busy.has("ALL") && rng() < 0.2) baseCodes.push("ALL", "ALL", "ALL");
        if (!baseCodes.length) return;

        const code = baseCodes[Math.floor(rng() * baseCodes.length)];
        const dir = rng() < 0.5 ? 1 : -1;
        const pool = MARKET_NEWS[kind][code][dir > 0 ? "up" : "down"];
        const tpl = pool[Math.floor(rng() * pool.length)];
        const rumor = forceKind ? false : rng() < cfg.rumorRate;
        const real = rumor ? rng() < MARKET_RUMOR_TRUE_RATE : true;
        const range = code === "ALL" ? cfg.macroPct : cfg.pct;
        let pct = range[0] + rng() * (range[1] - range[0]);
        if (kind === "coin" && code === "BTC") pct *= 0.5;

        const delay = 1 + Math.floor(rng() * 2);
        const dur = 4 + Math.floor(rng() * 3);
        const nameMap = {
          STAR: "별다방홀딩스", BEAN: "대한원두유통", HAN: "한강리츠부동산",
          BTC: "비트코인", CAFE: "카페토큰", DOGE: "시바라떼코인",
          ALL: kind === "stock" ? "주식 시장 전체" : "코인 시장 전체"
        };

        news.unshift({
          id: `${startTick}_${nid++}`,
          kind,
          code,
          name: nameMap[code] || code,
          dir,
          rumor,
          real,
          pct,
          headline: tpl.h,
          body: rumor ? "출처가 불분명한 소문입니다. 사실이 아니면 오히려 반대로 움직일 수 있어요." : tpl.b,
          tick: t,
          delay,
          dur,
          left: dur,
          status: "pending",
          resolvedTick: null
        });
        if (news.length > 24) news.length = 24;
        lastNewsTick = t;
      }

      for (let t = startTick; t <= targetTick; t++) {
        const rng = createSeededRng((t * 2654435761) ^ 0x9e3779b9);

        // 1) 진행 중인 뉴스 영향
        const drift = {};
        news.forEach(ev => {
          if (ev.status === "done") return;
          if (ev.delay > 0) { ev.delay--; return; }
          ev.status = "active";
          const eff = ev.real ? ev.dir * ev.pct : -ev.dir * ev.pct * MARKET_RUMOR_FAIL_BACKLASH;
          const per = eff / ev.dur;
          Object.keys(prices[ev.kind]).forEach(c => {
            if (ev.code !== "ALL" && ev.code !== c) return;
            const beta = ev.code === "ALL" && ev.kind === "coin" ? (MARKET_BETA[c] || 1) : 1;
            const k = ev.kind + c;
            drift[k] = (drift[k] || 0) + per * beta;
          });
          ev.left--;
          if (ev.left <= 0) {
            ev.status = "done";
            ev.resolvedTick = t;
          }
        });

        // 2) 전 종목 가격 갱신
        ["stock", "coin"].forEach(kind => {
          const cfg = MARKET_CFG[kind];
          Object.keys(prices[kind]).forEach(code => {
            const baseP = MARKET_BASE_PRICES[kind][code];
            const curP = prices[kind][code];
            let chg = 1 + (rng() - 0.49) * cfg.noise + cfg.revert * (baseP / curP - 1) + (drift[kind + code] || 0);
            chg = Math.max(0.5, chg);
            const floor = cfg.floorRatio
              ? Math.max(cfg.floor, Math.round(baseP * cfg.floorRatio))
              : cfg.floor;
            const nextP = Math.max(floor, Math.round(curP * chg));
            prices[kind][code] = nextP;
            hist[kind][code].push(nextP);
            if (hist[kind][code].length > MARKET_HIST_LEN) hist[kind][code].shift();
          });
        });

        // 3) 글로벌 뉴스 생성
        const activeCount = news.filter(n => n.status !== "done").length;
        if (t === startTick + 1 && news.length === 0) {
          spawnDeterministicEvent(t, rng, "stock");
        } else if (activeCount < 3 && t - lastNewsTick >= 3 && (rng() < 0.16 || t - lastNewsTick >= 10)) {
          spawnDeterministicEvent(t, rng, null);
        }
      }

      const snap = { tick: targetTick, prices, hist, news };
      sharedMarketCache.computedTick = targetTick;
      sharedMarketCache.snapshot = snap;
      return snap;
    }

    function ensureMarket(notifyNewEvents = false) {
      migrateMarketPriceUnits();
      if (!state.market || typeof state.market !== "object") state.market = {};
      const globalTick = getGlobalMarketTick();
      const snap = computeSharedMarketSnapshot(globalTick);

      state.market.tick = snap.tick;
      state.market.news = snap.news;

      ["stock", "coin"].forEach(kind => {
        marketList(kind).forEach(a => {
          const sharedPrice = snap.prices[kind][a.code];
          const sharedHist = snap.hist[kind][a.code];
          if (typeof a.base !== "number") a.base = MARKET_BASE_PRICES[kind][a.code] || a.price;
          if (typeof a.cost !== "number") a.cost = a.price * a.owned;
          if (typeof a.realized !== "number") a.realized = 0;
          if (typeof sharedPrice === "number") a.price = sharedPrice;
          if (Array.isArray(sharedHist) && sharedHist.length >= 2) {
            a.hist = [...sharedHist];
          }
        });
      });

      // 최초 로드 시 이미 지나간 뉴스는 토스트 폭탄이 터지지 않도록 조용히 등록
      if (!notifyNewEvents) {
        snap.news.forEach(ev => {
          sharedMarketCache.announcedNewsIds.add(ev.id);
          if (ev.status === "done" && ev.rumor) {
            sharedMarketCache.announcedRumorResultIds.add(ev.id);
          }
        });
      } else {
        snap.news.forEach(ev => {
          if (ev.tick === globalTick && !sharedMarketCache.announcedNewsIds.has(ev.id)) {
            sharedMarketCache.announcedNewsIds.add(ev.id);
            const tag = ev.rumor ? "📣 공통 루머" : "📰 실시간 속보";
            if (typeof showToast === "function") {
              showToast(`${tag} ${ev.headline}`, ev.dir > 0 ? "rose" : "sky");
            }
            if (typeof pushPhoneNotification === "function") {
              const appTarget = ev.kind === "coin" ? "coin" : "stock";
              const shortLbl = ev.kind === "coin"
                ? (ev.rumor ? "🪙 코인 루머" : "🪙 코인 속보")
                : (ev.rumor ? "📈 증시 루머" : "📈 증시 속보");
              pushPhoneNotification(appTarget, shortLbl);
            }
          }
          if (ev.status === "done" && ev.rumor && ev.resolvedTick === globalTick && !sharedMarketCache.announcedRumorResultIds.has(ev.id)) {
            sharedMarketCache.announcedRumorResultIds.add(ev.id);
            if (typeof showToast === "function") {
              showToast(ev.real ? `✅ 루머 사실로 확인 · ${ev.name}` : `❌ 헛소문이었어요 · ${ev.name}`, ev.real ? "emerald" : "purple");
            }
          }
        });
      }

      return state.market;
    }

    let lastObservedGlobalTick = -1;
    function marketTick() {
      const gTick = getGlobalMarketTick();
      if (gTick === lastObservedGlobalTick) return;
      lastObservedGlobalTick = gTick;
      ensureMarket(true);

      const phone = document.getElementById("phoneModal");
      const tablet = document.getElementById("tabletModal");
      if ((phone && !phone.classList.contains("hidden") || tablet && !tablet.classList.contains("hidden")) && (activePhoneApp === "stock" || activePhoneApp === "coin")) {
        renderPhoneApp();
      }
    }

    // ---------- 표시용 도우미 ----------
    function mkTone(v) { return v > 0 ? "mk-up" : v < 0 ? "mk-down" : "mk-flat"; }
    function mkArrow(v) { return v > 0 ? "▲" : v < 0 ? "▼" : "–"; }
    function mkWon(n) { return Math.round(n).toLocaleString() + "원"; }
    function mkSigned(n) { const r = Math.round(n); return (r > 0 ? "+" : "") + r.toLocaleString() + "원"; }
    function mkPct(p) { return (p > 0 ? "+" : "") + p.toFixed(2) + "%"; }
    function mkAgo(tick) {
      const s = Math.max(0, (getGlobalMarketTick() - tick) * MARKET_TICK_SECONDS);
      return s < 15 ? "방금" : s < 60 ? `${s}초 전` : `${Math.floor(s / 60)}분 전`;
    }
    function mkQty(kind, a) { return kind === "stock" ? `${a.owned}주` : `${a.owned < 1 ? a.owned.toFixed(6) : a.owned.toFixed(3)} ${a.code}`; }

    function marketChartSVG(kind, a, m) {
      const W = 300, H = 88, padT = 9, padB = 7;
      const h = a.hist, n = h.length;
      let lo = Math.min(...h), hi = Math.max(...h);
      const avg = a.owned > 0 ? a.cost / a.owned : null;
      let span = hi - lo || a.price * 0.01;
      let showAvg = false;
      if (avg !== null && avg >= lo - span && avg <= hi + span) { showAvg = true; lo = Math.min(lo, avg); hi = Math.max(hi, avg); }
      span = hi - lo || 1;
      const X = i => 4 + (n > 1 ? (i * (W - 12)) / (n - 1) : W - 12);
      const Y = v => padT + (1 - (v - lo) / span) * (H - padT - padB);
      const line = h.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
      const col = h[n - 1] > h[0] ? "#f87171" : h[n - 1] < h[0] ? "#60a5fa" : "#a8a29e";
      const gid = `mkg_${kind}_${a.code}`;
      let svg = `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto block" role="img" aria-label="${a.name} 가격 차트">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${col}" stop-opacity="0.32"/><stop offset="100%" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>`;
      [0.25, 0.5, 0.75].forEach(r => {
        const y = padT + r * (H - padT - padB);
        svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#44403c" stroke-width="0.6" stroke-dasharray="2 4"/>`;
      });
      svg += `<polygon points="${X(0)},${H} ${line} ${X(n - 1)},${H}" fill="url(#${gid})"/>`;
      svg += `<polyline points="${line}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
      m.news.filter(nw => nw.kind === kind && (nw.code === a.code || nw.code === "ALL")).forEach(nw => {
        const idx = n - 1 - (m.tick - nw.tick);
        if (idx < 0 || idx >= n) return;
        const x = X(idx), c = nw.dir > 0 ? "#f87171" : "#60a5fa";
        svg += `<line x1="${x}" y1="9" x2="${x}" y2="${H}" stroke="${c}" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.7"/><circle cx="${x}" cy="7" r="3.2" fill="${c}"/>`;
      });
      if (showAvg) {
        const y = Y(avg);
        svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#fbbf24" stroke-width="1" stroke-dasharray="5 3"/><text x="${W - 2}" y="${y - 3}" font-size="9" text-anchor="end" fill="#fbbf24">내 평단</text>`;
      }
      svg += `<circle cx="${X(n - 1)}" cy="${Y(h[n - 1])}" r="3.4" fill="${col}"/><circle cx="${X(n - 1)}" cy="${Y(h[n - 1])}" r="6.5" fill="${col}" opacity="0.25"/></svg>`;
      return svg;
    }

    function marketSummaryHTML(kind, list) {
      let value = 0, cost = 0, realized = 0;
      list.forEach(a => { value += a.owned * a.price; cost += a.cost; realized += a.realized; });
      const pl = value - cost;
      const plPct = cost > 0 ? (pl / cost) * 100 : 0;
      const label = kind === "stock" ? "내 주식" : "내 코인";
      return `
        <div class="mk-panel space-y-2">
          <div class="flex justify-between items-center text-[11px]">
            <span class="font-extrabold text-amber-200">💼 ${label} 한눈에 보기</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-700/60 text-emerald-300 font-bold">🌐 전 서버 실시간 시세</span>
          </div>
          <div class="flex items-end justify-between">
            <div>
              <div class="text-[10px] text-stone-400">총 평가금액</div>
              <div class="text-lg font-black text-white leading-tight">${mkWon(value)}</div>
            </div>
            <div class="text-right ${mkTone(pl)}">
              <div class="text-[10px] text-stone-400">평가손익</div>
              <div class="text-sm font-black leading-tight">${mkArrow(pl)} ${mkSigned(pl)}</div>
              <div class="text-[11px] font-bold">${cost > 0 ? mkPct(plPct) : "보유 없음"}</div>
            </div>
          </div>
          <div class="flex justify-between text-[10px] border-t border-stone-800 pt-1.5 text-stone-400">
            <span>보유 현금 ${mkWon(state.cash)}</span>
            <span>투자 원금 ${mkWon(cost)} · 실현 <b class="${mkTone(realized)}">${mkSigned(realized)}</b></span>
          </div>
          <div class="text-[10px] text-stone-500 text-center">🔴 오르면 빨강 · 🔵 내리면 파랑 · 모든 플레이어 동일 차트</div>
        </div>`;
    }

    function marketNewsHTML(kind, m) {
      const items = m.news.filter(n => n.kind === kind).slice(0, 3);
      let html = `<div class="space-y-1.5">
        <div class="flex items-center justify-between px-0.5">
          <span class="text-xs font-extrabold text-amber-200">📰 ${kind === "stock" ? "증시" : "코인"} 실시간 속보</span>
          <span class="text-[10px] text-stone-500">전 플레이어 공통 뉴스</span>
        </div>`;
      if (!items.length) {
        html += `<div class="mk-panel text-[11px] text-stone-400 text-center">아직 들어온 뉴스가 없어요. 속보가 뜨면 알림이 울립니다!</div>`;
      }
      items.forEach(n => {
        const up = n.dir > 0;
        let status;
        if (n.status === "done") status = n.rumor ? (n.real ? "✅ 사실이었음" : "❌ 헛소문") : "✅ 반영 완료";
        else if (n.rumor) status = "🔍 사실 확인 중";
        else status = n.delay > 0 ? "⏳ 곧 반영 예상" : "🔥 반영 중";
        html += `
          <div class="mk-news ${up ? "mk-news-up" : "mk-news-down"}">
            <div class="flex items-center gap-1 flex-wrap text-[10px] font-bold">
              <span class="mk-chip ${up ? "mk-up-bg" : "mk-down-bg"}">${up ? "▲ 호재" : "▼ 악재"}</span>
              <span class="mk-chip ${n.rumor ? "mk-rumor" : "mk-flat-bg"}">${n.rumor ? "📣 루머" : "📰 속보"}</span>
              <span class="text-stone-300">${n.name}</span>
              <span class="ml-auto text-stone-500">${mkAgo(n.tick)}</span>
            </div>
            <div class="text-xs font-extrabold text-white leading-snug mt-1">${n.headline}</div>
            ${n.status === "done" ? "" : `<div class="text-[11px] text-stone-400 leading-snug mt-0.5">${n.body}</div>`}
            <div class="text-[10px] font-bold mt-1 ${n.status === "done" ? "text-stone-500" : "text-amber-300"}">${status}</div>
          </div>`;
      });
      return html + `</div>`;
    }

    function marketCardHTML(kind, a, i, m) {
      const h = a.hist, n = h.length;
      const prev = h[n - 2] !== undefined ? h[n - 2] : a.price;
      const diff = a.price - prev;
      const diffPct = prev ? (diff / prev) * 100 : 0;
      const winPct = h[0] ? ((a.price - h[0]) / h[0]) * 100 : 0;
      const trend = mkTone(a.price - h[0]);
      const hi = Math.max(...h), lo = Math.min(...h);
      const mins = Math.max(1, Math.round((n * MARKET_TICK_SECONDS) / 60));

      const live = m.news.find(nw => nw.kind === kind && nw.status !== "done" && (nw.code === a.code || nw.code === "ALL"));
      let liveChip = "";
      if (live) {
        const up = live.dir > 0;
        const txt = live.rumor ? `📣 루머 ${up ? "▲" : "▼"}?` : `📰 ${up ? "호재" : "악재"} ${live.delay > 0 ? "대기" : "반영 중"} ${up ? "▲" : "▼"}`;
        liveChip = `<span class="mk-chip ${up ? "mk-up-bg" : "mk-down-bg"} mk-pulse">${txt}</span>`;
      }

      let holding;
      if (a.owned > 0) {
        const value = a.owned * a.price;
        const pl = value - a.cost;
        const plPct = a.cost > 0 ? (pl / a.cost) * 100 : 0;
        holding = `
          <div class="mk-hold grid grid-cols-3 gap-1 text-center">
            <div><div class="mk-k">보유</div><div class="mk-v text-white">${mkQty(kind, a)}</div></div>
            <div><div class="mk-k">평균 단가</div><div class="mk-v text-stone-200">${mkWon(a.cost / a.owned)}</div></div>
            <div class="${mkTone(pl)}"><div class="mk-k">평가손익</div><div class="mk-v">${mkSigned(pl)}</div><div class="text-[10px] font-bold">${mkPct(plPct)}</div></div>
          </div>`;
      } else {
        holding = `<div class="mk-hold text-center text-[11px] text-stone-500">보유 수량 없음${a.realized ? ` · 누적 실현손익 <b class="${mkTone(a.realized)}">${mkSigned(a.realized)}</b>` : ""}</div>`;
      }

      const sellDim = a.owned > 0 ? "" : " opacity-40";
      let buttons;
      if (kind === "stock") {
        buttons = `
          <button onclick="tradeAsset('stock', ${i}, 1, 1)" class="mk-btn mk-buy">1주 매수</button>
          <button onclick="tradeAsset('stock', ${i}, 1, 10)" class="mk-btn mk-buy">10주 매수</button>
          <button onclick="tradeAsset('stock', ${i}, -1, 1)" class="mk-btn mk-sell${sellDim}">1주 매도</button>
          <button onclick="tradeAsset('stock', ${i}, -1, 'all')" class="mk-btn mk-sell${sellDim}">전량 매도</button>`;
      } else {
        buttons = `
          <button onclick="tradeAsset('coin', ${i}, 1, 100000)" class="mk-btn mk-buy">10만원 매수</button>
          <button onclick="tradeAsset('coin', ${i}, 1, 500000)" class="mk-btn mk-buy">50만원 매수</button>
          <button onclick="tradeAsset('coin', ${i}, -1, 0.5)" class="mk-btn mk-sell${sellDim}">절반 매도</button>
          <button onclick="tradeAsset('coin', ${i}, -1, 1)" class="mk-btn mk-sell${sellDim}">전량 매도</button>`;
      }

      const sub = kind === "stock"
        ? `<span class="text-emerald-400">월 배당 ${(a.div * 100).toFixed(1)}%</span>`
        : `<span class="text-purple-300">${a.code}</span>`;

      return `
        <div class="mk-panel space-y-2">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              <div class="text-xs font-extrabold text-white">${a.name} ${kind === "stock" ? `<span class="text-stone-500">${a.code}</span>` : ""}</div>
              <div class="text-[11px] flex items-center gap-1.5 flex-wrap">${sub}${liveChip}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-base font-black ${trend} leading-tight">${mkWon(a.price)}</div>
              <div class="text-[11px] font-bold ${mkTone(diff)}">${mkArrow(diff)} ${Math.abs(diff).toLocaleString()} (${mkPct(diffPct)})</div>
            </div>
          </div>
          <div class="mk-chart">${marketChartSVG(kind, a, m)}</div>
          <div class="flex justify-between text-[10px] text-stone-400">
            <span>최근 ${mins}분 <b class="${mkTone(winPct)}">${mkPct(winPct)}</b></span>
            <span><b class="mk-up">고 ${hi.toLocaleString()}</b> · <b class="mk-down">저 ${lo.toLocaleString()}</b></span>
          </div>
          ${holding}
          <div class="grid grid-cols-4 gap-1.5">${buttons}</div>
        </div>`;
    }

    function renderMarketApp(kind, bodyEl) {
      const m = ensureMarket(false);
      const list = marketList(kind);
      const scroll = bodyEl.scrollTop;
      bodyEl.innerHTML = `<div class="tablet-market-layout"><section class="tablet-market-assets">${marketSummaryHTML(kind, list)}${list.map((a, i) => marketCardHTML(kind, a, i, m)).join("")}</section><aside class="tablet-market-news"><h3 class="px-1 text-xs font-black text-amber-200">📰 실시간 뉴스 · 루머</h3>${marketNewsHTML(kind, m)}</aside></div>`;
      bodyEl.scrollTop = scroll;
    }
