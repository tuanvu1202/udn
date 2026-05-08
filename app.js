document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('scoreForm');
    const resultsSection = document.getElementById('resultsSection');
    const finalScoreEl = document.getElementById('finalScore');
    const scoreDetailsEl = document.getElementById('scoreDetails');

    const safeList = document.getElementById('safeList');
    const matchList = document.getElementById('matchList');
    const reachList = document.getElementById('reachList');

    let majorsData = [];

    // Load data from JSON
    fetch('./datachuan.json')
        .then(response => response.json())
        .then(data => {
            majorsData = data;
        })
        .catch(error => {
            console.error('Error loading data:', error);
            alert('Không thể tải dữ liệu điểm chuẩn. Vui lòng thử lại sau.');
        });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get scores
        const math = parseFloat(document.getElementById('math').value) || 0;
        const physics = parseFloat(document.getElementById('physics').value) || 0;
        const informatics = parseFloat(document.getElementById('informatics').value) || 0;

        // Get priorities
        const regionScore = parseFloat(document.getElementById('region').value) || 0;
        const targetScore = parseFloat(document.getElementById('target').value) || 0;

        // Validation
        if (math < 0 || math > 10 || physics < 0 || physics > 10 || informatics < 0 || informatics > 10) {
            alert('Điểm môn học phải nằm trong khoảng từ 0 đến 10.');
            return;
        }

        const baseScore = math + physics + informatics;
        let priorityScore = regionScore + targetScore;

        // Quy chế tuyển sinh mới: Điểm ưu tiên giảm dần nếu tổng điểm >= 22.5
        if (baseScore >= 22.5) {
            priorityScore = priorityScore * ((30 - baseScore) / 7.5);
        }

        const totalScore = baseScore + priorityScore;

        // Display scores
        finalScoreEl.textContent = totalScore.toFixed(2);
        scoreDetailsEl.textContent = `(Tổng 3 môn: ${baseScore.toFixed(2)} + Ưu tiên: ${priorityScore.toFixed(2)})`;

        // Process aspirations
        processAspirations(totalScore);

        // Show results with animation
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function processAspirations(userScore) {
        // Clear previous lists
        safeList.innerHTML = '';
        matchList.innerHTML = '';
        reachList.innerHTML = '';

        const safeMajors = [];
        const matchMajors = [];
        const reachMajors = [];

        majorsData.forEach(major => {
            const diff = userScore - major.score;

            if (diff >= 1.0) {
                safeMajors.push(major);
            } else if (diff >= 0 && diff < 1.0) {
                matchMajors.push(major);
            } else if (diff < 0 && diff >= -1.0) {
                reachMajors.push(major);
            }
            // If diff < -1.0, it's too risky, we don't show it or we can ignore
        });

        // Sort descending by benchmark score
        const sortByScore = (a, b) => b.score - a.score;
        safeMajors.sort(sortByScore);
        matchMajors.sort(sortByScore);
        reachMajors.sort(sortByScore);

        // Render
        renderList(safeMajors, safeList);
        renderList(matchMajors, matchList);
        renderList(reachMajors, reachList);
    }

    function renderList(majors, container) {
        if (majors.length === 0) {
            container.innerHTML = '<li class="empty-state">Không có ngành nào phù hợp trong nhóm này.</li>';
            return;
        }

        majors.forEach(major => {
            const li = document.createElement('li');
            li.className = 'major-item';
            li.innerHTML = `
                <div class="major-name">${major.major}</div>
                <div class="major-school">${major.university} (Mã: ${major.majorCode})</div>
                <div class="major-score">Điểm chuẩn: <strong>${major.score.toFixed(2)}</strong></div>
            `;
            container.appendChild(li);
        });
    }
});
