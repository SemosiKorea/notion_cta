(function () {
  'use strict';

  const STORAGE_KEY = 'semosikorea.review.v1';
  const CARD_SELECTOR = '.question-card, .qc, .quiz-card';
  const FILE_NAME = decodeURIComponent((location.pathname.split('/').pop() || 'index.html'));
  const FILE_KEY = FILE_NAME.replace(/\.html$/i, '');

  if (!/OX퀴즈/i.test(FILE_NAME) && !document.querySelector(CARD_SELECTOR)) return;

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        version: 1,
        updatedAt: parsed.updatedAt || null,
        items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {}
      };
    } catch (_error) {
      return { version: 1, updatedAt: null, items: {} };
    }
  }

  function writeStore(store) {
    store.version = 1;
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function padQuestionNo(value) {
    return String(value).padStart(3, '0');
  }

  function normalizeAnswer(value) {
    if (value === true || value === 'true') return 'O';
    if (value === false || value === 'false') return 'X';
    const text = String(value || '').trim().toUpperCase();
    if (text === 'O' || text === '○') return 'O';
    if (text === 'X' || text === '×') return 'X';
    return '';
  }

  function textOf(element) {
    return (element && element.textContent ? element.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function getQuestionNo(card, index) {
    const explicit = card.dataset.questionNo || card.dataset.semosiQuestionNo;
    if (explicit) return Number(explicit);

    const node = card.querySelector('.question-no, .qn, .sn');
    if (node) {
      const match = textOf(node).match(/\d+/);
      if (match) return Number(match[0]);
    }

    const idMatch = (card.id || '').match(/\d+/);
    if (idMatch) return Number(idMatch[0]);

    return index + 1;
  }

  function getQuestionText(card) {
    const node = card.querySelector('.question-text, .quiz-q, .qt, .qh');
    const value = textOf(node || card);
    return value.slice(0, 420);
  }

  function getLaw(card) {
    const value = textOf(card.querySelector('.law-badge, .law-ref'));
    if (value) return value.slice(0, 80);
    const id = FILE_KEY.split('_');
    return id.length >= 3 ? id.slice(0, 3).join('_') : FILE_KEY;
  }

  function getTopic(card) {
    return textOf(card.querySelector('.topic-badge')).slice(0, 80);
  }

  function getAnswerFromButton(button) {
    if (!button || button.tagName !== 'BUTTON') return '';
    if (button.dataset.value) return normalizeAnswer(button.dataset.value);
    if (button.dataset.v) return normalizeAnswer(button.dataset.v);
    const text = textOf(button);
    if (/^(O|○)$/.test(text)) return 'O';
    if (/^(X|×)$/.test(text)) return 'X';
    return '';
  }

  function isCheckButton(button) {
    if (!button || button.tagName !== 'BUTTON') return false;
    const text = textOf(button);
    if (/전체|모두|다시|처음|해설|인쇄|오답만/.test(text)) return false;
    return button.classList.contains('check-btn') ||
      button.classList.contains('bck') ||
      /정답\s*확인|채점/.test(text);
  }

  function getResult(card) {
    if (card.dataset.correct === 'true') return true;
    if (card.dataset.correct === 'false') return false;
    if (card.classList.contains('correct')) return true;
    if (card.classList.contains('wrong')) return false;

    const negative = card.querySelector('.result-badge.ng, .rb.ng, .quiz-answer.show');
    const positive = card.querySelector('.result-badge.ok, .rb.ok, .quiz-answer.show');
    const negativeText = textOf(negative);
    const positiveText = textOf(positive);

    if (/오답|✗|틀림/.test(negativeText)) return false;
    if (/정답|✓|맞음/.test(positiveText)) return true;
    return null;
  }

  function getSelectedAnswer(card) {
    if (card.dataset.semosiSelected) return card.dataset.semosiSelected;

    const selectedButton = card.querySelector(
      '.ox-btn.selected-o, .ox-btn.selected-x, .oxb.so, .oxb.sx, .oxb.selected-o, .oxb.selected-x'
    );
    const selected = getAnswerFromButton(selectedButton);
    return selected || '';
  }

  function getConfidence(card) {
    const checked = card.querySelector('[data-semosi-confidence]:checked');
    return checked ? checked.value : '';
  }

  function confidenceLabel(value) {
    return ({
      confident: '확실함',
      unsure: '애매함',
      guess: '추측'
    })[value] || '미선택';
  }

  function isNeedsReview(record) {
    return record.correct === false || record.confidence === 'unsure' || record.confidence === 'guess';
  }

  function updateCardStatus(card, record) {
    const status = card.querySelector('[data-semosi-status]');
    if (!status) return;

    if (!record) {
      status.textContent = '아직 저장된 학습기록이 없습니다.';
      status.className = 'semosi-review-status';
      return;
    }

    const state = record.needsReview ? 'review' : 'done';
    const result = record.correct === true ? '정답' : record.correct === false ? '오답' : '기록';
    const confidence = confidenceLabel(record.confidence);
    status.textContent = record.needsReview
      ? `저장됨 · ${result} · ${confidence} · 복습대상`
      : `저장됨 · ${result} · ${confidence}`;
    status.className = `semosi-review-status ${state}`;
  }

  function buildRecord(card) {
    const correct = getResult(card);
    const selected = getSelectedAnswer(card);

    if (correct === null || !selected) return null;

    const qNo = Number(card.dataset.semosiQuestionNo || 0);
    const confidence = getConfidence(card);
    const record = {
      id: card.dataset.questionId,
      file: FILE_NAME,
      questionNo: qNo,
      selected,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      correct,
      needsReview: false,
      law: getLaw(card),
      topic: getTopic(card),
      text: getQuestionText(card),
      answeredAt: new Date().toISOString()
    };
    record.needsReview = isNeedsReview(record);
    return record;
  }

  function persistCard(card) {
    if (!card || !card.dataset.questionId) return;
    const record = buildRecord(card);
    if (!record) return;

    const store = readStore();
    store.items[record.id] = record;
    writeStore(store);
    updateCardStatus(card, record);
  }

  function restoreCard(card) {
    const store = readStore();
    const record = store.items[card.dataset.questionId];
    if (record && record.confidence) {
      const input = card.querySelector(`[data-semosi-confidence][value="${record.confidence}"]`);
      if (input) input.checked = true;
    }
    updateCardStatus(card, record || null);
  }

  function makeReviewUI(card) {
    const wrap = document.createElement('div');
    wrap.className = 'semosi-review';
    wrap.dataset.semosiReviewUi = '1';
    const groupName = `semosi-confidence-${FILE_KEY}-${card.dataset.semosiQuestionNo}`;
    wrap.innerHTML = [
      '<div class="semosi-review-label">확신도</div>',
      '<div class="semosi-confidence-group" role="radiogroup" aria-label="확신도 기록">',
      `<label><input type="radio" name="${groupName}" value="confident" data-semosi-confidence><span>확실함</span></label>`,
      `<label><input type="radio" name="${groupName}" value="unsure" data-semosi-confidence><span>애매함</span></label>`,
      `<label><input type="radio" name="${groupName}" value="guess" data-semosi-confidence><span>추측</span></label>`,
      '</div>',
      '<span class="semosi-review-status" data-semosi-status>아직 저장된 학습기록이 없습니다.</span>'
    ].join('');

    const anchor = card.querySelector('.answer-row, .qa, .quiz-answer, .question-body, .qbd, .quiz-options');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    } else {
      card.appendChild(wrap);
    }
  }

  function isQuestionCard(card) {
    if (!card || card.dataset.semosiEnhanced === '1') return false;
    return Boolean(card.querySelector('button') && (
      card.querySelector('.ox-btn, .oxb, .quiz-options button') ||
      Array.from(card.querySelectorAll('button')).some(getAnswerFromButton)
    ));
  }

  function enhanceCards() {
    const cards = Array.from(document.querySelectorAll(CARD_SELECTOR));
    cards.forEach((card, index) => {
      if (!isQuestionCard(card)) return;

      const qNo = getQuestionNo(card, index);
      const qId = `${FILE_KEY}::q${padQuestionNo(qNo)}`;
      card.dataset.semosiEnhanced = '1';
      card.dataset.semosiQuestionNo = String(qNo);
      card.dataset.questionId = qId;
      card.setAttribute('data-question-id', qId);

      makeReviewUI(card);
      restoreCard(card);
    });
  }

  function injectStyles() {
    if (document.getElementById('semosi-review-style')) return;
    const style = document.createElement('style');
    style.id = 'semosi-review-style';
    style.textContent = `
      .semosi-review{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin:.55rem 1rem .75rem;padding:.55rem .65rem;border:1px solid rgba(92,61,17,.16);border-radius:8px;background:rgba(255,253,249,.88);font-size:.75rem;color:#6b5d4a}
      .semosi-review-label{font-weight:800;color:#4f402f}
      .semosi-confidence-group{display:flex;align-items:center;gap:.3rem;flex-wrap:wrap}
      .semosi-confidence-group label{display:inline-flex;align-items:center;gap:.24rem;border:1px solid rgba(92,61,17,.22);border-radius:999px;background:#fffdf9;color:#4f402f;padding:.22rem .52rem;cursor:pointer;line-height:1.2;transition:background .14s,border-color .14s,color .14s}
      .semosi-confidence-group label:hover{border-color:rgba(92,61,17,.45);background:#fff8ed}
      .semosi-confidence-group input{accent-color:#5c3d11;margin:0}
      .semosi-confidence-group label:has(input:checked){border-color:#5c3d11;background:#efe5d6;color:#2b2115;font-weight:800}
      .semosi-review-status{color:#85745f}
      .semosi-review-status.done{color:#176b3a;font-weight:700}
      .semosi-review-status.review{color:#9b2335;font-weight:700}
      @media print{.semosi-review{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function handleAnswerClick(button) {
    const card = button.closest(CARD_SELECTOR);
    const answer = getAnswerFromButton(button);
    if (!card || !answer) return;

    card.dataset.semosiSelected = answer;
    setTimeout(() => persistCard(card), 20);
  }

  function handleCheckClick(button) {
    const card = button.closest(CARD_SELECTOR);
    if (!card) return;
    setTimeout(() => persistCard(card), 40);
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const answer = getAnswerFromButton(button);
      if (answer) {
        handleAnswerClick(button);
        return;
      }

      if (isCheckButton(button)) handleCheckClick(button);
    });

    document.addEventListener('change', (event) => {
      if (!event.target.matches('[data-semosi-confidence]')) return;
      const card = event.target.closest(CARD_SELECTOR);
      if (!card) return;
      persistCard(card);
      const store = readStore();
      updateCardStatus(card, store.items[card.dataset.questionId] || null);
    });
  }

  function observeDynamicQuiz() {
    let timer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(enhanceCards, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  onReady(() => {
    injectStyles();
    enhanceCards();
    bindEvents();
    observeDynamicQuiz();
  });
})();
