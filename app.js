// DevMeDoAnDrOiD
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const resultCountEl = document.getElementById('resultCount');
    const searchTimeEl = document.getElementById('searchTime');
    const statusTextEl = document.getElementById('statusText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    const initialState = document.getElementById('initialState');
    const resultsTableContainer = document.getElementById('resultsTableContainer');
    const resultsTbody = document.getElementById('resultsTbody');
    const resultsGridContainer = document.getElementById('resultsGridContainer');
    const resultsGrid = document.getElementById('resultsGrid');
    const infiniteScrollTrigger = document.getElementById('infiniteScrollTrigger');
    const toastNotification = document.getElementById('toastNotification');
    const toastText = document.getElementById('toastText');

    const kpiTotal = document.getElementById('kpiTotal');
    const kpiPassed = document.getElementById('kpiPassed');
    const kpiMaxScore = document.getElementById('kpiMaxScore');

    const tableViewBtn = document.getElementById('tableViewBtn');
    const cardViewBtn = document.getElementById('cardViewBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    const studentModal = document.getElementById('studentModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalStudentName = document.getElementById('modalStudentName');
    const modalSeatingNo = document.getElementById('modalSeatingNo');
    const modalTotalDegree = document.getElementById('modalTotalDegree');
    const modalPercentage = document.getElementById('modalPercentage');
    const modalStudentCase = document.getElementById('modalStudentCase');
    const progressBarValue = document.getElementById('progressBarValue');
    const progressFill = document.getElementById('progressFill');

    const printModalBtn = document.getElementById('printModalBtn');
    const copyModalBtn = document.getElementById('copyModalBtn');

    let debounceTimer = null;
    let currentQuery = '';
    let currentFilter = 'all';
    let currentView = 'table';
    let currentOffset = 0;
    const limit = 50;
    let isLoading = false;
    let hasMore = true;
    let currentResultsList = [];
    let activeStudent = null;
    let toastTimeout = null;
    let systemMaxScore = 320;
    let isGitHubPagesMode = false;

    const searchCache = new Map();

    const savedTheme = localStorage.getItem('ntega_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('ntega_theme', newTheme);
    });

    fetchStats();

    async function fetchStats() {
        try {
            const res = await fetch('/api/stats');
            if (res.ok) {
                const data = await res.json();
                applyStats(data);
                return;
            }
        } catch (e) {}

        try {
            isGitHubPagesMode = true;
            const res = await fetch('./data/stats.json');
            if (res.ok) {
                const data = await res.json();
                applyStats(data);
            }
        } catch (e) {}
    }

    function applyStats(data) {
        systemMaxScore = data.max_degree || 320;
        kpiTotal.textContent = Number(data.total_students).toLocaleString('ar-EG');
        kpiPassed.textContent = `${Number(data.passed_students).toLocaleString('ar-EG')} (${data.pass_rate}%)`;
        kpiMaxScore.textContent = `${data.max_degree} درجة`;
    }

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            resetAndFetch();
        });
    });

    tableViewBtn.addEventListener('click', () => {
        currentView = 'table';
        tableViewBtn.classList.add('active');
        cardViewBtn.classList.remove('active');
        updateViewDisplay();
    });

    cardViewBtn.addEventListener('click', () => {
        currentView = 'card';
        cardViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        updateViewDisplay();
    });

    function updateViewDisplay() {
        if (currentResultsList.length > 0) {
            if (currentView === 'table') {
                resultsTableContainer.classList.remove('hidden');
                resultsGridContainer.classList.add('hidden');
            } else {
                resultsTableContainer.classList.add('hidden');
                resultsGridContainer.classList.remove('hidden');
            }
        }
    }

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearSearchBtn.classList.toggle('hidden', query.length === 0);

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (query !== currentQuery) {
                currentQuery = query;
                resetAndFetch();
            }
        }, 150);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentQuery = '';
        clearSearchBtn.classList.add('hidden');
        searchInput.focus();
        resetAndFetch();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!studentModal.classList.contains('hidden')) {
                closeModal();
            } else if (searchInput.value) {
                clearSearchBtn.click();
            }
        }
    });

    function resetAndFetch() {
        currentOffset = 0;
        hasMore = true;
        currentResultsList = [];
        resultsTbody.innerHTML = '';
        resultsGrid.innerHTML = '';

        if (!currentQuery && currentFilter === 'all') {
            showState('initial');
            resultCountEl.textContent = '0';
            searchTimeEl.textContent = '0 ms';
            statusTextEl.textContent = 'جاهز للبحث';
            return;
        }

        fetchResults();
    }

    async function fetchResults() {
        if (isLoading || !hasMore) return;

        isLoading = true;
        statusTextEl.textContent = 'جاري الاستعلام...';

        if (currentOffset === 0) {
            showState('loading');
        }

        const cacheKey = `${currentQuery}_${currentFilter}_${currentOffset}_${limit}`;
        if (searchCache.has(cacheKey)) {
            const cachedData = searchCache.get(cacheKey);
            handleDataResponse(cachedData, true);
            isLoading = false;
            return;
        }

        if (!isGitHubPagesMode) {
            try {
                const url = `/api/search?q=${encodeURIComponent(currentQuery)}&filter=${currentFilter}&limit=${limit}&offset=${currentOffset}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    searchCache.set(cacheKey, data);
                    handleDataResponse(data, false);
                    isLoading = false;
                    return;
                }
            } catch (error) {
                isGitHubPagesMode = true;
            }
        }

        await fetchFromGitHubPagesPartition(cacheKey);
        isLoading = false;
    }

    async function fetchFromGitHubPagesPartition(cacheKey) {
        const startTime = performance.now();
        let items = [];

        try {
            if (/^\d+$/.test(currentQuery)) {
                const prefix = currentQuery.slice(0, 4);
                const res = await fetch(`./data/seating/${prefix}.json`);
                if (res.ok) {
                    const data = await res.json();
                    items = data.filter(s => String(s.seating_no).startsWith(currentQuery));
                }
            } else {
                const rawPrefix = currentQuery.slice(0, 2);
                const asciiKey = Array.from(rawPrefix).map(c => c.charCodeAt(0)).join('_');
                const res = await fetch(`./data/names/${asciiKey}.json`);
                if (res.ok) {
                    const data = await res.json();
                    const words = currentQuery.split(/\s+/).filter(w => w);
                    items = data.filter(s => {
                        return words.every(w => s.arabic_name.includes(w));
                    });
                }
            }

            if (currentFilter === 'pass') {
                items = items.filter(s => s.student_case_desc.includes('ناجح'));
            } else if (currentFilter === 'second') {
                items = items.filter(s => s.student_case_desc.includes('دور ثان'));
            } else if (currentFilter === 'top') {
                items = items.filter(s => s.percentage >= 90 || s.total_degree >= 288);
            }

            const pagedResults = items.slice(currentOffset, currentOffset + limit);
            const elapsed = Math.round(performance.now() - startTime);

            const resultData = {
                results: pagedResults,
                count: pagedResults.length,
                time_ms: elapsed
            };

            searchCache.set(cacheKey, resultData);
            handleDataResponse(resultData, false);

        } catch (e) {
            statusTextEl.textContent = 'حدث خطأ في الاتصال';
            if (currentOffset === 0) {
                showState('empty');
            }
        }
    }

    function handleDataResponse(data, isFromCache) {
        searchTimeEl.textContent = isFromCache ? '0.1 ms (من الذاكرة)' : `${data.time_ms || 0} ms`;

        if (currentOffset === 0) {
            resultCountEl.textContent = data.results ? data.results.length : 0;
        } else {
            const currentCount = parseInt(resultCountEl.textContent, 10) || 0;
            resultCountEl.textContent = (currentCount + (data.results ? data.results.length : 0)).toString();
        }

        if (!data.results || data.results.length === 0) {
            hasMore = false;
            if (currentOffset === 0) {
                showState('empty');
            }
            statusTextEl.textContent = 'اكتمل الاستعلام';
            return;
        }

        if (data.results.length < limit) {
            hasMore = false;
        }

        currentResultsList = currentResultsList.concat(data.results);
        renderResults(data.results);
        currentOffset += data.results.length;

        showState(currentView === 'table' ? 'table' : 'grid');
        statusTextEl.textContent = 'جاهز للبحث';
    }

    function renderResults(rows) {
        const tableFrag = document.createDocumentFragment();
        const gridFrag = document.createDocumentFragment();

        rows.forEach(row => {
            const caseClass = getCaseBadgeClass(row.student_case_desc);
            const pct = row.percentage || ((row.total_degree / systemMaxScore) * 100).toFixed(2);

            const tr = document.createElement('tr');
            tr.dataset.seating = row.seating_no;
            tr.innerHTML = `
                <td><span class="seating-badge">${escapeHtml(row.seating_no)}</span></td>
                <td><strong>${escapeHtml(row.arabic_name)}</strong></td>
                <td><span class="degree-badge">${escapeHtml(row.total_degree)}</span></td>
                <td><span class="percent-badge">${escapeHtml(pct)}%</span></td>
                <td><span class="case-badge ${caseClass}">${escapeHtml(row.student_case_desc)}</span></td>
                <td>
                    <button class="action-btn view-btn-item" data-seating="${escapeHtml(row.seating_no)}">
                        الشهادة
                    </button>
                </td>
            `;
            tableFrag.appendChild(tr);

            const card = document.createElement('div');
            card.className = 'student-card';
            card.dataset.seating = row.seating_no;
            card.innerHTML = `
                <div class="card-header-row">
                    <span class="seating-badge">${escapeHtml(row.seating_no)}</span>
                    <span class="case-badge ${caseClass}">${escapeHtml(row.student_case_desc)}</span>
                </div>
                <div class="student-name">${escapeHtml(row.arabic_name)}</div>
                <div class="card-stats-row">
                    <span class="degree-badge">المجموع: ${escapeHtml(row.total_degree)}</span>
                    <span class="percent-badge">${escapeHtml(pct)}%</span>
                </div>
                <div class="card-footer-row">
                    <button class="action-btn view-btn-item" data-seating="${escapeHtml(row.seating_no)}">عرض الشهادة الموثقة</button>
                </div>
            `;
            gridFrag.appendChild(card);
        });

        resultsTbody.appendChild(tableFrag);
        resultsGrid.appendChild(gridFrag);
    }

    resultsTableContainer.addEventListener('click', handleRowOrCardClick);
    resultsGridContainer.addEventListener('click', handleRowOrCardClick);

    function handleRowOrCardClick(e) {
        const target = e.target.closest('[data-seating]');
        if (target) {
            const seating = target.dataset.seating;
            const student = currentResultsList.find(s => String(s.seating_no) === String(seating));
            if (student) {
                openModal(student);
            }
        }
    }

    function openModal(student) {
        activeStudent = student;
        const pct = student.percentage || ((student.total_degree / systemMaxScore) * 100).toFixed(2);

        modalStudentName.textContent = student.arabic_name;
        modalSeatingNo.textContent = student.seating_no;
        modalTotalDegree.textContent = `${student.total_degree} / ${systemMaxScore}`;
        modalPercentage.textContent = `${pct}%`;
        modalStudentCase.textContent = student.student_case_desc;

        progressBarValue.textContent = `${pct}%`;
        progressFill.style.width = '0%';
        setTimeout(() => {
            progressFill.style.width = `${Math.min(pct, 100)}%`;
        }, 50);

        const caseClass = getCaseBadgeClass(student.student_case_desc);
        modalStudentCase.className = `cert-value status-badge case-badge ${caseClass}`;

        studentModal.classList.remove('hidden');
    }

    function closeModal() {
        studentModal.classList.add('hidden');
    }

    closeModalBtn.addEventListener('click', closeModal);
    studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) closeModal();
    });

    printModalBtn.addEventListener('click', () => {
        window.print();
    });

    copyModalBtn.addEventListener('click', () => {
        if (activeStudent) {
            const pct = activeStudent.percentage || ((activeStudent.total_degree / systemMaxScore) * 100).toFixed(2);
            const text = `اسم الطالب: ${activeStudent.arabic_name}\nرقم الجلوس: ${activeStudent.seating_no}\nالمجموع الكلي: ${activeStudent.total_degree} / ${systemMaxScore}\nالنسبة المئوية: ${pct}%\nالحالة: ${activeStudent.student_case_desc}`;
            navigator.clipboard.writeText(text).then(() => {
                showToast('تم نسخ بيانات الشهادة النصية بالكامل!');
            });
        }
    });

    exportCsvBtn.addEventListener('click', () => {
        if (currentResultsList.length === 0) {
            showToast('لا توجد نتائج للتصدير');
            return;
        }

        let csvContent = "\uFEFFرقم الجلوس,اسم الطالب,المجموع الكلي,النسبة المئوية,حالة الطالب\n";
        currentResultsList.forEach(r => {
            const pct = r.percentage || ((r.total_degree / systemMaxScore) * 100).toFixed(2);
            csvContent += `"${r.seating_no}","${r.arabic_name}","${r.total_degree}","${pct}%","${r.student_case_desc}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `نتائج_الثانوية_العامة_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('تم تصدير النتائج والنسب المئوية إلى CSV بنجاح!');
    });

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore && (currentQuery || currentFilter !== 'all')) {
            fetchResults();
        }
    }, { rootMargin: '250px' });

    observer.observe(infiniteScrollTrigger);

    function showState(state) {
        initialState.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        emptyState.classList.add('hidden');
        resultsTableContainer.classList.add('hidden');
        resultsGridContainer.classList.add('hidden');

        if (state === 'initial') initialState.classList.remove('hidden');
        if (state === 'loading') loadingSpinner.classList.remove('hidden');
        if (state === 'empty') emptyState.classList.remove('hidden');
        if (state === 'table') resultsTableContainer.classList.remove('hidden');
        if (state === 'grid') resultsGridContainer.classList.remove('hidden');
    }

    function getCaseBadgeClass(caseDesc) {
        if (!caseDesc) return 'case-pass';
        if (caseDesc.includes('ناجح')) return 'case-pass';
        if (caseDesc.includes('دور ثان')) return 'case-warning';
        return 'case-fail';
    }

    function showToast(message) {
        toastText.textContent = message;
        toastNotification.classList.remove('hidden');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastNotification.classList.add('hidden');
        }, 2500);
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
// Copyright (c) 2026 MeDoAnDrOiD. All Rights Reserved.
