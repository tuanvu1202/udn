document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('scoreForm');
    const resultsSection = document.getElementById('resultsSection');
    const finalScoreEl = document.getElementById('finalScore');
    const scoreDetailsEl = document.getElementById('scoreDetails');
    const calculationBreakdownEl = document.getElementById('calculationBreakdown');

    const safeList = document.getElementById('safeList');
    const matchList = document.getElementById('matchList');
    const reachList = document.getElementById('reachList');

    const tabBtns = document.querySelectorAll('.tab-btn');
    const hocbaSection = document.getElementById('hocbaSection');
    const hsgGroup = document.getElementById('hsgGroup');
    const hbInputs = document.querySelectorAll('#hocbaSection input[type="number"]');

    let majorsData = [];
    let currentMethod = 'THPT'; // Default to THPT

    // Lỗi submit button là do validation "required". Xóa required để cho phép submit thoải mái.
    hbInputs.forEach(input => input.required = false);

    // Bắt buộc tất cả các ô nhập số không được vượt quá 10 và tối đa 2 chữ số thập phân
    const allNumberInputs = document.querySelectorAll('input[type="number"]');
    allNumberInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value === "") return;
            
            let val = parseFloat(this.value);
            
            // Giới hạn trong khoảng 0 - 10
            if (val > 10) {
                this.value = "10";
            } else if (val < 0) {
                this.value = "0";
            }
            
            // Cắt phần thập phân tối đa 2 chữ số
            if (this.value.includes('.')) {
                let parts = this.value.split('.');
                if (parts[1].length > 2) {
                    this.value = parts[0] + '.' + parts[1].substring(0, 2);
                }
            }
        });
    });

    // Handle Tab Switch
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentMethod = e.target.dataset.method;
            
            if (currentMethod === 'COMBINED') {
                hocbaSection.classList.remove('hidden');
                hsgGroup.classList.remove('hidden');
                updateLiveBreakdown();
            } else {
                hocbaSection.classList.add('hidden');
                hsgGroup.classList.add('hidden');
            }

            // Hide results when changing method
            resultsSection.classList.add('hidden');
        });
    });

    // Handle live average calculation
    hbInputs.forEach(input => {
        input.addEventListener('input', updateAverages);
    });

    function updateAverages() {
        ['10', '11', '12'].forEach(grade => {
            const m = parseFloat(document.getElementById(`m${grade}`).value) || 0;
            const p = parseFloat(document.getElementById(`p${grade}`).value) || 0;
            const i = parseFloat(document.getElementById(`i${grade}`).value) || 0;
            
            const sum = m + p + i;
            const avg = sum / 3;
            document.getElementById(`avg${grade}`).textContent = avg > 0 ? avg.toFixed(2) : "0.00";
        });
    }

    const thptInputs = [document.getElementById('math'), document.getElementById('physics'), document.getElementById('informatics')];
    const ratioSelect = document.getElementById('ratioSelect');
    
    // Listen for live breakdown updates
    [...thptInputs, ...hbInputs, ratioSelect].forEach(input => {
        if (input) input.addEventListener('input', updateLiveBreakdown);
    });
    if (ratioSelect) {
        ratioSelect.addEventListener('change', () => {
            updateLiveBreakdown();
            // Nếu bảng kết quả đang hiện, tự động submit để cập nhật danh sách
            if (!resultsSection.classList.contains('hidden')) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
    }

    function updateLiveBreakdown() {
        if (currentMethod !== 'COMBINED') return;
        
        // calc THPT
        const mThpt = parseFloat(document.getElementById('math').value) || 0;
        const pThpt = parseFloat(document.getElementById('physics').value) || 0;
        const iThpt = parseFloat(document.getElementById('informatics').value) || 0;
        const baseThpt = mThpt + pThpt + iThpt;

        // calc HB
        const m10 = parseFloat(document.getElementById('m10').value) || 0;
        const m11 = parseFloat(document.getElementById('m11').value) || 0;
        const m12 = parseFloat(document.getElementById('m12').value) || 0;
        const hbMath = (m10 + m11 + m12) / 3;

        const p10 = parseFloat(document.getElementById('p10').value) || 0;
        const p11 = parseFloat(document.getElementById('p11').value) || 0;
        const p12 = parseFloat(document.getElementById('p12').value) || 0;
        const hbPhysics = (p10 + p11 + p12) / 3;

        const i10 = parseFloat(document.getElementById('i10').value) || 0;
        const i11 = parseFloat(document.getElementById('i11').value) || 0;
        const i12 = parseFloat(document.getElementById('i12').value) || 0;
        const hbInformatics = (i10 + i11 + i12) / 3;

        const baseHb = hbMath + hbPhysics + hbInformatics;

        let thptRatio, hbRatio;
        if (ratioSelect && ratioSelect.value === 'VKU') {
            thptRatio = 0.4; hbRatio = 0.6;
        } else {
            thptRatio = 0.7; hbRatio = 0.3;
        }

        const weightedHb = baseHb * hbRatio;
        const weightedThpt = baseThpt * thptRatio;
        const averageBase = weightedHb + weightedThpt;

        document.getElementById('rawHbScore').textContent = baseHb.toFixed(2);
        document.getElementById('rawThptScore').textContent = baseThpt.toFixed(2);
        document.getElementById('hbRatioText').textContent = Math.round(hbRatio * 100);
        document.getElementById('thptRatioText').textContent = Math.round(thptRatio * 100);
        document.getElementById('weightedHbScore').textContent = weightedHb.toFixed(2);
        document.getElementById('weightedThptScore').textContent = weightedThpt.toFixed(2);
        document.getElementById('liveAverageBase').textContent = averageBase.toFixed(2);
    }

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

        // Get THPT scores
        const math = parseFloat(document.getElementById('math').value) || 0;
        const physics = parseFloat(document.getElementById('physics').value) || 0;
        const informatics = parseFloat(document.getElementById('informatics').value) || 0;

        // Get priorities
        const targetScore = parseFloat(document.getElementById('target').value) || 0;
        const hsgPrize = parseFloat(document.getElementById('hsgPrize').value) || 0;

        let totalScore = 0;
        let scoreDetailsText = '';
        let targetFilter = null; // Used to filter university in combined mode

        if (currentMethod === 'THPT') {
            const baseScore = math + physics + informatics;
            let priorityScore = targetScore;

            if (baseScore >= 22.5) {
                priorityScore = priorityScore * ((30 - baseScore) / 7.5);
            }

            totalScore = baseScore + priorityScore;
            scoreDetailsText = `(Tổng THPT: ${baseScore.toFixed(2)} + Ưu tiên: ${priorityScore.toFixed(2)})`;
            calculationBreakdownEl.classList.add('hidden');
            targetFilter = 'ALL';
        } else if (currentMethod === 'COMBINED') {
            const baseThpt = math + physics + informatics;
            
            // Lấy trung bình 3 năm cho từng môn
            const hbMath = ((parseFloat(document.getElementById('m10').value) || 0) + 
                           (parseFloat(document.getElementById('m11').value) || 0) + 
                           (parseFloat(document.getElementById('m12').value) || 0)) / 3;

            const hbPhysics = ((parseFloat(document.getElementById('p10').value) || 0) + 
                              (parseFloat(document.getElementById('p11').value) || 0) + 
                              (parseFloat(document.getElementById('p12').value) || 0)) / 3;

            const hbInformatics = ((parseFloat(document.getElementById('i10').value) || 0) + 
                                  (parseFloat(document.getElementById('i11').value) || 0) + 
                                  (parseFloat(document.getElementById('i12').value) || 0)) / 3;

            const baseHb = hbMath + hbPhysics + hbInformatics;
            
            let thptRatio, hbRatio;
            const ratioChoice = document.getElementById('ratioSelect').value;

            if (ratioChoice === 'VKU') {
                thptRatio = 0.4;
                hbRatio = 0.6;
                targetFilter = 'VKU';
            } else if (ratioChoice === 'UTE') {
                thptRatio = 0.7;
                hbRatio = 0.3;
                targetFilter = 'DSK'; // UTE Code
            }

            const averageBase = (baseThpt * thptRatio) + (baseHb * hbRatio);

            let priorityScore = targetScore;
            // Áp dụng quy chế giảm điểm ưu tiên cho điểm trung bình
            if (averageBase >= 22.5) {
                priorityScore = priorityScore * ((30 - averageBase) / 7.5);
            }

            // Cộng điểm thưởng thành tích (tự nhập)
            totalScore = averageBase + priorityScore + hsgPrize;
            scoreDetailsText = `(Điểm cơ sở: ${averageBase.toFixed(2)} + Ưu tiên: ${priorityScore.toFixed(2)} + Thưởng: ${hsgPrize.toFixed(2)})`;
            
            // Hiện chi tiết breakdown
            const hbPercentage = Math.round(hbRatio * 100);
            const thptPercentage = Math.round(thptRatio * 100);
            calculationBreakdownEl.textContent = `Học bạ (${baseHb.toFixed(2)}) * ${hbPercentage}% + THPT (${baseThpt.toFixed(2)}) * ${thptPercentage}% = ${averageBase.toFixed(2)}`;
            calculationBreakdownEl.classList.remove('hidden');
        }

        // Display scores
        finalScoreEl.textContent = totalScore.toFixed(2);
        scoreDetailsEl.textContent = scoreDetailsText;

        // Process aspirations
        processAspirations(totalScore, currentMethod, targetFilter);

        // Show results with animation
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function processAspirations(userScore, method, targetFilter) {
        // Clear previous lists
        safeList.innerHTML = '';
        matchList.innerHTML = '';
        reachList.innerHTML = '';

        const safeMajors = [];
        const matchMajors = [];
        const reachMajors = [];

        majorsData.forEach(major => {
            // Lọc trường theo phương thức xét tuyển
            if (method === 'THPT') {
                if (!major.methods.includes('THPT')) return;
            } else if (method === 'COMBINED') {
                if (!major.methods.includes('COMBINED')) return;
                // Áp dụng bộ lọc tỉ lệ trường
                if (major.universityCode !== targetFilter) return;
            }

            const diff = userScore - major.score;

            if (diff >= 1.0) {
                safeMajors.push(major);
            } else if (diff >= 0 && diff < 1.0) {
                matchMajors.push(major);
            } else if (diff < 0 && diff >= -1.5) {
                reachMajors.push(major);
            }
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
            container.innerHTML = '<li class="empty-state">Không có trường/ngành nào phù hợp trong nhóm này hoặc không hỗ trợ phương thức này.</li>';
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
