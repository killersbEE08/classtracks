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

})();
