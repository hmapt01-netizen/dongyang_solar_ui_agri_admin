/* ==========================================================================
   LASEE AI Agrivoltaic PV Compliance & Admin System Core Controller
   (동양연합 영농형 태양광 AI 영농이행 종합관리 플랫폼 코어 앱)
   ========================================================================== */

const DongyangAgriApp = {
  currentView: 'dashboard',
  currentSiteId: 'haemi-01',
  currentTheme: 'light',

  leafletMap: null,
  activeTileLayer: null,
  currentTileType: 'street',
  markers: {},

  init: function() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Check initial auth status (Show auth overlay on initial load if not logged in)
    const isLoggedIn = sessionStorage.getItem('dongyang_agri_logged_in') === 'true';
    if (!isLoggedIn) {
      setTimeout(() => this.showAuthOverlay(), 150);
    }

    // Auto-detect mobile devices
    const checkMobile = () => {
      if (window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        this.isMobileSimMode = true;
        document.body.classList.add('mobile-sim-mode');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Keyboard Shortcuts for Mobile Simulator (Ctrl+M / F2 / Korean IME ㅡ)
    document.addEventListener('keydown', (e) => {
      const isM = e.code === 'KeyM' || (e.key && (e.key.toLowerCase() === 'm' || e.key === 'ㅡ'));
      if ((e.ctrlKey && isM) || e.key === 'F2') {
        e.preventDefault();
        this.toggleMobileSim();
      }
    });

    // Auto-close mobile drawer when scrolling main content
    setTimeout(() => {
      const mainWrapper = document.querySelector('.main-wrapper');
      if (mainWrapper) {
        mainWrapper.addEventListener('scroll', () => {
          this.closeMobileDrawer();
        }, { passive: true });
      }
    }, 500);

    this.renderDashboard();
    this.renderSiteDetail(this.currentSiteId);
    
    // Render Real Leaflet Map
    setTimeout(() => this.initRealMap(), 300);

    if (typeof AgriCharts !== 'undefined') {
      setTimeout(() => AgriCharts.initDashboardCharts(), 300);
    }

    console.log("DongyangAgriApp initialized successfully.");
  },

  initRealMap: function() {
    const mapBox = document.getElementById('realLeafletMap');
    if (!mapBox || typeof L === 'undefined') return;

    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }

    // Initialize Leaflet Map centered on Gangwon-do (Wonju/Hoengseong/Chuncheon)
    this.leafletMap = L.map('realLeafletMap', {
      zoomControl: true,
      attributionControl: false,
      fadeAnimation: false,
      zoomAnimation: true
    }).setView([37.55, 127.85], 9);

    this.switchMapTile(this.currentTileType);

    // Custom Icon Maker
    const createCustomIcon = (statusBadge) => {
      const color = (statusBadge === 'badge-warning') ? '#f59e0b' : '#10b981';
      return L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color:${color}; width:24px; height:24px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.5);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    };

    // Add Markers for all 5 sites
    Object.keys(AGRI_ADMIN_DATA.sites).forEach(siteId => {
      const site = AGRI_ADMIN_DATA.sites[siteId];
      if (site.lat && site.lng) {
        const marker = L.marker([site.lat, site.lng], {
          icon: createCustomIcon(site.statusBadge)
        }).addTo(this.leafletMap);

        const popupContent = `
          <div style="padding:8px; font-family:'Plus Jakarta Sans', sans-serif; min-width:200px;">
            <strong style="font-size:14px; color:#1d3324;">${site.name}</strong><br>
            <span style="font-size:11.5px; color:#526759;">📍 ${site.address}</span><br>
            <div style="margin-top:6px; font-size:12px; font-weight:800;">
              🌱 시범 작물: <span style="color:#10b981;">${site.subCrop}</span>
            </div>
            <div style="margin-top:10px;">
              <button onclick="DongyangAgriApp.selectSite('${site.id}')" style="background:#3d5a47; color:#ffffff; border:none; padding:6px 14px; border-radius:12px; font-size:11.5px; font-weight:800; cursor:pointer; width:100%;">
                🔍 상세 관제 이동
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        this.markers[siteId] = marker;
      }
    });

    setTimeout(() => {
      if (this.leafletMap) {
        this.fitAllSites();
      }
    }, 300);
  },

  fitAllSites: function() {
    if (!this.leafletMap) return;
    this.leafletMap.invalidateSize();

    const siteList = Object.keys(AGRI_ADMIN_DATA.sites).map(id => AGRI_ADMIN_DATA.sites[id]).filter(s => s.lat && s.lng);
    if (siteList.length === 0) return;

    const bounds = L.latLngBounds(siteList.map(s => [s.lat, s.lng]));
    this.leafletMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 10, animate: true });
  },

  switchMapTile: function(type) {
    this.currentTileType = type;
    if (!this.leafletMap) return;

    if (this.activeTileLayer) {
      this.leafletMap.removeLayer(this.activeTileLayer);
    }

    let url = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    if (type === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    this.activeTileLayer = L.tileLayer(url, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c', 'd'],
      crossOrigin: true,
      attribution: '© CartoDB / Esri Satellite | 동양연합 영농형 태양광'
    }).addTo(this.leafletMap);

    const btnStreet = document.getElementById('mapModeStreetBtn');
    const btnSat = document.getElementById('mapModeSatBtn');
    if (btnStreet && btnSat) {
      if (type === 'street') {
        btnStreet.style.background = 'var(--sage-primary)';
        btnStreet.style.color = '#ffffff';
        btnSat.style.background = '#e2e8f0';
        btnSat.style.color = '#334155';
      } else {
        btnSat.style.background = 'var(--sage-primary)';
        btnSat.style.color = '#ffffff';
        btnStreet.style.background = '#e2e8f0';
        btnStreet.style.color = '#334155';
      }
    }
  },

  filterMapByStatus: function(statusType) {
    if (!this.leafletMap) return;

    document.querySelectorAll('.natural-stat-card').forEach(card => card.classList.remove('kpi-active'));

    const pill = document.getElementById('mapFilterPill');
    this.leafletMap.invalidateSize();

    if (statusType === 'watch') {
      const watchCard = document.getElementById('kpiCardWatch');
      if (watchCard) watchCard.classList.add('kpi-active');

      if (pill) {
        pill.style.display = 'inline-block';
        pill.innerHTML = '⚠️ 관찰필요 2건 필터링됨 <span style="cursor:pointer; text-decoration:underline; margin-left:4px; font-weight:900;" onclick="DongyangAgriApp.filterMapByStatus(\'all\')">[전체보기]</span>';
      }

      const watchLatLngs = [];
      Object.keys(AGRI_ADMIN_DATA.sites).forEach(siteId => {
        const site = AGRI_ADMIN_DATA.sites[siteId];
        const marker = this.markers[siteId];
        if (marker) {
          if (site.statusBadge === 'badge-warning') {
            this.leafletMap.addLayer(marker);
            watchLatLngs.push([site.lat, site.lng]);
          } else {
            this.leafletMap.removeLayer(marker);
          }
        }
      });

      if (watchLatLngs.length > 0) {
        const bounds = L.latLngBounds(watchLatLngs);
        this.leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 11, animate: true });
      }

    } else if (statusType === 'normal') {
      const normalCard = document.getElementById('kpiCardNormal');
      if (normalCard) normalCard.classList.add('kpi-active');

      if (pill) {
        pill.style.display = 'inline-block';
        pill.innerHTML = '✅ 정상 3건 필터링됨 <span style="cursor:pointer; text-decoration:underline; margin-left:4px; font-weight:900;" onclick="DongyangAgriApp.filterMapByStatus(\'all\')">[전체보기]</span>';
      }

      const normalLatLngs = [];
      Object.keys(AGRI_ADMIN_DATA.sites).forEach(siteId => {
        const site = AGRI_ADMIN_DATA.sites[siteId];
        const marker = this.markers[siteId];
        if (marker) {
          if (site.statusBadge === 'badge-success') {
            this.leafletMap.addLayer(marker);
            normalLatLngs.push([site.lat, site.lng]);
          } else {
            this.leafletMap.removeLayer(marker);
          }
        }
      });

      if (normalLatLngs.length > 0) {
        const bounds = L.latLngBounds(normalLatLngs);
        this.leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 10, animate: true });
      }

    } else if (statusType === 'inspection' || statusType === 'action') {
      if (pill) {
        pill.style.display = 'inline-block';
        pill.innerHTML = 'ℹ️ 해당 상태 0건 <span style="cursor:pointer; text-decoration:underline; margin-left:4px; font-weight:900;" onclick="DongyangAgriApp.filterMapByStatus(\'all\')">[전체보기]</span>';
      }
      alert('해당 상태에 해당하는 사업장이 현재 0건입니다.');
    } else {
      // 'all'
      const allCard = document.getElementById('kpiCardAll');
      if (allCard) allCard.classList.add('kpi-active');
      if (pill) pill.style.display = 'none';

      Object.keys(AGRI_ADMIN_DATA.sites).forEach(siteId => {
        const marker = this.markers[siteId];
        if (marker) {
          this.leafletMap.addLayer(marker);
        }
      });
      this.fitAllSites();
    }
  },

  toggleMobileSim: function() {
    this.isMobileSimMode = !this.isMobileSimMode;
    document.body.classList.toggle('mobile-sim-mode', this.isMobileSimMode);
    
    const btn = document.getElementById('mobileSimBtn');
    if (btn) {
      btn.innerHTML = this.isMobileSimMode ? '<i class="fa-solid fa-desktop"></i> 🖥️ PC뷰' : '<i class="fa-solid fa-mobile-screen-button"></i> 📱 폰뷰';
    }

    setTimeout(() => {
      if (this.leafletMap) {
        this.fitAllSites();
      }
    }, 250);

    let toast = document.getElementById('mobileSimToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mobileSimToast';
      toast.style.cssText = 'position:fixed; top:70px; right:20px; z-index:99999; pointer-events:none !important; background:rgba(0,0,0,0.88); color:#ffffff; padding:10px 18px; border-radius:30px; font-weight:800; font-size:12.5px; box-shadow:0 10px 30px rgba(0,0,0,0.35); backdrop-filter:blur(8px); transition:all 0.3s ease; border:1px solid rgba(255,255,255,0.2);';
      document.body.appendChild(toast);
    }
    toast.textContent = this.isMobileSimMode ? '📱 스마트폰 모바일 뷰 시뮬레이터 ON (Ctrl+M / F2)' : '🖥️ PC 데스크톱 뷰 모드 ON (Ctrl+M / F2)';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2500);
  },

  toggleMobileNav: function() {
    const sidebar = document.querySelector('.left-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('drawer-open');
    }
  },

  closeMobileDrawer: function() {
    const sidebar = document.querySelector('.left-sidebar');
    if (sidebar && sidebar.classList.contains('drawer-open')) {
      sidebar.classList.remove('drawer-open');
    }
  },

  updateClock: function() {
    const el = document.getElementById('headerLiveTime');
    if (el) {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const da = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      const se = String(now.getSeconds()).padStart(2, '0');
      el.textContent = `${yr}.${mo}.${da} ${hr}:${mi}:${se}`;
    }
  },

  toggleTheme: function() {
    this.currentTheme = (this.currentTheme === 'light') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.className = (this.currentTheme === 'dark') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  },

  selectSite: function(siteId) {
    const select = document.getElementById('plantSelect');
    if (siteId === 'all') {
      if (select) select.value = 'all';
      this.switchView('dashboard');
      return;
    }

    this.currentSiteId = siteId;
    if (select) select.value = siteId;

    this.renderSiteDetail(siteId);
    this.switchView('site-detail');
  },

  switchView: function(viewId) {
    const sidebar = document.querySelector('.left-sidebar');
    if (sidebar) {
      sidebar.classList.remove('drawer-open');
    }

    this.currentView = viewId;

    document.querySelectorAll('.plantSelectSelect').forEach(select => {
      if (viewId === 'dashboard') {
        select.value = 'all';
      } else if (viewId === 'site-detail') {
        if (select.value === 'all') {
          select.value = this.currentSiteId || '12139';
        }
        this.renderSiteDetail(select.value);
      }
    });

    // Update Sidebar active item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      }
    });

    // Update View Sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewId}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    if (viewId === 'dashboard') {
      setTimeout(() => {
        if (this.leafletMap) {
          this.leafletMap.invalidateSize();
        } else {
          this.initRealMap();
        }
      }, 150);
    }

    // Scroll container to absolute top of selected section
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
      mainWrapper.scrollTo({ top: 0, behavior: 'instant' });
      mainWrapper.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  },

  switchSubTab: function(tabName) {
    this.closeMobileDrawer();
    document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`subtab-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');

    const mainWrapper = document.querySelector('.main-wrapper');
    let targetEl = null;

    if (tabName === 'activity') {
      targetEl = document.getElementById('detailActivitiesSection');
    } else if (tabName === 'permit') {
      targetEl = document.getElementById('detailPermitSection');
    } else if (tabName === 'action') {
      targetEl = document.getElementById('detailAnomaliesSection');
    } else {
      targetEl = document.getElementById('siteDetailTopKpi');
    }

    if (targetEl && mainWrapper) {
      const topOffset = targetEl.offsetTop - 10;
      mainWrapper.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  },

  selectSite: function(siteId) {
    this.currentSiteId = siteId;

    document.querySelectorAll('.plantSelectSelect').forEach(select => {
      select.value = siteId;
    });

    if (siteId !== 'all' && AGRI_ADMIN_DATA.sites[siteId]) {
      this.renderSiteDetail(siteId);
      this.switchView('site-detail');
    } else {
      this.switchView('dashboard');
    }
  },

  renderDashboard: function() {
    const summary = AGRI_ADMIN_DATA.summary;
    document.getElementById('statTotalSites').textContent = summary.totalSites;
    document.getElementById('statNormalSites').textContent = summary.normalSites;
    document.getElementById('statWatchSites').textContent = summary.watchSites;
    document.getElementById('statInspectionSites').textContent = summary.inspectionSites;
    document.getElementById('statActionSites').textContent = summary.actionSites;

    // Render Priority Watchlist
    const watchListContainer = document.getElementById('priorityWatchlistContainer');
    if (watchListContainer) {
      watchListContainer.innerHTML = AGRI_ADMIN_DATA.priorityWatchlist.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card-subtle); padding:12px 14px; border-radius:14px; border:1px solid var(--border-color); cursor:pointer;" onclick="DongyangAgriApp.selectSite('${item.id}')">
          <div>
            <strong style="font-size:14px; color:var(--text-primary);">${item.name}</strong>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${item.issue}</div>
          </div>
          <span class="badge ${item.badge}">${item.level}</span>
        </div>
      `).join('');
    }

    // Render Recent Reports Table
    const tableBody = document.getElementById('recentReportsTableBody');
    if (tableBody) {
      tableBody.innerHTML = AGRI_ADMIN_DATA.recentReports.map(rep => `
        <tr>
          <td style="font-weight:800; text-align:left;">${rep.name}</td>
          <td>${rep.crop}</td>
          <td>${rep.events}</td>
          <td>${rep.area}</td>
          <td><span class="badge ${rep.badge}">${rep.result}</span></td>
          <td>
            <button class="btn-header btn-sage" style="padding:4px 10px; font-size:11px;" onclick="DongyangAgriApp.openReportModal('${rep.id}')">
              <i class="fa-solid fa-file-lines"></i> 보기
            </button>
          </td>
        </tr>
      `).join('');
    }
  },

  renderSiteDetail: function(siteId) {
    const validId = (siteId && AGRI_ADMIN_DATA.sites[siteId]) ? siteId : '12139';
    const site = AGRI_ADMIN_DATA.sites[validId];
    if (!site) return;
    this.currentSiteId = validId;
    
    document.getElementById('siteDetailTitle').textContent = site.name;
    document.getElementById('siteDetailBreadcrumb').textContent = `사업장 / ${site.code}`;
    
    const badgeEl = document.getElementById('siteDetailStatusBadge');
    badgeEl.textContent = site.status;
    badgeEl.className = `badge ${site.statusBadge}`;

    document.getElementById('detailKpiScore').textContent = site.complianceScore;
    document.getElementById('detailKpiCrop').textContent = `${site.aiCrop} (${site.cropMatch ? '일치' : '불일치'})`;
    document.getElementById('detailKpiArea').textContent = `${site.areaRatio}%`;
    document.getElementById('detailKpiEvents').textContent = `${site.eventsCount}건`;
    document.getElementById('detailKpiInactive').textContent = `${site.inactiveDays}일`;

    // Permit comparison
    document.getElementById('permitCropName').textContent = site.permitCrop;
    document.getElementById('aiCropName').textContent = `${site.aiCrop} (${site.cropMatch ? '일치' : '불일치'})`;
    document.getElementById('permitAreaSize').textContent = `${site.permitArea.toLocaleString()} ㎡`;
    document.getElementById('actualAreaSize').textContent = `${site.actualArea.toLocaleString()} ㎡ (${site.areaRatio}%)`;
    document.getElementById('otherUseStatus').textContent = site.otherUseCount === 0 ? "없음 (미탐지)" : "의심 탐지";

    // Table activities
    const tableBody = document.getElementById('detailActivitiesTableBody');
    if (tableBody && site.timeline) {
      tableBody.innerHTML = site.timeline.map(act => `
        <tr>
          <td style="font-weight:700;">${act.date}</td>
          <td style="font-weight:800; color:var(--sage-primary);">${act.title}</td>
          <td>${act.cam}</td>
          <td>${act.confidence}</td>
          <td><span class="badge badge-success">${act.review}</span></td>
        </tr>
      `).join('');
    }
  },

  makeDecision: function(action) {
    const badge = document.getElementById('evidenceReviewStatusBadge');
    if (badge) {
      badge.textContent = action;
      if (action === '인정') badge.className = 'badge badge-success';
      else if (action === '보류') badge.className = 'badge badge-warning';
      else badge.className = 'badge badge-danger';
    }
    alert(`[${action}] 판정이 정상 등록되었습니다.`);
  },

  showAuthOverlay: function() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) {
      overlay.style.setProperty('display', 'flex', 'important');
    }
  },

  hideAuthOverlay: function() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) {
      overlay.style.setProperty('display', 'none', 'important');
    }
  },

  switchAuthTab: function(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabLogin = document.getElementById('authTabLogin');
    const tabSignup = document.getElementById('authTabSignup');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'flex';
      if (signupForm) signupForm.style.display = 'none';
      if (tabLogin) {
        tabLogin.style.background = '#3d5a47';
        tabLogin.style.color = '#ffffff';
        tabLogin.style.boxShadow = '0 2px 8px rgba(61,90,71,0.4)';
      }
      if (tabSignup) {
        tabSignup.style.background = 'transparent';
        tabSignup.style.color = 'var(--text-secondary, #64748b)';
        tabSignup.style.boxShadow = 'none';
      }
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'flex';
      if (tabSignup) {
        tabSignup.style.background = '#3d5a47';
        tabSignup.style.color = '#ffffff';
        tabSignup.style.boxShadow = '0 2px 8px rgba(61,90,71,0.4)';
      }
      if (tabLogin) {
        tabLogin.style.background = 'transparent';
        tabLogin.style.color = 'var(--text-secondary, #64748b)';
        tabLogin.style.boxShadow = 'none';
      }
    }
  },

  handleLoginSubmit: function() {
    sessionStorage.setItem('dongyang_agri_logged_in', 'true');
    this.hideAuthOverlay();
  },

  handleSignupSubmit: function() {
    const nameInput = document.getElementById('signupName');
    const name = nameInput ? nameInput.value.trim() : '사용자';
    alert(`[${name}] 님의 회원가입 신청이 정상 접수되었습니다. 관리자 승인 후 로그인해 주세요.`);
    this.switchAuthTab('login');
  },

  handleLogout: function() {
    if (confirm("관리자 전용 로그인 세션을 종료하고 로그아웃 하시겠습니까?")) {
      sessionStorage.removeItem('dongyang_agri_logged_in');
      this.showAuthOverlay();
    }
  },

  handleSearch: function(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) return;

    if (e.key === 'Enter') {
      const match = Object.keys(AGRI_ADMIN_DATA.sites).find(id => {
        const s = AGRI_ADMIN_DATA.sites[id];
        return s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query);
      });

      if (match) {
        this.selectSite(match);
      } else {
        alert(`'${query}'에 해당하는 사업장을 찾을 수 없습니다.`);
      }
    }
  },

  openReportModal: function(siteId) {
    const validId = (siteId && AGRI_ADMIN_DATA.sites[siteId]) ? siteId : '12139';
    const site = AGRI_ADMIN_DATA.sites[validId];
    const modal = document.getElementById('reportModal');
    const content = document.getElementById('modalReportContent');

    content.innerHTML = `
      <div style="border:3px solid #3d5a47; border-radius:12px; padding:32px; background:linear-gradient(180deg, #f8faf9 0%, #ffffff 100%); margin-bottom:24px;">
        <div style="font-size:11px; font-weight:800; color:#3d5a47; letter-spacing:1px; margin-bottom:8px;">AGRIVOLTAIC COMPLIANCE REPORT</div>
        <h2 style="font-size:24px; font-weight:900; color:#1d3324; margin-bottom:12px;">AI 기반 영농형 태양광 영농이행 정기점검 보고서</h2>
        <p style="font-size:12.5px; color:#526759; margin-bottom:20px;">일반 스마트팜 생육분석이 아닌, 영농의무·적합작물 재배·농지 이용 적정성 확인을 위한 행정지원 보고서</p>

        <div style="background:#1d3324; color:#ffffff; padding:18px; border-radius:10px; margin-bottom:20px;">
          <div style="font-size:10.5px; color:#a3b8aa; font-weight:800; margin-bottom:4px;">REPORTING PERIOD</div>
          <div style="font-size:20px; font-weight:900; margin-bottom:8px;">${AGRI_ADMIN_DATA.summary.reportingPeriod}</div>
          <div style="font-size:13px; font-weight:800;">사업장: ${site.name}</div>
          <div style="font-size:11.5px; color:#a3b8aa;">허가번호 ${site.permitNo} · 관리기관 강원특별자치도 / 원주·횡성·춘천시</div>
        </div>

        <div style="display:grid; grid-template-columns:3fr 2fr; gap:16px; margin-bottom:20px;">
          <div style="background:#edf4ef; border-radius:10px; padding:16px;">
            <div style="font-size:11px; font-weight:800; color:#3d5a47; margin-bottom:8px;">📷 AI CAMERA 03 증빙 썸네일</div>
            <div style="background:#111827; color:#ffffff; height:120px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800;">
              [작업자 0.97] [농기계 0.92] 2027.03.28 10:42
            </div>
          </div>
          <div style="background:#edf4ef; border-radius:10px; padding:16px;">
            <div style="font-size:10.5px; color:#526759; font-weight:800;">MONTHLY RESULT</div>
            <div style="font-size:24px; font-weight:900; color:#10b981; margin:4px 0;">${site.status}</div>
            <span class="badge ${site.statusBadge}" style="margin-bottom:8px;">영농의무 이행</span>
            <p style="font-size:11px; color:#324739; margin:0;">신고작물과 실제 작물이 일치하며 주요 영농활동이 지속적으로 확인되었습니다.</p>
          </div>
        </div>

        <div style="border-top:2px dashed #a3b8aa; padding-top:16px;">
          <h3 style="font-size:15px; font-weight:900; color:#1d3324; margin-bottom:10px;">01 EXECUTIVE SUMMARY 종합 평가</h3>
          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:10px; margin-bottom:16px;">
            <div style="background:#ffffff; border:1px solid #a3b8aa; padding:10px; border-radius:8px; text-align:center;">
              <div style="font-size:11px; color:#526759;">작물 확인</div>
              <strong style="font-size:16px; color:#1d3324;">${site.cropMatch ? '일치' : '불일치'}</strong>
            </div>
            <div style="background:#ffffff; border:1px solid #a3b8aa; padding:10px; border-radius:8px; text-align:center;">
              <div style="font-size:11px; color:#526759;">실경작면적</div>
              <strong style="font-size:16px; color:#1d3324;">${site.areaRatio}%</strong>
            </div>
            <div style="background:#ffffff; border:1px solid #a3b8aa; padding:10px; border-radius:8px; text-align:center;">
              <div style="font-size:11px; color:#526759;">영농 이벤트</div>
              <strong style="font-size:16px; color:#1d3324;">${site.eventsCount}건</strong>
            </div>
            <div style="background:#ffffff; border:1px solid #a3b8aa; padding:10px; border-radius:8px; text-align:center;">
              <div style="font-size:11px; color:#526759;">연속 무활동</div>
              <strong style="font-size:16px; color:#1d3324;">${site.inactiveDays}일</strong>
            </div>
            <div style="background:#ffffff; border:1px solid #a3b8aa; padding:10px; border-radius:8px; text-align:center;">
              <div style="font-size:11px; color:#526759;">타용도 의심</div>
              <strong style="font-size:16px; color:#10b981;">0건</strong>
            </div>
          </div>
        </div>

        <div style="text-align:right; margin-top:20px;">
          <button class="btn-header btn-terracotta" onclick="window.print()">
            <i class="fa-solid fa-print"></i> 1-Click PDF 인쇄 / 다운로드
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  closeReportModal: function() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.classList.remove('active');
  },

  applyToReport: function() {
    alert("AI 영상 증빙 검토 결과가 정기점검 리포트에 성공적으로 반영되었습니다.");
  }
};

document.addEventListener('DOMContentLoaded', () => {
  DongyangAgriApp.init();
});
