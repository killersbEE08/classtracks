/* =========================================================
   ClassTrack Guides — interactive tools
   Every widget is feature-detected, so this file is a safe
   no-op on pages that do not contain a given tool.
   ========================================================= */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function num(el) { var v = parseFloat(el && el.value); return isNaN(v) ? 0 : v; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function setBar(bar, pct) { if (bar && bar.firstElementChild) bar.firstElementChild.style.width = clamp(pct, 0, 100) + "%"; }

  /* ---------- 1. Attendance percentage calculator ---------- */
  (function () {
    var root = $("#attnCalc");
    if (!root) return;
    var attended = $("#attnAttended", root);
    var total = $("#attnTotal", root);
    var res = $("#attnResult", root);
    var bar = $("#attnBar", root);
    var big = res.querySelector(".big");
    var sub = res.querySelector(".sub");

    function calc() {
      var a = Math.max(0, num(attended));
      var t = Math.max(0, num(total));
      if (t <= 0) { big.textContent = "—"; sub.textContent = "Enter your attended and total classes to see your percentage."; res.dataset.state = ""; setBar(bar, 0); return; }
      if (a > t) { big.textContent = "—"; sub.textContent = "Attended classes cannot be more than total classes."; res.dataset.state = "bad"; setBar(bar, 0); return; }
      var pct = (a / t) * 100;
      big.textContent = pct.toFixed(2) + "%";
      res.dataset.state = pct >= 75 ? "good" : "bad";
      sub.textContent = pct >= 75
        ? "You are above the usual 75% requirement. Keep it up."
        : "Below the usual 75% requirement — attend the next few classes to recover.";
      setBar(bar, pct);
    }
    [attended, total].forEach(function (e) { e.addEventListener("input", calc); });
    calc();
  })();

  /* ---------- 2. Bunk calculator ---------- */
  (function () {
    var root = $("#bunkCalc");
    if (!root) return;
    var attended = $("#bunkAttended", root);
    var total = $("#bunkTotal", root);
    var target = $("#bunkTarget", root);
    var res = $("#bunkResult", root);
    var bar = $("#bunkBar", root);
    var big = res.querySelector(".big");
    var sub = res.querySelector(".sub");

    function calc() {
      var a = Math.max(0, Math.floor(num(attended)));
      var t = Math.max(0, Math.floor(num(total)));
      var goal = clamp(num(target), 1, 99);
      if (t <= 0 || a > t) {
        big.textContent = "—";
        sub.textContent = a > t ? "Attended classes cannot exceed classes held." : "Enter classes attended, classes held and your target.";
        res.dataset.state = ""; setBar(bar, 0); return;
      }
      var pct = (a / t) * 100;
      var g = goal / 100;
      setBar(bar, pct);
      if (pct >= goal) {
        // How many future classes can be skipped: attended / (total + x) >= g  ->  x <= attended/g - total
        var canSkip = Math.floor(a / g - t);
        canSkip = Math.max(0, canSkip);
        big.textContent = "Skip " + canSkip + " class" + (canSkip === 1 ? "" : "es");
        sub.textContent = "You are at " + pct.toFixed(1) + "%. You can miss " + canSkip + " upcoming class" + (canSkip === 1 ? "" : "es") + " and stay at or above " + goal + "%.";
        res.dataset.state = "good";
      } else {
        // How many must attend in a row: (attended + x)/(total + x) >= g  ->  x >= (g*total - attended)/(1 - g)
        var mustAttend = Math.ceil((g * t - a) / (1 - g));
        mustAttend = Math.max(0, mustAttend);
        big.textContent = "Attend " + mustAttend + " more";
        sub.textContent = "You are at " + pct.toFixed(1) + "%. Attend the next " + mustAttend + " class" + (mustAttend === 1 ? "" : "es") + " in a row to reach " + goal + "%.";
        res.dataset.state = "bad";
      }
    }
    [attended, total, target].forEach(function (e) { e.addEventListener("input", calc); });
    calc();
  })();

  /* ---------- 3. GPA calculator ---------- */
  (function () {
    var root = $("#gpaCalc");
    if (!root) return;
    var rows = $("#gpaRows", root);
    var addBtn = $("#gpaAdd", root);
    var scaleSel = $("#gpaScale", root);
    var res = $("#gpaResult", root);
    var big = res.querySelector(".big");
    var sub = res.querySelector(".sub");

    var GRADES_4 = [
      ["A / A+ (4.0)", 4.0], ["A- (3.7)", 3.7], ["B+ (3.3)", 3.3], ["B (3.0)", 3.0],
      ["B- (2.7)", 2.7], ["C+ (2.3)", 2.3], ["C (2.0)", 2.0], ["D (1.0)", 1.0], ["F (0.0)", 0.0]
    ];
    var GRADES_10 = [
      ["O (10)", 10], ["A+ (9)", 9], ["A (8)", 8], ["B+ (7)", 7],
      ["B (6)", 6], ["C (5)", 5], ["P (4)", 4], ["F (0)", 0]
    ];

    function gradeOptions() {
      var list = scaleSel.value === "10" ? GRADES_10 : GRADES_4;
      return list.map(function (g) { return '<option value="' + g[1] + '">' + g[0] + "</option>"; }).join("");
    }

    function addRow(name) {
      var row = document.createElement("div");
      row.className = "gpa-row";
      row.innerHTML =
        '<input type="text" class="gpa-name" placeholder="' + (name || "Course name") + '" aria-label="Course name" />' +
        '<select class="gpa-grade" aria-label="Grade">' + gradeOptions() + "</select>" +
        '<input type="number" class="gpa-credits" min="0" step="0.5" value="3" aria-label="Credits" />' +
        '<button type="button" class="gpa-del" aria-label="Remove course">&times;</button>';
      rows.appendChild(row);
      row.querySelector(".gpa-del").addEventListener("click", function () { row.remove(); calc(); });
      $$("input, select", row).forEach(function (el) { el.addEventListener("input", calc); });
    }

    function calc() {
      var max = scaleSel.value === "10" ? 10 : 4;
      var totalPoints = 0, totalCredits = 0;
      $$(".gpa-row", rows).forEach(function (r) {
        var g = parseFloat(r.querySelector(".gpa-grade").value);
        var c = parseFloat(r.querySelector(".gpa-credits").value);
        if (isNaN(c) || c < 0) c = 0;
        if (!isNaN(g)) { totalPoints += g * c; totalCredits += c; }
      });
      if (totalCredits <= 0) { big.textContent = "—"; sub.textContent = "Add your courses, grades and credits to see your GPA."; res.dataset.state = ""; return; }
      var gpa = totalPoints / totalCredits;
      big.textContent = gpa.toFixed(2) + " / " + max;
      var good = gpa >= (max === 10 ? 7.5 : 3.0);
      res.dataset.state = good ? "good" : "";
      sub.textContent = "Based on " + totalCredits + " credit" + (totalCredits === 1 ? "" : "s") + " across " + $$(".gpa-row", rows).length + " course" + ($$(".gpa-row", rows).length === 1 ? "" : "s") + ".";
    }

    scaleSel.addEventListener("change", function () {
      $$(".gpa-row", rows).forEach(function (r) {
        var sel = r.querySelector(".gpa-grade");
        sel.innerHTML = gradeOptions();
      });
      calc();
    });
    addBtn.addEventListener("click", function () { addRow(); });

    // Seed with two example rows
    addRow("Mathematics");
    addRow("Physics");
    calc();
  })();

  /* ---------- 4. Progress checklists (planner / assignments / study) ---------- */
  $$(".checklist[data-progress]").forEach(function (list) {
    var targetSel = list.getAttribute("data-progress");
    var out = targetSel ? document.querySelector(targetSel) : null;
    var boxes = $$('input[type="checkbox"]', list);
    function update() {
      var done = 0;
      boxes.forEach(function (b) {
        var li = b.closest("li");
        if (b.checked) { done++; if (li) li.classList.add("done"); }
        else if (li) li.classList.remove("done");
      });
      if (out) {
        var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
        var big = out.querySelector(".big"); var sub = out.querySelector(".sub"); var bar = out.querySelector(".tool__bar");
        if (big) big.textContent = done + " / " + boxes.length + " done";
        if (sub) sub.textContent = pct === 100 ? "All set. You are fully on track." : pct + "% complete — keep going.";
        if (bar) setBar(bar, pct);
        out.dataset.state = pct === 100 ? "good" : "";
      }
    }
    boxes.forEach(function (b) { b.addEventListener("change", update); });
    update();
  });

  /* ---------- 5. Exam / deadline countdown ---------- */
  (function () {
    var root = $("#dateCalc");
    if (!root) return;
    var dateIn = $("#dateTarget", root);
    var res = $("#dateResult", root);
    var big = res.querySelector(".big");
    var sub = res.querySelector(".sub");
    function calc() {
      if (!dateIn.value) { big.textContent = "—"; sub.textContent = "Pick your exam or deadline date."; res.dataset.state = ""; return; }
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var target = new Date(dateIn.value + "T00:00:00");
      var days = Math.round((target - today) / 86400000);
      if (days > 0) {
        var weeks = Math.floor(days / 7), rem = days % 7;
        big.textContent = days + " day" + (days === 1 ? "" : "s") + " left";
        sub.textContent = "That is about " + weeks + " week" + (weeks === 1 ? "" : "s") + (rem ? " and " + rem + " day" + (rem === 1 ? "" : "s") : "") + " to prepare.";
        res.dataset.state = days <= 7 ? "bad" : "good";
      } else if (days === 0) {
        big.textContent = "It is today"; sub.textContent = "Deep breath — you have got this."; res.dataset.state = "bad";
      } else {
        big.textContent = Math.abs(days) + " day" + (days === -1 ? "" : "s") + " ago"; sub.textContent = "That date has already passed."; res.dataset.state = "";
      }
    }
    dateIn.addEventListener("input", calc);
    calc();
  })();

  /* ---------- 6. Study time splitter ---------- */
  (function () {
    var root = $("#studyCalc");
    if (!root) return;
    var hours = $("#studyHours", root);
    var subjects = $("#studySubjects", root);
    var res = $("#studyResult", root);
    var list = $("#studyList", root);
    var big = res.querySelector(".big");
    var sub = res.querySelector(".sub");
    function calc() {
      var h = Math.max(0, num(hours));
      var names = (subjects.value || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      list.innerHTML = "";
      if (h <= 0 || names.length === 0) { big.textContent = "—"; sub.textContent = "Enter your weekly study hours and subjects (comma separated)."; res.dataset.state = ""; return; }
      var per = h / names.length;
      // Suggest 25-minute Pomodoro blocks
      var blocks = Math.round((per * 60) / 25);
      big.textContent = per.toFixed(1) + " h / subject";
      sub.textContent = "About " + blocks + " Pomodoro block" + (blocks === 1 ? "" : "s") + " (25 min each) per subject, per week.";
      res.dataset.state = "good";
      names.forEach(function (n) {
        var li = document.createElement("li");
        li.innerHTML = "<span>" + n.replace(/[<>&]/g, "") + "</span><b>" + per.toFixed(1) + " h</b>";
        list.appendChild(li);
      });
    }
    [hours, subjects].forEach(function (e) { e.addEventListener("input", calc); });
    calc();
  })();

  /* ---------- 7. CGPA <-> Percentage converter ---------- */
  (function () {
    var root = $("#cgpaCalc");
    if (!root) return;
    var cgpa = $("#cgpaValue", root);
    var mult = $("#cgpaMult", root);
    var pct = $("#cgpaPercent", root);
    var res = $("#cgpaResult", root);
    var big = res.querySelector(".big");
    var sub = res.querySelector(".sub");

    function m() { var v = parseFloat(mult && mult.value); return (isNaN(v) || v <= 0) ? 9.5 : v; }
    function show(c, p) {
      if (isNaN(c) || isNaN(p)) { big.textContent = "—"; sub.textContent = "Enter your CGPA (or a percentage) and a multiplier."; res.dataset.state = ""; return; }
      big.textContent = "CGPA " + c.toFixed(2) + " \u2248 " + p.toFixed(2) + "%";
      sub.textContent = "Using Percentage = CGPA \u00d7 " + m() + ". Change the multiplier to match your university.";
      res.dataset.state = "good";
    }
    function fromCgpa() {
      var c = parseFloat(cgpa.value);
      if (isNaN(c)) { show(NaN, NaN); return; }
      var p = c * m();
      pct.value = p ? p.toFixed(2) : "";
      show(c, p);
    }
    function fromPct() {
      var p = parseFloat(pct.value);
      if (isNaN(p)) { show(NaN, NaN); return; }
      var c = p / m();
      cgpa.value = c ? c.toFixed(2) : "";
      show(c, p);
    }
    cgpa.addEventListener("input", fromCgpa);
    pct.addEventListener("input", fromPct);
    mult.addEventListener("input", fromCgpa);
    fromCgpa();
  })();

  /* ---------- 8. Final grade calculator ---------- */
  (function () {
    var root = $("#finalCalc");
    if (!root) return;
    var cur = $("#fgCurrent", root);
    var target = $("#fgTarget", root);
    var weight = $("#fgWeight", root);
    var res = $("#fgResult", root);
    var bar = $("#fgBar", root);
    var big = res.querySelector(".big");
    var sub = res.querySelector(".sub");

    function calc() {
      var c = num(cur), t = num(target), w = num(weight);
      if (w <= 0 || w > 100) { big.textContent = "\u2014"; sub.textContent = "Enter your current grade, target grade and the final's weight (1\u2013100%)."; res.dataset.state = ""; setBar(bar, 0); return; }
      var wd = w / 100;
      var needed = (t - c * (1 - wd)) / wd;
      setBar(bar, needed);
      if (needed <= 0) {
        big.textContent = "You've already secured it";
        sub.textContent = "Even a 0% on the final keeps you at or above " + t + "%. Anything you score is a bonus.";
        res.dataset.state = "good";
      } else if (needed > 100) {
        big.textContent = "Not reachable at " + w + "% weight";
        sub.textContent = "You'd need " + needed.toFixed(1) + "% on the final \u2014 above 100%. Aim for your best and ask your professor about extra credit or make-up options.";
        res.dataset.state = "bad";
      } else {
        big.textContent = "Score " + needed.toFixed(1) + "% on the final";
        sub.textContent = "That's what you need on a final worth " + w + "% to reach " + t + "% overall (you're at " + c + "% now).";
        res.dataset.state = needed >= 90 ? "bad" : "good";
      }
    }
    [cur, target, weight].forEach(function (e) { e.addEventListener("input", calc); });
    calc();
  })();

  /* ---------- 9. Pomodoro focus timer ---------- */
  (function () {
    var root = $("#pomodoro");
    if (!root) return;
    var disp = $("#pomoTime", root);
    var bar = $("#pomoBar", root);
    var modeLbl = $("#pomoMode", root);
    var countLbl = $("#pomoCount", root);
    var toggle = $("#pomoToggle", root);
    var reset = $("#pomoReset", root);
    var res = $("#pomoResult", root);
    if (!disp || !toggle) return;

    var mins = {
      focus: parseFloat(root.getAttribute("data-focus")) || 25,
      short: parseFloat(root.getAttribute("data-break")) || 5,
      long: parseFloat(root.getAttribute("data-long")) || 15
    };
    var labels = { focus: "Focus session", short: "Short break", long: "Long break" };
    var mode = "focus", total = mins[mode] * 60, left = total, timer = null, done = 0;

    function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
    function render() {
      disp.textContent = fmt(left);
      setBar(bar, total ? ((total - left) / total) * 100 : 0);
      if (modeLbl) modeLbl.textContent = labels[mode];
      if (res) res.dataset.state = mode === "focus" ? "" : "good";
    }
    function setMode(m) { mode = m; total = mins[m] * 60; left = total; render(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } toggle.textContent = "Start"; }
    function tick() {
      left--;
      if (left <= 0) {
        stop();
        try { if (navigator && navigator.vibrate) navigator.vibrate(200); } catch (e) {}
        if (mode === "focus") {
          done++;
          if (countLbl) countLbl.textContent = done + " focus session" + (done === 1 ? "" : "s") + " done";
          setMode(done % 4 === 0 ? "long" : "short");
        } else { setMode("focus"); }
        return;
      }
      render();
    }
    toggle.addEventListener("click", function () {
      if (timer) { stop(); } else { timer = setInterval(tick, 1000); toggle.textContent = "Pause"; }
    });
    if (reset) reset.addEventListener("click", function () { stop(); setMode(mode); });
    $$("[data-pomo]", root).forEach(function (b) {
      b.addEventListener("click", function () { stop(); setMode(b.getAttribute("data-pomo")); });
    });
    render();
  })();

  /* ---------- 10. SGPA -> CGPA calculator (semester-wise) ---------- */
  (function () {
    var root = $("#sgpaCalc");
    if (!root) return;
    var rows = $("#sgpaRows", root);
    var addBtn = $("#sgpaAdd", root);
    var mult = $("#sgpaMult", root);
    var res = $("#sgpaResult", root);
    var big = res.querySelector(".big");
    var sub = res.querySelector(".sub");
    var count = 0;

    function m() { var v = parseFloat(mult && mult.value); return (isNaN(v) || v <= 0) ? 9.5 : v; }

    function addRow(sgpa, credits) {
      count++;
      var row = document.createElement("div");
      row.className = "gpa-row";
      row.innerHTML =
        '<input type="text" class="gpa-name" value="Semester ' + count + '" aria-label="Semester name" />' +
        '<input type="number" class="gpa-grade" min="0" max="10" step="0.01" placeholder="SGPA" value="' + (sgpa != null ? sgpa : "") + '" inputmode="decimal" aria-label="SGPA" />' +
        '<input type="number" class="gpa-credits" min="0" step="0.5" value="' + (credits != null ? credits : 20) + '" inputmode="decimal" aria-label="Credits" />' +
        '<button type="button" class="gpa-del" aria-label="Remove semester">&times;</button>';
      rows.appendChild(row);
      row.querySelector(".gpa-del").addEventListener("click", function () { row.remove(); calc(); });
      $$("input", row).forEach(function (el) { el.addEventListener("input", calc); });
    }

    function calc() {
      var totalPoints = 0, totalCredits = 0, n = 0;
      $$(".gpa-row", rows).forEach(function (r) {
        var s = parseFloat(r.querySelector(".gpa-grade").value);
        var c = parseFloat(r.querySelector(".gpa-credits").value);
        if (isNaN(c) || c < 0) c = 0;
        if (!isNaN(s) && s >= 0) { totalPoints += s * c; totalCredits += c; n++; }
      });
      if (n === 0 || totalCredits <= 0) {
        big.textContent = "\u2014";
        sub.textContent = "Add your semesters' SGPA and credits to see your CGPA.";
        res.dataset.state = "";
        return;
      }
      var cgpa = totalPoints / totalCredits;
      var pct = cgpa * m();
      big.textContent = "CGPA " + cgpa.toFixed(2);
      sub.textContent = "\u2248 " + pct.toFixed(2) + "% (CGPA \u00d7 " + m() + ") across " + n + " semester" + (n === 1 ? "" : "s") + ".";
      res.dataset.state = cgpa >= 7.5 ? "good" : "";
    }

    addBtn.addEventListener("click", function () { addRow(); calc(); });
    if (mult) mult.addEventListener("input", calc);

    // Seed with two example semesters
    addRow(8.2, 20);
    addRow(8.6, 20);
    calc();
  })();

  /* Shared helpers for the planners below */
  function toMin(v) { // "HH:MM" -> minutes since midnight, or NaN
    var m = /^(\d{1,2}):(\d{2})/.exec(v || "");
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : NaN;
  }
  function fmtMin(t) { // minutes (may exceed 1440) -> "h:mm am/pm"
    t = ((Math.round(t) % 1440) + 1440) % 1440;
    var h = Math.floor(t / 60), mm = t % 60, ap = h < 12 ? "am" : "pm";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + (mm < 10 ? "0" : "") + mm + " " + ap;
  }
  function addLi(list, label, value) { // safe: uses textContent, never innerHTML
    var li = document.createElement("li");
    var s = document.createElement("span"); s.textContent = label;
    var b = document.createElement("b"); b.textContent = value;
    li.appendChild(s); li.appendChild(b); list.appendChild(li);
  }

  /* ---------- 11. Daily schedule maker ---------- */
  (function () {
    var root = $("#schedCalc");
    if (!root) return;
    var wakeIn = $("#schedWake", root), sleepIn = $("#schedSleep", root);
    var csIn = $("#schedClassStart", root), ceIn = $("#schedClassEnd", root);
    var hoursIn = $("#schedStudy", root), noClass = $("#schedNoClass", root);
    var res = $("#schedResult", root), list = $("#schedList", root);
    var big = res.querySelector(".big"), sub = res.querySelector(".sub");

    function calc() {
      list.innerHTML = "";
      var wake = toMin(wakeIn.value), sleep = toMin(sleepIn.value);
      var studyLeft = Math.round(clamp(num(hoursIn), 0, 12) * 60);
      if (isNaN(wake) || isNaN(sleep)) { big.textContent = "\u2014"; sub.textContent = "Enter your wake-up and bedtime."; res.dataset.state = ""; return; }
      if (sleep <= wake) sleep += 1440; // bedtime after midnight
      var sleepHrs = (wake + 1440 - sleep) / 60;

      // Fixed anchors of the day
      var fixed = [{ s: wake, e: wake + 45, label: "Wake up, get ready & breakfast" }];
      var hasClass = !(noClass && noClass.checked);
      var cs = toMin(csIn.value), ce = toMin(ceIn.value);
      if (hasClass) {
        if (isNaN(cs) || isNaN(ce) || ce <= cs) { big.textContent = "\u2014"; sub.textContent = "Class end time must be after class start time (or tick \u201cNo classes today\u201d)."; res.dataset.state = "bad"; return; }
        if (cs < wake) cs += 1440, ce += 1440;
        if (cs < wake + 45 || ce > sleep - 45) { big.textContent = "\u2014"; sub.textContent = "Your classes need to fit between waking up and bedtime \u2014 check the times."; res.dataset.state = "bad"; return; }
        fixed.push({ s: cs, e: ce, label: "Classes (attend + quick notes review)" });
        fixed.push({ s: ce, e: Math.min(ce + 45, sleep - 45), label: "Recharge: snack, walk, no screens" });
      }
      var dinner = Math.max(19 * 60 + 30, hasClass ? ce + 45 : wake + 45);
      if (dinner + 45 <= sleep - 45) fixed.push({ s: dinner, e: dinner + 45, label: "Dinner & family / friends time" });
      fixed.push({ s: sleep - 45, e: sleep, label: "Wind down: plan tomorrow, phone away" });
      fixed.sort(function (a, b) { return a.s - b.s; });

      // Fill gaps with 50-min study blocks + 10-min breaks, then free time
      var items = [], cursor = wake, blocks = 0, placed = 0;
      function fill(from, to) {
        var t = from;
        while (studyLeft >= 20 && to - t >= 30) {
          var len = Math.min(50, studyLeft, to - t);
          items.push({ s: t, e: t + len, label: "Focus block " + (++blocks) + " (phone in another room)", study: true });
          t += len; studyLeft -= len; placed += len;
          if (to - t >= 10 && studyLeft >= 20) { items.push({ s: t, e: t + 10, label: "Short break: water, stretch" }); t += 10; }
        }
        if (to - t >= 15) items.push({ s: t, e: to, label: "Free time (hobbies, gym, friends)" });
      }
      fixed.forEach(function (f) {
        if (f.s > cursor) fill(cursor, f.s);
        items.push(f); cursor = Math.max(cursor, f.e);
      });
      if (sleep > cursor) fill(cursor, sleep);
      items.sort(function (a, b) { return a.s - b.s; });
      items.forEach(function (it) { addLi(list, it.label, fmtMin(it.s) + " \u2013 " + fmtMin(it.e)); });
      addLi(list, "Sleep", fmtMin(sleep) + " \u2013 " + fmtMin(wake));

      var ph = (placed / 60);
      big.textContent = ph.toFixed(1).replace(/\.0$/, "") + " h study \u00b7 " + sleepHrs.toFixed(1).replace(/\.0$/, "") + " h sleep";
      var notes = [];
      if (studyLeft >= 20) notes.push("Your day is full \u2014 " + (studyLeft / 60).toFixed(1) + " h of study didn't fit. Lower the goal or move it to the weekend.");
      if (sleepHrs < 7) notes.push("Under 7 h of sleep hurts memory and focus \u2014 try an earlier bedtime.");
      if (!notes.length) notes.push("Balanced day: " + blocks + " focus block" + (blocks === 1 ? "" : "s") + ", breaks, meals and free time included.");
      sub.textContent = notes.join(" ");
      res.dataset.state = (studyLeft >= 20 || sleepHrs < 7) ? "bad" : "good";
    }
    [wakeIn, sleepIn, csIn, ceIn, hoursIn].forEach(function (e) { e.addEventListener("input", calc); });
    if (noClass) noClass.addEventListener("change", function () {
      csIn.disabled = ceIn.disabled = noClass.checked; calc();
    });
    calc();
  })();

  /* ---------- 12. Exam study planner (weighted by difficulty & confidence) ---------- */
  (function () {
    var root = $("#examPlan");
    if (!root) return;
    var dateIn = $("#epDate", root), hpdIn = $("#epHours", root);
    var rows = $("#epRows", root), addBtn = $("#epAdd", root);
    var res = $("#epResult", root), list = $("#epList", root), phases = $("#epPhases", root);
    var big = res.querySelector(".big"), sub = res.querySelector(".sub");
    var DIFF = [["Easy", 1], ["Medium", 1.4], ["Hard", 1.8]];
    var CONF = [["Weak", 1.5], ["Okay", 1], ["Strong", 0.6]];

    function opts(arr, sel) {
      return arr.map(function (o) { return '<option value="' + o[1] + '"' + (o[0] === sel ? " selected" : "") + ">" + o[0] + "</option>"; }).join("");
    }
    function addRow(name, d, c) {
      var row = document.createElement("div");
      row.className = "gpa-row";
      row.innerHTML =
        '<input type="text" class="gpa-name" placeholder="Subject" aria-label="Subject name" />' +
        '<select class="gpa-grade" aria-label="Difficulty">' + opts(DIFF, d || "Medium") + "</select>" +
        '<select class="gpa-credits" aria-label="How confident you feel">' + opts(CONF, c || "Okay") + "</select>" +
        '<button type="button" class="gpa-del" aria-label="Remove subject">&times;</button>';
      row.querySelector(".gpa-name").value = name || "";
      rows.appendChild(row);
      row.querySelector(".gpa-del").addEventListener("click", function () { row.remove(); calc(); });
      $$("input, select", row).forEach(function (el) { el.addEventListener("input", calc); el.addEventListener("change", calc); });
    }
    function fmtDate(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
    function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
    function range(a, b) { return a === b ? fmtDate(addDays(today0(), a)) : fmtDate(addDays(today0(), a)) + " \u2013 " + fmtDate(addDays(today0(), b)); }
    function today0() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }

    function calc() {
      list.innerHTML = ""; phases.innerHTML = "";
      var hpd = clamp(num(hpdIn), 0, 14);
      if (!dateIn.value) { big.textContent = "\u2014"; sub.textContent = "Pick your first exam date to build your plan."; res.dataset.state = ""; return; }
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var exam = new Date(dateIn.value + "T00:00:00");
      var days = Math.round((exam - today) / 86400000); // full days before the exam
      if (days <= 0) { big.textContent = "\u2014"; sub.textContent = days === 0 ? "Your exam is today \u2014 skim your summary sheet and stay calm." : "That date has passed. Pick an upcoming exam."; res.dataset.state = "bad"; return; }
      if (hpd <= 0) { big.textContent = "\u2014"; sub.textContent = "Enter how many hours you can study per day."; res.dataset.state = ""; return; }

      var subs = [];
      $$(".gpa-row", rows).forEach(function (r, i) {
        var n = r.querySelector(".gpa-name").value.trim() || ("Subject " + (i + 1));
        var w = parseFloat(r.querySelector(".gpa-grade").value) * parseFloat(r.querySelector(".gpa-credits").value);
        subs.push({ name: n, w: isNaN(w) ? 1 : w });
      });
      if (!subs.length) { big.textContent = "\u2014"; sub.textContent = "Add at least one subject."; res.dataset.state = ""; return; }

      var rest = days >= 7 ? Math.floor(days / 7) : 0; // one light/rest day per week
      var studyDays = days - rest;
      var total = studyDays * hpd;
      var sumW = subs.reduce(function (a, s) { return a + s.w; }, 0);
      subs.sort(function (a, b) { return b.w - a.w; });
      subs.forEach(function (s) {
        var h = total * s.w / sumW;
        addLi(list, s.name, h.toFixed(1) + " h  (" + Math.max(1, Math.round(h * 60 / 50)) + " blocks)");
      });

      // Phases: learn -> practise -> final revision (shorter windows compress the first phase)
      var p1 = days >= 10 ? Math.round(days * 0.5) : days >= 4 ? Math.round(days * 0.3) : 0;
      var p2 = Math.round(days * 0.8); if (p2 <= p1) p2 = Math.min(days - 1, p1 + 1);
      if (p1 > 0) addLi(phases, "1 \u00b7 Learn & fill gaps (hardest topics first)", range(0, p1 - 1));
      if (p2 > p1) addLi(phases, (p1 > 0 ? "2" : "1") + " \u00b7 Practise: past papers & active recall", range(p1, p2 - 1));
      addLi(phases, (p1 > 0 ? "3" : "2") + " \u00b7 Final revision: summaries & weak spots", range(p2, days - 1));

      big.textContent = days + " day" + (days === 1 ? "" : "s") + " \u00b7 " + total.toFixed(0) + " study hours";
      sub.textContent = (rest ? studyDays + " study days + " + rest + " lighter rest day" + (rest === 1 ? "" : "s") + ". " : "") +
        "More hours go to subjects that are harder and where you feel weaker." +
        (days < 7 ? " Short on time? Focus on past papers and high-weight topics." : "");
      res.dataset.state = days < 7 ? "bad" : "good";
    }

    addBtn.addEventListener("click", function () { addRow(); calc(); });
    [dateIn, hpdIn].forEach(function (e) { e.addEventListener("input", calc); });
    // Default exam date: 21 days from today
    var d0 = new Date(); d0.setDate(d0.getDate() + 21);
    dateIn.value = d0.getFullYear() + "-" + ("0" + (d0.getMonth() + 1)).slice(-2) + "-" + ("0" + d0.getDate()).slice(-2);
    addRow("Maths", "Hard", "Weak");
    addRow("Physics", "Medium", "Okay");
    addRow("English", "Easy", "Strong");
    calc();
  })();

  /* ---------- 13. Study time cushion calculator (time you have vs time you need) ---------- */
  (function () {
    var root = $("#cushionCalc");
    if (!root) return;
    var weekly = $("#cuWeekly", root), rows = $("#cuRows", root), addBtn = $("#cuAdd", root);
    var res = $("#cuResult", root), list = $("#cuList", root);
    var big = res.querySelector(".big"), sub = res.querySelector(".sub");

    function addRow(name, hrs, days) {
      var row = document.createElement("div");
      row.className = "gpa-row";
      row.innerHTML =
        '<input type="text" class="gpa-name" placeholder="Task (e.g. Essay)" aria-label="Task name" />' +
        '<input type="number" class="gpa-grade" min="0" step="0.5" placeholder="Hours" inputmode="decimal" aria-label="Hours needed" />' +
        '<input type="number" class="gpa-credits" min="1" step="1" placeholder="Days" inputmode="numeric" aria-label="Due in how many days" />' +
        '<button type="button" class="gpa-del" aria-label="Remove task">&times;</button>';
      row.querySelector(".gpa-name").value = name || "";
      if (hrs != null) row.querySelector(".gpa-grade").value = hrs;
      if (days != null) row.querySelector(".gpa-credits").value = days;
      rows.appendChild(row);
      row.querySelector(".gpa-del").addEventListener("click", function () { row.remove(); calc(); });
      $$("input", row).forEach(function (el) { el.addEventListener("input", calc); });
    }
    function h(n) { return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "") + " h"; }

    function calc() {
      list.innerHTML = "";
      var perDay = Math.max(0, num(weekly)) / 7;
      var tasks = [];
      $$(".gpa-row", rows).forEach(function (r, i) {
        var need = parseFloat(r.querySelector(".gpa-grade").value), d = parseInt(r.querySelector(".gpa-credits").value, 10);
        if (!isNaN(need) && need > 0 && !isNaN(d) && d > 0) tasks.push({ name: r.querySelector(".gpa-name").value.trim() || ("Task " + (i + 1)), need: need, d: d });
      });
      if (perDay <= 0 || !tasks.length) { big.textContent = "\u2014"; sub.textContent = "Enter your weekly study hours and at least one task with hours and days until due."; res.dataset.state = ""; return; }
      tasks.sort(function (a, b) { return a.d - b.d; });
      var cum = 0, worst = Infinity, worstTask = null, first = null;
      tasks.forEach(function (t) {
        cum += t.need;
        var cushion = perDay * t.d - cum; // hours left over if you work in due-date order
        if (cushion < worst) { worst = cushion; worstTask = t; }
        if (cushion < 0 && !first) first = { t: t, c: cushion };
        addLi(list, t.name + " \u00b7 due in " + t.d + " day" + (t.d === 1 ? "" : "s"), (cushion >= 0 ? "+" : "\u2212") + h(Math.abs(cushion)) + (cushion >= 0 ? " spare" : " short"));
      });
      if (worst >= 0) {
        big.textContent = "+" + h(worst) + " cushion";
        sub.textContent = "You have enough time for everything if you work in due-date order. " + (worst < perDay * 2 ? "It's tight, though \u2014 start the first task today." : "Protect that spare time for surprises.");
        res.dataset.state = "good";
      } else {
        big.textContent = h(-worst) + " short";
        sub.textContent = "You first run out of time at \u201c" + first.t.name + "\u201d (due in " + first.t.d + " day" + (first.t.d === 1 ? "" : "s") + ", " + h(-first.c) + " short)" +
          (worstTask !== first.t ? " and end up " + h(-worst) + " short by \u201c" + worstTask.name + "\u201d" : "") +
          ". Add about " + h(-worst / worstTask.d) + " of study a day, cut scope, or ask for an extension now \u2014 not the night before.";
        res.dataset.state = "bad";
      }
    }
    addBtn.addEventListener("click", function () { addRow(); calc(); });
    weekly.addEventListener("input", calc);
    addRow("Lab report", 4, 3);
    addRow("History essay", 8, 7);
    addRow("Maths exam revision", 12, 14);
    calc();
  })();

})();
