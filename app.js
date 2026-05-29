document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // --- State & Data Management ---
  const STORAGE_KEY = 'chalkboard_stories_v1';
  let stories = [];

  // Default initial stories to wow the user (removed dynamically when user erases them)
  const defaultStories = [
    {
      id: 'default-1',
      nickname: '유리창속비',
      story: '비가 오는 날이면 늘 라디오를 켜요. 고등학교 시절, 친구들과 함께 분식집에서 이 노래를 들으며 떡볶이를 나눠 먹던 때가 너무 그리워집니다. 그 시절의 우리가 참 소중했네요.',
      song: '김광석 - 거리에서',
      x: 15,
      y: 20,
      rotation: -5
    },
    {
      id: 'default-2',
      nickname: '보라빛밤',
      story: '첫사랑과 함께 거닐던 야간 자율학습 하굣길이 떠오릅니다. 가로등 아래에서 이어폰 한 짝씩 나누어 끼고 들었던 감미로운 멜로디. 지금 들어도 그때의 차가운 밤공기와 설렘이 생생하네요.',
      song: '전람회 - 기억의 습작',
      x: 55,
      y: 25,
      rotation: 6
    },
    {
      id: 'default-3',
      nickname: '낭만청춘',
      story: '힘든 시험 기간에 늘 저를 위로해 주었던 노래입니다. 칠판 가득 적힌 수학 공식들을 보며 한숨 쉴 때, 이 노래를 흥얼거리면 마법처럼 힘이 났어요! 지금 청춘들에게 들려주고 싶네요.',
      song: '옥상달빛 - 수고했어 오늘도',
      x: 35,
      y: 55,
      rotation: -3
    }
  ];

  // Save stories to localStorage
  const saveStories = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    updateStats();
  };

  // Load stories from localStorage
  const loadStories = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      stories = JSON.parse(data);
    } else {
      // Set default templates if none exist
      stories = [...defaultStories];
      saveStories();
    }
  };

  // --- DOM Elements ---
  const chalkboard = document.getElementById('chalkboard');
  const notesGrid = document.getElementById('notes-grid');
  const storyCounter = document.getElementById('story-counter');
  const btnWriteStory = document.getElementById('btn-write-story');
  const btnClearBoard = document.getElementById('btn-clear-board');
  const animationViewport = document.getElementById('animation-viewport');

  // Portal & DJ Login Elements
  const landingPortal = document.getElementById('landing-portal');
  const btnEnterGuest = document.getElementById('btn-enter-guest');
  const btnShowDjLogin = document.getElementById('btn-show-dj-login');
  const djLoginPanel = document.getElementById('dj-login-panel');
  const portalChoices = document.getElementById('portal-choices');
  const btnBackToChoices = document.getElementById('btn-back-to-choices');
  const djLoginForm = document.getElementById('dj-login-form');
  const loginId = document.getElementById('login-id');
  const loginPw = document.getElementById('login-pw');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const eraserHolder = document.getElementById('eraser-holder');
  const djModeBadge = document.getElementById('dj-mode-badge');

  // Modals
  const modalWrite = document.getElementById('modal-write');
  const modalDetail = document.getElementById('modal-detail');
  const btnCloseWrite = document.getElementById('btn-close-write');
  const btnCloseDetail = document.getElementById('btn-close-detail');

  // Custom Deletion Confirm Modal Elements
  const modalConfirm = document.getElementById('modal-confirm');
  const btnConfirmYes = document.getElementById('btn-confirm-yes');
  const btnConfirmNo = document.getElementById('btn-confirm-no');

  // Form Elements
  const storyForm = document.getElementById('story-form');
  const storyFormPaper = document.getElementById('story-form-paper');
  const inputNickname = document.getElementById('input-nickname');
  const inputStory = document.getElementById('input-story');
  const inputSong = document.getElementById('input-song');

  // Detail elements
  const detailNickname = document.getElementById('detail-nickname');
  const detailStory = document.getElementById('detail-story');
  const detailRequestedSong = document.getElementById('detail-requested-song');
  const btnDeleteStory = document.getElementById('btn-delete-story');
  const btnYoutubeLink = document.getElementById('btn-youtube-link');
  const btnYoutubeText = document.getElementById('btn-youtube-text');
  const detailLpPanel = document.getElementById('detail-lp-panel');

  let activeStoryId = null;
  let pendingDeleteStoryId = null;
  let isDJMode = false;

  // --- Modal Utilities ---
  const showModal = (modal) => {
    modal.classList.remove('hidden');
  };

  const hideModal = (modal) => {
    modal.classList.add('hidden');
  };

  // --- Counter Stats ---
  const updateStats = () => {
    storyCounter.textContent = `사연: ${stories.length}개`;
  };

  // --- Sticky Note Rendering ---
  const renderNote = (story) => {
    const note = document.createElement('div');
    note.className = 'chalk-sticky-note';
    note.id = `note-${story.id}`;
    note.style.left = `${story.x}%`;
    note.style.top = `${story.y}%`;
    note.style.transform = `rotate(${story.rotation}deg)`;
    
    note.innerHTML = `
      <div class="pushpin"></div>
      <div class="note-nickname">${escapeHTML(story.nickname)}</div>
      <div class="note-story-snippet">${escapeHTML(story.story)}</div>
      <div class="note-song-title">
        <i data-lucide="music"></i>
        <span>${escapeHTML(story.song)}</span>
      </div>
    `;

    // Bind click to open detail
    note.addEventListener('click', () => openDetailModal(story));
    notesGrid.appendChild(note);
    
    // Re-initialize dynamic Lucide icons for new components
    lucide.createIcons();
  };

  const renderAllNotes = () => {
    notesGrid.innerHTML = '';
    stories.forEach(story => renderNote(story));
    updateStats();
  };

  // Escape HTML helper to prevent XSS injection
  const escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  };

  // --- Open Detail View ---
  const openDetailModal = (story) => {
    activeStoryId = story.id;
    detailNickname.textContent = story.nickname;
    detailStory.textContent = story.story;
    detailRequestedSong.textContent = story.song;

    // Set up YouTube Search link
    const cleanSongQuery = story.song.trim();
    btnYoutubeLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanSongQuery)}`;

    // Dynamically replace button text with '[Requested Song] 재생하기'
    // Prevent button overflow for extremely long song titles
    const maxDisplayLen = 22;
    const displaySong = cleanSongQuery.length > maxDisplayLen 
      ? cleanSongQuery.substring(0, maxDisplayLen) + '...' 
      : cleanSongQuery;
    btnYoutubeText.textContent = `"${displaySong}" 재생하기`;

    showModal(modalDetail);

    // Slide out the LP record to the right with spring animation
    detailLpPanel.classList.remove('active');
    void detailLpPanel.offsetWidth; // Trigger DOM reflow to restart transition
    detailLpPanel.classList.add('active');
  };

  // --- Delete Story (Custom Confirm Dialog implementation) ---
  btnDeleteStory.addEventListener('click', () => {
    if (!activeStoryId) return;
    // Set pending delete target and show custom confirm box
    pendingDeleteStoryId = activeStoryId;
    showModal(modalConfirm);
  });

  // Custom Confirm Yes
  btnConfirmYes.addEventListener('click', () => {
    if (!pendingDeleteStoryId) return;

    const noteEl = document.getElementById(`note-${pendingDeleteStoryId}`);
    if (noteEl) {
      noteEl.style.transform = 'scale(0) rotate(20deg)';
      noteEl.style.opacity = '0';
    }

    stories = stories.filter(s => s.id !== pendingDeleteStoryId);
    saveStories();

    setTimeout(() => {
      hideModal(modalConfirm);
      hideModal(modalDetail);
      detailLpPanel.classList.remove('active');
      renderAllNotes();
      pendingDeleteStoryId = null;
    }, 300);
  });

  // Custom Confirm No
  btnConfirmNo.addEventListener('click', () => {
    hideModal(modalConfirm);
    pendingDeleteStoryId = null;
  });

  // Close confirm modal when clicking overlay
  modalConfirm.addEventListener('click', (e) => {
    if (e.target === modalConfirm) {
      hideModal(modalConfirm);
      pendingDeleteStoryId = null;
    }
  });

  // --- Clear / Erase Board (Full wipe) ---
  btnClearBoard.addEventListener('click', () => {
    if (confirm('칠판의 모든 사연과 기록을 지우개로 깨끗이 지우시겠습니까?\n(로컬 데이터가 완전히 삭제됩니다.)')) {
      
      // Animate note erasures
      const notes = document.querySelectorAll('.chalk-sticky-note');
      notes.forEach((note, index) => {
        setTimeout(() => {
          note.style.transform = 'scale(0) translateY(40px)';
          note.style.opacity = '0';
        }, index * 80);
      });

      // Wipe data structures completely (ensuring no dummy items are left)
      stories = [];
      saveStories();

      // Complete reload screen after animations clear
      setTimeout(() => {
        renderAllNotes();
      }, (notes.length * 80) + 300);
    }
  });

  // --- Write Modal trigger buttons ---
  btnWriteStory.addEventListener('click', () => {
    storyForm.reset();
    showModal(modalWrite);
  });

  btnCloseWrite.addEventListener('click', () => {
    hideModal(modalWrite);
  });

  btnCloseDetail.addEventListener('click', () => {
    detailLpPanel.classList.remove('active');
    hideModal(modalDetail);
  });

  // Close modals when user clicks outside modal boundary
  [modalWrite, modalDetail].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        detailLpPanel.classList.remove('active');
        hideModal(modal);
      }
    });
  });

  // --- Portal & DJ Login Handlers ---
  const applyRoleSettings = () => {
    if (isDJMode) {
      eraserHolder.style.display = 'block';
      djModeBadge.classList.remove('hidden');
    } else {
      eraserHolder.style.display = 'none';
      djModeBadge.classList.add('hidden');
    }
  };

  // Guest Enter
  btnEnterGuest.addEventListener('click', () => {
    isDJMode = false;
    sessionStorage.setItem('visible_radio_role', 'guest');
    applyRoleSettings();
    landingPortal.classList.add('portal-slide-up');
    
    setTimeout(() => {
      landingPortal.classList.add('hidden');
    }, 600);
  });

  // Show DJ Login
  btnShowDjLogin.addEventListener('click', () => {
    portalChoices.classList.add('hidden');
    djLoginPanel.classList.remove('hidden');
    loginId.focus();
  });

  // Back to Choices
  btnBackToChoices.addEventListener('click', () => {
    portalChoices.classList.remove('hidden');
    djLoginPanel.classList.add('hidden');
    djLoginForm.reset();
    loginErrorMsg.classList.add('hidden');
  });

  // DJ Login Submit (ID: Educom, PW: test)
  djLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idVal = loginId.value.trim();
    const pwVal = loginPw.value.trim();

    if (idVal === 'admin' && pwVal === 'admin4250') {
      isDJMode = true;
      sessionStorage.setItem('visible_radio_role', 'dj');
      applyRoleSettings();
      landingPortal.classList.add('portal-slide-up');
      
      setTimeout(() => {
        landingPortal.classList.add('hidden');
      }, 600);
    } else {
      // Show error & shake login card
      loginErrorMsg.classList.remove('hidden');
      const portalCard = document.querySelector('.portal-card');
      portalCard.classList.remove('shake-animation');
      void portalCard.offsetWidth; // Trigger reflow
      portalCard.classList.add('shake-animation');
    }
  });

  // Persistent role restoration on load
  const restoreUserRole = () => {
    const savedRole = sessionStorage.getItem('visible_radio_role');
    if (savedRole === 'dj') {
      isDJMode = true;
      applyRoleSettings();
      landingPortal.style.display = 'none';
      landingPortal.classList.add('hidden');
    } else if (savedRole === 'guest') {
      isDJMode = false;
      applyRoleSettings();
      landingPortal.style.display = 'none';
      landingPortal.classList.add('hidden');
    } else {
      // First visit - set default guest hide eraser settings
      isDJMode = false;
      applyRoleSettings();
    }
  };

  // Run restoration
  restoreUserRole();

  // --- 3D Origami Folding and Flying airplane sequence ---
  storyForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nickname = inputNickname.value.trim();
    const story = inputStory.value.trim();
    const song = inputSong.value.trim();

    if (!nickname || !story || !song) return;

    // Calculate dimensions and coordinates for 3D flight path
    const surfaceRect = chalkboard.getBoundingClientRect();
    const paperRect = storyFormPaper.getBoundingClientRect();

    // 1. Origami Flight start coordinates (relative to viewport)
    const startX = paperRect.left + (paperRect.width / 2) - surfaceRect.left;
    const startY = paperRect.top + (paperRect.height / 2) - surfaceRect.top;

    // 2. Safe random end coordinates on green chalkboard
    // Save in percentage format to automatically support viewport resizes!
    const endXPercent = Math.random() * 70 + 10; // 10% to 80% boundary
    const endYPercent = Math.random() * 60 + 12; // 12% to 72% boundary
    
    // Pixel equivalents for the flight animation
    const endX = (endXPercent / 100) * surfaceRect.width;
    const endY = (endYPercent / 100) * surfaceRect.height;
    
    const randomRotation = Math.floor(Math.random() * 14) - 7; // -7deg to +7deg range
    const newId = 'story-' + Date.now();

    // Begin Origami collapse transformation
    storyFormPaper.classList.add('folding-prep');
    
    setTimeout(() => {
      storyFormPaper.classList.add('fold-collapse');
    }, 300);

    // Spawn 3D Paper Airplane to fly
    setTimeout(() => {
      createPaperAirplaneFlight(startX, startY, endX, endY, () => {
        // Flight Complete Trigger Callback:
        // A. Trigger Chalkboard Dust Puff animation
        createChalkDustPuff(endX, endY);

        // B. Add new story item to local array
        const newStory = {
          id: newId,
          nickname,
          story,
          song,
          x: endXPercent,
          y: endYPercent,
          rotation: randomRotation
        };
        
        stories.push(newStory);
        saveStories();
        renderNote(newStory);

        // C. Clean up form modal and restore classes
        hideModal(modalWrite);
        storyFormPaper.classList.remove('folding-prep', 'fold-collapse');
        storyForm.reset();
      });
    }, 700); // Trigger flight exactly when paper collapses
  });

  // Creates the physical paper airplane SVG and triggers the CSS 3D flight keyframes
  const createPaperAirplaneFlight = (startX, startY, endX, endY, callback) => {
    const plane = document.createElement('div');
    plane.className = 'origami-airplane-flight';
    
    // Set starts and ends as inline CSS custom properties for @keyframes access
    plane.style.setProperty('--start-x', `${startX}px`);
    plane.style.setProperty('--start-y', `${startY}px`);
    plane.style.setProperty('--end-x', `${endX}px`);
    plane.style.setProperty('--end-y', `${endY}px`);

    // Render a high-fidelity vector Paper Airplane origami design
    plane.innerHTML = `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Main body folds -->
        <polygon points="50,15 15,80 50,65" fill="hsl(355, 80%, 93%)" />
        <polygon points="50,15 85,80 50,65" fill="hsl(355, 78%, 88%)" />
        <!-- Under wing shadow panels -->
        <polygon points="50,15 50,65 35,80" fill="hsl(355, 60%, 82%)" />
        <polygon points="50,15 50,65 65,80" fill="hsl(355, 55%, 78%)" />
        <!-- Base folding seam -->
        <polygon points="50,65 50,85 42,80" fill="hsl(355, 50%, 75%)" />
        <polygon points="50,65 50,85 58,80" fill="hsl(355, 48%, 70%)" />
      </svg>
    `;

    // Apply the customized 3D animation
    plane.style.animation = 'flyAirplane 1.8s cubic-bezier(0.2, 0.7, 0.45, 1) forwards';
    animationViewport.appendChild(plane);

    // Resolve flight steps on animation end
    plane.addEventListener('animationend', () => {
      plane.remove();
      if (callback) callback();
    });
  };

  // Renders a expanding expanding chalk cloud on contact
  const createChalkDustPuff = (x, y) => {
    const puff = document.createElement('div');
    puff.className = 'dust-puff';
    puff.style.left = `${x}px`;
    puff.style.top = `${y}px`;
    
    animationViewport.appendChild(puff);

    puff.addEventListener('animationend', () => {
      puff.remove();
    });
  };

  // --- Initial Launch Setup ---
  loadStories();
  renderAllNotes();
});
