'use strict';
function parseChecks(raw){const tokens=raw.trim().split(/[\s,;]+/).filter(Boolean);if(!tokens.length)throw Error('Enter at least one time, such as 08:15.');if(tokens.length>100)throw Error('Use at most 100 check times from one day.');
return tokens.map(t=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))throw Error('Use 24-hour HH:MM times. Check: '+t.slice(0,24));return Number(t.slice(0,2))*60+Number(t.slice(3));}).sort((a,b)=>a-b);}
function analyzeChecks(times) {
  const hours = Array(24).fill(0);
  for (const time of times) hours[Math.floor(time / 60)]++;
  const candidates = [...new Set(times.map(time => Math.min(time, 1380)))].sort((a, b) => a - b);
  let maxCount = 0;
  let starts = [];
  for (const start of candidates) {
    const count = times.filter(time => time >= start && time < start + 60).length;
    if (count > maxCount) { maxCount = count; starts = []; }
    if (count === maxCount) starts.push(start);
  }
  return {hours, starts, count: maxCount, total: times.length};
}
function clock(minutes) {
  return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
}
const $ = id => document.getElementById(id);
function windowLabel(start) { return clock(start) + '–' + clock(start + 60); }
function showAction(start) {
  $('action').textContent = 'For ' + windowLabel(start) + ', choose one app you would like to protect and one reason you would open a timed Pass. Keep essential apps reachable. Compare another day before treating this as a routine.';
}
function clear() {
  $('result').hidden = true;
  $('summary').textContent = $('action').textContent = $('error').textContent = '';
  $('bars').replaceChildren();
  if ($('peak-choice')) $('peak-choice').replaceChildren();
  if ($('peak-options')) $('peak-options').hidden = true;
}
function drawBars(hours) {
  const maximum = Math.max(...hours);
  hours.forEach((count, hour) => {
    const row = document.createElement('div'), label = document.createElement('span');
    const track = document.createElement('div'), fill = document.createElement('div'), value = document.createElement('span');
    row.className = 'bar-row'; track.className = 'track'; fill.className = 'fill';
    label.textContent = clock(hour * 60); value.textContent = String(count);
    fill.style.width = (100 * count / maximum) + '%';
    track.append(fill); row.append(label, track, value); $('bars').append(row);
  });
}
function run(event) {
  event.preventDefault(); clear();
  let analysis;
  try { analysis = analyzeChecks(parseChecks($('times').value)); }
  catch (error) { $('error').textContent = error.message; $('times').focus(); return; }
  const {starts, count, total, hours} = analysis;
  const percentage = Math.round(count / total * 100);
  const coverage = count + (count === 1 ? ' check' : ' checks') + ' (' + percentage + '% of the log)';
  const summary = starts.length === 1
    ? 'The busiest tested window is ' + windowLabel(starts[0]) + ' with ' + coverage + '.'
    : starts.length + ' candidate windows tie for busiest, each with ' + coverage + '.';
  $('summary').textContent = total + (total === 1 ? ' logged check. ' : ' logged checks. ') + summary;
  if ($('peak-choice') && starts.length > 1) {
    for (const start of starts) $('peak-choice').add(new Option(windowLabel(start), String(start)));
    $('peak-options').hidden = false;
  }
  showAction(starts[0]); drawBars(hours); $('result').hidden = false; $('summary').focus();
}
$('peak-choice')?.addEventListener('change', event => showAction(Number(event.target.value)));
$('check-form').addEventListener('submit', run);
$('times').addEventListener('input', clear);
$('example').addEventListener('click', () => {
  $('times').value = '08:15, 12:05, 17:30, 20:50, 21:02, 21:08, 21:12, 21:20, 21:40, 22:15';
  clear();
});
$('reset').addEventListener('click', () => { $('times').value = ''; clear(); $('times').focus(); });
