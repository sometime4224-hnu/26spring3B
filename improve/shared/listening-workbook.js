(() => {
    "use strict";

    const STORAGE_PREFIX = "korean3b.listening.v3";
    const DEFAULT_FEATURES = {
        ko: [
            "듣기 전 활동",
            "단계적 자막 공개",
            "속도 조절",
            "문장 구간 반복",
            "딕토글로스",
            "노트 필기",
            "쉐도잉",
            "명료화 표현"
        ],
        vi: [
            "Hoạt động trước khi nghe",
            "Mở phụ đề theo từng bước",
            "Điều chỉnh tốc độ",
            "Luyện từng câu",
            "Dictogloss",
            "Ghi chú",
            "Shadowing",
            "Biểu hiện hỏi lại"
        ]
    };
    const DEFAULT_ROUTINE = {
        ko: [
            { title: "듣기 전 예측", body: "상황 그림, 핵심 어휘, 화자 관계와 담화 유형을 먼저 떠올립니다." },
            { title: "귀로 먼저 듣기", body: "1회는 자막 없이, 2회는 핵심어만, 3회째부터 전체 대본을 봅니다." },
            { title: "재구성과 노트", body: "딕토글로스와 Cornell/3칸 노트로 내용을 다시 조직합니다." },
            { title: "말하기로 마무리", body: "쉐도잉과 명료화 표현으로 듣기를 실제 상호작용까지 연결합니다." }
        ],
        vi: [
            { title: "Dự đoán trước khi nghe", body: "Nhìn tranh tình huống, từ vựng chính, quan hệ giữa người nói và loại hội thoại trước đã." },
            { title: "Nghe trước bằng tai", body: "Lần 1 nghe không có phụ đề, lần 2 chỉ xem từ khóa, từ lần 3 mới xem toàn văn." },
            { title: "Tái cấu trúc và ghi chú", body: "Sắp xếp lại nội dung bằng dictogloss và ghi chú Cornell/3 cột." },
            { title: "Kết thúc bằng nói", body: "Nói theo và luyện hỏi lại để nội dung nghe được nối sang giao tiếp thật." }
        ]
    };
    const DEFAULT_CLARIFICATIONS = [
        { ko: "다시 말씀해 주세요.", vi: "Xin vui lòng nói lại ạ.", use: "잘 못 들었을 때 바로 다시 요청하기", useVi: "Xin người nói lặp lại ngay khi em nghe chưa rõ." },
        { ko: "즉, ~라는 말씀이세요?", vi: "Ý anh/chị là ... đúng không ạ?", use: "상대 말을 내 말로 다시 확인하기", useVi: "Diễn đạt lại bằng lời của mình để xác nhận ý của đối phương." },
        { ko: "핵심은 ~~ 맞나요?", vi: "Ý chính là ... đúng không ạ?", use: "긴 설명에서 핵심만 요약해 확인하기", useVi: "Tóm tắt ý chính trong lời giải thích dài để hỏi lại." },
        { ko: "제가 제대로 들었는지 확인하고 싶어요.", vi: "Em muốn kiểm tra xem mình nghe đúng chưa ạ.", use: "공손하게 확인 질문 열기", useVi: "Mở đầu câu hỏi xác nhận một cách lịch sự." }
    ];
    const INSTRUCTION_UI_TEXT = {
        ko: {
            languageLabel: "안내 언어",
            languageKo: "한국어",
            languageVi: "Tiếng Việt",
            languageHelp: "안내·설명·지시만 베트남어로 바꾸고, 학습용 한국어 표현은 그대로 둡니다.",
            routineTitle: "학습 루틴",
            anchorAria: "학습 항목 바로가기",
            preListeningTitle: "듣기 전 활동",
            preListeningCopy: "시각 자료와 핵심 어휘를 보고 장면을 예측한 뒤, 화자 관계와 담화 유형까지 먼저 짚어 보세요.",
            sceneTitle: "상황 그림",
            sceneCaption: "핵심 상황을 먼저 떠올리며 배경지식을 활성화해 보세요.",
            vocabShow: "뜻 보기",
            vocabHide: "뜻 닫기",
            predictionRelation: "화자 관계 예측",
            predictionGenre: "담화 유형 예측",
            predictionCheck: "예측 확인",
            predictionFeedbackInitial: "먼저 선택하고, 왜 그렇게 생각했는지 짧게 말해 본 뒤 확인해 보세요.",
            backgroundPromptTitle: "배경지식 메모",
            audioTitle: "듣기 조절",
            audioCopy: "실제 음원은 속도를 조절하고, 문장 구간 반복과 쉐도잉은 아래 문장 연습에서 브라우저 한국어 음성으로 지원합니다.",
            originalAudio: "원음 듣기",
            audioUnsupported: "브라우저가 오디오 재생을 지원하지 않습니다.",
            loopOn: "본문 반복 ON",
            loopOff: "본문 반복 OFF",
            stopLineSpeech: "문장 음성 멈추기",
            noAudioSupport: "원음 파일이 없어서 브라우저 한국어 음성으로 전체 대화와 문장 연습을 제공합니다.",
            playDialogue: "전체 대화 TTS 듣기",
            stopAudio: "음성 멈추기",
            subtitleHelp: "자막은 1회 청취 후 핵심어, 2회 후 전체 대본, 3회 후 한국어+베트남어가 열립니다.",
            listenCount(count) {
                return `현재 청취 횟수: ${count}회`;
            },
            listenBadge(count) {
                return `청취 ${count}회`;
            },
            subtitleTitle: "단계적 자막 공개",
            sentenceTitle: "문장 구간 반복 · 쉐도잉",
            sentenceCopy: "문장 듣기 → 2회 반복 → 쉐도잉 흐름으로 따라 해 보세요. 자막 단계에 따라 보이는 정보가 달라집니다.",
            sentenceNumber(index) {
                return `문장 ${index}`;
            },
            playLine: "문장 듣기",
            repeatLine: "2회 반복",
            shadowLine: "쉐도잉",
            lineStatusInitial: "문장 단위 연습을 시작하면 청취 횟수도 함께 기록됩니다.",
            hiddenPreview: "자막 없음 단계입니다. 먼저 듣고 의미를 떠올려 보세요.",
            subtitleClosed: "자막을 잠시 닫아 두었습니다. 먼저 귀로만 들으면서 인물 관계와 핵심 사건을 떠올려 보세요.",
            currentStage(label, unlocked) {
                return `현재 단계: ${label} · 현재 ${unlocked}단계까지 열림 · 1회 후 핵심어, 2회 후 전체 대본, 3회 후 한국어+베트남어를 확인하세요.`;
            },
            dictoglossTitle: "딕토글로스 / 재구성",
            dictoglossCheck: "재구성 점검",
            dictoglossModel: "모범 요약 보기",
            dictoglossInitial: "핵심어를 얼마나 살렸는지 먼저 스스로 점검해 보세요.",
            modelSummary: "모범 요약",
            noteTitle: "노트 필기 템플릿",
            noteCopy: "유학생 듣기 상황을 고려해 3칸 노트와 Cornell 형식을 모두 넣었습니다. 편한 방식으로 메모해 보세요.",
            noteTabThree: "3칸 노트",
            noteTabCornell: "Cornell",
            noteKeywords: "핵심어",
            noteDetails: "세부 내용",
            noteQuestions: "내 질문",
            noteCue: "단서 / Cue",
            noteNotes: "노트 / Notes",
            noteSummary: "요약 / Summary",
            clarificationTitle: "명료화 표현 훈련",
            clarificationAdd: "문장 넣기",
            clarificationSpeak: "발음 듣기",
            clarificationBox: "내가 다시 묻기",
            clarificationStatusInitial: "표현을 눌러 문장을 넣고, 상황에 맞게 바꿔 말해 보세요.",
            oralTitle: "구어 문법 / 담화표지 하이라이트",
            oralCopy: "전체 대본 단계에서 아래 항목들이 본문에 강조 표시됩니다. 회화체가 어떤 뉘앙스를 만드는지 함께 봅니다.",
            footer: "듣기 전략과 말하기 연습을 한 화면에서 이어지도록 재구성했습니다.",
            predictionMissing: "화자 관계와 담화 유형을 모두 고른 뒤 확인해 주세요.",
            predictionRelationResult(label) {
                return `화자 관계: ${label}`;
            },
            predictionGenreResult(label) {
                return `담화 유형: ${label}`;
            },
            predictionSuccess: "예측이 잘 맞았습니다.",
            predictionAdjust: "예측을 조정해 보세요.",
            stageLocked(stageId, label) {
                return `이 단계는 아직 잠겨 있습니다. 최소 ${stageId}회 이상 들어야 ${label} 단계가 열립니다.`;
            },
            speedChanged(speed) {
                return `재생 속도를 ${speed.toFixed(1)}배로 바꿨습니다.`;
            },
            loopOnStatus: "본문 반복을 켰습니다.",
            loopOffStatus: "본문 반복을 껐습니다.",
            lineUnsupported: "브라우저가 음성 합성을 지원하지 않아 문장 연습을 실행할 수 없습니다.",
            linePlayOnce(index) {
                return `문장 ${index}을 한 번 듣습니다.`;
            },
            linePlayRepeat(index) {
                return `문장 ${index}을 두 번 반복합니다.`;
            },
            lineShadowStart(index) {
                return `문장 ${index}을 듣고, 잠시 따라 말한 뒤 다시 듣습니다.`;
            },
            lineShadowPrompt: "이제 따라 말해 보세요. 잠시 뒤 같은 문장을 다시 들려줍니다.",
            lineFinished(index) {
                return `문장 ${index} 연습을 마쳤습니다.`;
            },
            dialogueUnsupported: "브라우저가 음성 합성을 지원하지 않아 전체 대화를 재생할 수 없습니다.",
            dialoguePlaying: "전체 대화를 한국어 음성으로 재생합니다.",
            dialogueFinished: "전체 대화 재생을 마쳤습니다.",
            clarificationUnsupported: "브라우저가 음성 합성을 지원하지 않습니다.",
            clarificationHeard(expression) {
                return `표현을 들었습니다: ${expression}`;
            },
            clarificationAdded: "표현을 연습 상자에 넣었습니다. 상황에 맞게 바꿔 써 보세요.",
            dictoglossEmpty: "먼저 내용을 재구성해서 적어 보세요.",
            dictoglossMatched(matched, total) {
                return `포착한 핵심어 ${matched}/${total}`;
            },
            dictoglossMissing: "보강할 핵심어",
            dictoglossAllClear: "핵심어를 모두 살렸습니다.",
            none: "없음",
            audioPlaying: "원음을 재생하고 있습니다.",
            speechStopped: "음성을 멈췄습니다.",
            listenUnlocked(count, label) {
                return `청취 ${count}회 기록 완료. 이제 ${label} 단계가 열렸습니다.`;
            },
            listenRecorded(count) {
                return `청취 ${count}회 기록 완료. 필요하면 자막 단계를 한 단계 올려 보세요.`;
            }
        },
        vi: {
            languageLabel: "Ngôn ngữ hướng dẫn",
            languageKo: "한국어",
            languageVi: "Tiếng Việt",
            languageHelp: "Chỉ đổi phần hướng dẫn, giải thích và chỉ dẫn sang tiếng Việt; các biểu hiện tiếng Hàn dùng để học vẫn giữ nguyên.",
            routineTitle: "Quy trình học",
            anchorAria: "Đi nhanh đến từng mục học",
            preListeningTitle: "Hoạt động trước khi nghe",
            preListeningCopy: "Nhìn tài liệu gợi ý và từ vựng chính để đoán tình huống trước, sau đó xác định quan hệ giữa người nói và loại hội thoại.",
            sceneTitle: "Tranh tình huống",
            sceneCaption: "Hãy gợi ra tình huống chính trước để kích hoạt kiến thức nền.",
            vocabShow: "Xem nghĩa",
            vocabHide: "Ẩn nghĩa",
            predictionRelation: "Dự đoán quan hệ giữa người nói",
            predictionGenre: "Dự đoán loại hội thoại",
            predictionCheck: "Kiểm tra dự đoán",
            predictionFeedbackInitial: "Hãy chọn trước, nói ngắn gọn vì sao em nghĩ như vậy rồi mới kiểm tra.",
            backgroundPromptTitle: "Ghi chú kiến thức nền",
            audioTitle: "Điều chỉnh nghe",
            audioCopy: "Âm thanh gốc có thể điều chỉnh tốc độ, còn lặp lại từng câu và shadowing được hỗ trợ bằng giọng đọc tiếng Hàn của trình duyệt ở phần bên dưới.",
            originalAudio: "Nghe file gốc",
            audioUnsupported: "Trình duyệt không hỗ trợ phát audio.",
            loopOn: "Lặp lại nội dung ON",
            loopOff: "Lặp lại nội dung OFF",
            stopLineSpeech: "Dừng giọng đọc câu",
            noAudioSupport: "Không có file âm thanh gốc nên trình duyệt sẽ đọc toàn bộ hội thoại và từng câu bằng giọng Hàn.",
            playDialogue: "Nghe toàn bộ hội thoại TTS",
            stopAudio: "Dừng âm thanh",
            subtitleHelp: "Sau 1 lần nghe sẽ mở từ khóa, sau 2 lần sẽ mở toàn văn, sau 3 lần sẽ mở tiếng Hàn + tiếng Việt.",
            listenCount(count) {
                return `Số lần nghe hiện tại: ${count}`;
            },
            listenBadge(count) {
                return `Đã nghe ${count} lần`;
            },
            subtitleTitle: "Mở phụ đề theo từng bước",
            sentenceTitle: "Lặp lại từng câu · Shadowing",
            sentenceCopy: "Hãy luyện theo trình tự nghe câu -> lặp lại 2 lần -> shadowing. Thông tin hiện ra sẽ thay đổi theo bước phụ đề.",
            sentenceNumber(index) {
                return `Câu ${index}`;
            },
            playLine: "Nghe câu",
            repeatLine: "Lặp lại 2 lần",
            shadowLine: "Shadowing",
            lineStatusInitial: "Khi bắt đầu luyện theo từng câu, số lần nghe cũng sẽ được ghi lại.",
            hiddenPreview: "Đây là bước không có phụ đề. Hãy nghe trước và đoán nghĩa.",
            subtitleClosed: "Tạm thời đang đóng phụ đề. Hãy nghe bằng tai trước và nghĩ về quan hệ giữa nhân vật cùng sự kiện chính.",
            currentStage(label, unlocked) {
                return `Bước hiện tại: ${label} · hiện mở đến bước ${unlocked} · sau 1 lần nghe mở từ khóa, sau 2 lần mở toàn văn, sau 3 lần mở tiếng Hàn + tiếng Việt.`;
            },
            dictoglossTitle: "Dictogloss / Tái cấu trúc",
            dictoglossCheck: "Kiểm tra bài tái cấu trúc",
            dictoglossModel: "Xem tóm tắt mẫu",
            dictoglossInitial: "Trước tiên hãy tự kiểm tra xem em đã giữ được bao nhiêu từ khóa.",
            modelSummary: "Tóm tắt mẫu",
            noteTitle: "Mẫu ghi chú",
            noteCopy: "Để phù hợp với người học quốc tế, trang này có cả ghi chú 3 cột và Cornell. Em có thể chọn cách nào thuận tiện hơn.",
            noteTabThree: "Ghi chú 3 cột",
            noteTabCornell: "Cornell",
            noteKeywords: "Từ khóa",
            noteDetails: "Chi tiết",
            noteQuestions: "Câu hỏi của em",
            noteCue: "Gợi ý / Cue",
            noteNotes: "Ghi chú / Notes",
            noteSummary: "Tóm tắt / Summary",
            clarificationTitle: "Luyện biểu hiện hỏi lại",
            clarificationAdd: "Chèn vào câu",
            clarificationSpeak: "Nghe phát âm",
            clarificationBox: "Tự mình hỏi lại",
            clarificationStatusInitial: "Hãy bấm vào biểu hiện để chèn vào ô luyện tập, rồi đổi cho phù hợp với tình huống.",
            oralTitle: "Điểm nhấn ngữ pháp khẩu ngữ / dấu hiệu hội thoại",
            oralCopy: "Ở bước xem toàn văn, các mục dưới đây sẽ được đánh dấu trong bài. Hãy xem chung để cảm nhận sắc thái hội thoại.",
            footer: "Trang này được sắp xếp lại để chiến lược nghe và luyện nói nối liền nhau trên cùng một màn hình.",
            predictionMissing: "Hãy chọn cả quan hệ giữa người nói và loại hội thoại rồi mới kiểm tra.",
            predictionRelationResult(label) {
                return `Quan hệ giữa người nói: ${label}`;
            },
            predictionGenreResult(label) {
                return `Loại hội thoại: ${label}`;
            },
            predictionSuccess: "Dự đoán của em rất chính xác.",
            predictionAdjust: "Hãy điều chỉnh lại dự đoán.",
            stageLocked(stageId, label) {
                return `Bước này vẫn đang khóa. Em cần nghe ít nhất ${stageId} lần thì mới mở được bước ${label}.`;
            },
            speedChanged(speed) {
                return `Đã đổi tốc độ phát thanh ${speed.toFixed(1)}x.`;
            },
            loopOnStatus: "Đã bật lặp lại nội dung.",
            loopOffStatus: "Đã tắt lặp lại nội dung.",
            lineUnsupported: "Trình duyệt không hỗ trợ tổng hợp giọng nói nên không thể luyện từng câu.",
            linePlayOnce(index) {
                return `Đang nghe câu ${index} một lần.`;
            },
            linePlayRepeat(index) {
                return `Đang lặp lại câu ${index} hai lần.`;
            },
            lineShadowStart(index) {
                return `Nghe câu ${index}, nói theo trong giây lát rồi nghe lại thêm một lần nữa.`;
            },
            lineShadowPrompt: "Bây giờ em hãy nói theo. Một lúc nữa hệ thống sẽ đọc lại cùng câu đó.",
            lineFinished(index) {
                return `Đã hoàn thành luyện câu ${index}.`;
            },
            dialogueUnsupported: "Trình duyệt không hỗ trợ tổng hợp giọng nói nên không thể phát toàn bộ hội thoại.",
            dialoguePlaying: "Đang phát toàn bộ hội thoại bằng giọng Hàn.",
            dialogueFinished: "Đã phát xong toàn bộ hội thoại.",
            clarificationUnsupported: "Trình duyệt không hỗ trợ tổng hợp giọng nói.",
            clarificationHeard(expression) {
                return `Đã nghe biểu hiện: ${expression}`;
            },
            clarificationAdded: "Đã chèn biểu hiện vào ô luyện tập. Hãy sửa lại cho hợp tình huống.",
            dictoglossEmpty: "Hãy viết lại nội dung trước đã.",
            dictoglossMatched(matched, total) {
                return `Số từ khóa em đã bắt được: ${matched}/${total}`;
            },
            dictoglossMissing: "Từ khóa nên bổ sung",
            dictoglossAllClear: "Em đã giữ được tất cả từ khóa.",
            none: "không có",
            audioPlaying: "Đang phát file gốc.",
            speechStopped: "Đã dừng âm thanh.",
            listenUnlocked(count, label) {
                return `Đã ghi nhận ${count} lần nghe. Bây giờ bước ${label} đã được mở.`;
            },
            listenRecorded(count) {
                return `Đã ghi nhận ${count} lần nghe. Nếu cần, em có thể nâng lên một bước phụ đề.`;
            }
        }
    };
    const QUIZ_UI_TEXT = {
        ko: {
            languageLabel: "문제·해설 언어 / Ngôn ngữ câu hỏi",
            languageKo: "한국어",
            languageVi: "Tiếng Việt",
            languageHelp: "한국어 문제를 이해하기 어렵다면 여기서 바로 베트남어로 바꿔서 문제와 해설을 읽을 수 있습니다.",
            guideTitle: "지금 할 일",
            guideText: "1. 문제를 읽습니다. 2. 한 번 더 듣고 답을 고릅니다. 3. 채점 후 해설을 읽으며 근거 문장을 다시 확인합니다.",
            submit: "채점하기",
            reset: "다시 풀기",
            statusInitial: "문제를 모두 풀고 채점해 보세요.",
            statusIncomplete: "모든 문항에 답한 뒤 채점해 주세요.",
            statusResult(total, score) {
                return `${total}문항 중 ${score}문항 정답입니다. 해설까지 읽고 다시 들으면 훨씬 안정됩니다.`;
            }
        },
        vi: {
            languageLabel: "문제·해설 언어 / Ngôn ngữ câu hỏi",
            languageKo: "한국어",
            languageVi: "Tiếng Việt",
            languageHelp: "Nếu khó hiểu câu hỏi tiếng Hàn, em có thể đổi sang tiếng Việt để đọc cả câu hỏi và phần giải thích.",
            guideTitle: "Bây giờ cần làm gì?",
            guideText: "1. Đọc câu hỏi. 2. Nghe lại và chọn đáp án. 3. Sau khi chấm, đọc phần giải thích để tìm câu làm căn cứ.",
            submit: "Chấm điểm",
            reset: "Làm lại",
            statusInitial: "Hãy trả lời tất cả câu hỏi rồi bấm chấm điểm.",
            statusIncomplete: "Hãy chọn đáp án cho tất cả câu hỏi trước khi chấm.",
            statusResult(total, score) {
                return `Em đúng ${score}/${total} câu. Hãy đọc phần giải thích rồi nghe lại câu căn cứ.`;
            }
        }
    };
    const STAGES = [
        { id: 0, label: "자막 없음", labelVi: "Không có phụ đề", unlock: 0 },
        { id: 1, label: "핵심어만", labelVi: "Chỉ hiện từ khóa", unlock: 1 },
        { id: 2, label: "전체 대본", labelVi: "Toàn bộ văn bản", unlock: 2 },
        { id: 3, label: "한국어 + 베트남어", labelVi: "Tiếng Hàn + Tiếng Việt", unlock: 3 }
    ];

    const lessonMap = new Map();
    const lessonState = new Map();
    const quizState = new Map();
    let pageConfig = null;
    let koreanVoice = null;
    let instructionLanguage = "ko";
    let hasInitialized = false;

    const speechApi = "speechSynthesis" in window ? window.speechSynthesis : null;
    const speechState = {
        token: 0,
        timeouts: [],
        activeLessonId: null
    };

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function pageKey() {
        return (window.location.pathname || "listening-page").toLowerCase();
    }

    function storageKey(lessonId, field) {
        return `${STORAGE_PREFIX}:${pageKey()}:${lessonId}:${field}`;
    }

    function instructionStorageKey() {
        return `${STORAGE_PREFIX}:${pageKey()}:page:instruction-language`;
    }

    function readStorage(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            return false;
        }
        return true;
    }

    function normalizeText(value) {
        return String(value == null ? "" : value)
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[.,!?~'"“”‘’\-()/]/g, "");
    }

    function hasInstructionLanguageToggle(config = pageConfig) {
        return Boolean(config && config.instructionLanguage && config.instructionLanguage.enabled);
    }

    function readInstructionLanguage(config = pageConfig) {
        if (!hasInstructionLanguageToggle(config)) return "ko";
        const saved = readStorage(instructionStorageKey(), config.instructionLanguage.default || "ko");
        return saved === "vi" ? "vi" : "ko";
    }

    function getInstructionLanguage() {
        if (!hasInstructionLanguageToggle()) return "ko";
        return instructionLanguage === "vi" ? "vi" : "ko";
    }

    function getInstructionText() {
        return INSTRUCTION_UI_TEXT[getInstructionLanguage()];
    }

    function chooseLocalizedText(koValue, viValue, fallback = "") {
        const base = koValue == null ? fallback : koValue;
        if (getInstructionLanguage() === "vi" && viValue != null && viValue !== "") {
            return viValue;
        }
        return base == null ? "" : base;
    }

    function getLocalizedField(source, key, fallback = "") {
        if (!source) return fallback;
        return chooseLocalizedText(source[key], source[`${key}Vi`], fallback);
    }

    function getLocalizedNotePrompt(lesson, key, fallback) {
        if (getInstructionLanguage() === "vi" && lesson.notePromptsVi && lesson.notePromptsVi[key]) {
            return lesson.notePromptsVi[key];
        }
        if (lesson.notePrompts && lesson.notePrompts[key]) {
            return lesson.notePrompts[key];
        }
        return fallback;
    }

    function getStageLabel(stage) {
        if (!stage) return "";
        return chooseLocalizedText(stage.label, stage.labelVi, stage.label);
    }

    function getFeatureList(config) {
        if (getInstructionLanguage() === "vi" && Array.isArray(config.featureListVi) && config.featureListVi.length) {
            return config.featureListVi;
        }
        if (Array.isArray(config.featureList) && config.featureList.length) {
            return config.featureList;
        }
        return DEFAULT_FEATURES[getInstructionLanguage()];
    }

    function getRoutine(config) {
        if (getInstructionLanguage() === "vi" && Array.isArray(config.routineVi) && config.routineVi.length) {
            return config.routineVi;
        }
        if (Array.isArray(config.routine) && config.routine.length) {
            return config.routine;
        }
        return DEFAULT_ROUTINE[getInstructionLanguage()];
    }

    function getQuizLanguage(state) {
        return state.quizLanguage === "vi" ? "vi" : "ko";
    }

    function getQuizText(language) {
        return QUIZ_UI_TEXT[language === "vi" ? "vi" : "ko"];
    }

    function getQuestionPrompt(question, language) {
        if (language === "vi" && question.promptVi) return question.promptVi;
        return question.prompt || "";
    }

    function getQuestionExplanation(question, language) {
        if (language === "vi" && question.explanationVi) return question.explanationVi;
        return question.explanation || "";
    }

    function getOptionLabel(option, language) {
        if (language === "vi" && option.labelVi) return option.labelVi;
        return option.label || "";
    }

    function getLessonQuizTitle(lesson, language) {
        if (language === "vi" && lesson.quizTitleVi) return lesson.quizTitleVi;
        return lesson.quizTitle || "이해 점검";
    }

    function getLessonQuizGuide(lesson, language) {
        if (language === "vi") {
            return lesson.quizGuideVi || getQuizText("vi").guideText;
        }
        return lesson.quizGuideKo || getQuizText("ko").guideText;
    }

    function createInitialState(lesson) {
        const listens = Number(readStorage(storageKey(lesson.id, "listens"), 0)) || 0;
        const stage = Number(readStorage(storageKey(lesson.id, "stage"), 0)) || 0;
        const speed = Number(readStorage(storageKey(lesson.id, "speed"), 1)) || 1;
        const loop = Boolean(readStorage(storageKey(lesson.id, "loop"), false));
        const noteTab = readStorage(storageKey(lesson.id, "note-tab"), "three");
        const quizLanguage = readStorage(storageKey(lesson.id, "quiz-language"), "ko");
        return {
            listens,
            stage,
            speed,
            loop,
            noteTab: noteTab === "cornell" ? "cornell" : "three",
            quizLanguage: quizLanguage === "vi" ? "vi" : "ko"
        };
    }

    function getState(lessonId) {
        if (!lessonState.has(lessonId)) {
            const lesson = lessonMap.get(lessonId);
            lessonState.set(lessonId, createInitialState(lesson));
        }
        return lessonState.get(lessonId);
    }

    function getUnlockedStage(listens) {
        if (listens >= 3) return 3;
        if (listens >= 2) return 2;
        if (listens >= 1) return 1;
        return 0;
    }

    function syncState(lessonId) {
        const state = getState(lessonId);
        const unlocked = getUnlockedStage(state.listens);
        if (state.stage > unlocked) state.stage = unlocked;
        writeStorage(storageKey(lessonId, "listens"), state.listens);
        writeStorage(storageKey(lessonId, "stage"), state.stage);
        writeStorage(storageKey(lessonId, "speed"), state.speed);
        writeStorage(storageKey(lessonId, "loop"), state.loop);
        writeStorage(storageKey(lessonId, "note-tab"), state.noteTab);
        writeStorage(storageKey(lessonId, "quiz-language"), getQuizLanguage(state));
    }

    function buildHero(config) {
        const uiText = getInstructionText();
        const features = getFeatureList(config)
            .map((feature) => `<span class="lw-pill">${escapeHtml(feature)}</span>`)
            .join("");
        const routine = getRoutine(config);
        const showToggle = hasInstructionLanguageToggle(config);

        return `
            <section class="lw-hero">
                <div class="lw-hero-grid">
                    <div>
                        <span class="lw-kicker">${escapeHtml(getLocalizedField(config, "kicker", "Listening Studio"))}</span>
                        <h1>${escapeHtml(getLocalizedField(config, "title", document.title || "듣기 학습"))}</h1>
                        <p>${escapeHtml(getLocalizedField(config, "description", "듣기 전 활동부터 단계적 자막, 문장 반복, 쉐도잉까지 한 흐름으로 학습할 수 있게 재구성했습니다."))}</p>
                        ${showToggle ? `
                            <div class="lw-instruction-bar">
                                <strong>${escapeHtml(uiText.languageLabel)}</strong>
                                <button type="button" class="lw-note-tab${getInstructionLanguage() === "ko" ? " is-active" : ""}" data-action="set-instruction-language" data-instruction-language="ko">${escapeHtml(uiText.languageKo)}</button>
                                <button type="button" class="lw-note-tab${getInstructionLanguage() === "vi" ? " is-active" : ""}" data-action="set-instruction-language" data-instruction-language="vi">${escapeHtml(uiText.languageVi)}</button>
                                <div class="lw-instruction-help">${escapeHtml(uiText.languageHelp)}</div>
                            </div>
                        ` : ""}
                        <div class="lw-pill-list">${features}</div>
                    </div>
                    <aside class="lw-routine">
                        <h2>${escapeHtml(uiText.routineTitle)}</h2>
                        ${routine.map((item, index) => `
                            <div class="lw-routine-step">
                                <span>${index + 1}</span>
                                <div>
                                    <strong>${escapeHtml(getLocalizedField(item, "title", ""))}</strong>
                                    <p>${escapeHtml(getLocalizedField(item, "body", ""))}</p>
                                </div>
                            </div>
                        `).join("")}
                    </aside>
                </div>
            </section>
        `;
    }

    function buildAnchorList(config) {
        return `
            <nav class="lw-anchor-list" aria-label="${escapeHtml(getInstructionText().anchorAria)}">
                ${config.lessons.map((lesson, index) => `
                    <a href="#lesson-${escapeHtml(lesson.id)}">
                        <span>${escapeHtml(lesson.label || `듣기 ${index + 1}`)}</span>
                        <strong>${escapeHtml(getLocalizedField(lesson, "title", lesson.title || `듣기 ${index + 1}`))}</strong>
                    </a>
                `).join("")}
            </nav>
        `;
    }

    function buildScene(scene) {
        return `
            <div class="lw-scene">
                <div class="lw-scene-top">
                    <div class="lw-scene-icon" aria-hidden="true">${escapeHtml(scene.emoji || "🎧")}</div>
                    <div>
                        <div class="lw-scene-title">${escapeHtml(getLocalizedField(scene, "title", getInstructionText().sceneTitle))}</div>
                        <div class="lw-scene-caption">${escapeHtml(getLocalizedField(scene, "caption", getInstructionText().sceneCaption))}</div>
                    </div>
                </div>
                <div class="lw-scene-tags">
                    ${(scene.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
                </div>
            </div>
        `;
    }

    function buildVocab(lesson) {
        const uiText = getInstructionText();
        return `
            <div class="lw-vocab-grid">
                ${(lesson.preListening.vocab || []).map((item, index) => `
                    <article class="lw-vocab-card" data-open="false" id="vocab-${escapeHtml(lesson.id)}-${index}">
                        <div class="lw-vocab-head">
                            <div class="lw-vocab-ko">${escapeHtml(item.ko)}</div>
                            <button type="button" class="lw-chip-button" data-action="toggle-vocab" data-lesson-id="${escapeHtml(lesson.id)}" data-vocab-index="${index}">${escapeHtml(uiText.vocabShow)}</button>
                        </div>
                        <div class="lw-vocab-hint">${escapeHtml(item.hint || "")}</div>
                        <div class="lw-vocab-vi">${escapeHtml(item.vi || "")}</div>
                    </article>
                `).join("")}
            </div>
        `;
    }

    function buildPredictionGroup(name, title, options) {
        return `
            <div class="lw-prediction-box">
                <strong>${escapeHtml(title)}</strong>
                <div class="lw-radio-list">
                    ${options.map((option) => `
                        <label>
                            <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(option.value)}">
                            <span>${escapeHtml(option.label)}</span>
                        </label>
                    `).join("")}
                </div>
            </div>
        `;
    }

    function buildPreListening(lesson) {
        const uiText = getInstructionText();
        return `
            <section class="lw-section">
                <h3>${escapeHtml(uiText.preListeningTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(uiText.preListeningCopy)}</p>
                ${buildScene(lesson.scene || {})}
                <div class="lw-grid" style="margin-top: 14px;">
                    ${buildVocab(lesson)}
                    <div class="lw-prediction-grid">
                        ${buildPredictionGroup(`rel-${lesson.id}`, uiText.predictionRelation, lesson.preListening.relationshipOptions || [])}
                        ${buildPredictionGroup(`genre-${lesson.id}`, uiText.predictionGenre, lesson.preListening.genreOptions || [])}
                    </div>
                    <div class="lw-inline-actions">
                        <button type="button" class="lw-button" data-action="check-prediction" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.predictionCheck)}</button>
                    </div>
                    <div id="prediction-feedback-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(uiText.predictionFeedbackInitial)}</div>
                    <div class="lw-summary-block">
                        <strong>${escapeHtml(getLocalizedField(lesson.preListening, "backgroundPromptTitle", uiText.backgroundPromptTitle))}</strong>
                        <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "background-note"))}" placeholder="${escapeHtml(getLocalizedField(lesson.preListening, "backgroundPrompt", "이 상황에서 가장 먼저 나올 내용이나 질문을 한두 문장으로 적어 보세요."))}"></textarea>
                    </div>
                </div>
            </section>
        `;
    }

    function buildAudioSection(lesson) {
        const state = getState(lesson.id);
        const uiText = getInstructionText();
        const playerMarkup = lesson.audioSrc
            ? `
                <div class="lw-audio-wrap">
                    <strong>${escapeHtml(uiText.originalAudio)}</strong>
                    <audio id="audio-${escapeHtml(lesson.id)}" controls preload="metadata">
                        <source src="${escapeHtml(lesson.audioSrc)}" type="audio/mpeg">
                        ${escapeHtml(uiText.audioUnsupported)}
                    </audio>
                </div>
                <div class="lw-inline-actions" style="margin-top: 12px;">
                    <button type="button" class="lw-button-secondary lw-button" data-action="toggle-loop" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(state.loop ? uiText.loopOn : uiText.loopOff)}</button>
                    <button type="button" class="lw-button-secondary lw-button" data-action="stop-speech" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.stopLineSpeech)}</button>
                </div>
            `
            : `
                <div class="lw-help-box">${escapeHtml(uiText.noAudioSupport)}</div>
                <div class="lw-inline-actions" style="margin-top: 12px;">
                    <button type="button" class="lw-button" data-action="play-dialogue" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.playDialogue)}</button>
                    <button type="button" class="lw-button-secondary lw-button" data-action="stop-speech" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.stopAudio)}</button>
                </div>
            `;

        return `
            <section class="lw-section">
                <h3>${escapeHtml(uiText.audioTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(uiText.audioCopy)}</p>
                ${playerMarkup}
                <div class="lw-speed-row" style="margin-top: 14px;">
                    ${[0.8, 1.0, 1.2].map((speed) => `
                        <button type="button" class="lw-speed-button${state.speed === speed ? " is-active" : ""}" data-action="set-speed" data-lesson-id="${escapeHtml(lesson.id)}" data-speed="${speed.toFixed(1)}">${speed.toFixed(1)}배</button>
                    `).join("")}
                </div>
                <div class="lw-help-box">${escapeHtml(uiText.subtitleHelp)}</div>
                <div id="listen-status-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(uiText.listenCount(state.listens))}</div>
            </section>
        `;
    }

    function buildSubtitleSection(lesson) {
        const uiText = getInstructionText();
        return `
            <section class="lw-section">
                <h3>${escapeHtml(uiText.subtitleTitle)}</h3>
                <div class="lw-stage-row">
                    ${STAGES.map((stage) => `
                        <button type="button" class="lw-stage-button" data-action="set-stage" data-lesson-id="${escapeHtml(lesson.id)}" data-stage="${stage.id}">
                            ${escapeHtml(getStageLabel(stage))}
                        </button>
                    `).join("")}
                </div>
                <div id="stage-meta-${escapeHtml(lesson.id)}" class="lw-help-box"></div>
                <div id="transcript-${escapeHtml(lesson.id)}" class="lw-transcript-panel"></div>
            </section>
        `;
    }

    function buildSentenceTrainer(lesson) {
        const uiText = getInstructionText();
        return `
            <section class="lw-section">
                <h3>${escapeHtml(uiText.sentenceTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(uiText.sentenceCopy)}</p>
                <div class="lw-grid">
                    ${lesson.transcript.map((line, index) => `
                        <article class="lw-line-card" id="line-card-${escapeHtml(lesson.id)}-${index}">
                            <div class="lw-line-top">
                                <span>${escapeHtml(uiText.sentenceNumber(index + 1))}</span>
                                <span>${escapeHtml(line.speaker)}</span>
                            </div>
                            <div id="line-preview-${escapeHtml(lesson.id)}-${index}"></div>
                            <div class="lw-line-actions" style="margin-top: 12px;">
                                <button type="button" class="lw-line-button" data-action="play-line" data-lesson-id="${escapeHtml(lesson.id)}" data-line-index="${index}">${escapeHtml(uiText.playLine)}</button>
                                <button type="button" class="lw-line-button" data-action="repeat-line" data-lesson-id="${escapeHtml(lesson.id)}" data-line-index="${index}">${escapeHtml(uiText.repeatLine)}</button>
                                <button type="button" class="lw-line-button" data-action="shadow-line" data-lesson-id="${escapeHtml(lesson.id)}" data-line-index="${index}">${escapeHtml(uiText.shadowLine)}</button>
                            </div>
                        </article>
                    `).join("")}
                </div>
                <div id="line-status-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(uiText.lineStatusInitial)}</div>
            </section>
        `;
    }

    function buildDictogloss(lesson) {
        const uiText = getInstructionText();
        return `
            <section class="lw-section">
                <h3>${escapeHtml(uiText.dictoglossTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(getLocalizedField(lesson.dictogloss, "prompt", "2~3회 들은 뒤 아래 핵심어만 보고 전체 내용을 다시 구성해 보세요."))}</p>
                <div class="lw-keyword-pack">
                    ${(lesson.dictogloss.keywords || []).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}
                </div>
                <textarea id="dictogloss-input-${escapeHtml(lesson.id)}" class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "dictogloss"))}" placeholder="${escapeHtml(getLocalizedField(lesson.dictogloss, "placeholder", "핵심어를 활용해 내용을 한국어로 재구성해 보세요."))}" style="margin-top: 14px;"></textarea>
                <div class="lw-inline-actions" style="margin-top: 12px;">
                    <button type="button" class="lw-button" data-action="check-dictogloss" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.dictoglossCheck)}</button>
                    <button type="button" class="lw-button-secondary lw-button" data-action="toggle-model-summary" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.dictoglossModel)}</button>
                </div>
                <div id="dictogloss-feedback-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(uiText.dictoglossInitial)}</div>
                <div id="model-summary-${escapeHtml(lesson.id)}" class="lw-summary-block" hidden>
                    <strong>${escapeHtml(uiText.modelSummary)}</strong>
                    <div style="font-size: 14px; line-height: 1.8; color: #475569;">${escapeHtml(lesson.dictogloss.modelSummary || "")}</div>
                </div>
            </section>
        `;
    }

    function buildNoteSection(lesson) {
        const uiText = getInstructionText();
        return `
            <section class="lw-section">
                <h3>${escapeHtml(uiText.noteTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(uiText.noteCopy)}</p>
                <div class="lw-note-tabs">
                    <button type="button" class="lw-note-tab" data-action="set-note-tab" data-lesson-id="${escapeHtml(lesson.id)}" data-note-tab="three">${escapeHtml(uiText.noteTabThree)}</button>
                    <button type="button" class="lw-note-tab" data-action="set-note-tab" data-lesson-id="${escapeHtml(lesson.id)}" data-note-tab="cornell">${escapeHtml(uiText.noteTabCornell)}</button>
                </div>
                <div id="note-three-${escapeHtml(lesson.id)}" class="lw-note-panel">
                    <div class="lw-three-grid">
                        <div class="lw-note-block">
                            <strong>${escapeHtml(uiText.noteKeywords)}</strong>
                            <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "note-three-keywords"))}" placeholder="${escapeHtml(getLocalizedNotePrompt(lesson, "keywords", "반복해서 들리는 낱말, 인물, 장소, 사건"))}"></textarea>
                        </div>
                        <div class="lw-note-block">
                            <strong>${escapeHtml(uiText.noteDetails)}</strong>
                            <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "note-three-details"))}" placeholder="${escapeHtml(getLocalizedNotePrompt(lesson, "details", "핵심 근거, 순서, 이유, 결과"))}"></textarea>
                        </div>
                        <div class="lw-note-block">
                            <strong>${escapeHtml(uiText.noteQuestions)}</strong>
                            <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "note-three-questions"))}" placeholder="${escapeHtml(getLocalizedNotePrompt(lesson, "questions", "다시 듣고 싶은 부분, 헷갈린 표현"))}"></textarea>
                        </div>
                    </div>
                </div>
                <div id="note-cornell-${escapeHtml(lesson.id)}" class="lw-note-panel">
                    <div class="lw-note-grid">
                        <div class="lw-note-block">
                            <strong>${escapeHtml(uiText.noteCue)}</strong>
                            <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "note-cue"))}" placeholder="${escapeHtml(getLocalizedNotePrompt(lesson, "cue", "질문, 키워드, 연결어"))}"></textarea>
                        </div>
                        <div class="lw-note-block">
                            <strong>${escapeHtml(uiText.noteNotes)}</strong>
                            <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "note-notes"))}" placeholder="${escapeHtml(getLocalizedNotePrompt(lesson, "notes", "들은 내용을 순서대로 적기"))}"></textarea>
                        </div>
                    </div>
                    <div class="lw-summary-block" style="margin-top: 12px;">
                        <strong>${escapeHtml(uiText.noteSummary)}</strong>
                        <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "note-summary"))}" placeholder="${escapeHtml(getLocalizedNotePrompt(lesson, "summary", "한두 문장으로 요약하기"))}"></textarea>
                    </div>
                </div>
            </section>
        `;
    }

    function buildClarificationSection(lesson) {
        const expressions = lesson.clarifications && lesson.clarifications.length
            ? lesson.clarifications
            : DEFAULT_CLARIFICATIONS;
        const uiText = getInstructionText();

        return `
            <section class="lw-section">
                <h3>${escapeHtml(uiText.clarificationTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(getLocalizedField(lesson, "clarificationPrompt", "못 들은 부분을 다시 묻거나, 핵심을 확인하는 표현을 버튼으로 골라 연습해 보세요."))}</p>
                <div class="lw-grid">
                    ${expressions.map((item) => `
                        <div class="lw-expression-card">
                            <strong>${escapeHtml(item.ko)}</strong>
                            <small>${escapeHtml(item.vi)}</small>
                            <div>${escapeHtml(chooseLocalizedText(item.use, item.useVi, item.use || ""))}</div>
                            <div class="lw-chip-row">
                                <button type="button" class="lw-chip-button" data-action="append-expression" data-lesson-id="${escapeHtml(lesson.id)}" data-expression="${escapeHtml(item.ko)}">${escapeHtml(uiText.clarificationAdd)}</button>
                                <button type="button" class="lw-chip-button" data-action="speak-expression" data-lesson-id="${escapeHtml(lesson.id)}" data-expression="${escapeHtml(item.ko)}">${escapeHtml(uiText.clarificationSpeak)}</button>
                            </div>
                        </div>
                    `).join("")}
                </div>
                <div class="lw-summary-block" style="margin-top: 12px;">
                    <strong>${escapeHtml(uiText.clarificationBox)}</strong>
                    <textarea id="clarify-box-${escapeHtml(lesson.id)}" class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "clarify-box"))}" placeholder="${escapeHtml(getLocalizedField(lesson, "clarifyScenario", "예: 신부가 누구인지 못 들었을 때, 핵심 계획을 다시 확인하고 싶을 때 쓸 표현을 조합해 보세요."))}"></textarea>
                </div>
                <div id="clarify-status-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(uiText.clarificationStatusInitial)}</div>
            </section>
        `;
    }

    function buildOralFeatures(lesson) {
        const uiText = getInstructionText();
        return `
            <section class="lw-section">
                <h3>${escapeHtml(uiText.oralTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(uiText.oralCopy)}</p>
                <div class="lw-grid">
                    ${(lesson.oralFeatures || []).map((item) => `
                        <article class="lw-feature-card">
                            <strong><span class="lw-mini-chip">${escapeHtml(item.term)}</span>${escapeHtml(chooseLocalizedText(item.type, item.typeVi, item.type || ""))}</strong>
                            <p>${escapeHtml(chooseLocalizedText(item.note, item.noteVi, item.note || ""))}</p>
                            ${item.extension ? `<p>${escapeHtml(chooseLocalizedText(item.extension, item.extensionVi, item.extension || ""))}</p>` : ""}
                        </article>
                    `).join("")}
                </div>
            </section>
        `;
    }

    function buildQuizSection(lesson) {
        const state = getState(lesson.id);
        const language = getQuizLanguage(state);
        const uiText = getQuizText(language);
        return `
            <section class="lw-section">
                <h3 id="quiz-title-${escapeHtml(lesson.id)}">${escapeHtml(getLessonQuizTitle(lesson, language))}</h3>
                <div class="lw-summary-block" style="margin-bottom: 12px;">
                    <strong id="quiz-guide-title-${escapeHtml(lesson.id)}">${escapeHtml(uiText.guideTitle)}</strong>
                    <div id="quiz-guide-${escapeHtml(lesson.id)}" style="font-size: 14px; line-height: 1.8; color: #475569;">${escapeHtml(getLessonQuizGuide(lesson, language))}</div>
                </div>
                <div class="lw-quiz-language-bar">
                    <strong>${escapeHtml(uiText.languageLabel)}</strong>
                    <button type="button" class="lw-note-tab${language === "ko" ? " is-active" : ""}" data-action="set-quiz-language" data-lesson-id="${escapeHtml(lesson.id)}" data-quiz-language="ko">${escapeHtml(uiText.languageKo)}</button>
                    <button type="button" class="lw-note-tab${language === "vi" ? " is-active" : ""}" data-action="set-quiz-language" data-lesson-id="${escapeHtml(lesson.id)}" data-quiz-language="vi">${escapeHtml(uiText.languageVi)}</button>
                    <div class="lw-quiz-language-help" id="quiz-language-help-${escapeHtml(lesson.id)}">${escapeHtml(uiText.languageHelp)}</div>
                </div>
                <div class="lw-grid">
                    ${(lesson.questions || []).map((question, index) => `
                        <article class="lw-quiz-card" id="quiz-card-${escapeHtml(lesson.id)}-${index}">
                            <strong id="quiz-prompt-${escapeHtml(lesson.id)}-${index}">${index + 1}. ${escapeHtml(getQuestionPrompt(question, language))}</strong>
                            <div class="lw-quiz-options">
                                ${question.options.map((option, optionIndex) => `
                                    <label>
                                        <input type="radio" name="quiz-${escapeHtml(lesson.id)}-${index}" value="${escapeHtml(option.value)}">
                                        <span id="quiz-option-${escapeHtml(lesson.id)}-${index}-${optionIndex}">${escapeHtml(getOptionLabel(option, language))}</span>
                                    </label>
                                `).join("")}
                            </div>
                            <div class="lw-quiz-feedback" id="quiz-feedback-${escapeHtml(lesson.id)}-${index}">${escapeHtml(getQuestionExplanation(question, language))}</div>
                        </article>
                    `).join("")}
                </div>
                <div class="lw-quiz-actions" style="margin-top: 14px;">
                    <button type="button" class="lw-quiz-submit" id="quiz-submit-${escapeHtml(lesson.id)}" data-action="submit-quiz" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.submit)}</button>
                    <button type="button" class="lw-quiz-reset" id="quiz-reset-${escapeHtml(lesson.id)}" data-action="reset-quiz" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.reset)}</button>
                </div>
                <div id="quiz-status-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(uiText.statusInitial)}</div>
            </section>
        `;
    }

    function buildLessonVisual(lesson) {
        if (!lesson.activityImage || !lesson.activityImage.src) return "";

        const caption = getLocalizedField(lesson.activityImage, "caption", "");
        return `
            <figure class="lw-lesson-visual">
                <img src="${escapeHtml(lesson.activityImage.src)}" alt="${escapeHtml(getLocalizedField(lesson.activityImage, "alt", lesson.title || "학습 그림"))}" loading="lazy" decoding="async">
                ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
            </figure>
        `;
    }

    function buildLesson(lesson, index) {
        const state = getState(lesson.id);
        syncState(lesson.id);
        return `
            <section class="lw-lesson" id="lesson-${escapeHtml(lesson.id)}">
                <div class="lw-lesson-header">
                    <div>
                        <div class="lw-lesson-tag">${escapeHtml(lesson.label || `듣기 ${index + 1}`)}</div>
                        <h2>${escapeHtml(getLocalizedField(lesson, "title", lesson.title || `듣기 ${index + 1}`))}</h2>
                        <div class="lw-lesson-summary">${escapeHtml(getLocalizedField(lesson, "summary", lesson.summary || ""))}</div>
                    </div>
                    <div class="lw-count-badge" id="listen-count-${escapeHtml(lesson.id)}">${escapeHtml(getInstructionText().listenBadge(state.listens))}</div>
                </div>
                ${buildLessonVisual(lesson)}
                <div class="lw-grid-2">
                    ${buildPreListening(lesson)}
                    ${buildAudioSection(lesson)}
                </div>
                <div class="lw-grid" style="margin-top: 18px;">
                    ${buildSubtitleSection(lesson)}
                    ${buildSentenceTrainer(lesson)}
                </div>
                <div class="lw-grid-2" style="margin-top: 18px;">
                    ${buildDictogloss(lesson)}
                    ${buildNoteSection(lesson)}
                </div>
                <div class="lw-grid-2" style="margin-top: 18px;">
                    ${buildClarificationSection(lesson)}
                    ${buildOralFeatures(lesson)}
                </div>
                <div class="lw-grid" style="margin-top: 18px;">
                    ${buildQuizSection(lesson)}
                </div>
            </section>
        `;
    }

    function decorateText(text, highlights) {
        const source = String(text == null ? "" : text);
        if (!highlights || !highlights.length) return escapeHtml(source);

        const matches = [];
        highlights.forEach((item) => {
            const term = item.term;
            if (!term) return;
            const index = source.indexOf(term);
            if (index === -1) return;
            matches.push({
                start: index,
                end: index + term.length,
                type: item.type || ""
            });
        });

        matches.sort((left, right) => left.start - right.start);

        let cursor = 0;
        let output = "";
        matches.forEach((match) => {
            if (match.start < cursor) return;
            output += escapeHtml(source.slice(cursor, match.start));
            output += `<mark class="lw-highlight" title="${escapeHtml(match.type)}">${escapeHtml(source.slice(match.start, match.end))}</mark>`;
            cursor = match.end;
        });
        output += escapeHtml(source.slice(cursor));
        return output;
    }

    function renderTranscriptStage(lesson, stage) {
        const uiText = getInstructionText();
        if (stage === 0) {
            return `
                <div class="lw-status" data-tone="info">
                    ${escapeHtml(uiText.subtitleClosed)}
                </div>
            `;
        }

        return lesson.transcript.map((line) => {
            if (stage === 1) {
                return `
                    <article class="lw-transcript-line">
                        <div class="lw-line-speaker">${escapeHtml(line.speaker)}</div>
                        <div class="lw-keyword-pack">
                            ${(line.keywords || []).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}
                        </div>
                    </article>
                `;
            }

            return `
                <article class="lw-transcript-line">
                    <div class="lw-line-speaker">${escapeHtml(line.speaker)}</div>
                    <div class="lw-line-text">${decorateText(line.text, line.highlights || [])}</div>
                    ${stage === 3 ? `<div class="lw-line-translation">${escapeHtml(line.vi || "")}</div>` : ""}
                </article>
            `;
        }).join("");
    }

    function renderLinePreview(line, stage) {
        if (stage === 0) {
            return `<div class="lw-line-text is-hidden">${escapeHtml(getInstructionText().hiddenPreview)}</div>`;
        }

        if (stage === 1) {
            return `<div class="lw-keyword-pack">${(line.keywords || []).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>`;
        }

        return `
            <div class="lw-line-text">${decorateText(line.text, line.highlights || [])}</div>
            ${stage === 3 ? `<div class="lw-line-translation">${escapeHtml(line.vi || "")}</div>` : ""}
        `;
    }

    function renderStageMeta(lessonId) {
        const uiText = getInstructionText();
        const state = getState(lessonId);
        const unlocked = getUnlockedStage(state.listens);
        const current = STAGES.find((stage) => stage.id === state.stage) || STAGES[0];
        return uiText.currentStage(getStageLabel(current), unlocked);
    }

    function updateQuizUI(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson) return;

        const state = getState(lessonId);
        const language = getQuizLanguage(state);
        const uiText = getQuizText(language);
        const quiz = getLessonQuizState(lessonId);

        const title = document.getElementById(`quiz-title-${lessonId}`);
        if (title) title.textContent = getLessonQuizTitle(lesson, language);

        const guideTitle = document.getElementById(`quiz-guide-title-${lessonId}`);
        if (guideTitle) guideTitle.textContent = uiText.guideTitle;

        const guide = document.getElementById(`quiz-guide-${lessonId}`);
        if (guide) guide.textContent = getLessonQuizGuide(lesson, language);

        const languageHelp = document.getElementById(`quiz-language-help-${lessonId}`);
        if (languageHelp) languageHelp.textContent = uiText.languageHelp;

        document.querySelectorAll(`[data-action="set-quiz-language"][data-lesson-id="${lessonId}"]`).forEach((button) => {
            button.classList.toggle("is-active", button.dataset.quizLanguage === language);
        });

        const submitButton = document.getElementById(`quiz-submit-${lessonId}`);
        if (submitButton) submitButton.textContent = uiText.submit;

        const resetButton = document.getElementById(`quiz-reset-${lessonId}`);
        if (resetButton) resetButton.textContent = uiText.reset;

        lesson.questions.forEach((question, index) => {
            const prompt = document.getElementById(`quiz-prompt-${lessonId}-${index}`);
            if (prompt) prompt.textContent = `${index + 1}. ${getQuestionPrompt(question, language)}`;

            question.options.forEach((option, optionIndex) => {
                const optionNode = document.getElementById(`quiz-option-${lessonId}-${index}-${optionIndex}`);
                if (optionNode) optionNode.textContent = getOptionLabel(option, language);
            });

            const feedback = document.getElementById(`quiz-feedback-${lessonId}-${index}`);
            if (feedback) feedback.textContent = getQuestionExplanation(question, language);
        });

        if (!quiz.submitted || quiz.score == null) {
            setStatus(`quiz-status-${lessonId}`, uiText.statusInitial, "info");
            return;
        }

        setStatus(`quiz-status-${lessonId}`, uiText.statusResult(lesson.questions.length, quiz.score), quiz.score === lesson.questions.length ? "success" : "info");
    }

    function setStatus(elementId, message, tone = "info") {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.dataset.tone = tone;
        element.textContent = message;
    }

    function updateLessonUI(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson) return;

        const state = getState(lessonId);
        const uiText = getInstructionText();
        syncState(lessonId);

        const countBadge = document.getElementById(`listen-count-${lessonId}`);
        if (countBadge) countBadge.textContent = uiText.listenBadge(state.listens);

        const listenStatus = document.getElementById(`listen-status-${lessonId}`);
        if (listenStatus) listenStatus.textContent = uiText.listenCount(state.listens);

        const stageMeta = document.getElementById(`stage-meta-${lessonId}`);
        if (stageMeta) stageMeta.textContent = renderStageMeta(lessonId);

        const transcript = document.getElementById(`transcript-${lessonId}`);
        if (transcript) transcript.innerHTML = renderTranscriptStage(lesson, state.stage);

        const unlocked = getUnlockedStage(state.listens);
        document.querySelectorAll(`[data-lesson-id="${lessonId}"][data-stage]`).forEach((button) => {
            const stageValue = Number(button.dataset.stage);
            button.classList.toggle("is-active", stageValue === state.stage);
            button.classList.toggle("is-locked", stageValue > unlocked);
        });

        document.querySelectorAll(`[data-lesson-id="${lessonId}"][data-speed]`).forEach((button) => {
            button.classList.toggle("is-active", Number(button.dataset.speed) === state.speed);
        });

        const loopButton = document.querySelector(`[data-action="toggle-loop"][data-lesson-id="${lessonId}"]`);
        if (loopButton) {
            loopButton.textContent = state.loop ? uiText.loopOn : uiText.loopOff;
        }

        const audio = document.getElementById(`audio-${lessonId}`);
        if (audio) {
            audio.playbackRate = state.speed;
            audio.loop = state.loop;
        }

        lesson.transcript.forEach((line, index) => {
            const preview = document.getElementById(`line-preview-${lessonId}-${index}`);
            if (preview) preview.innerHTML = renderLinePreview(line, state.stage);
        });

        document.querySelectorAll(`[data-action="set-note-tab"][data-lesson-id="${lessonId}"]`).forEach((button) => {
            button.classList.toggle("is-active", button.dataset.noteTab === state.noteTab);
        });

        const threePanel = document.getElementById(`note-three-${lessonId}`);
        const cornellPanel = document.getElementById(`note-cornell-${lessonId}`);
        if (threePanel) threePanel.classList.toggle("is-active", state.noteTab === "three");
        if (cornellPanel) cornellPanel.classList.toggle("is-active", state.noteTab === "cornell");

        updateQuizUI(lessonId);
    }

    function registerListen(lessonId, amount = 1) {
        const uiText = getInstructionText();
        const state = getState(lessonId);
        state.listens += amount;
        const unlockedBefore = getUnlockedStage(state.listens - amount);
        const unlockedAfter = getUnlockedStage(state.listens);
        if (state.stage > unlockedAfter) state.stage = unlockedAfter;
        syncState(lessonId);
        updateLessonUI(lessonId);
        if (unlockedAfter > unlockedBefore) {
            setStatus(`listen-status-${lessonId}`, uiText.listenUnlocked(state.listens, getStageLabel(STAGES[unlockedAfter])), "success");
        } else {
            setStatus(`listen-status-${lessonId}`, uiText.listenRecorded(state.listens), "success");
        }
    }

    function toggleVocab(lessonId, vocabIndex) {
        const uiText = getInstructionText();
        const card = document.getElementById(`vocab-${lessonId}-${vocabIndex}`);
        if (!card) return;
        const isOpen = card.dataset.open === "true";
        card.dataset.open = isOpen ? "false" : "true";
        const button = card.querySelector("[data-action='toggle-vocab']");
        if (button) button.textContent = isOpen ? uiText.vocabShow : uiText.vocabHide;
    }

    function checkPrediction(lessonId) {
        const uiText = getInstructionText();
        const lesson = lessonMap.get(lessonId);
        if (!lesson) return;

        const relation = document.querySelector(`input[name="rel-${lessonId}"]:checked`);
        const genre = document.querySelector(`input[name="genre-${lessonId}"]:checked`);
        if (!relation || !genre) {
            setStatus(`prediction-feedback-${lessonId}`, uiText.predictionMissing, "warn");
            return;
        }

        const relationOk = relation.value === lesson.preListening.relationshipAnswer;
        const genreOk = genre.value === lesson.preListening.genreAnswer;
        const relationMatch = lesson.preListening.relationshipOptions.find((item) => item.value === lesson.preListening.relationshipAnswer);
        const genreMatch = lesson.preListening.genreOptions.find((item) => item.value === lesson.preListening.genreAnswer);
        const relationLabel = relationMatch ? relationMatch.label : lesson.preListening.relationshipAnswer;
        const genreLabel = genreMatch ? genreMatch.label : lesson.preListening.genreAnswer;
        const message = [
            uiText.predictionRelationResult(relationLabel),
            uiText.predictionGenreResult(genreLabel),
            getLocalizedField(lesson.preListening, "predictionNote", lesson.preListening.predictionNote || "")
        ].filter(Boolean).join(" / ");
        setStatus(`prediction-feedback-${lessonId}`, `${relationOk && genreOk ? uiText.predictionSuccess : uiText.predictionAdjust} ${message}`.trim(), relationOk && genreOk ? "success" : "info");
    }

    function setStage(lessonId, stageId) {
        const uiText = getInstructionText();
        const state = getState(lessonId);
        const unlocked = getUnlockedStage(state.listens);
        if (stageId > unlocked) {
            setStatus(`listen-status-${lessonId}`, uiText.stageLocked(stageId, getStageLabel(STAGES[stageId])), "warn");
            return;
        }

        state.stage = stageId;
        syncState(lessonId);
        updateLessonUI(lessonId);
    }

    function setSpeed(lessonId, speed) {
        const uiText = getInstructionText();
        const state = getState(lessonId);
        state.speed = speed;
        syncState(lessonId);
        updateLessonUI(lessonId);
        setStatus(`listen-status-${lessonId}`, uiText.speedChanged(speed), "info");
    }

    function toggleLoop(lessonId) {
        const uiText = getInstructionText();
        const state = getState(lessonId);
        state.loop = !state.loop;
        syncState(lessonId);
        updateLessonUI(lessonId);
        setStatus(`listen-status-${lessonId}`, state.loop ? uiText.loopOnStatus : uiText.loopOffStatus, "info");
    }

    function cancelSpeech() {
        speechState.token += 1;
        speechState.timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
        speechState.timeouts = [];
        if (speechApi) speechApi.cancel();
        clearSpeakingState();
    }

    function clearSpeakingState() {
        if (!speechState.activeLessonId) return;
        const lesson = lessonMap.get(speechState.activeLessonId);
        if (!lesson) return;
        lesson.transcript.forEach((line, index) => {
            const card = document.getElementById(`line-card-${speechState.activeLessonId}-${index}`);
            if (card) card.classList.remove("is-speaking");
        });
        speechState.activeLessonId = null;
    }

    function setSpeakingLine(lessonId, lineIndex) {
        clearSpeakingState();
        speechState.activeLessonId = lessonId;
        const card = document.getElementById(`line-card-${lessonId}-${lineIndex}`);
        if (card) card.classList.add("is-speaking");
    }

    function wait(ms, token) {
        return new Promise((resolve) => {
            const timeoutId = window.setTimeout(() => {
                if (token === speechState.token) resolve();
            }, ms);
            speechState.timeouts.push(timeoutId);
        });
    }

    function pickKoreanVoice() {
        if (!speechApi) return null;
        const voices = speechApi.getVoices();
        koreanVoice = voices.find((voice) => String(voice.lang || "").toLowerCase().startsWith("ko")) || null;
        return koreanVoice;
    }

    function speakText(text, rate, token) {
        if (!speechApi) return Promise.resolve(false);

        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "ko-KR";
            utterance.rate = rate;
            utterance.pitch = 1;
            utterance.voice = koreanVoice || pickKoreanVoice();
            utterance.onend = () => resolve(true);
            utterance.onerror = () => resolve(false);
            if (token !== speechState.token) {
                resolve(false);
                return;
            }
            speechApi.speak(utterance);
        });
    }

    function pauseAllAudio() {
        document.querySelectorAll("audio").forEach((audio) => {
            audio.pause();
        });
    }

    async function playLine(lessonId, lineIndex, mode) {
        const uiText = getInstructionText();
        const lesson = lessonMap.get(lessonId);
        const state = getState(lessonId);
        if (!lesson || !lesson.transcript[lineIndex]) return;
        if (!speechApi) {
            setStatus(`line-status-${lessonId}`, uiText.lineUnsupported, "warn");
            return;
        }

        cancelSpeech();
        pauseAllAudio();

        const token = speechState.token;
        const line = lesson.transcript[lineIndex];
        setSpeakingLine(lessonId, lineIndex);

        if (mode === "once") {
            setStatus(`line-status-${lessonId}`, uiText.linePlayOnce(lineIndex + 1), "info");
            await speakText(line.text, state.speed, token);
        } else if (mode === "repeat") {
            setStatus(`line-status-${lessonId}`, uiText.linePlayRepeat(lineIndex + 1), "info");
            await speakText(line.text, state.speed, token);
            if (token !== speechState.token) return;
            await wait(320, token);
            if (token !== speechState.token) return;
            await speakText(line.text, state.speed, token);
        } else {
            setStatus(`line-status-${lessonId}`, uiText.lineShadowStart(lineIndex + 1), "info");
            await speakText(line.text, state.speed, token);
            if (token !== speechState.token) return;
            setStatus(`line-status-${lessonId}`, uiText.lineShadowPrompt, "success");
            await wait(1450, token);
            if (token !== speechState.token) return;
            await speakText(line.text, state.speed, token);
        }

        if (token !== speechState.token) return;
        clearSpeakingState();
        registerListen(lessonId, 1);
        setStatus(`line-status-${lessonId}`, uiText.lineFinished(lineIndex + 1), "success");
    }

    async function playDialogue(lessonId) {
        const uiText = getInstructionText();
        const lesson = lessonMap.get(lessonId);
        const state = getState(lessonId);
        if (!lesson) return;
        if (!speechApi) {
            setStatus(`listen-status-${lessonId}`, uiText.dialogueUnsupported, "warn");
            return;
        }

        cancelSpeech();
        pauseAllAudio();

        const token = speechState.token;
        speechState.activeLessonId = lessonId;
        setStatus(`listen-status-${lessonId}`, uiText.dialoguePlaying, "info");

        for (let index = 0; index < lesson.transcript.length; index += 1) {
            if (token !== speechState.token) return;
            setSpeakingLine(lessonId, index);
            await speakText(lesson.transcript[index].text, state.speed, token);
            if (token !== speechState.token) return;
            await wait(220, token);
        }

        if (token !== speechState.token) return;
        clearSpeakingState();
        registerListen(lessonId, 1);
        setStatus(`listen-status-${lessonId}`, uiText.dialogueFinished, "success");
    }

    function speakExpression(lessonId, expression) {
        const uiText = getInstructionText();
        if (!speechApi) {
            setStatus(`clarify-status-${lessonId}`, uiText.clarificationUnsupported, "warn");
            return;
        }
        cancelSpeech();
        const token = speechState.token;
        speakText(expression, 1, token).then(() => {
            if (token === speechState.token) {
                setStatus(`clarify-status-${lessonId}`, uiText.clarificationHeard(expression), "success");
            }
        });
    }

    function appendExpression(lessonId, expression) {
        const box = document.getElementById(`clarify-box-${lessonId}`);
        if (!box) return;
        const joiner = box.value.trim() ? " " : "";
        box.value = `${box.value}${joiner}${expression}`;
        writeStorage(storageKey(lessonId, "clarify-box"), box.value);
        setStatus(`clarify-status-${lessonId}`, getInstructionText().clarificationAdded, "success");
    }

    function checkDictogloss(lessonId) {
        const uiText = getInstructionText();
        const lesson = lessonMap.get(lessonId);
        const input = document.getElementById(`dictogloss-input-${lessonId}`);
        if (!lesson || !input) return;

        const value = input.value.trim();
        if (!value) {
            setStatus(`dictogloss-feedback-${lessonId}`, uiText.dictoglossEmpty, "warn");
            return;
        }

        const normalized = normalizeText(value);
        const matched = (lesson.dictogloss.keywords || []).filter((keyword) => normalized.includes(normalizeText(keyword)));
        const missing = (lesson.dictogloss.keywords || []).filter((keyword) => !normalized.includes(normalizeText(keyword)));
        const message = [
            `${uiText.dictoglossMatched(matched.length, lesson.dictogloss.keywords.length)}: ${matched.join(", ") || uiText.none}`,
            missing.length ? `${uiText.dictoglossMissing}: ${missing.join(", ")}` : uiText.dictoglossAllClear
        ].join(" / ");
        setStatus(`dictogloss-feedback-${lessonId}`, message, missing.length ? "info" : "success");
    }

    function toggleModelSummary(lessonId) {
        const box = document.getElementById(`model-summary-${lessonId}`);
        if (!box) return;
        box.hidden = !box.hidden;
    }

    function setNoteTab(lessonId, tab) {
        const state = getState(lessonId);
        state.noteTab = tab === "cornell" ? "cornell" : "three";
        syncState(lessonId);
        updateLessonUI(lessonId);
    }

    function setQuizLanguage(lessonId, language) {
        const state = getState(lessonId);
        state.quizLanguage = language === "vi" ? "vi" : "ko";
        syncState(lessonId);
        updateQuizUI(lessonId);
    }

    function getLessonQuizState(lessonId) {
        if (!quizState.has(lessonId)) {
            quizState.set(lessonId, { submitted: false, score: null });
        }
        return quizState.get(lessonId);
    }

    function captureRuntimeState() {
        const snapshot = {
            scrollY: window.scrollY || 0,
            predictions: {},
            quizAnswers: {},
            modelSummaryOpen: {},
            openVocabs: {}
        };

        lessonMap.forEach((lesson, lessonId) => {
            snapshot.predictions[lessonId] = {
                relation: document.querySelector(`input[name="rel-${lessonId}"]:checked`)?.value || null,
                genre: document.querySelector(`input[name="genre-${lessonId}"]:checked`)?.value || null
            };
            snapshot.quizAnswers[lessonId] = (lesson.questions || []).map((question, index) => (
                document.querySelector(`input[name="quiz-${lessonId}-${index}"]:checked`)?.value || null
            ));
            const modelSummary = document.getElementById(`model-summary-${lessonId}`);
            snapshot.modelSummaryOpen[lessonId] = Boolean(modelSummary && !modelSummary.hidden);
            snapshot.openVocabs[lessonId] = Array.from(document.querySelectorAll(`[id^="vocab-${lessonId}-"]`))
                .filter((card) => card.dataset.open === "true")
                .map((card) => Number(card.id.split("-").pop()));
        });

        return snapshot;
    }

    function restoreRuntimeState(snapshot) {
        if (!snapshot) return;

        Object.entries(snapshot.predictions || {}).forEach(([lessonId, selection]) => {
            if (selection.relation != null) {
                const relation = document.querySelector(`input[name="rel-${lessonId}"][value="${selection.relation}"]`);
                if (relation) relation.checked = true;
            }
            if (selection.genre != null) {
                const genre = document.querySelector(`input[name="genre-${lessonId}"][value="${selection.genre}"]`);
                if (genre) genre.checked = true;
            }
        });

        Object.entries(snapshot.openVocabs || {}).forEach(([lessonId, indexes]) => {
            (indexes || []).forEach((index) => {
                const card = document.getElementById(`vocab-${lessonId}-${index}`);
                if (!card) return;
                card.dataset.open = "true";
                const button = card.querySelector("[data-action='toggle-vocab']");
                if (button) button.textContent = getInstructionText().vocabHide;
            });
        });

        Object.entries(snapshot.modelSummaryOpen || {}).forEach(([lessonId, isOpen]) => {
            const box = document.getElementById(`model-summary-${lessonId}`);
            if (box) box.hidden = !isOpen;
        });

        Object.entries(snapshot.quizAnswers || {}).forEach(([lessonId, answers]) => {
            (answers || []).forEach((value, index) => {
                if (value == null) return;
                const input = document.querySelector(`input[name="quiz-${lessonId}-${index}"][value="${value}"]`);
                if (input) input.checked = true;
            });
        });

        lessonMap.forEach((lesson, lessonId) => {
            const quiz = getLessonQuizState(lessonId);
            lesson.questions.forEach((question, index) => {
                const card = document.getElementById(`quiz-card-${lessonId}-${index}`);
                if (!card) return;
                card.classList.remove("correct", "incorrect", "show-feedback");
                if (!quiz.submitted || quiz.score == null) return;
                const selected = document.querySelector(`input[name="quiz-${lessonId}-${index}"]:checked`);
                if (!selected) return;
                card.classList.add(selected.value === question.answer ? "correct" : "incorrect", "show-feedback");
            });
        });

        window.scrollTo({ top: snapshot.scrollY || 0 });
    }

    function resetQuiz(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson) return;
        lesson.questions.forEach((question, index) => {
            document.querySelectorAll(`input[name="quiz-${lessonId}-${index}"]`).forEach((input) => {
                input.checked = false;
            });
            const card = document.getElementById(`quiz-card-${lessonId}-${index}`);
            if (card) {
                card.classList.remove("correct", "incorrect", "show-feedback");
            }
        });
        const state = getLessonQuizState(lessonId);
        state.submitted = false;
        state.score = null;
        updateQuizUI(lessonId);
    }

    function submitQuiz(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson) return;
        const language = getQuizLanguage(getState(lessonId));
        const uiText = getQuizText(language);

        let score = 0;
        for (let index = 0; index < lesson.questions.length; index += 1) {
            const question = lesson.questions[index];
            const selected = document.querySelector(`input[name="quiz-${lessonId}-${index}"]:checked`);
            if (!selected) {
                setStatus(`quiz-status-${lessonId}`, uiText.statusIncomplete, "warn");
                return;
            }

            const isCorrect = selected.value === question.answer;
            if (isCorrect) score += 1;
            const card = document.getElementById(`quiz-card-${lessonId}-${index}`);
            if (card) {
                card.classList.remove("correct", "incorrect");
                card.classList.add(isCorrect ? "correct" : "incorrect", "show-feedback");
            }
        }

        const quiz = getLessonQuizState(lessonId);
        quiz.submitted = true;
        quiz.score = score;
        setStatus(`quiz-status-${lessonId}`, uiText.statusResult(lesson.questions.length, score), score === lesson.questions.length ? "success" : "info");
    }

    function hydrateTextareas() {
        document.querySelectorAll("[data-storage-key]").forEach((field) => {
            const key = field.dataset.storageKey;
            const saved = readStorage(key, "");
            if (typeof saved === "string") field.value = saved;
            field.addEventListener("input", () => {
                writeStorage(key, field.value);
            });
        });
    }

    function attachAudioListeners() {
        lessonMap.forEach((lesson, lessonId) => {
            const audio = document.getElementById(`audio-${lessonId}`);
            if (!audio) return;
            audio.addEventListener("play", () => {
                cancelSpeech();
                setStatus(`listen-status-${lessonId}`, getInstructionText().audioPlaying, "info");
            });
            audio.addEventListener("ended", () => {
                registerListen(lessonId, 1);
            });
        });
    }

    function applyTheme(config) {
        const shell = document.querySelector(".lw-shell");
        if (!shell || !config.theme) return;
        if (config.theme.accent) shell.style.setProperty("--lw-accent", config.theme.accent);
        if (config.theme.accentDark) shell.style.setProperty("--lw-accent-dark", config.theme.accentDark);
        if (config.theme.soft) shell.style.setProperty("--lw-soft", config.theme.soft);
        if (config.theme.ink) shell.style.setProperty("--lw-ink", config.theme.ink);
        if (config.theme.surface) shell.style.setProperty("--lw-surface", config.theme.surface);
        if (config.theme.pageBackground) document.body.style.background = config.theme.pageBackground;
    }

    function renderApp(config, options = {}) {
        const root = document.getElementById("listening-workbook-app");
        if (!root) return;
        const runtimeSnapshot = options.preserveRuntime ? captureRuntimeState() : null;

        lessonMap.clear();
        lessonState.clear();

        config.lessons.forEach((lesson) => {
            lessonMap.set(lesson.id, lesson);
            lessonState.set(lesson.id, createInitialState(lesson));
        });

        root.innerHTML = `
            <main class="lw-shell">
                ${buildHero(config)}
                ${buildAnchorList(config)}
                ${config.lessons.map((lesson, index) => buildLesson(lesson, index)).join("")}
                <div class="lw-footer-note">${escapeHtml(getInstructionText().footer)}</div>
            </main>
        `;

        applyTheme(config);
        hydrateTextareas();
        attachAudioListeners();
        config.lessons.forEach((lesson) => updateLessonUI(lesson.id));
        restoreRuntimeState(runtimeSnapshot);
        config.lessons.forEach((lesson) => updateQuizUI(lesson.id));
    }

    function setInstructionLanguage(language) {
        if (!hasInstructionLanguageToggle()) return;
        instructionLanguage = language === "vi" ? "vi" : "ko";
        writeStorage(instructionStorageKey(), instructionLanguage);
        renderApp(pageConfig, { preserveRuntime: true });
    }

    function handleClick(event) {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const action = button.dataset.action;
        const lessonId = button.dataset.lessonId;

        if (action === "toggle-vocab") return void toggleVocab(lessonId, Number(button.dataset.vocabIndex));
        if (action === "check-prediction") return void checkPrediction(lessonId);
        if (action === "set-stage") return void setStage(lessonId, Number(button.dataset.stage));
        if (action === "set-speed") return void setSpeed(lessonId, Number(button.dataset.speed));
        if (action === "toggle-loop") return void toggleLoop(lessonId);
        if (action === "play-line") return void playLine(lessonId, Number(button.dataset.lineIndex), "once");
        if (action === "repeat-line") return void playLine(lessonId, Number(button.dataset.lineIndex), "repeat");
        if (action === "shadow-line") return void playLine(lessonId, Number(button.dataset.lineIndex), "shadow");
        if (action === "play-dialogue") return void playDialogue(lessonId);
        if (action === "stop-speech") {
            cancelSpeech();
            setStatus(`listen-status-${lessonId}`, getInstructionText().speechStopped, "info");
            return;
        }
        if (action === "set-instruction-language") return void setInstructionLanguage(button.dataset.instructionLanguage);
        if (action === "check-dictogloss") return void checkDictogloss(lessonId);
        if (action === "toggle-model-summary") return void toggleModelSummary(lessonId);
        if (action === "set-note-tab") return void setNoteTab(lessonId, button.dataset.noteTab);
        if (action === "set-quiz-language") return void setQuizLanguage(lessonId, button.dataset.quizLanguage);
        if (action === "append-expression") return void appendExpression(lessonId, button.dataset.expression || "");
        if (action === "speak-expression") return void speakExpression(lessonId, button.dataset.expression || "");
        if (action === "submit-quiz") return void submitQuiz(lessonId);
        if (action === "reset-quiz") return void resetQuiz(lessonId);
    }

    function initSpeechVoice() {
        if (!speechApi) return;
        pickKoreanVoice();
        speechApi.onvoiceschanged = pickKoreanVoice;
    }

    function init() {
        if (hasInitialized) return;
        pageConfig = window.LISTENING_WORKBOOK_CONFIG;
        if (!pageConfig || !Array.isArray(pageConfig.lessons) || !pageConfig.lessons.length) return;
        hasInitialized = true;
        instructionLanguage = readInstructionLanguage(pageConfig);
        renderApp(pageConfig);
        initSpeechVoice();
        document.addEventListener("click", handleClick);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
