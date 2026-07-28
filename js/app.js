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

    // Clear previous highlight classes
    const secOverview = document.getElementById('siteDetailTopKpi');
    const secActivity = document.getElementById('detailActivitiesSection');
    const secPermit = document.getElementById('detailPermitSection');
    const secAction = document.getElementById('detailAnomaliesSection');

    [secOverview, secActivity, secPermit, secAction].forEach(el => {
      if (el) el.classList.remove('section-highlight');
    });

    let targetEl = null;
    if (tabName === 'activity') {
      targetEl = secActivity;
    } else if (tabName === 'permit') {
      targetEl = secPermit;
    } else if (tabName === 'action') {
      targetEl = secAction;
    } else {
      targetEl = secOverview;
    }

    if (targetEl) {
      targetEl.classList.add('section-highlight');
      setTimeout(() => {
        targetEl.classList.remove('section-highlight');
      }, 1600);

      const mainWrapper = document.querySelector('.main-wrapper');
      if (mainWrapper) {
        const topOffset = targetEl.offsetTop - 15;
        mainWrapper.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
      }
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
      <div style="text-align:right; margin-bottom:16px;">
        <button class="btn-header btn-terracotta" onclick="window.print()" style="padding:8px 18px; font-size:13px; font-weight:800; border-radius:30px; box-shadow:0 4px 14px rgba(208,98,69,0.35);">
          <i class="fa-solid fa-print"></i> 1-Click PDF 인쇄 / 다운로드
        </button>
      </div>

      <!-- 📄 PAGE 01: EXECUTIVE SUMMARY 종합 평가 -->
      <div style="background:var(--bg-card, #ffffff); border:1px solid var(--border-color); border-radius:16px; padding:32px; margin-bottom:24px; box-shadow:var(--shadow-card);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:11px; font-weight:800; color:var(--text-muted); letter-spacing:1px;">01 EXECUTIVE SUMMARY</span>
          <span style="font-size:11px; font-weight:800; color:var(--text-muted);">REPORT ID: APV-2027-03-0031</span>
        </div>
        <h2 style="font-size:22px; font-weight:900; color:var(--text-primary); margin:0 0 20px 0;">종합 평가</h2>

        <div style="display:flex; align-items:baseline; gap:16px; margin-bottom:24px;">
          <span style="font-size:54px; font-weight:900; color:var(--text-primary); line-height:1;">${site.complianceScore || 93}</span>
          <div>
            <div style="font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:4px;">영농이행지수</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="font-size:24px; font-weight:900; color:${site.statusBadge === 'badge-warning' ? '#d06245' : '#10b981'};">${site.status}</strong>
              <span class="badge ${site.statusBadge}" style="padding:4px 10px; font-size:11.5px; border-radius:12px;">${site.statusBadge === 'badge-warning' ? '관찰 필요' : '현장점검 불필요'}</span>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:12px; margin-bottom:20px;">
          <div style="background:var(--bg-card-subtle); padding:14px 12px; border-radius:12px; border:1px solid var(--border-color);">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">작물 확인</div>
            <div style="font-size:20px; font-weight:900; color:var(--text-primary);">${site.cropMatch ? '일치' : '불일치'}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${site.declaredCrop}</div>
          </div>
          <div style="background:var(--bg-card-subtle); padding:14px 12px; border-radius:12px; border:1px solid var(--border-color);">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">실경작면적</div>
            <div style="font-size:20px; font-weight:900; color:var(--text-primary);">${site.areaRatio}%</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${site.actualArea.split(' ')[0]} ㎡</div>
          </div>
          <div style="background:var(--bg-card-subtle); padding:14px 12px; border-radius:12px; border:1px solid var(--border-color);">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">영농 이벤트</div>
            <div style="font-size:20px; font-weight:900; color:var(--text-primary);">${site.eventsCount}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">월간 탐지</div>
          </div>
          <div style="background:var(--bg-card-subtle); padding:14px 12px; border-radius:12px; border:1px solid var(--border-color);">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">연속 무활동</div>
            <div style="font-size:20px; font-weight:900; color:var(--text-primary);">${site.inactiveDays}일</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">기준 이내</div>
          </div>
          <div style="background:var(--bg-card-subtle); padding:14px 12px; border-radius:12px; border:1px solid var(--border-color);">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">타용도 의심</div>
            <div style="font-size:20px; font-weight:900; color:var(--text-primary);">0</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">미탐지</div>
          </div>
        </div>

        <div style="background:var(--bg-card-subtle); border:1px solid var(--border-color); border-radius:12px; padding:16px 18px; margin-bottom:20px;">
          <div style="font-size:11.5px; font-weight:800; color:var(--sage-primary); margin-bottom:6px;">AI 종합의견</div>
          <p style="font-size:12.5px; color:var(--text-primary); margin:0; line-height:1.6;">
            신고된 작물인 ${site.declaredCrop}이 전체 허가면적의 약 ${site.areaRatio}%에서 확인되었습니다. 3월 중 경운, 파종, 제초 및 작업자·농기계 활동이 탐지되었고 장기 방치나 비농업적 사용 징후는 확인되지 않았습니다. 본 결과는 행정담당자의 검토를 지원하기 위한 참고자료이며 법적 처분은 담당기관의 최종 판단에 따릅니다.
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px;">
            <div style="font-size:12px; font-weight:800; color:var(--text-primary); margin-bottom:12px;">허가 및 영농계획 비교</div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-color); color:var(--text-muted); text-align:left;">
                  <th style="padding:6px 0;">항목</th>
                  <th style="padding:6px 0;">허가/계획</th>
                  <th style="padding:6px 0;">AI 확인</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:8px 0;">재배작물</td>
                  <td>${site.declaredCrop}</td>
                  <td><span class="badge badge-success" style="padding:2px 8px; font-size:11px;">일치</span></td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:8px 0;">재배면적</td>
                  <td>${site.permitArea}</td>
                  <td>${site.actualArea.split(' ')[0]} ㎡</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:8px 0;">작업시기</td>
                  <td>3월 경운·파종</td>
                  <td>확인</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">타용도 사용</td>
                  <td>금지</td>
                  <td>미탐지</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px;">
            <div style="font-size:12px; font-weight:800; color:var(--text-primary); margin-bottom:14px;">검토 우선순위</div>
            <div style="margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; margin-bottom:4px;">
                <span>영농의무</span>
                <strong>96%</strong>
              </div>
              <div style="background:#e2e8f0; height:8px; border-radius:4px; overflow:hidden;">
                <div style="background:#3d5a47; width:96%; height:100%;"></div>
              </div>
            </div>
            <div style="margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; margin-bottom:4px;">
                <span>적합작물 재배</span>
                <strong>95%</strong>
              </div>
              <div style="background:#e2e8f0; height:8px; border-radius:4px; overflow:hidden;">
                <div style="background:#3d5a47; width:95%; height:100%;"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; margin-bottom:4px;">
                <span>농지 이용 적정성</span>
                <strong>91%</strong>
              </div>
              <div style="background:#e2e8f0; height:8px; border-radius:4px; overflow:hidden;">
                <div style="background:#3d5a47; width:91%; height:100%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 📄 PAGE 02: FARMING ACTIVITY 영농활동 분석 및 타임라인 -->
      <div style="background:var(--bg-card, #ffffff); border:1px solid var(--border-color); border-radius:16px; padding:32px; margin-bottom:24px; box-shadow:var(--shadow-card);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:11px; font-weight:800; color:var(--text-muted); letter-spacing:1px;">02 FARMING ACTIVITY</span>
          <span class="badge badge-success" style="padding:4px 12px; font-size:11.5px;">월간 ${site.eventsCount}건 확인</span>
        </div>
        <h2 style="font-size:22px; font-weight:900; color:var(--text-primary); margin:0 0 20px 0;">영농활동 분석 및 타임라인</h2>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; margin-bottom:20px;">
          <div style="background:var(--bg-card-subtle); padding:16px; border-radius:12px; border:1px solid var(--border-color);">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">작업자 탐지</div>
            <div style="font-size:28px; font-weight:900; color:var(--text-primary);">18회</div>
          </div>
          <div style="background:var(--bg-card-subtle); padding:16px; border-radius:12px; border:1px solid var(--border-color);">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">농기계 탐지</div>
            <div style="font-size:28px; font-weight:900; color:var(--text-primary);">8회</div>
          </div>
          <div style="background:var(--bg-card-subtle); padding:16px; border-radius:12px; border:1px solid var(--border-color);">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">주요 작업 유형</div>
            <div style="font-size:20px; font-weight:900; color:var(--text-primary);">경운·파종·제초</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
          <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px;">
            <div style="font-size:12px; font-weight:800; color:var(--text-primary); margin-bottom:12px;">작업 유형별 탐지</div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-color); color:var(--text-muted); text-align:left;">
                  <th style="padding:6px 0;">영농행위</th>
                  <th style="padding:6px 0;">탐지</th>
                  <th style="padding:6px 0;">신뢰도</th>
                  <th style="padding:6px 0;">판정</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:8px 0; font-weight:800;">경운</td>
                  <td>3회</td>
                  <td>95%</td>
                  <td><span class="badge badge-success" style="padding:2px 8px; font-size:11px;">확인</span></td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:8px 0; font-weight:800;">파종</td>
                  <td>2회</td>
                  <td>94%</td>
                  <td><span class="badge badge-success" style="padding:2px 8px; font-size:11px;">확인</span></td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:8px 0; font-weight:800;">제초</td>
                  <td>4회</td>
                  <td>90%</td>
                  <td><span class="badge badge-success" style="padding:2px 8px; font-size:11px;">확인</span></td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-weight:800;">수확</td>
                  <td>0회</td>
                  <td>-</td>
                  <td><span class="badge badge-warning" style="padding:2px 8px; font-size:11px;">시기 전</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px;">
            <div style="font-size:12px; font-weight:800; color:var(--text-primary); margin-bottom:12px;">월간 타임라인</div>
            <ul style="list-style:none; padding:0; margin:0; font-size:12px;">
              <li style="margin-bottom:10px; padding-left:14px; border-left:3px solid #10b981;">
                <strong style="color:var(--text-primary); font-size:13px;">03.02 경운</strong>
                <div style="color:var(--text-muted); font-size:11px; margin-top:2px;">카메라 01 · 농기계 1대 · 신뢰도 96%</div>
              </li>
              <li style="margin-bottom:10px; padding-left:14px; border-left:3px solid #10b981;">
                <strong style="color:var(--text-primary); font-size:13px;">03.06 파종</strong>
                <div style="color:var(--text-muted); font-size:11px; margin-top:2px;">카메라 02 · 작업자 2명 · 신뢰도 94%</div>
              </li>
              <li style="margin-bottom:10px; padding-left:14px; border-left:3px solid #10b981;">
                <strong style="color:var(--text-primary); font-size:13px;">03.18 제초</strong>
                <div style="color:var(--text-muted); font-size:11px; margin-top:2px;">카메라 03 · 작업자 1명 · 신뢰도 91%</div>
              </li>
              <li style="padding-left:14px; border-left:3px solid #10b981;">
                <strong style="color:var(--text-primary); font-size:13px;">03.28 농기계 작업</strong>
                <div style="color:var(--text-muted); font-size:11px; margin-top:2px;">남측 진입로 · 신뢰도 92%</div>
              </li>
            </ul>
          </div>
        </div>

        <div style="background:var(--bg-card-subtle); border:1px solid var(--border-color); border-radius:12px; padding:14px 16px;">
          <div style="font-size:11.5px; font-weight:800; color:var(--text-muted); margin-bottom:4px;">판단 기준</div>
          <p style="font-size:12px; color:var(--text-primary); margin:0; line-height:1.5;">
            탐지 이벤트는 영상 속 작업자, 농기계, 작업 동작 및 시간적 연속성을 결합하여 생성합니다. 생육속도·작물건강도·수량은 평가하지 않습니다.
          </p>
        </div>
      </div>

      <!-- 📄 PAGE 03: VIDEO EVIDENCE AI 영상 증빙 -->
      <div style="background:var(--bg-card, #ffffff); border:1px solid var(--border-color); border-radius:16px; padding:32px; margin-bottom:24px; box-shadow:var(--shadow-card);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:11px; font-weight:800; color:var(--text-muted); letter-spacing:1px;">03 VIDEO EVIDENCE</span>
          <span style="font-size:11px; font-weight:800; color:var(--text-muted);">CAMERA 03 · 2027.03.28 10:42</span>
        </div>
        <h2 style="font-size:22px; font-weight:900; color:var(--text-primary); margin:0 0 20px 0;">AI 영상 증빙</h2>

        <div style="display:grid; grid-template-columns:3fr 2fr; gap:16px; margin-bottom:20px;">
          <!-- Bounding box image simulation -->
          <div style="background:#111827; border-radius:14px; position:relative; min-height:200px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:2px solid var(--sage-primary);">
            <img src="cctv_sample_real.jpg" alt="AI CAM 03 현장 캡처" style="width:100%; height:100%; object-fit:cover; opacity:0.85;" onerror="this.style.display='none';" />
            <div style="position:absolute; top:25%; left:20%; border:2px solid #10b981; background:rgba(16,185,129,0.25); padding:4px 8px; border-radius:4px; color:#ffffff; font-size:11px; font-weight:900;">
              작업자 0.97
            </div>
            <div style="position:absolute; top:35%; left:45%; border:2px solid #10b981; background:rgba(16,185,129,0.25); padding:4px 8px; border-radius:4px; color:#ffffff; font-size:11px; font-weight:900;">
              농기계 0.92
            </div>
          </div>

          <!-- AI 판단 Box -->
          <div style="background:var(--bg-card-subtle); border:1px solid var(--border-color); border-radius:14px; padding:18px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:4px;">AI 판단</div>
              <h3 style="font-size:20px; font-weight:900; color:var(--text-primary); margin:0 0 10px 0;">농기계 작업</h3>
              <span class="badge badge-success" style="padding:4px 10px; font-size:11.5px; margin-bottom:14px;">증빙 적합</span>
            </div>

            <table style="width:100%; font-size:12px; border-collapse:collapse;">
              <tbody>
                <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:6px 0; color:var(--text-muted);">작업자</td><td style="text-align:right; font-weight:800;">2명</td></tr>
                <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:6px 0; color:var(--text-muted);">농기계</td><td style="text-align:right; font-weight:800;">1대</td></tr>
                <tr style="border-bottom:1px solid var(--border-color);"><td style="padding:6px 0; color:var(--text-muted);">활동구역</td><td style="text-align:right; font-weight:800;">B구역</td></tr>
                <tr><td style="padding:6px 0; color:var(--text-muted);">신뢰도</td><td style="text-align:right; font-weight:900; color:#10b981;">94%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
          <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px;">
            <div style="font-size:12px; font-weight:800; color:var(--text-primary); margin-bottom:10px;">판단 근거</div>
            <ul style="margin:0; padding-left:16px; font-size:12px; color:var(--text-primary); line-height:1.6;">
              <li>작업자 2명 연속 탐지</li>
              <li>농기계 이동 궤적 확인</li>
              <li>경작구역 내 반복 작업 패턴</li>
              <li>비농업적 적치 또는 주차 패턴 아님</li>
            </ul>
          </div>

          <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px;">
            <div style="font-size:12px; font-weight:800; color:var(--text-primary); margin-bottom:10px;">원본 무결성</div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
              <tbody>
                <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:6px 0; color:var(--text-muted);">영상 ID</td><td style="text-align:right; font-weight:800;">CAM03-0328-1042</td></tr>
                <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:6px 0; color:var(--text-muted);">위치</td><td style="text-align:right; font-weight:800;">36.71, 126.55</td></tr>
                <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:6px 0; color:var(--text-muted);">원본 보존</td><td style="text-align:right; font-weight:800; color:#10b981;">확인</td></tr>
                <tr><td style="padding:6px 0; color:var(--text-muted);">검토상태</td><td style="text-align:right; font-weight:800;">담당자 승인</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="background:var(--bg-card-subtle); border:1px solid var(--border-color); border-radius:12px; padding:14px 16px;">
          <div style="font-size:11.5px; font-weight:800; color:var(--text-muted); margin-bottom:4px;">설명가능성 원칙</div>
          <p style="font-size:12px; color:var(--text-primary); margin:0; line-height:1.5;">
            AI는 결과뿐 아니라 탐지 객체, 시간, 위치, 신뢰도 및 원본영상 연결정보를 함께 제공합니다. 행정담당자는 증빙을 열람한 뒤 인정·보류·오탐 처리할 수 있습니다.
          </p>
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
