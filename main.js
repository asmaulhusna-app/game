let pairCount = 3;
let selected = [], matched = [], currentRound = [];
let attempts = 0, totalAttempts = 0, roundsCompleted = 0, accuracyCounter = 0;

const grid = document.getElementById('game-grid');
const gallery = document.getElementById('gallery');

function shuffle(arr) {
  return arr.map(x => ({ x, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .map(a => a.x);
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  const isDhul = item.translit === 'Dhul-Jalali wal-Ikram';

  if (item.type === 'name') {
    card.innerHTML = `
      <div class="arabic ${isDhul ? 'small-arabic' : ''}">${item.arabic}</div>
      <div class="translit ${isDhul ? 'small-translit' : ''}">${item.translit}</div>
    `;
  } else {
    card.innerHTML = `<div>${item.meaning}</div>`;
  }

  card.onclick = () => handleClick(item, card);
  return card;
}

// Универсальное закрытие попапа с анимацией
function closePopup(popupId) {
  const popup = document.getElementById(popupId);
  if (!popup) return;

  popup.classList.add('hide');

  setTimeout(() => {
    popup.classList.add('hidden');
    popup.classList.remove('hide');
  }, 300); // должен совпадать с CSS-анимацией
}

function renderGameRound() {
  grid.innerHTML = '';
  selected = [];
  matched = [];
  attempts = 0;

  const chosen = shuffle([...names]).slice(0, pairCount);
  currentRound = shuffle([
    ...chosen.map(n => ({ ...n, type: 'name' })),
    ...chosen.map(n => ({ ...n, type: 'meaning' }))
  ]);

  currentRound.forEach(item => grid.appendChild(createCard(item)));
}

function handleClick(item, el) {
  if (el.classList.contains('matched')) return;

  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selected = selected.filter(s => s.el !== el);
    return;
  }

  el.classList.add('selected');
  selected.push({ item, el });

  if (selected.length === 2) {
    attempts++;
    totalAttempts++;

    const [a, b] = selected;
    const isMatch = a.item.translit === b.item.translit && a.item.type !== b.item.type;

    if (isMatch) {
      [a.el, b.el].forEach(e => {
        e.classList.remove('selected');
        e.classList.add('matched');
        // Force reflow (чтобы точно перерисовалось)
        void e.offsetWidth;
      });
      
      matched.push(a.item.translit);
      if (matched.length === pairCount) {
        setTimeout(onRoundComplete, 600);
      }
    } else {
      setTimeout(() => {
        [a.el, b.el].forEach(e => e.classList.remove('selected'));
      }, 600);
    }

    selected = [];
  }
}

function onRoundComplete() {
  roundsCompleted++;
  accuracyCounter++;
  localStorage.setItem('roundsCompleted', roundsCompleted);
  document.getElementById('round-counter').textContent = roundsCompleted;

  if (accuracyCounter >= 3) {
    const percent = Math.round((9 / totalAttempts) * 100);
    document.getElementById('accuracy-text').textContent =
      `🎯 Ваша аккуратность: ${percent}% (${totalAttempts} попыток на 9 совпадений)`;
    document.getElementById('accuracy-popup').classList.remove('hidden');
    accuracyCounter = 0;
    totalAttempts = 0;
  } else {
    renderGameRound();
  }
}

// закрытие accuracy popup с анимацией
function closeAccuracyPopup() {
  closePopup('accuracy-popup');
  renderGameRound();
}

// закрытие detail popup с анимацией
function closeDetailPopup() {
  closePopup('detail-popup');
}

function createGalleryItem(n, index) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.innerHTML = `
    <div class="arabic">${n.arabic}</div>
    <div><strong>${index + 1}. <span class="translit">${n.translit}</span></strong></div>
    <div class="meaning">${n.meaning}</div>
    <div class="description">${n.desc || ''}</div>
  `;
  item.onclick = () => showDetailPopup(n);
  return item;
}

function renderGallery() {
  gallery.innerHTML = `
    <div class="gallery-content" id="gallery-content">
      <input type="text" id="gallery-search" placeholder="Поиск..." class="gallery-search">
    </div>
  `;
  const container = document.getElementById('gallery-content');
  names.forEach((n, i) => {
    container.appendChild(createGalleryItem(n, i));
  });

  // 🎯 Подключаем поиск
  setupGallerySearch();
}

function setupGallerySearch() {
  const searchInput = document.getElementById('gallery-search');

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const items = document.querySelectorAll('.gallery-item');

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? '' : 'none';
    });
  });
}


let isAnimating = false;

function toggleGallery() {
  const g = document.getElementById('gallery');

  // Если сейчас в процессе анимации — игнорируем клик
  if (isAnimating) return;

  const isVisible = g.classList.contains('visible');

  if (isVisible) {
    isAnimating = true;
    g.classList.remove('visible');

    const onEnd = (e) => {
      if (e.propertyName === 'opacity') {
        g.classList.remove('showing');
        g.removeEventListener('transitionend', onEnd);
        isAnimating = false;
      }
    };

    g.addEventListener('transitionend', onEnd);
  } else {
    g.classList.add('showing');
    // Дать время на отрисовку перед добавлением visible
    requestAnimationFrame(() => {
      isAnimating = true;
      g.classList.add('visible');

      const onEnd = (e) => {
        if (e.propertyName === 'opacity') {
          g.removeEventListener('transitionend', onEnd);
          isAnimating = false;
        }
      };

      g.addEventListener('transitionend', onEnd);
    });
  }
}


function showDetailPopup(obj) {
  document.getElementById('detail-title').innerHTML =
    `<span class="detail-arabic">${obj.arabic}</span><br>
     <span class="detail-translit">${obj.translit}</span><br>
     <span class="detail-meaning">${obj.meaning}</span>`;
  document.getElementById('detail-text').textContent =
    obj.details || 'Нет подробного описания.';
  document.getElementById('detail-popup').classList.remove('hidden');
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function changePairCount(delta) {
  const min = 2, max = 12;
  const next = pairCount + delta;
  if (next >= min && next <= max) {
    pairCount = next;
    document.getElementById('pair-count-display').textContent = pairCount;
    renderGameRound();
  }
}

function toggleFloating() {
  const panel = document.getElementById('pair-controls');
  panel.classList.toggle('hidden-mobile');
  const toggle = panel.querySelector('.floating-toggle');
  toggle.textContent = panel.classList.contains('hidden-mobile') ? '->' : '<-';
}

(function init() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }

  roundsCompleted = parseInt(localStorage.getItem('roundsCompleted')) || 0;
  document.getElementById('round-counter').textContent = roundsCompleted;

  renderGameRound();
  renderGallery();
})();
