document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // ==========================================
  // --- Firebase & Firestore Configuration ---
  // ==========================================
  // 1단계에서 복사한 본인의 Firebase 환경설정 값으로 대체하세요!
  const firebaseConfig = {
  apiKey: "AIzaSyCri_QkHRJqZgzZqdcoWxyF9kFuHCpDGUI",
  authDomain: "radio-f79f9.firebaseapp.com",
  projectId: "radio-f79f9",
  storageBucket: "radio-f79f9.firebasestorage.app",
  messagingSenderId: "4987890307",
  appId: "1:4987890307:web:f2a9330a7bb1c52c9649b6"
};

  // Firebase 및 Firestore 초기화
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const collectionRef = db.collection('chalkboard_stories'); // 컬렉션 이름 정의

  let stories = [];

  // 기본 초기 사연 (DB가 텅 비었을 때 최초 1회만 심어줄 기본값)
  const defaultStories = [
    { nickname: '유리창속비', story: '비가 오는 날이면 늘 라디오를 켜요...', song: '김광석 - 거리에서', x: 15, y: 20, rotation: -5 },
    { nickname: '보라빛밤', story: '첫사랑과 함께 거닐던 야간 자율학습...', song: '전람회 - 기억의 습작', x: 55, y: 25, rotation: 6 },
    { nickname: '낭만청춘', story: '힘든 시험 기간에 늘 저를 위로해 주었던...', song: '옥상달빛 - 수고했어 오늘도', x: 35, y: 55, rotation: -3 }
  ];

  // --- Realtime Data Synchronization (실시간 데이터 동기화) ---
  // 데이터가 추가되거나 삭제되면 실시간으로 감지하여 화면을 자동으로 갱신합니다.
  const listenToStories = () => {
    collectionRef.onSnapshot((snapshot) => {
      stories = [];
      snapshot.forEach((doc) => {
        stories.push({
          id: doc.id, // Firestore 문서 ID를 고유 ID로 활용
          ...doc.data()
        });
      });
      
      // 만약 DB에 데이터가 아예 없다면 디폴트 데이터 세팅
      if (stories.length === 0) {
        defaultStories.forEach(async (item) => {
          await collectionRef.add({ ...item, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        });
        return; // add 이벤트로 인해 실시간 리스너가 다시 돌기 때문에 리턴 처리
      }

      // 화면 새로 그리기
      renderAllNotes();
    }, (error) => {
      console.error("Firestore listen error: ", error);
    });
  };

  // ==========================================
  // --- DOM Elements --- (기존 코드 유지)
  // ==========================================
  const chalkboard = document.getElementById('chalkboard');
  const notesGrid = document.getElementById('notes-grid');
  const storyCounter = document.getElementById('story-counter');
  // ... (이하 중간 DOM 변수 선언 생략, 기존 코드 그대로 유지) ...


  // --- Counter Stats ---
  const updateStats = () => {
    storyCounter.textContent = `사연: ${stories.length}개`;
  };

  // --- Sticky Note Rendering --- (기존 코드 유지)
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

    note.addEventListener('click', () => openDetailModal(story));
    notesGrid.appendChild(note);
    lucide.createIcons();
  };

  const renderAllNotes = () => {
    notesGrid.innerHTML = '';
    stories.forEach(story => renderNote(story));
    updateStats();
  };

  // HTML Escape 헬퍼 (기존 코드 유지)
  const escapeHTML = (str) => { /* ... 기존과 동일 ... */ };

  // 상세 모달 열기 (기존 코드 유지)
  const openDetailModal = (story) => { /* ... 기존과 동일 ... */ };


  // --- 단일 사연 삭제 구현 (Firestore 적용) ---
  btnDeleteStory.addEventListener('click', () => {
    if (!activeStoryId) return;
    pendingDeleteStoryId = activeStoryId;
    showModal(modalConfirm);
  });

  btnConfirmYes.addEventListener('click', async () => {
    if (!pendingDeleteStoryId) return;

    const noteEl = document.getElementById(`note-${pendingDeleteStoryId}`);
    if (noteEl) {
      noteEl.style.transform = 'scale(0) rotate(20deg)';
      noteEl.style.opacity = '0';
    }

    try {
      // localStorage 필터 대신 Firestore 문서 삭제 명령 수행
      await collectionRef.doc(pendingDeleteStoryId).delete();
      
      setTimeout(() => {
        hideModal(modalConfirm);
        hideModal(modalDetail);
        detailLpPanel.classList.remove('active');
        pendingDeleteStoryId = null;
        // renderAllNotes()는 실시간 리스너(onSnapshot)가 자동으로 실행해 주므로 지워도 됩니다.
      }, 300);
    } catch (error) {
      alert("사연 삭제에 실패했습니다: " + error.message);
    }
  });

  // --- 칠판 전체 비우기 (Firestore 적용) ---
  btnClearBoard.addEventListener('click', async () => {
    if (confirm('칠판의 모든 사연과 기록을 지우개로 깨끗이 지우시겠습니까?\n(온라인 데이터베이스가 완전히 초기화됩니다.)')) {
      
      const notes = document.querySelectorAll('.chalk-sticky-note');
      notes.forEach((note, index) => {
        setTimeout(() => {
          note.style.transform = 'scale(0) translateY(40px)';
          note.style.opacity = '0';
        }, index * 80);
      });

      try {
        // Firestore는 컬렉션 통째 삭제를 클라이언트 단에서 권장하지 않으므로, 반복문으로 모든 문서 삭제
        const snapshot = await collectionRef.get();
        const batch = db.batch();
        
        snapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        // 배치 작업으로 한 번에 데이터 전송 처리
        await batch.commit();
      } catch (error) {
        console.error("전체 삭제 오류:", error);
      }
    }
  });

  // ... (중간 모달 제어 및 포탈/로그인 이벤트는 기존 코드 그대로 유지) ...


  // --- 새 사연 등록 시 종이비행기 비행 후 Firestore 저장 ---
  storyForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nickname = inputNickname.value.trim();
    const story = inputStory.value.trim();
    const song = inputSong.value.trim();

    if (!nickname || !story || !song) return;

    const surfaceRect = chalkboard.getBoundingClientRect();
    const paperRect = storyFormPaper.getBoundingClientRect();

    const startX = paperRect.left + (paperRect.width / 2) - surfaceRect.left;
    const startY = paperRect.top + (paperRect.height / 2) - surfaceRect.top;

    const endXPercent = Math.random() * 70 + 10;
    const endYPercent = Math.random() * 60 + 12;
    
    const endX = (endXPercent / 100) * surfaceRect.width;
    const endY = (endYPercent / 100) * surfaceRect.height;
    
    const randomRotation = Math.floor(Math.random() * 14) - 7;

    storyFormPaper.classList.add('folding-prep');
    
    setTimeout(() => {
      storyFormPaper.classList.add('fold-collapse');
    }, 300);

    // 비행기 애니메이션 시작
    setTimeout(() => {
      createPaperAirplaneFlight(startX, startY, endX, endY, async () => {
        createChalkDustPuff(endX, endY);

        // [핵심 변경] 새 사연 객체를 만들어 Firestore에 비동기로 추가합니다.
        const newStoryData = {
          nickname,
          story,
          song,
          x: endXPercent,
          y: endYPercent,
          rotation: randomRotation,
          createdAt: firebase.firestore.FieldValue.serverTimestamp() // 생성 시간순 정렬 필요 시 활용
        };

        try {
          await collectionRef.add(newStoryData);
        } catch (err) {
          alert("데이터 저장 실패: " + err.message);
        }

        // UI 클린업 작업
        hideModal(modalWrite);
        storyFormPaper.classList.remove('folding-prep', 'fold-collapse');
        storyForm.reset();
      });
    }, 700);
  });

  // ... (비행기, 먼지 효과 이펙트 함수 기존 유지) ...

  // --- Initial Launch Setup ---
  // 로컬 로딩 함수 대신 Firebase 실시간 리스너를 실행합니다.
  listenToStories();
});
