export const BOARDS = Object.freeze([
  Object.freeze([1, 7, 13, 18, 24]),
  Object.freeze([3, 9, 11, 17, 22])
]);

export function scoreRound(targetIndexes, selectedIndexes, cellCount = 25) {
  const targets = new Set(targetIndexes);
  const selected = new Set(selectedIndexes);
  if (cellCount < 1 || [...targets, ...selected].some(index => !Number.isInteger(index) || index < 0 || index >= cellCount)) {
    throw new RangeError('Cell indexes must be integers within the board.');
  }
  const hits = [...selected].filter(index => targets.has(index)).length;
  return {
    hits,
    missed: targets.size - hits,
    extraTaps: [...selected].filter(index => !targets.has(index)).length,
    selected: selected.size,
    targets: targets.size
  };
}

export function compareRounds(first, second) {
  return {
    hitDifference: second.hits - first.hits,
    missedDifference: second.missed - first.missed,
    extraTapDifference: second.extraTaps - first.extraTaps
  };
}

function describeDifference(value, label) {
  if (value === 0) return `The two rounds had the same number of ${label}.`;
  return `Round 2 had ${Math.abs(value)} ${value > 0 ? 'more' : 'fewer'} ${label} than round 1.`;
}

function start() {
  const board = document.querySelector('#search-board');
  const instruction = document.querySelector('#search-instruction');
  const check = document.querySelector('#search-check');
  const next = document.querySelector('#search-next');
  const reset = document.querySelector('#search-reset');
  const result = document.querySelector('#search-result');
  if (!board || !instruction || !check || !next || !reset || !result) return;

  let round = 0;
  let locked = false;
  const recorded = [];

  function renderBoard() {
    locked = false;
    board.replaceChildren();
    for (let index = 0; index < 25; index += 1) {
      const target = BOARDS[round].includes(index);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'search-cell';
      cell.textContent = target ? '◆' : '◇';
      cell.dataset.index = String(index);
      cell.setAttribute('aria-pressed', 'false');
      cell.setAttribute('aria-label', `Row ${Math.floor(index / 5) + 1}, column ${index % 5 + 1}: ${target ? 'filled' : 'outlined'} diamond`);
      cell.addEventListener('click', () => {
        if (locked) return;
        cell.setAttribute('aria-pressed', cell.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
      board.append(cell);
    }
    instruction.innerHTML = `<strong>Round ${round + 1} of 2.</strong> Select each filled diamond (◆). Leave outlined diamonds (◇) unselected.`;
    check.textContent = `Check round ${round + 1}`;
    check.hidden = false;
    next.hidden = true;
    result.innerHTML = '<p>Select the filled diamonds, then check the round.</p>';
  }

  function selectedIndexes() {
    return [...board.querySelectorAll('.search-cell[aria-pressed="true"]')].map(cell => Number(cell.dataset.index));
  }

  check.addEventListener('click', () => {
    if (locked) return;
    const score = scoreRound(BOARDS[round], selectedIndexes());
    recorded[round] = score;
    locked = true;
    board.querySelectorAll('.search-cell').forEach(cell => { cell.disabled = true; });
    result.innerHTML = `<p><strong>Round ${round + 1}:</strong> ${score.hits} correct finds, ${score.missed} missed targets, and ${score.extraTaps} extra taps.</p>`;
    check.hidden = true;
    if (round === 0) {
      next.hidden = false;
    } else {
      const comparison = compareRounds(recorded[0], recorded[1]);
      result.insertAdjacentHTML('beforeend',
        `<p>${describeDifference(comparison.hitDifference, 'correct finds')} ${describeDifference(comparison.extraTapDifference, 'extra taps')}</p>` +
        '<p class="small">These counts describe two small boards, not your age, health, intelligence or everyday attention. Familiarity with the instructions can affect a second attempt.</p>');
    }
  });

  next.addEventListener('click', () => {
    round = 1;
    renderBoard();
    board.querySelector('.search-cell')?.focus();
  });

  reset.addEventListener('click', () => {
    round = 0;
    recorded.length = 0;
    renderBoard();
    result.scrollIntoView({block: 'nearest'});
  });

  renderBoard();
}

if (typeof document !== 'undefined') start();
