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
            quickDockTitle: "빠른 듣기",
            quickDockPlay: "재생",
            quickDockStop: "멈춤",
            quickDockOpen: "펼치기",
            quickDockClose: "접기",
            quickDockTop: "상단",
            quickDockAudio: "듣기",
            quickDockQuiz: "문제",
            quickDockAudioSource: "원음",
            quickDockTtsSource: "대화 TTS",
            quickDockNavAria: "빠른 이동",
            quickDockSeekAria: "재생 위치 조절",
            quickDockLinePosition(current, total) {
                return `문장 ${current} / ${total}`;
            },
            quickDockLineTotal(total) {
                return `전체 ${total}문장`;
            },
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
            quickDockTitle: "Nghe nhanh",
            quickDockPlay: "Phát",
            quickDockStop: "Dừng",
            quickDockOpen: "Mở",
            quickDockClose: "Thu gọn",
            quickDockTop: "Lên đầu",
            quickDockAudio: "Nghe",
            quickDockQuiz: "Câu hỏi",
            quickDockAudioSource: "File gốc",
            quickDockTtsSource: "Hội thoại TTS",
            quickDockNavAria: "Đi nhanh",
            quickDockSeekAria: "Điều chỉnh vị trí phát",
            quickDockLinePosition(current, total) {
                return `Câu ${current} / ${total}`;
            },
            quickDockLineTotal(total) {
                return `Tổng ${total} câu`;
            },
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
    const tfState = new Map();
    const clozeState = new Map();
    const audioLineState = new Map();
    const audioChunkState = new Map();
    const lineChunkCache = new WeakMap();
    const sequenceState = new Map();
    let pageConfig = null;
    let koreanVoice = null;
    let instructionLanguage = "ko";
    let quickDockLessonId = null;
    let quickDockCollapsed = false;
    let hasInitialized = false;
    let scrollSyncFrameId = null;

    const speechApi = "speechSynthesis" in window ? window.speechSynthesis : null;
    const speechState = {
        token: 0,
        timeouts: [],
        activeLessonId: null
    };
    const playbackState = {
        kind: null,
        lessonId: null,
        mode: null,
        currentLineIndex: null
    };
    const sequenceDragState = {
        lessonId: null,
        itemId: null
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

    function pageStorageKey(field) {
        return `${STORAGE_PREFIX}:${pageKey()}:page:${field}`;
    }

    function instructionStorageKey() {
        return pageStorageKey("instruction-language");
    }

    function quickDockLessonStorageKey() {
        return pageStorageKey("quick-dock-lesson");
    }

    function quickDockCollapsedStorageKey() {
        return pageStorageKey("quick-dock-collapsed");
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

    function usesAudioInPreLayout(config = pageConfig) {
        return Boolean(config && config.layoutVariant === "audio-in-pre");
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

    function getDefaultQuickDockLessonId(config = pageConfig) {
        return config && Array.isArray(config.lessons) && config.lessons.length ? config.lessons[0].id : "";
    }

    function readQuickDockLesson(config = pageConfig) {
        const fallback = getDefaultQuickDockLessonId(config);
        const saved = readStorage(quickDockLessonStorageKey(), fallback);
        if (!config || !Array.isArray(config.lessons)) return fallback;
        return config.lessons.some((lesson) => lesson.id === saved) ? saved : fallback;
    }

    function readQuickDockCollapsed() {
        const fallback = Boolean(window.matchMedia && window.matchMedia("(max-width: 720px)").matches);
        return Boolean(readStorage(quickDockCollapsedStorageKey(), fallback));
    }

    function getQuickDockLesson(config = pageConfig) {
        if (!config || !Array.isArray(config.lessons) || !config.lessons.length) return null;
        return lessonMap.get(quickDockLessonId) || config.lessons[0] || null;
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

    function getLessonTfState(lessonId) {
        if (!tfState.has(lessonId)) {
            tfState.set(lessonId, { submitted: false, score: null });
        }
        return tfState.get(lessonId);
    }

    function getLessonClozeState(lessonId) {
        if (!clozeState.has(lessonId)) {
            clozeState.set(lessonId, { submitted: false, score: null });
        }
        return clozeState.get(lessonId);
    }

    function getTfStatement(question) {
        return chooseLocalizedText(question.statement, question.statementVi, "");
    }

    function getTfExplanation(question) {
        return chooseLocalizedText(question.explanation, question.explanationVi, "");
    }

    function getTfAnswerValue(question) {
        return question.answer ? "O" : "X";
    }

    function hasTfQuestions(lesson) {
        return Boolean(lesson && Array.isArray(lesson.tfQuestions) && lesson.tfQuestions.length);
    }

    function hasClozeItems(lesson) {
        return Boolean(lesson && Array.isArray(lesson.clozeItems) && lesson.clozeItems.length);
    }

    function hasSequenceTask(lesson) {
        return Boolean(lesson && lesson.sequenceTask && Array.isArray(lesson.sequenceTask.items) && lesson.sequenceTask.items.length);
    }

    function hasProsConsTable(lesson) {
        return Boolean(lesson && lesson.prosConsTable);
    }

    function getSequenceTaskState(lessonId) {
        if (!sequenceState.has(lessonId)) {
            sequenceState.set(lessonId, { submitted: false, correct: null });
        }
        return sequenceState.get(lessonId);
    }

    function getSequenceDefaultOrder(lesson) {
        if (!hasSequenceTask(lesson)) return [];
        return lesson.sequenceTask.items.map((item) => item.id);
    }

    function getSequenceOrder(lesson) {
        if (!hasSequenceTask(lesson)) return [];
        const defaultOrder = getSequenceDefaultOrder(lesson);
        const saved = readStorage(storageKey(lesson.id, "sequence-order"), defaultOrder);
        if (!Array.isArray(saved) || saved.length !== defaultOrder.length) return defaultOrder;
        const savedSet = new Set(saved);
        if (savedSet.size !== defaultOrder.length) return defaultOrder;
        return defaultOrder.every((id) => savedSet.has(id)) ? saved : defaultOrder;
    }

    function setSequenceOrder(lessonId, order) {
        writeStorage(storageKey(lessonId, "sequence-order"), order);
    }

    function getSequenceItemLabel(item) {
        return chooseLocalizedText(item.label, item.labelVi, item.label || "");
    }

    function getSequenceStatusInitial(lesson) {
        return getLocalizedField(
            lesson.sequenceTask,
            "statusInitial",
            chooseLocalizedText(
                "항목을 끌어 놓거나 위아래로 움직여 올바른 순서로 배열해 보세요.",
                "Hay keo tha hoac di chuyen len xuong de sap xep dung thu tu."
            )
        );
    }

    function getSequenceStatusIncomplete(lesson) {
        return getLocalizedField(
            lesson.sequenceTask,
            "statusIncomplete",
            chooseLocalizedText(
                "모든 항목의 순서를 확인한 뒤 채점해 보세요.",
                "Hay sap xep het cac muc roi moi kiem tra."
            )
        );
    }

    function getSequenceStatusCorrect(lesson) {
        return getLocalizedField(
            lesson.sequenceTask,
            "statusCorrect",
            chooseLocalizedText(
                "순서가 정확합니다. 지시가 진행되는 흐름을 잘 잡았습니다.",
                "Thu tu da chinh xac. Em da nam duoc dong chay cua cac chi dan."
            )
        );
    }

    function getSequenceStatusIncorrect(lesson) {
        return getLocalizedField(
            lesson.sequenceTask,
            "statusIncorrect",
            chooseLocalizedText(
                "순서를 다시 점검해 보세요. 먼저/나서/다 했으면 같은 연결 표현에 주목하면 도움이 됩니다.",
                "Hay kiem tra lai thu tu. Chu y cac cach noi nhu truoc tien, sau khi, lam xong thi se giup em."
            )
        );
    }

    function getSequenceButtonLabel(lesson, key, fallbackKo, fallbackVi) {
        return lesson.sequenceTask
            ? getLocalizedField(lesson.sequenceTask, key, chooseLocalizedText(fallbackKo, fallbackVi))
            : chooseLocalizedText(fallbackKo, fallbackVi);
    }

    function getTfStatusInitial(lesson) {
        return lesson.tfSection && getLocalizedField(lesson.tfSection, "statusInitial", "")
            || chooseLocalizedText("문장을 듣고 O/X를 골라 보세요.", "Nghe tung cau roi chon Dung hay Sai.");
    }

    function getTfStatusIncomplete(lesson) {
        return lesson.tfSection && getLocalizedField(lesson.tfSection, "statusIncomplete", "")
            || chooseLocalizedText("모든 문항에 답한 뒤 확인해 주세요.", "Hay tra loi het cac cau roi moi kiem tra.");
    }

    function getTfStatusResult(lesson, total, score) {
        if (lesson.tfSection) {
            const custom = getLocalizedField(lesson.tfSection, "statusResult", "");
            if (custom) {
                return custom
                    .replace("{total}", String(total))
                    .replace("{score}", String(score));
            }
        }
        if (getInstructionLanguage() === "vi") {
            return `Em dung ${score}/${total} cau O/X.`;
        }
        return `${total}문장 중 ${score}문장을 맞혔습니다.`;
    }

    function getClozeSentence(item) {
        return chooseLocalizedText(item.sentence, item.sentenceVi, "");
    }

    function getClozeHint(item) {
        return chooseLocalizedText(item.hint, item.hintVi, "");
    }

    function getClozeAnswers(item) {
        const answers = [item.blank].concat(Array.isArray(item.accept) ? item.accept : []);
        return answers
            .map((value) => String(value == null ? "" : value).trim())
            .filter(Boolean);
    }

    function getClozeFeedback(item) {
        const answerLabel = chooseLocalizedText("정답", "Dap an");
        const hintLabel = chooseLocalizedText("힌트", "Goi y");
        const explanation = chooseLocalizedText(item.explanation, item.explanationVi, "");
        const parts = [`${answerLabel}: ${getClozeAnswers(item)[0] || ""}`];
        if (getClozeHint(item)) parts.push(`${hintLabel}: ${getClozeHint(item)}`);
        if (explanation) parts.push(explanation);
        return parts.join(" / ");
    }

    function getClozePlaceholder(item) {
        return getLocalizedField(
            item,
            "placeholder",
            chooseLocalizedText("정답을 입력하세요.", "Hay nhap dap an.")
        );
    }

    function getClozeStatusInitial(lesson) {
        return lesson.clozeSection && getLocalizedField(lesson.clozeSection, "statusInitial", "")
            || chooseLocalizedText("문장을 완성할 말을 적어 보세요.", "Hay dien tu hoan thanh cau.");
    }

    function getClozeStatusIncomplete(lesson) {
        return lesson.clozeSection && getLocalizedField(lesson.clozeSection, "statusIncomplete", "")
            || chooseLocalizedText("모든 빈칸에 답을 적은 뒤 확인해 주세요.", "Hay dien het cac o trong roi moi kiem tra.");
    }

    function getClozeStatusResult(lesson, total, score) {
        if (lesson.clozeSection) {
            const custom = getLocalizedField(lesson.clozeSection, "statusResult", "");
            if (custom) {
                return custom
                    .replace("{total}", String(total))
                    .replace("{score}", String(score));
            }
        }
        if (getInstructionLanguage() === "vi") {
            return `Em dien dung ${score}/${total} cau.`;
        }
        return `${total}문장 중 ${score}문장을 바르게 완성했습니다.`;
    }

    function createInitialState(lesson) {
        const listens = Number(readStorage(storageKey(lesson.id, "listens"), 0)) || 0;
        const stage = Number(readStorage(storageKey(lesson.id, "stage"), 0)) || 0;
        const speed = Number(readStorage(storageKey(lesson.id, "speed"), 1)) || 1;
        const loop = Boolean(readStorage(storageKey(lesson.id, "loop"), false));
        const noteTab = readStorage(storageKey(lesson.id, "note-tab"), "three");
        const quizLanguage = readStorage(storageKey(lesson.id, "quiz-language"), "ko");
        const transcriptLength = Array.isArray(lesson.transcript) ? lesson.transcript.length : 0;
        const dialogueStartLineRaw = Number(readStorage(storageKey(lesson.id, "dialogue-start-line"), 0)) || 0;
        return {
            listens,
            stage,
            speed,
            loop,
            noteTab: noteTab === "cornell" ? "cornell" : "three",
            quizLanguage: quizLanguage === "vi" ? "vi" : "ko",
            dialogueStartLine: Math.max(0, Math.min(dialogueStartLineRaw, Math.max(transcriptLength - 1, 0)))
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
        writeStorage(storageKey(lessonId, "dialogue-start-line"), state.dialogueStartLine);
    }

    function formatClockTime(seconds) {
        const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
        const mins = Math.floor(safe / 60);
        const secs = Math.floor(safe % 60);
        return `${mins}:${String(secs).padStart(2, "0")}`;
    }

    function getQuickDockProgressData(lesson) {
        const uiText = getInstructionText();
        if (!lesson) {
            return {
                mode: "audio",
                min: 0,
                max: 1,
                value: 0,
                currentLabel: "0:00",
                totalLabel: "0:00"
            };
        }

        if (lesson.audioSrc) {
            const audio = document.getElementById(`audio-${lesson.id}`);
            const duration = audio && Number.isFinite(audio.duration) ? audio.duration : 0;
            const currentTime = audio ? audio.currentTime : 0;
            return {
                mode: "audio",
                min: 0,
                max: duration > 0 ? duration : 1,
                value: Math.min(currentTime, duration > 0 ? duration : 1),
                currentLabel: formatClockTime(currentTime),
                totalLabel: formatClockTime(duration)
            };
        }

        const state = getState(lesson.id);
        const total = Math.max((lesson.transcript || []).length, 1);
        const activeIndex = playbackState.lessonId === lesson.id && Number.isInteger(playbackState.currentLineIndex)
            ? playbackState.currentLineIndex
            : state.dialogueStartLine;
        const lineIndex = Math.max(0, Math.min(activeIndex, total - 1));
        return {
            mode: "tts",
            min: 0,
            max: Math.max(total - 1, 0),
            value: lineIndex,
            currentLabel: uiText.quickDockLinePosition(lineIndex + 1, total),
            totalLabel: uiText.quickDockLineTotal(total)
        };
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

    function getLessonProgressSteps(lesson) {
        return [
            {
                id: "pre",
                label: chooseLocalizedText("듣기 전", "Truoc khi nghe"),
                anchorId: `pre-section-${lesson.id}`,
                targetIds: [`pre-section-${lesson.id}`]
            },
            {
                id: "audio",
                label: chooseLocalizedText("듣기", "Nghe"),
                anchorId: `audio-section-${lesson.id}`,
                targetIds: [`audio-section-${lesson.id}`]
            },
            {
                id: "subtitle",
                label: chooseLocalizedText("자막", "Phu de"),
                anchorId: `subtitle-section-${lesson.id}`,
                targetIds: [`subtitle-section-${lesson.id}`]
            },
            {
                id: "sentence",
                label: chooseLocalizedText("문장 연습", "Luyen tung cau"),
                anchorId: `sentence-section-${lesson.id}`,
                targetIds: [`sentence-section-${lesson.id}`]
            },
            {
                id: "analysis",
                label: chooseLocalizedText("재구성", "Tai cau truc"),
                anchorId: hasSequenceTask(lesson) ? `sequence-section-${lesson.id}` : `dictogloss-section-${lesson.id}`,
                targetIds: [
                    hasSequenceTask(lesson) ? `sequence-section-${lesson.id}` : null,
                    `dictogloss-section-${lesson.id}`
                ].filter(Boolean)
            },
            {
                id: "note",
                label: chooseLocalizedText("노트", "Ghi chu"),
                anchorId: `note-section-${lesson.id}`,
                targetIds: [`note-section-${lesson.id}`]
            },
            {
                id: "quiz",
                label: chooseLocalizedText("퀴즈", "Cau hoi"),
                anchorId: hasClozeItems(lesson)
                    ? `cloze-section-${lesson.id}`
                    : (hasTfQuestions(lesson) ? `tf-section-${lesson.id}` : `quiz-section-${lesson.id}`),
                targetIds: [
                    hasClozeItems(lesson) ? `cloze-section-${lesson.id}` : null,
                    hasTfQuestions(lesson) ? `tf-section-${lesson.id}` : null,
                    `quiz-section-${lesson.id}`
                ].filter(Boolean)
            }
        ];
    }

    function buildLessonProgress(lesson) {
        const steps = getLessonProgressSteps(lesson);
        const navLabel = chooseLocalizedText("학습 진행 단계", "Tien do hoc");

        return `
            <nav class="lw-lesson-progress" id="lesson-progress-${escapeHtml(lesson.id)}" aria-label="${escapeHtml(navLabel)}">
                <div class="lw-lesson-progress__line" aria-hidden="true">
                    <span class="lw-lesson-progress__fill" id="lesson-progress-fill-${escapeHtml(lesson.id)}"></span>
                </div>
                <div class="lw-lesson-progress__steps">
                    ${steps.map((step, index) => `
                        <a
                            href="#${escapeHtml(step.anchorId)}"
                            class="lw-lesson-progress__step"
                            id="lesson-progress-step-${escapeHtml(lesson.id)}-${escapeHtml(step.id)}"
                            data-lesson-id="${escapeHtml(lesson.id)}"
                            data-progress-step="${escapeHtml(step.id)}"
                            data-progress-index="${index}"
                        >
                            <span class="lw-lesson-progress__dot">${index + 1}</span>
                            <span class="lw-lesson-progress__label">${escapeHtml(step.label)}</span>
                        </a>
                    `).join("")}
                </div>
            </nav>
        `;
    }

    function buildQuickDock(config) {
        const uiText = getInstructionText();
        const lesson = getQuickDockLesson(config);
        if (!lesson) return "";
        const state = getState(lesson.id);
        const sourceLabel = lesson.audioSrc ? uiText.quickDockAudioSource : uiText.quickDockTtsSource;
        const progress = getQuickDockProgressData(lesson);

        return `
            <aside class="lw-quick-dock${quickDockCollapsed ? " is-collapsed" : ""}">
                <div class="lw-quick-dock__bar">
                    <div class="lw-quick-dock__summary">
                        <div class="lw-quick-dock__eyebrow">${escapeHtml(uiText.quickDockTitle)}</div>
                        <strong>${escapeHtml(lesson.label || getLocalizedField(lesson, "title", "듣기"))}</strong>
                        <span>${escapeHtml(getLocalizedField(lesson, "title", lesson.title || ""))}</span>
                    </div>
                    <div class="lw-quick-dock__actions">
                        <button type="button" class="lw-quick-dock__button is-primary" data-action="quick-play">${escapeHtml(uiText.quickDockPlay)}</button>
                        <button type="button" class="lw-quick-dock__button" data-action="quick-stop">${escapeHtml(uiText.quickDockStop)}</button>
                        <button type="button" class="lw-quick-dock__button is-ghost" data-action="toggle-quick-dock">${escapeHtml(quickDockCollapsed ? uiText.quickDockOpen : uiText.quickDockClose)}</button>
                    </div>
                </div>
                <div class="lw-quick-dock__panel">
                    <div class="lw-quick-dock__meta">
                        <span class="lw-mini-chip">${escapeHtml(sourceLabel)}</span>
                        <span class="lw-mini-chip">${escapeHtml(uiText.listenBadge(state.listens))}</span>
                    </div>
                    <div class="lw-quick-dock__timeline">
                        <div class="lw-quick-dock__time">
                            <strong id="lw-quick-dock-current">${escapeHtml(progress.currentLabel)}</strong>
                            <span id="lw-quick-dock-total">${escapeHtml(progress.totalLabel)}</span>
                        </div>
                        <input
                            id="lw-quick-dock-progress"
                            class="lw-quick-dock__range"
                            type="range"
                            min="${progress.min}"
                            max="${progress.max}"
                            step="${progress.mode === "audio" ? "0.1" : "1"}"
                            value="${progress.value}"
                            aria-label="${escapeHtml(uiText.quickDockSeekAria)}"
                            data-action="seek-quick-progress"
                            data-progress-mode="${progress.mode}"
                            data-lesson-id="${escapeHtml(lesson.id)}"
                        >
                    </div>
                    <nav class="lw-quick-dock__nav" aria-label="${escapeHtml(uiText.quickDockNavAria)}">
                        <a href="#lw-top">${escapeHtml(uiText.quickDockTop)}</a>
                        <a href="#audio-section-${escapeHtml(lesson.id)}">${escapeHtml(uiText.quickDockAudio)}</a>
                        <a href="#quiz-section-${escapeHtml(lesson.id)}">${escapeHtml(uiText.quickDockQuiz)}</a>
                    </nav>
                    <div class="lw-quick-dock__lessons">
                        ${config.lessons.map((entry, index) => `
                            <a href="#lesson-${escapeHtml(entry.id)}" class="lw-quick-dock__lesson-link${entry.id === lesson.id ? " is-active" : ""}" data-action="set-quick-lesson" data-lesson-id="${escapeHtml(entry.id)}">
                                ${escapeHtml(entry.label || `듣기 ${index + 1}`)}
                            </a>
                        `).join("")}
                    </div>
                </div>
            </aside>
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
        const flipLabel = chooseLocalizedText("뜻 보기", "Xem nghia");
        const frontLabel = chooseLocalizedText("앞면", "Mat truoc");
        const backLabel = chooseLocalizedText("뒷면", "Mat sau");
        const returnLabel = chooseLocalizedText("앞면으로 돌아가기", "Quay lai mat truoc");
        const hintLabel = chooseLocalizedText("문맥 힌트", "Goi y ngu canh");
        const buttonLabel = chooseLocalizedText("어휘 카드 뒤집기", "Lat the tu vung");
        return `
            <div class="lw-vocab-grid">
                ${(lesson.preListening.vocab || []).map((item, index) => `
                    <article class="lw-vocab-card" data-open="false" id="vocab-${escapeHtml(lesson.id)}-${index}">
                        <button
                            type="button"
                            class="lw-vocab-flip"
                            data-action="toggle-vocab"
                            data-lesson-id="${escapeHtml(lesson.id)}"
                            data-vocab-index="${index}"
                            aria-pressed="false"
                            aria-label="${escapeHtml(buttonLabel)}"
                        >
                            <span class="lw-vocab-flip__inner">
                                <span class="lw-vocab-face lw-vocab-face--front">
                                    <span class="lw-vocab-badge">${escapeHtml(frontLabel)}</span>
                                    <span class="lw-vocab-ko">${escapeHtml(item.ko)}</span>
                                    <span class="lw-vocab-tip">${escapeHtml(flipLabel)}</span>
                                </span>
                                <span class="lw-vocab-face lw-vocab-face--back">
                                    <span class="lw-vocab-badge">${escapeHtml(backLabel)}</span>
                                    <span class="lw-vocab-vi">${escapeHtml(item.vi || "")}</span>
                                    ${item.hint ? `
                                        <span class="lw-vocab-context">
                                            <strong>${escapeHtml(hintLabel)}</strong>
                                            <span>${escapeHtml(item.hint)}</span>
                                        </span>
                                    ` : ""}
                                    <span class="lw-vocab-tip">${escapeHtml(returnLabel)}</span>
                                </span>
                            </span>
                        </button>
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
        const vocabTitle = chooseLocalizedText("핵심 어휘", "Tu vung chinh");
        const vocabCopy = chooseLocalizedText(
            "카드를 뒤집으며 표현의 뜻과 문맥 힌트를 먼저 정리해 보세요.",
            "Hay lat the de kiem tra nghia va goi y ngu canh cua cac bieu hien truoc khi nghe."
        );
        const predictionTitle = chooseLocalizedText("상황 예측", "Du doan tinh huong");
        const predictionCopy = chooseLocalizedText(
            "화자 관계와 담화 유형을 고르고, 왜 그렇게 생각했는지 짧게 정리해 보세요.",
            "Hay chon quan he giua nguoi noi va loai hoi thoai, sau do ghi ngan gon vi sao em du doan nhu vay."
        );
        const topClusterMarkup = usesAudioInPreLayout()
            ? `
                <div class="lw-pre-top-grid">
                    ${buildScene(lesson.scene || {})}
                    ${buildEmbeddedAudioSection(lesson)}
                </div>
            `
            : buildScene(lesson.scene || {});
        return `
            <section class="lw-section lw-progress-target lw-pre-section" id="pre-section-${escapeHtml(lesson.id)}">
                <h3>${escapeHtml(uiText.preListeningTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(uiText.preListeningCopy)}</p>
                ${topClusterMarkup}

                <div class="lw-pre-layout">
                    <div class="lw-pre-card">
                        <div class="lw-pre-card__header">
                            <span class="lw-pre-card__eyebrow">${escapeHtml(vocabTitle)}</span>
                            <p>${escapeHtml(vocabCopy)}</p>
                        </div>
                        ${buildVocab(lesson)}
                    </div>

                    <div class="lw-pre-card">
                        <div class="lw-pre-card__header">
                            <span class="lw-pre-card__eyebrow">${escapeHtml(predictionTitle)}</span>
                            <p>${escapeHtml(predictionCopy)}</p>
                        </div>
                        <div class="lw-prediction-grid">
                            ${buildPredictionGroup(`rel-${lesson.id}`, uiText.predictionRelation, lesson.preListening.relationshipOptions || [])}
                            ${buildPredictionGroup(`genre-${lesson.id}`, uiText.predictionGenre, lesson.preListening.genreOptions || [])}
                        </div>
                        <div class="lw-inline-actions lw-pre-actions">
                            <button type="button" class="lw-button" data-action="check-prediction" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.predictionCheck)}</button>
                        </div>
                        <div id="prediction-feedback-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(uiText.predictionFeedbackInitial)}</div>
                    </div>
                </div>

                <div class="lw-summary-block lw-pre-summary">
                    <strong>${escapeHtml(getLocalizedField(lesson.preListening, "backgroundPromptTitle", uiText.backgroundPromptTitle))}</strong>
                    <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "background-note"))}" placeholder="${escapeHtml(getLocalizedField(lesson.preListening, "backgroundPrompt", "이 상황에서 가장 먼저 나올 내용이나 질문을 한두 문장으로 적어 보세요."))}"></textarea>
                </div>
            </section>
        `;
    }

    function buildAudioPlayerMarkup(lesson, options = {}) {
        const { compact = false } = options;
        const state = getState(lesson.id);
        const uiText = getInstructionText();
        const actionSpacing = compact ? "" : ' style="margin-top: 12px;"';
        const fallbackHelpClass = compact ? "lw-help-box lw-help-box--compact" : "lw-help-box";

        return lesson.audioSrc
            ? `
                <div class="lw-audio-wrap">
                    <strong>${escapeHtml(uiText.originalAudio)}</strong>
                    <audio id="audio-${escapeHtml(lesson.id)}" controls preload="metadata">
                        <source src="${escapeHtml(lesson.audioSrc)}" type="audio/mpeg">
                        ${escapeHtml(uiText.audioUnsupported)}
                    </audio>
                </div>
                <div class="lw-inline-actions"${actionSpacing}>
                    <button type="button" class="lw-button-secondary lw-button" data-action="toggle-loop" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(state.loop ? uiText.loopOn : uiText.loopOff)}</button>
                    <button type="button" class="lw-button-secondary lw-button" data-action="stop-speech" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.stopLineSpeech)}</button>
                </div>
            `
            : `
                <div class="${fallbackHelpClass}">${escapeHtml(uiText.noAudioSupport)}</div>
                <div class="lw-inline-actions"${actionSpacing}>
                    <button type="button" class="lw-button" data-action="play-dialogue" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.playDialogue)}</button>
                    <button type="button" class="lw-button-secondary lw-button" data-action="stop-speech" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(uiText.stopAudio)}</button>
                </div>
            `;
    }

    function buildEmbeddedAudioSection(lesson) {
        const state = getState(lesson.id);
        const uiText = getInstructionText();

        return `
            <section class="lw-pre-card lw-pre-card--audio lw-progress-target" id="audio-section-${escapeHtml(lesson.id)}">
                <div class="lw-pre-card__header lw-pre-card__header--audio">
                    <span class="lw-pre-card__eyebrow">${escapeHtml(uiText.audioTitle)}</span>
                    <p>${escapeHtml(uiText.audioCopy)}</p>
                </div>
                <div class="lw-audio-panel__surface">
                    ${buildAudioPlayerMarkup(lesson, { compact: true })}
                    <div class="lw-audio-panel__meta">
                        <div class="lw-speed-row">
                            ${[0.8, 1.0, 1.2].map((speed) => `
                                <button type="button" class="lw-speed-button${state.speed === speed ? " is-active" : ""}" data-action="set-speed" data-lesson-id="${escapeHtml(lesson.id)}" data-speed="${speed.toFixed(1)}">${speed.toFixed(1)}배</button>
                            `).join("")}
                        </div>
                        <div id="listen-status-${escapeHtml(lesson.id)}" class="lw-status lw-status--compact" data-tone="info">${escapeHtml(uiText.listenCount(state.listens))}</div>
                    </div>
                    <div class="lw-help-box lw-help-box--compact">${escapeHtml(uiText.subtitleHelp)}</div>
                </div>
            </section>
        `;
    }

    function buildAudioSection(lesson) {
        const state = getState(lesson.id);
        const uiText = getInstructionText();

        return `
            <section class="lw-section lw-progress-target" id="audio-section-${escapeHtml(lesson.id)}">
                <h3>${escapeHtml(uiText.audioTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(uiText.audioCopy)}</p>
                ${buildAudioPlayerMarkup(lesson)}
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
            <section class="lw-section lw-progress-target" id="subtitle-section-${escapeHtml(lesson.id)}">
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
            <section class="lw-section lw-progress-target" id="sentence-section-${escapeHtml(lesson.id)}">
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
            <section class="lw-section lw-progress-target" id="dictogloss-section-${escapeHtml(lesson.id)}">
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

    function renderSequenceTaskItems(lesson) {
        const itemMap = new Map((lesson.sequenceTask.items || []).map((item) => [item.id, item]));
        const order = getSequenceOrder(lesson);
        const moveUpLabel = chooseLocalizedText("위로", "Len");
        const moveDownLabel = chooseLocalizedText("아래로", "Xuong");

        return order.map((itemId, index) => {
            const item = itemMap.get(itemId);
            if (!item) return "";
            return `
                <li class="lw-sequence-item" draggable="true" data-lesson-id="${escapeHtml(lesson.id)}" data-sequence-item-id="${escapeHtml(itemId)}">
                    <div class="lw-sequence-handle" aria-hidden="true">::</div>
                    <div class="lw-sequence-index">${index + 1}</div>
                    <div class="lw-sequence-text">${escapeHtml(getSequenceItemLabel(item))}</div>
                    <div class="lw-sequence-actions">
                        <button type="button" class="lw-chip-button" data-action="move-sequence-item" data-lesson-id="${escapeHtml(lesson.id)}" data-sequence-item-id="${escapeHtml(itemId)}" data-direction="-1">${escapeHtml(moveUpLabel)}</button>
                        <button type="button" class="lw-chip-button" data-action="move-sequence-item" data-lesson-id="${escapeHtml(lesson.id)}" data-sequence-item-id="${escapeHtml(itemId)}" data-direction="1">${escapeHtml(moveDownLabel)}</button>
                    </div>
                </li>
            `;
        }).join("");
    }

    function buildSequenceTask(lesson) {
        if (!hasSequenceTask(lesson)) return "";

        const title = getLocalizedField(lesson.sequenceTask, "title", chooseLocalizedText("순서 배열", "Sap xep thu tu"));
        const guide = getLocalizedField(
            lesson.sequenceTask,
            "guide",
            chooseLocalizedText(
                "업무 지시가 진행된 순서대로 항목을 배열해 보세요.",
                "Hay sap xep cac muc theo dung thu tu cac chi dan cong viec da duoc dua ra."
            )
        );
        const checkLabel = getSequenceButtonLabel(lesson, "checkLabel", "순서 확인", "Kiem tra thu tu");
        const resetLabel = getSequenceButtonLabel(lesson, "resetLabel", "처음 순서로", "Ve thu tu dau");

        return `
            <section class="lw-section lw-progress-target" id="sequence-section-${escapeHtml(lesson.id)}">
                <h3 id="sequence-title-${escapeHtml(lesson.id)}">${escapeHtml(title)}</h3>
                <p id="sequence-guide-${escapeHtml(lesson.id)}" class="lw-section-copy">${escapeHtml(guide)}</p>
                <ol id="sequence-list-${escapeHtml(lesson.id)}" class="lw-sequence-list">
                    ${renderSequenceTaskItems(lesson)}
                </ol>
                <div class="lw-inline-actions" style="margin-top: 12px;">
                    <button type="button" class="lw-button" id="sequence-check-${escapeHtml(lesson.id)}" data-action="check-sequence-task" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(checkLabel)}</button>
                    <button type="button" class="lw-button-secondary lw-button" id="sequence-reset-${escapeHtml(lesson.id)}" data-action="reset-sequence-task" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(resetLabel)}</button>
                </div>
                <div id="sequence-status-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(getSequenceStatusInitial(lesson))}</div>
            </section>
        `;
    }

    function buildNoteSection(lesson) {
        const uiText = getInstructionText();
        const notePrintButton = chooseLocalizedText("인쇄용 노트 열기", "Mo ban in ghi chu");
        const notePrintHelp = chooseLocalizedText(
            "현재 적은 노트를 인쇄용 정리본으로 열 수 있습니다.",
            "Co the mo phien ban de in tu nhung ghi chu hien tai."
        );
        return `
            <section class="lw-section lw-progress-target" id="note-section-${escapeHtml(lesson.id)}">
                <h3>${escapeHtml(uiText.noteTitle)}</h3>
                <p class="lw-section-copy">${escapeHtml(uiText.noteCopy)}</p>
                <div class="lw-inline-actions lw-note-tools">
                    <button type="button" class="lw-button-secondary lw-button" data-action="print-note-sheet" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(notePrintButton)}</button>
                </div>
                <div id="note-print-status-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(notePrintHelp)}</div>
                ${hasProsConsTable(lesson) ? `
                    <div class="lw-summary-block" style="margin-bottom: 14px;">
                        <strong>${escapeHtml(getLocalizedField(lesson.prosConsTable, "title", chooseLocalizedText("장단점 정리", "Tong hop uu diem va nhoc diem")))}</strong>
                        <div style="font-size: 14px; line-height: 1.8; color: #475569;">${escapeHtml(getLocalizedField(lesson.prosConsTable, "guide", chooseLocalizedText("좋은 점과 고민되는 점을 나눠 적어 보면 대화의 논리가 더 또렷해집니다.", "Khi tach rieng diem tot va dieu dang do du, logic cua hoi thoai se ro hon.")))}</div>
                    </div>
                    <div class="lw-balance-grid">
                        <div class="lw-note-block">
                            <strong>${escapeHtml(getLocalizedField(lesson.prosConsTable, "prosLabel", chooseLocalizedText("좋은 점", "Diem tot")))}</strong>
                            <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "pros-cons-pros"))}" placeholder="${escapeHtml(getLocalizedField(lesson.prosConsTable, "prosPlaceholder", chooseLocalizedText("예: 집에서 가깝다, 동료들이 좋다", "Vi du: gan nha, dong nghiep tot"))) }"></textarea>
                        </div>
                        <div class="lw-note-block">
                            <strong>${escapeHtml(getLocalizedField(lesson.prosConsTable, "consLabel", chooseLocalizedText("고민되는 점", "Dieu dang do du")))}</strong>
                            <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "pros-cons-cons"))}" placeholder="${escapeHtml(getLocalizedField(lesson.prosConsTable, "consPlaceholder", chooseLocalizedText("예: 너무 바쁘다, 야근이 많다", "Vi du: qua ban, tang ca nhieu"))) }"></textarea>
                        </div>
                    </div>
                ` : ""}
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
            <section class="lw-section lw-progress-target" id="quiz-section-${escapeHtml(lesson.id)}">
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
        const pendingLabel = getLocalizedField(lesson.activityImage, "pendingLabel", "이미지를 준비 중입니다.");
        const pendingHint = getLocalizedField(lesson.activityImage, "pendingHint", "이미지 파일을 추가하면 이 영역에 자동으로 표시됩니다.");
        return `
            <figure class="lw-lesson-visual" data-image-status="ready">
                <img src="${escapeHtml(lesson.activityImage.src)}" alt="${escapeHtml(getLocalizedField(lesson.activityImage, "alt", lesson.title || "학습 그림"))}" loading="lazy" decoding="async" onerror="const figure=this.closest('.lw-lesson-visual'); if(figure){figure.setAttribute('data-image-status','missing');} this.remove();">
                <div class="lw-lesson-visual-placeholder" aria-live="polite">
                    <strong>${escapeHtml(pendingLabel)}</strong>
                    <span>${escapeHtml(pendingHint)}</span>
                </div>
                ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
            </figure>
        `;
    }

    function buildGrammarLinkSection(lesson) {
        if (!lesson.grammarLink || !lesson.grammarLink.href) return "";

        const title = getLocalizedField(
            lesson.grammarLink,
            "title",
            chooseLocalizedText("문법 연결", "Lien ket ngu phap")
        );
        const description = getLocalizedField(
            lesson.grammarLink,
            "description",
            chooseLocalizedText(
                "이 듣기와 연결되는 문법 페이지로 바로 이동해 복습해 보세요.",
                "Hay mo ngay trang ngu phap lien quan de on lai sau khi nghe."
            )
        );
        const label = getLocalizedField(
            lesson.grammarLink,
            "label",
            chooseLocalizedText("문법 페이지로 이동", "Mo trang ngu phap")
        );

        return `
            <section class="lw-section">
                <h3>${escapeHtml(title)}</h3>
                <div class="lw-summary-block">
                    <div style="font-size: 14px; line-height: 1.8; color: #475569;">${escapeHtml(description)}</div>
                    <div class="lw-inline-actions" style="margin-top: 12px;">
                        <a class="lw-button lw-resource-link" href="${escapeHtml(lesson.grammarLink.href)}">${escapeHtml(label)}</a>
                    </div>
                </div>
            </section>
        `;
    }

    function buildSpeakingSection(lesson) {
        if (!lesson.speakingTask) return "";

        const title = getLocalizedField(
            lesson.speakingTask,
            "title",
            chooseLocalizedText("말하기 출력", "Dau ra noi")
        );
        const prompt = getLocalizedField(
            lesson.speakingTask,
            "prompt",
            chooseLocalizedText("들은 내용을 바탕으로 직접 말할 준비를 해 보세요.", "Hay chuan bi noi dua tren noi dung vua nghe.")
        );
        const placeholder = getLocalizedField(
            lesson.speakingTask,
            "placeholder",
            chooseLocalizedText("말할 순서나 핵심 문장을 메모해 보세요.", "Hay ghi nhanh thu tu noi hoac cac cau chinh.")
        );
        const tips = getInstructionLanguage() === "vi"
            ? (lesson.speakingTask.tipsVi || [])
            : (lesson.speakingTask.tips || []);

        return `
            <section class="lw-section">
                <h3>${escapeHtml(title)}</h3>
                <p class="lw-section-copy">${escapeHtml(prompt)}</p>
                ${tips.length ? `<div class="lw-keyword-pack">${tips.map((tip) => `<span>${escapeHtml(tip)}</span>`).join("")}</div>` : ""}
                <textarea class="lw-textarea" data-storage-key="${escapeHtml(storageKey(lesson.id, "speaking-task"))}" placeholder="${escapeHtml(placeholder)}" style="margin-top: 14px;"></textarea>
            </section>
        `;
    }

    function buildClozeSection(lesson) {
        if (!hasClozeItems(lesson)) return "";

        const title = lesson.clozeSection
            ? getLocalizedField(lesson.clozeSection, "title", chooseLocalizedText("빈칸 채우기", "Dien vao cho trong"))
            : chooseLocalizedText("빈칸 채우기", "Dien vao cho trong");
        const guide = lesson.clozeSection
            ? getLocalizedField(
                lesson.clozeSection,
                "guide",
                chooseLocalizedText(
                    "핵심 문법이나 표현을 채우며 문장의 흐름을 다시 확인해 보세요.",
                    "Hay dien cho trong de kiem tra lai dong chay cua cau va mau ngu phap chinh."
                )
            )
            : chooseLocalizedText(
                "핵심 문법이나 표현을 채우며 문장의 흐름을 다시 확인해 보세요.",
                "Hay dien cho trong de kiem tra lai dong chay cua cau va mau ngu phap chinh."
            );
        const hintLabel = chooseLocalizedText("문법 힌트", "Goi y ngu phap");
        const submitLabel = lesson.clozeSection
            ? getLocalizedField(lesson.clozeSection, "submitLabel", chooseLocalizedText("정답 확인", "Kiem tra dap an"))
            : chooseLocalizedText("정답 확인", "Kiem tra dap an");
        const resetLabel = lesson.clozeSection
            ? getLocalizedField(lesson.clozeSection, "resetLabel", chooseLocalizedText("다시 풀기", "Lam lai"))
            : chooseLocalizedText("다시 풀기", "Lam lai");

        return `
            <section class="lw-section lw-progress-target" id="cloze-section-${escapeHtml(lesson.id)}">
                <h3 id="cloze-title-${escapeHtml(lesson.id)}">${escapeHtml(title)}</h3>
                <p id="cloze-guide-${escapeHtml(lesson.id)}" class="lw-section-copy">${escapeHtml(guide)}</p>
                <div class="lw-grid">
                    ${(lesson.clozeItems || []).map((item, index) => `
                        <article class="lw-quiz-card lw-cloze-card" id="cloze-card-${escapeHtml(lesson.id)}-${index}">
                            <strong id="cloze-prompt-${escapeHtml(lesson.id)}-${index}">${index + 1}. ${escapeHtml(getClozeSentence(item))}</strong>
                            ${getClozeHint(item) ? `<div class="lw-help-box lw-cloze-hint" id="cloze-hint-${escapeHtml(lesson.id)}-${index}">${escapeHtml(hintLabel)}: ${escapeHtml(getClozeHint(item))}</div>` : ""}
                            <input
                                type="text"
                                class="lw-text-input lw-cloze-input"
                                id="cloze-input-${escapeHtml(lesson.id)}-${index}"
                                data-storage-key="${escapeHtml(storageKey(lesson.id, `cloze-${index}`))}"
                                placeholder="${escapeHtml(getClozePlaceholder(item))}"
                                autocomplete="off"
                            >
                            <div class="lw-quiz-feedback" id="cloze-feedback-${escapeHtml(lesson.id)}-${index}">${escapeHtml(getClozeFeedback(item))}</div>
                        </article>
                    `).join("")}
                </div>
                <div class="lw-quiz-actions" style="margin-top: 14px;">
                    <button type="button" class="lw-quiz-submit" id="cloze-submit-${escapeHtml(lesson.id)}" data-action="submit-cloze" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(submitLabel)}</button>
                    <button type="button" class="lw-quiz-reset" id="cloze-reset-${escapeHtml(lesson.id)}" data-action="reset-cloze" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(resetLabel)}</button>
                </div>
                <div id="cloze-status-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(getClozeStatusInitial(lesson))}</div>
            </section>
        `;
    }

    function buildTfSection(lesson) {
        if (!hasTfQuestions(lesson)) return "";

        const title = lesson.tfSection
            ? getLocalizedField(lesson.tfSection, "title", chooseLocalizedText("빠른 확인", "Kiem tra nhanh"))
            : chooseLocalizedText("빠른 확인", "Kiem tra nhanh");
        const guide = lesson.tfSection
            ? getLocalizedField(
                lesson.tfSection,
                "guide",
                chooseLocalizedText(
                    "객관식 퀴즈에 들어가기 전에 O/X로 핵심 사실을 먼저 확인해 보세요.",
                    "Truoc khi vao bai trac nghiem, hay kiem tra nhanh cac thong tin chinh bang O/X."
                )
            )
            : chooseLocalizedText(
                "객관식 퀴즈에 들어가기 전에 O/X로 핵심 사실을 먼저 확인해 보세요.",
                "Truoc khi vao bai trac nghiem, hay kiem tra nhanh cac thong tin chinh bang O/X."
            );
        const trueLabel = chooseLocalizedText("맞다 (O)", "Dung (O)");
        const falseLabel = chooseLocalizedText("아니다 (X)", "Sai (X)");
        const submitLabel = lesson.tfSection
            ? getLocalizedField(lesson.tfSection, "submitLabel", chooseLocalizedText("확인하기", "Kiem tra"))
            : chooseLocalizedText("확인하기", "Kiem tra");
        const resetLabel = lesson.tfSection
            ? getLocalizedField(lesson.tfSection, "resetLabel", chooseLocalizedText("다시 풀기", "Lam lai"))
            : chooseLocalizedText("다시 풀기", "Lam lai");

        return `
            <section class="lw-section lw-progress-target" id="tf-section-${escapeHtml(lesson.id)}">
                <h3 id="tf-title-${escapeHtml(lesson.id)}">${escapeHtml(title)}</h3>
                <p id="tf-guide-${escapeHtml(lesson.id)}" class="lw-section-copy">${escapeHtml(guide)}</p>
                <div class="lw-grid">
                    ${(lesson.tfQuestions || []).map((question, index) => `
                        <article class="lw-quiz-card" id="tf-card-${escapeHtml(lesson.id)}-${index}">
                            <strong id="tf-prompt-${escapeHtml(lesson.id)}-${index}">${index + 1}. ${escapeHtml(getTfStatement(question))}</strong>
                            <div class="lw-quiz-options">
                                <label>
                                    <input type="radio" name="tf-${escapeHtml(lesson.id)}-${index}" value="O">
                                    <span id="tf-option-${escapeHtml(lesson.id)}-${index}-0">${escapeHtml(trueLabel)}</span>
                                </label>
                                <label>
                                    <input type="radio" name="tf-${escapeHtml(lesson.id)}-${index}" value="X">
                                    <span id="tf-option-${escapeHtml(lesson.id)}-${index}-1">${escapeHtml(falseLabel)}</span>
                                </label>
                            </div>
                            <div class="lw-quiz-feedback" id="tf-feedback-${escapeHtml(lesson.id)}-${index}">${escapeHtml(getTfExplanation(question))}</div>
                        </article>
                    `).join("")}
                </div>
                <div class="lw-quiz-actions" style="margin-top: 14px;">
                    <button type="button" class="lw-quiz-submit" id="tf-submit-${escapeHtml(lesson.id)}" data-action="submit-tf" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(submitLabel)}</button>
                    <button type="button" class="lw-quiz-reset" id="tf-reset-${escapeHtml(lesson.id)}" data-action="reset-tf" data-lesson-id="${escapeHtml(lesson.id)}">${escapeHtml(resetLabel)}</button>
                </div>
                <div id="tf-status-${escapeHtml(lesson.id)}" class="lw-status" data-tone="info">${escapeHtml(getTfStatusInitial(lesson))}</div>
            </section>
        `;
    }

    function buildAnalysisPractice(lesson) {
        if (hasSequenceTask(lesson)) {
            return `
                <div class="lw-grid-2" style="margin-top: 18px;">
                    ${buildSequenceTask(lesson)}
                    ${buildDictogloss(lesson)}
                </div>
                <div class="lw-grid" style="margin-top: 18px;">
                    ${buildNoteSection(lesson)}
                </div>
            `;
        }

        return `
            <div class="lw-grid-2" style="margin-top: 18px;">
                ${buildDictogloss(lesson)}
                ${buildNoteSection(lesson)}
            </div>
        `;
    }

    function buildPracticeExtensions(lesson) {
        const clozeMarkup = buildClozeSection(lesson);
        const speakingMarkup = buildSpeakingSection(lesson);
        const tfMarkup = buildTfSection(lesson);
        const sections = [clozeMarkup, tfMarkup, speakingMarkup].filter(Boolean);
        if (!sections.length) return "";

        if (sections.length === 1) {
            return `
                <div class="lw-grid" style="margin-top: 18px;">
                    ${sections[0]}
                </div>
            `;
        }

        const rows = [];
        for (let index = 0; index < sections.length; index += 2) {
            const slice = sections.slice(index, index + 2);
            rows.push(slice.length === 1
                ? `
                    <div class="lw-grid" style="margin-top: 18px;">
                        ${slice[0]}
                    </div>
                `
                : `
                    <div class="lw-grid-2" style="margin-top: 18px;">
                        ${slice.join("")}
                    </div>
                `
            );
        }

        return rows.join("");
    }

    function buildLesson(lesson, index) {
        const state = getState(lesson.id);
        syncState(lesson.id);
        const introMarkup = usesAudioInPreLayout()
            ? buildPreListening(lesson)
            : `
                <div class="lw-grid-2">
                    ${buildPreListening(lesson)}
                    ${buildAudioSection(lesson)}
                </div>
            `;
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
                ${buildLessonProgress(lesson)}
                ${buildGrammarLinkSection(lesson)}
                ${buildLessonVisual(lesson)}
                ${introMarkup}
                <div class="lw-grid" style="margin-top: 18px;">
                    ${buildSubtitleSection(lesson)}
                    ${buildSentenceTrainer(lesson)}
                </div>
                ${buildAnalysisPractice(lesson)}
                <div class="lw-grid-2" style="margin-top: 18px;">
                    ${buildClarificationSection(lesson)}
                    ${buildOralFeatures(lesson)}
                </div>
                ${buildPracticeExtensions(lesson)}
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

        return lesson.transcript.map((line, index) => {
            if (stage === 1) {
                return `
                    <article class="lw-transcript-line" id="transcript-line-${escapeHtml(lesson.id)}-${index}" data-line-index="${index}">
                        <div class="lw-line-speaker">${escapeHtml(line.speaker)}</div>
                        <div class="lw-keyword-pack">
                            ${(line.keywords || []).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}
                        </div>
                    </article>
                `;
            }

            return `
                <article class="lw-transcript-line" id="transcript-line-${escapeHtml(lesson.id)}-${index}" data-line-index="${index}">
                    <div class="lw-line-speaker">${escapeHtml(line.speaker)}</div>
                    <div class="lw-line-text">${renderChunkedLineText(lesson.id, index, line, "transcript-chunk")}</div>
                    ${stage === 3 ? `<div class="lw-line-translation">${escapeHtml(line.vi || "")}</div>` : ""}
                </article>
            `;
        }).join("");
    }

    function renderLinePreview(lessonId, lineIndex, line, stage) {
        if (stage === 0) {
            return `<div class="lw-line-text is-hidden">${escapeHtml(getInstructionText().hiddenPreview)}</div>`;
        }

        if (stage === 1) {
            return `<div class="lw-keyword-pack">${(line.keywords || []).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>`;
        }

        return `
            <div class="lw-line-text">${renderChunkedLineText(lessonId, lineIndex, line, "preview-chunk")}</div>
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

    function getLineTimeRange(line) {
        const start = Number(line && line.start);
        const end = Number(line && line.end);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
        return { start, end };
    }

    function getExplicitLineChunks(line) {
        if (!line || !Array.isArray(line.chunks) || !line.chunks.length) return null;

        const chunks = line.chunks
            .map((chunk) => {
                const text = String(chunk && chunk.text ? chunk.text : "").trim();
                const start = Number(chunk && chunk.start);
                const end = Number(chunk && chunk.end);
                if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
                return { text, start, end };
            })
            .filter(Boolean);

        return chunks.length ? chunks : null;
    }

    function buildGeneratedLineChunks(line) {
        const range = getLineTimeRange(line);
        if (!range) return null;

        const source = String(line && line.text ? line.text : "").trim();
        const parts = source.match(/[^.?!]+[.?!]?/g)
            ?.map((part) => part.trim())
            .filter(Boolean) || [];

        if (parts.length < 2 || range.end - range.start < 2.6) return null;

        const weights = parts.map((part) => Math.max(normalizeText(part).length, part.length, 1));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        if (!totalWeight) return null;

        let cursor = range.start;
        return parts.map((part, index) => {
            const isLast = index === parts.length - 1;
            const duration = isLast
                ? Math.max(0, range.end - cursor)
                : (range.end - range.start) * (weights[index] / totalWeight);
            const start = Number(cursor.toFixed(3));
            const end = Number((isLast ? range.end : cursor + duration).toFixed(3));
            cursor = end;
            return { text: part, start, end };
        }).filter((chunk) => chunk.end >= chunk.start);
    }

    function getLineChunks(line) {
        if (!line || typeof line !== "object") return null;
        if (lineChunkCache.has(line)) return lineChunkCache.get(line);

        const chunks = getExplicitLineChunks(line) || buildGeneratedLineChunks(line);
        lineChunkCache.set(line, chunks);
        return chunks;
    }

    function hasTimedTranscript(lesson) {
        return Boolean(lesson && Array.isArray(lesson.transcript) && lesson.transcript.some((line) => getLineTimeRange(line)));
    }

    function renderChunkedLineText(lessonId, lineIndex, line, slotIdPrefix) {
        const chunks = getLineChunks(line);
        if (!chunks) return decorateText(line.text, line.highlights || []);

        return chunks.map((chunk, chunkIndex) => `
            <span
                class="lw-line-chunk"
                id="${slotIdPrefix}-${lessonId}-${lineIndex}-${chunkIndex}"
                data-line-index="${lineIndex}"
                data-chunk-index="${chunkIndex}"
            >${decorateText(chunk.text, line.highlights || [])}</span>
        `).join(" ");
    }

    function getAudioActiveLineIndex(lessonId, currentTime) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasTimedTranscript(lesson)) return null;

        const safeTime = Number.isFinite(currentTime) ? currentTime : 0;
        for (let index = 0; index < lesson.transcript.length; index += 1) {
            const range = getLineTimeRange(lesson.transcript[index]);
            if (!range) continue;
            if (safeTime >= Math.max(0, range.start - 0.05) && safeTime < range.end + 0.05) {
                return index;
            }
        }
        return null;
    }

    function getAudioSyncTarget(lessonId, currentTime) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasTimedTranscript(lesson)) return null;

        const safeTime = Number.isFinite(currentTime) ? currentTime : 0;
        for (let lineIndex = 0; lineIndex < lesson.transcript.length; lineIndex += 1) {
            const line = lesson.transcript[lineIndex];
            const chunks = getLineChunks(line);
            if (chunks && chunks.length) {
                for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
                    const chunk = chunks[chunkIndex];
                    if (safeTime >= Math.max(0, chunk.start - 0.05) && safeTime < chunk.end + 0.05) {
                        return { lineIndex, chunkIndex };
                    }
                }
            }

            const range = getLineTimeRange(line);
            if (!range) continue;
            if (safeTime >= Math.max(0, range.start - 0.05) && safeTime < range.end + 0.05) {
                return { lineIndex, chunkIndex: null };
            }
        }
        return null;
    }

    function setAudioLineClass(lessonId, lineIndex, active) {
        const transcriptLine = document.getElementById(`transcript-line-${lessonId}-${lineIndex}`);
        if (transcriptLine) transcriptLine.classList.toggle("is-audio-active", active);

        const lineCard = document.getElementById(`line-card-${lessonId}-${lineIndex}`);
        if (lineCard) lineCard.classList.toggle("is-audio-active", active);
    }

    function setAudioChunkClass(lessonId, lineIndex, chunkIndex, active) {
        const transcriptChunk = document.getElementById(`transcript-chunk-${lessonId}-${lineIndex}-${chunkIndex}`);
        if (transcriptChunk) transcriptChunk.classList.toggle("is-audio-active", active);

        const previewChunk = document.getElementById(`preview-chunk-${lessonId}-${lineIndex}-${chunkIndex}`);
        if (previewChunk) previewChunk.classList.toggle("is-audio-active", active);
    }

    function maybeScrollAudioLineIntoView(lessonId, lineIndex) {
        const transcriptLine = document.getElementById(`transcript-line-${lessonId}-${lineIndex}`);
        if (!transcriptLine) return;

        const rect = transcriptLine.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 0;
        const topLimit = window.innerWidth <= 640 ? 190 : 132;
        const bottomLimit = viewportHeight - 140;
        if (rect.top < topLimit || rect.bottom > bottomLimit) {
            transcriptLine.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    function updateAudioSyncUI(lessonId, options = {}) {
        const lesson = lessonMap.get(lessonId);
        const audio = document.getElementById(`audio-${lessonId}`);
        if (!lesson || !audio || !hasTimedTranscript(lesson)) {
            const previousLine = audioLineState.get(lessonId);
            const previousChunk = audioChunkState.get(lessonId);
            if (Number.isInteger(previousChunk) && Number.isInteger(previousLine)) {
                setAudioChunkClass(lessonId, previousLine, previousChunk, false);
            }
            if (Number.isInteger(previousLine)) setAudioLineClass(lessonId, previousLine, false);
            audioLineState.delete(lessonId);
            audioChunkState.delete(lessonId);
            return;
        }

        const target = getAudioSyncTarget(lessonId, audio.currentTime);
        const activeLineIndex = target ? target.lineIndex : null;
        const activeChunkIndex = target ? target.chunkIndex : null;
        const previousLine = audioLineState.get(lessonId);
        const previousChunk = audioChunkState.get(lessonId);

        if (previousLine === activeLineIndex && previousChunk === activeChunkIndex && !options.force) {
            if (Number.isInteger(activeLineIndex) && playbackState.kind === "audio" && playbackState.lessonId === lessonId) {
                playbackState.currentLineIndex = activeLineIndex;
            }
            return;
        }

        if (Number.isInteger(previousChunk) && Number.isInteger(previousLine)) {
            setAudioChunkClass(lessonId, previousLine, previousChunk, false);
        }
        if (Number.isInteger(previousLine) && (previousLine !== activeLineIndex || options.force)) {
            setAudioLineClass(lessonId, previousLine, false);
        }

        if (Number.isInteger(activeLineIndex)) {
            setAudioLineClass(lessonId, activeLineIndex, true);
            audioLineState.set(lessonId, activeLineIndex);
            if (Number.isInteger(activeChunkIndex)) {
                setAudioChunkClass(lessonId, activeLineIndex, activeChunkIndex, true);
                audioChunkState.set(lessonId, activeChunkIndex);
            } else {
                audioChunkState.delete(lessonId);
            }
            if (playbackState.kind === "audio" && playbackState.lessonId === lessonId) {
                playbackState.currentLineIndex = activeLineIndex;
            }
            if (options.scroll !== false && playbackState.kind === "audio" && playbackState.lessonId === lessonId) {
                maybeScrollAudioLineIntoView(lessonId, activeLineIndex);
            }
            return;
        }

        audioLineState.delete(lessonId);
        audioChunkState.delete(lessonId);
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
            if (preview) preview.innerHTML = renderLinePreview(lessonId, index, line, state.stage);
        });

        document.querySelectorAll(`[data-action="set-note-tab"][data-lesson-id="${lessonId}"]`).forEach((button) => {
            button.classList.toggle("is-active", button.dataset.noteTab === state.noteTab);
        });

        const threePanel = document.getElementById(`note-three-${lessonId}`);
        const cornellPanel = document.getElementById(`note-cornell-${lessonId}`);
        if (threePanel) threePanel.classList.toggle("is-active", state.noteTab === "three");
        if (cornellPanel) cornellPanel.classList.toggle("is-active", state.noteTab === "cornell");

        updateAudioSyncUI(lessonId, { force: true, scroll: false });
        updateClozeUI(lessonId);
        updateSequenceTaskUI(lessonId);
        updateTfUI(lessonId);
        updateQuizUI(lessonId);
        updateLessonProgressUI(lessonId);
        updateQuickDockUI();
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
        const card = document.getElementById(`vocab-${lessonId}-${vocabIndex}`);
        if (!card) return;
        const isOpen = card.dataset.open === "true";
        card.dataset.open = isOpen ? "false" : "true";
        const button = card.querySelector("[data-action='toggle-vocab']");
        if (button) button.setAttribute("aria-pressed", String(!isOpen));
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

    function updateQuickDockUI() {
        const mount = document.getElementById("lw-quick-dock-mount");
        if (!mount || !pageConfig) return;
        mount.innerHTML = buildQuickDock(pageConfig);
    }

    function refreshQuickDockProgress() {
        const lesson = getQuickDockLesson();
        if (!lesson) return;

        const progress = getQuickDockProgressData(lesson);
        const current = document.getElementById("lw-quick-dock-current");
        const total = document.getElementById("lw-quick-dock-total");
        const range = document.getElementById("lw-quick-dock-progress");

        if (current) current.textContent = progress.currentLabel;
        if (total) total.textContent = progress.totalLabel;
        if (range) {
            range.min = String(progress.min);
            range.max = String(progress.max);
            range.step = progress.mode === "audio" ? "0.1" : "1";
            range.value = String(progress.value);
            range.dataset.progressMode = progress.mode;
            range.dataset.lessonId = lesson.id;
        }
    }

    function setQuickDockLesson(lessonId, options = {}) {
        if (!lessonId || !lessonMap.has(lessonId)) return;
        if (quickDockLessonId === lessonId && !options.force) return;
        quickDockLessonId = lessonId;
        if (options.save !== false) {
            writeStorage(quickDockLessonStorageKey(), lessonId);
        }
        updateQuickDockUI();
    }

    function setQuickDockCollapsed(collapsed, options = {}) {
        quickDockCollapsed = Boolean(collapsed);
        if (options.save !== false) {
            writeStorage(quickDockCollapsedStorageKey(), quickDockCollapsed);
        }
        updateQuickDockUI();
    }

    function getViewportLessonId() {
        if (!pageConfig || !Array.isArray(pageConfig.lessons) || !pageConfig.lessons.length) return null;

        let bestId = pageConfig.lessons[0].id;
        let bestScore = Number.POSITIVE_INFINITY;
        const viewportHeight = window.innerHeight || 0;

        pageConfig.lessons.forEach((lesson) => {
            const section = document.getElementById(`lesson-${lesson.id}`);
            if (!section) return;
            const rect = section.getBoundingClientRect();
            const isNearViewport = rect.bottom > 120 && rect.top < viewportHeight * 0.72;
            const score = Math.abs(rect.top - 106) + (isNearViewport ? 0 : 5000);
            if (score < bestScore) {
                bestScore = score;
                bestId = lesson.id;
            }
        });

        return bestId;
    }

    function getLessonProgressIndex(lesson) {
        const steps = getLessonProgressSteps(lesson);
        const threshold = window.innerWidth <= 640 ? 252 : 170;
        let activeIndex = 0;

        steps.forEach((step, index) => {
            const top = step.targetIds
                .map((targetId) => document.getElementById(targetId))
                .filter(Boolean)
                .map((element) => element.getBoundingClientRect().top)
                .reduce((best, value) => Math.min(best, value), Number.POSITIVE_INFINITY);
            if (top <= threshold) {
                activeIndex = index;
            }
        });

        return activeIndex;
    }

    function updateLessonProgressUI(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson) return;

        const steps = getLessonProgressSteps(lesson);
        const activeIndex = getLessonProgressIndex(lesson);
        const fill = document.getElementById(`lesson-progress-fill-${lessonId}`);
        if (fill) {
            fill.style.width = steps.length > 1
                ? `${(activeIndex / (steps.length - 1)) * 100}%`
                : "100%";
        }

        steps.forEach((step, index) => {
            const link = document.getElementById(`lesson-progress-step-${lessonId}-${step.id}`);
            if (!link) return;
            link.classList.toggle("is-active", index === activeIndex);
            link.classList.toggle("is-completed", index < activeIndex);
            if (index === activeIndex) {
                link.setAttribute("aria-current", "step");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    function syncLessonProgressToViewport() {
        if (!pageConfig || !Array.isArray(pageConfig.lessons)) return;
        pageConfig.lessons.forEach((lesson) => updateLessonProgressUI(lesson.id));
    }

    function syncQuickDockToViewport() {
        if (!pageConfig || !Array.isArray(pageConfig.lessons) || !pageConfig.lessons.length) return;
        const lessonId = playbackState.lessonId || getViewportLessonId();
        if (lessonId && lessonId !== quickDockLessonId) {
            setQuickDockLesson(lessonId, { save: false });
        }
    }

    function scheduleQuickDockViewportSync() {
        if (scrollSyncFrameId) return;
        scrollSyncFrameId = window.requestAnimationFrame(() => {
            scrollSyncFrameId = null;
            syncQuickDockToViewport();
            syncLessonProgressToViewport();
        });
    }

    function setPlaybackState(kind, lessonId, meta = {}) {
        playbackState.kind = kind || null;
        playbackState.lessonId = lessonId || null;
        playbackState.mode = meta.mode || null;
        playbackState.currentLineIndex = Number.isInteger(meta.currentLineIndex) ? meta.currentLineIndex : null;
        if (lessonId) setQuickDockLesson(lessonId, { save: false });
        refreshQuickDockProgress();
    }

    function clearPlaybackState(kind, lessonId) {
        if (kind && playbackState.kind !== kind) return;
        if (lessonId && playbackState.lessonId !== lessonId) return;
        playbackState.kind = null;
        playbackState.lessonId = null;
        playbackState.mode = null;
        playbackState.currentLineIndex = null;
        updateQuickDockUI();
    }

    function cancelSpeech() {
        speechState.token += 1;
        speechState.timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
        speechState.timeouts = [];
        if (speechApi) speechApi.cancel();
        clearSpeakingState();
        clearPlaybackState("speech");
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
        playbackState.currentLineIndex = lineIndex;
        const card = document.getElementById(`line-card-${lessonId}-${lineIndex}`);
        if (card) card.classList.add("is-speaking");
        refreshQuickDockProgress();
    }

    function setDialogueStartLine(lessonId, lineIndex) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson) return;
        const state = getState(lessonId);
        const maxIndex = Math.max((lesson.transcript || []).length - 1, 0);
        state.dialogueStartLine = Math.max(0, Math.min(Number(lineIndex) || 0, maxIndex));
        syncState(lessonId);
        refreshQuickDockProgress();
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
        clearPlaybackState("audio");
    }

    async function playQuickLesson() {
        const lesson = getQuickDockLesson();
        if (!lesson) return;
        setQuickDockLesson(lesson.id);

        if (lesson.audioSrc) {
            const audio = document.getElementById(`audio-${lesson.id}`);
            const state = getState(lesson.id);
            if (!audio) return;
            cancelSpeech();
            pauseAllAudio();
            audio.playbackRate = state.speed;
            audio.loop = state.loop;
            try {
                await audio.play();
            } catch (error) {
                setStatus(`listen-status-${lesson.id}`, getInstructionText().audioUnsupported, "warn");
            }
            return;
        }

        await playDialogue(lesson.id, getState(lesson.id).dialogueStartLine || 0);
    }

    function stopQuickLesson() {
        const lesson = getQuickDockLesson();
        const targetLessonId = playbackState.lessonId || (lesson && lesson.id);
        pauseAllAudio();
        cancelSpeech();
        if (targetLessonId) {
            setStatus(`listen-status-${targetLessonId}`, getInstructionText().speechStopped, "info");
        }
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
        setPlaybackState("speech", lessonId, { mode: "line", currentLineIndex: lineIndex });
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
        clearPlaybackState("speech", lessonId);
    }

    async function playDialogue(lessonId, startIndex = 0) {
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
        const safeStart = Math.max(0, Math.min(Number(startIndex) || 0, Math.max((lesson.transcript || []).length - 1, 0)));
        setDialogueStartLine(lessonId, safeStart);
        setPlaybackState("speech", lessonId, { mode: "dialogue", currentLineIndex: safeStart });
        setStatus(`listen-status-${lessonId}`, uiText.dialoguePlaying, "info");

        for (let index = safeStart; index < lesson.transcript.length; index += 1) {
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
        clearPlaybackState("speech", lessonId);
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

    function readPrintableValue(key) {
        const value = readStorage(key, "");
        return typeof value === "string" ? value.trim() : "";
    }

    function renderPrintableBlock(title, value, emptyText) {
        const content = value
            ? `<div class="sheet-value">${escapeHtml(value)}</div>`
            : `<div class="sheet-value sheet-value--empty">${escapeHtml(emptyText)}</div>`;
        return `
            <section class="sheet-block">
                <h3>${escapeHtml(title)}</h3>
                ${content}
            </section>
        `;
    }

    function printNoteSheet(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson) return;

        const lessonTitle = getLocalizedField(lesson, "title", lesson.title || lessonId);
        const emptyText = chooseLocalizedText("아직 적지 않음", "Chua ghi");
        const printTitle = chooseLocalizedText("인쇄용 노트 시트", "Phieu ghi chu de in");
        const printedAtLabel = chooseLocalizedText("출력 시각", "Thoi gian in");
        const threeTitle = chooseLocalizedText("3칸 노트", "Ghi chu 3 cot");
        const cornellTitle = chooseLocalizedText("Cornell 노트", "Ghi chu Cornell");
        const notePrintSuccess = chooseLocalizedText(
            "인쇄용 노트 창을 열었습니다.",
            "Da mo cua so ghi chu de in."
        );
        const notePrintWarn = chooseLocalizedText(
            "브라우저가 인쇄 창을 막았습니다. 팝업 차단을 확인해 주세요.",
            "Trinh duyet da chan cua so in. Hay kiem tra che do chan pop-up."
        );
        const printedAt = new Date().toLocaleString(getInstructionLanguage() === "vi" ? "vi-VN" : "ko-KR");

        const sections = [];

        if (hasProsConsTable(lesson)) {
            sections.push(`
                <section class="sheet-group">
                    <h2>${escapeHtml(getLocalizedField(lesson.prosConsTable, "title", chooseLocalizedText("장단점 비교", "So sanh uu diem va nhoc diem")))}</h2>
                    <div class="sheet-grid">
                        ${renderPrintableBlock(
                            getLocalizedField(lesson.prosConsTable, "prosLabel", chooseLocalizedText("좋은 점", "Diem tot")),
                            readPrintableValue(storageKey(lessonId, "pros-cons-pros")),
                            emptyText
                        )}
                        ${renderPrintableBlock(
                            getLocalizedField(lesson.prosConsTable, "consLabel", chooseLocalizedText("고민되는 점", "Dieu dang do du")),
                            readPrintableValue(storageKey(lessonId, "pros-cons-cons")),
                            emptyText
                        )}
                    </div>
                </section>
            `);
        }

        sections.push(`
            <section class="sheet-group">
                <h2>${escapeHtml(threeTitle)}</h2>
                <div class="sheet-grid sheet-grid--three">
                    ${renderPrintableBlock(getInstructionText().noteKeywords, readPrintableValue(storageKey(lessonId, "note-three-keywords")), emptyText)}
                    ${renderPrintableBlock(getInstructionText().noteDetails, readPrintableValue(storageKey(lessonId, "note-three-details")), emptyText)}
                    ${renderPrintableBlock(getInstructionText().noteQuestions, readPrintableValue(storageKey(lessonId, "note-three-questions")), emptyText)}
                </div>
            </section>
        `);

        sections.push(`
            <section class="sheet-group">
                <h2>${escapeHtml(cornellTitle)}</h2>
                <div class="sheet-grid">
                    ${renderPrintableBlock(getInstructionText().noteCue, readPrintableValue(storageKey(lessonId, "note-cue")), emptyText)}
                    ${renderPrintableBlock(getInstructionText().noteNotes, readPrintableValue(storageKey(lessonId, "note-notes")), emptyText)}
                </div>
                ${renderPrintableBlock(getInstructionText().noteSummary, readPrintableValue(storageKey(lessonId, "note-summary")), emptyText)}
            </section>
        `);

        const printWindow = window.open("", "_blank", "width=960,height=760");
        if (!printWindow) {
            setStatus(`note-print-status-${lessonId}`, notePrintWarn, "warn");
            return;
        }

        printWindow.document.open();
        printWindow.document.write(`
            <!doctype html>
            <html lang="${escapeHtml(getInstructionLanguage() === "vi" ? "vi" : "ko")}">
                <head>
                    <meta charset="utf-8">
                    <title>${escapeHtml(`${printTitle} - ${lessonTitle}`)}</title>
                    <style>
                        :root { color-scheme: light; }
                        body { margin: 0; font-family: "Segoe UI", sans-serif; color: #0f172a; background: #fffaf2; }
                        main { max-width: 980px; margin: 0 auto; padding: 32px 24px 48px; }
                        .sheet-header { padding: 24px; border-radius: 24px; background: linear-gradient(135deg, #fff7ed, #ffffff); border: 1px solid rgba(194, 120, 3, 0.16); }
                        .sheet-header h1 { margin: 0 0 8px; font-size: 32px; line-height: 1.1; }
                        .sheet-header p { margin: 0; font-size: 14px; line-height: 1.7; color: #475569; }
                        .sheet-group { margin-top: 22px; }
                        .sheet-group h2 { margin: 0 0 12px; font-size: 20px; }
                        .sheet-grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .sheet-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                        .sheet-block { border-radius: 18px; padding: 16px; border: 1px solid rgba(148, 163, 184, 0.24); background: #fff; break-inside: avoid; }
                        .sheet-block h3 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: #92400e; }
                        .sheet-value { min-height: 72px; white-space: pre-wrap; line-height: 1.8; font-size: 14px; }
                        .sheet-value--empty { color: #94a3b8; font-style: italic; }
                        @media print {
                            body { background: #fff; }
                            main { padding: 0; max-width: none; }
                            .sheet-header { border-color: #d6d3d1; box-shadow: none; }
                        }
                    </style>
                </head>
                <body>
                    <main>
                        <header class="sheet-header">
                            <h1>${escapeHtml(lessonTitle)}</h1>
                            <p>${escapeHtml(printTitle)} / ${escapeHtml(printedAtLabel)}: ${escapeHtml(printedAt)}</p>
                        </header>
                        ${sections.join("")}
                    </main>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        window.setTimeout(() => {
            printWindow.print();
        }, 150);
        setStatus(`note-print-status-${lessonId}`, notePrintSuccess, "success");
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

    function updateTfUI(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasTfQuestions(lesson)) return;

        const state = getLessonTfState(lessonId);
        const title = lesson.tfSection
            ? getLocalizedField(lesson.tfSection, "title", chooseLocalizedText("빠른 확인", "Kiem tra nhanh"))
            : chooseLocalizedText("빠른 확인", "Kiem tra nhanh");
        const guide = lesson.tfSection
            ? getLocalizedField(
                lesson.tfSection,
                "guide",
                chooseLocalizedText(
                    "객관식 퀴즈에 들어가기 전에 O/X로 핵심 사실을 먼저 확인해 보세요.",
                    "Truoc khi vao bai trac nghiem, hay kiem tra nhanh cac thong tin chinh bang O/X."
                )
            )
            : chooseLocalizedText(
                "객관식 퀴즈에 들어가기 전에 O/X로 핵심 사실을 먼저 확인해 보세요.",
                "Truoc khi vao bai trac nghiem, hay kiem tra nhanh cac thong tin chinh bang O/X."
            );
        const submitLabel = lesson.tfSection
            ? getLocalizedField(lesson.tfSection, "submitLabel", chooseLocalizedText("확인하기", "Kiem tra"))
            : chooseLocalizedText("확인하기", "Kiem tra");
        const resetLabel = lesson.tfSection
            ? getLocalizedField(lesson.tfSection, "resetLabel", chooseLocalizedText("다시 풀기", "Lam lai"))
            : chooseLocalizedText("다시 풀기", "Lam lai");

        const titleNode = document.getElementById(`tf-title-${lessonId}`);
        if (titleNode) titleNode.textContent = title;

        const guideNode = document.getElementById(`tf-guide-${lessonId}`);
        if (guideNode) guideNode.textContent = guide;

        const submitButton = document.getElementById(`tf-submit-${lessonId}`);
        if (submitButton) submitButton.textContent = submitLabel;

        const resetButton = document.getElementById(`tf-reset-${lessonId}`);
        if (resetButton) resetButton.textContent = resetLabel;

        (lesson.tfQuestions || []).forEach((question, index) => {
            const prompt = document.getElementById(`tf-prompt-${lessonId}-${index}`);
            if (prompt) prompt.textContent = `${index + 1}. ${getTfStatement(question)}`;

            const trueNode = document.getElementById(`tf-option-${lessonId}-${index}-0`);
            if (trueNode) trueNode.textContent = chooseLocalizedText("맞다 (O)", "Dung (O)");

            const falseNode = document.getElementById(`tf-option-${lessonId}-${index}-1`);
            if (falseNode) falseNode.textContent = chooseLocalizedText("아니다 (X)", "Sai (X)");

            const feedback = document.getElementById(`tf-feedback-${lessonId}-${index}`);
            if (feedback) feedback.textContent = getTfExplanation(question);
        });

        if (!state.submitted || state.score == null) {
            setStatus(`tf-status-${lessonId}`, getTfStatusInitial(lesson), "info");
            return;
        }

        setStatus(
            `tf-status-${lessonId}`,
            getTfStatusResult(lesson, lesson.tfQuestions.length, state.score),
            state.score === lesson.tfQuestions.length ? "success" : "info"
        );
    }

    function isClozeCorrect(item, value) {
        const normalized = normalizeText(value);
        if (!normalized) return false;
        return getClozeAnswers(item).some((answer) => normalizeText(answer) === normalized);
    }

    function updateClozeUI(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasClozeItems(lesson)) return;

        const state = getLessonClozeState(lessonId);
        const title = lesson.clozeSection
            ? getLocalizedField(lesson.clozeSection, "title", chooseLocalizedText("빈칸 채우기", "Dien vao cho trong"))
            : chooseLocalizedText("빈칸 채우기", "Dien vao cho trong");
        const guide = lesson.clozeSection
            ? getLocalizedField(
                lesson.clozeSection,
                "guide",
                chooseLocalizedText(
                    "핵심 문법이나 표현을 채우며 문장의 흐름을 다시 확인해 보세요.",
                    "Hay dien cho trong de kiem tra lai dong chay cua cau va mau ngu phap chinh."
                )
            )
            : chooseLocalizedText(
                "핵심 문법이나 표현을 채우며 문장의 흐름을 다시 확인해 보세요.",
                "Hay dien cho trong de kiem tra lai dong chay cua cau va mau ngu phap chinh."
            );
        const hintLabel = chooseLocalizedText("문법 힌트", "Goi y ngu phap");
        const submitLabel = lesson.clozeSection
            ? getLocalizedField(lesson.clozeSection, "submitLabel", chooseLocalizedText("정답 확인", "Kiem tra dap an"))
            : chooseLocalizedText("정답 확인", "Kiem tra dap an");
        const resetLabel = lesson.clozeSection
            ? getLocalizedField(lesson.clozeSection, "resetLabel", chooseLocalizedText("다시 풀기", "Lam lai"))
            : chooseLocalizedText("다시 풀기", "Lam lai");

        const titleNode = document.getElementById(`cloze-title-${lessonId}`);
        if (titleNode) titleNode.textContent = title;

        const guideNode = document.getElementById(`cloze-guide-${lessonId}`);
        if (guideNode) guideNode.textContent = guide;

        const submitButton = document.getElementById(`cloze-submit-${lessonId}`);
        if (submitButton) submitButton.textContent = submitLabel;

        const resetButton = document.getElementById(`cloze-reset-${lessonId}`);
        if (resetButton) resetButton.textContent = resetLabel;

        lesson.clozeItems.forEach((item, index) => {
            const prompt = document.getElementById(`cloze-prompt-${lessonId}-${index}`);
            if (prompt) prompt.textContent = `${index + 1}. ${getClozeSentence(item)}`;

            const hint = document.getElementById(`cloze-hint-${lessonId}-${index}`);
            if (hint) hint.textContent = `${hintLabel}: ${getClozeHint(item)}`;

            const input = document.getElementById(`cloze-input-${lessonId}-${index}`);
            if (input) input.setAttribute("placeholder", getClozePlaceholder(item));

            const feedback = document.getElementById(`cloze-feedback-${lessonId}-${index}`);
            if (feedback) feedback.textContent = getClozeFeedback(item);

            const card = document.getElementById(`cloze-card-${lessonId}-${index}`);
            if (card) {
                card.classList.remove("correct", "incorrect", "show-feedback");
                if (state.submitted) {
                    const value = input ? input.value : readStorage(storageKey(lessonId, `cloze-${index}`), "");
                    const correct = isClozeCorrect(item, value);
                    card.classList.add(correct ? "correct" : "incorrect", "show-feedback");
                }
            }
        });

        if (!state.submitted || state.score == null) {
            setStatus(`cloze-status-${lessonId}`, getClozeStatusInitial(lesson), "info");
            return;
        }

        setStatus(
            `cloze-status-${lessonId}`,
            getClozeStatusResult(lesson, lesson.clozeItems.length, state.score),
            state.score === lesson.clozeItems.length ? "success" : "info"
        );
    }

    function updateSequenceTaskUI(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasSequenceTask(lesson)) return;

        const state = getSequenceTaskState(lessonId);
        const title = getLocalizedField(lesson.sequenceTask, "title", chooseLocalizedText("순서 배열", "Sap xep thu tu"));
        const guide = getLocalizedField(
            lesson.sequenceTask,
            "guide",
            chooseLocalizedText(
                "업무 지시가 진행된 순서대로 항목을 배열해 보세요.",
                "Hay sap xep cac muc theo dung thu tu cac chi dan cong viec da duoc dua ra."
            )
        );

        const titleNode = document.getElementById(`sequence-title-${lessonId}`);
        if (titleNode) titleNode.textContent = title;

        const guideNode = document.getElementById(`sequence-guide-${lessonId}`);
        if (guideNode) guideNode.textContent = guide;

        const listNode = document.getElementById(`sequence-list-${lessonId}`);
        if (listNode) listNode.innerHTML = renderSequenceTaskItems(lesson);

        const checkButton = document.getElementById(`sequence-check-${lessonId}`);
        if (checkButton) {
            checkButton.textContent = getSequenceButtonLabel(lesson, "checkLabel", "순서 확인", "Kiem tra thu tu");
        }

        const resetButton = document.getElementById(`sequence-reset-${lessonId}`);
        if (resetButton) {
            resetButton.textContent = getSequenceButtonLabel(lesson, "resetLabel", "처음 순서로", "Ve thu tu dau");
        }

        if (!state.submitted) {
            setStatus(`sequence-status-${lessonId}`, getSequenceStatusInitial(lesson), "info");
            return;
        }

        setStatus(
            `sequence-status-${lessonId}`,
            state.correct ? getSequenceStatusCorrect(lesson) : getSequenceStatusIncorrect(lesson),
            state.correct ? "success" : "warn"
        );
    }

    function moveSequenceItem(lessonId, itemId, direction) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasSequenceTask(lesson)) return;

        const order = getSequenceOrder(lesson).slice();
        const index = order.indexOf(itemId);
        if (index === -1) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= order.length) return;

        [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
        setSequenceOrder(lessonId, order);

        const state = getSequenceTaskState(lessonId);
        state.submitted = false;
        state.correct = null;
        updateSequenceTaskUI(lessonId);
    }

    function insertSequenceItemBefore(lessonId, draggedId, targetId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasSequenceTask(lesson) || draggedId === targetId) return;

        const currentOrder = getSequenceOrder(lesson);
        const filtered = currentOrder.filter((itemId) => itemId !== draggedId);
        const targetIndex = filtered.indexOf(targetId);
        if (targetIndex === -1) return;

        filtered.splice(targetIndex, 0, draggedId);
        setSequenceOrder(lessonId, filtered);

        const state = getSequenceTaskState(lessonId);
        state.submitted = false;
        state.correct = null;
        updateSequenceTaskUI(lessonId);
    }

    function resetSequenceTask(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasSequenceTask(lesson)) return;

        setSequenceOrder(lessonId, getSequenceDefaultOrder(lesson));
        const state = getSequenceTaskState(lessonId);
        state.submitted = false;
        state.correct = null;
        updateSequenceTaskUI(lessonId);
    }

    function checkSequenceTask(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasSequenceTask(lesson)) return;

        const currentOrder = getSequenceOrder(lesson);
        const answerOrder = lesson.sequenceTask.answerOrder || [];
        if (!currentOrder.length || currentOrder.length !== answerOrder.length) {
            setStatus(`sequence-status-${lessonId}`, getSequenceStatusIncomplete(lesson), "warn");
            return;
        }

        const isCorrect = currentOrder.every((itemId, index) => itemId === answerOrder[index]);
        const state = getSequenceTaskState(lessonId);
        state.submitted = true;
        state.correct = isCorrect;
        updateSequenceTaskUI(lessonId);
    }

    function captureRuntimeState() {
        const snapshot = {
            scrollY: window.scrollY || 0,
            predictions: {},
            tfAnswers: {},
            quizAnswers: {},
            modelSummaryOpen: {},
            openVocabs: {}
        };

        lessonMap.forEach((lesson, lessonId) => {
            snapshot.predictions[lessonId] = {
                relation: document.querySelector(`input[name="rel-${lessonId}"]:checked`)?.value || null,
                genre: document.querySelector(`input[name="genre-${lessonId}"]:checked`)?.value || null
            };
            snapshot.tfAnswers[lessonId] = (lesson.tfQuestions || []).map((question, index) => (
                document.querySelector(`input[name="tf-${lessonId}-${index}"]:checked`)?.value || null
            ));
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
                if (button) button.setAttribute("aria-pressed", "true");
            });
        });

        Object.entries(snapshot.modelSummaryOpen || {}).forEach(([lessonId, isOpen]) => {
            const box = document.getElementById(`model-summary-${lessonId}`);
            if (box) box.hidden = !isOpen;
        });

        Object.entries(snapshot.tfAnswers || {}).forEach(([lessonId, answers]) => {
            (answers || []).forEach((value, index) => {
                if (value == null) return;
                const input = document.querySelector(`input[name="tf-${lessonId}-${index}"][value="${value}"]`);
                if (input) input.checked = true;
            });
        });

        Object.entries(snapshot.quizAnswers || {}).forEach(([lessonId, answers]) => {
            (answers || []).forEach((value, index) => {
                if (value == null) return;
                const input = document.querySelector(`input[name="quiz-${lessonId}-${index}"][value="${value}"]`);
                if (input) input.checked = true;
            });
        });

        lessonMap.forEach((lesson, lessonId) => {
            const tf = getLessonTfState(lessonId);
            const cloze = getLessonClozeState(lessonId);
            (lesson.clozeItems || []).forEach((item, index) => {
                const card = document.getElementById(`cloze-card-${lessonId}-${index}`);
                if (!card) return;
                card.classList.remove("correct", "incorrect", "show-feedback");
                if (!cloze.submitted || cloze.score == null) return;
                const input = document.getElementById(`cloze-input-${lessonId}-${index}`);
                const value = input ? input.value : readStorage(storageKey(lessonId, `cloze-${index}`), "");
                card.classList.add(isClozeCorrect(item, value) ? "correct" : "incorrect", "show-feedback");
            });
            (lesson.tfQuestions || []).forEach((question, index) => {
                const card = document.getElementById(`tf-card-${lessonId}-${index}`);
                if (!card) return;
                card.classList.remove("correct", "incorrect", "show-feedback");
                if (!tf.submitted || tf.score == null) return;
                const selected = document.querySelector(`input[name="tf-${lessonId}-${index}"]:checked`);
                if (!selected) return;
                card.classList.add(selected.value === getTfAnswerValue(question) ? "correct" : "incorrect", "show-feedback");
            });

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

    function resetCloze(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasClozeItems(lesson)) return;

        lesson.clozeItems.forEach((item, index) => {
            const input = document.getElementById(`cloze-input-${lessonId}-${index}`);
            if (input) input.value = "";
            writeStorage(storageKey(lessonId, `cloze-${index}`), "");
            const card = document.getElementById(`cloze-card-${lessonId}-${index}`);
            if (card) {
                card.classList.remove("correct", "incorrect", "show-feedback");
            }
        });

        const state = getLessonClozeState(lessonId);
        state.submitted = false;
        state.score = null;
        updateClozeUI(lessonId);
    }

    function submitCloze(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasClozeItems(lesson)) return;

        let score = 0;
        for (let index = 0; index < lesson.clozeItems.length; index += 1) {
            const item = lesson.clozeItems[index];
            const input = document.getElementById(`cloze-input-${lessonId}-${index}`);
            const value = input ? input.value.trim() : readStorage(storageKey(lessonId, `cloze-${index}`), "");
            if (!value) {
                setStatus(`cloze-status-${lessonId}`, getClozeStatusIncomplete(lesson), "warn");
                return;
            }

            const correct = isClozeCorrect(item, value);
            if (correct) score += 1;

            const card = document.getElementById(`cloze-card-${lessonId}-${index}`);
            if (card) {
                card.classList.remove("correct", "incorrect");
                card.classList.add(correct ? "correct" : "incorrect", "show-feedback");
            }
        }

        const state = getLessonClozeState(lessonId);
        state.submitted = true;
        state.score = score;
        setStatus(
            `cloze-status-${lessonId}`,
            getClozeStatusResult(lesson, lesson.clozeItems.length, score),
            score === lesson.clozeItems.length ? "success" : "info"
        );
    }

    function resetTf(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasTfQuestions(lesson)) return;

        lesson.tfQuestions.forEach((question, index) => {
            document.querySelectorAll(`input[name="tf-${lessonId}-${index}"]`).forEach((input) => {
                input.checked = false;
            });
            const card = document.getElementById(`tf-card-${lessonId}-${index}`);
            if (card) {
                card.classList.remove("correct", "incorrect", "show-feedback");
            }
        });

        const state = getLessonTfState(lessonId);
        state.submitted = false;
        state.score = null;
        updateTfUI(lessonId);
    }

    function submitTf(lessonId) {
        const lesson = lessonMap.get(lessonId);
        if (!lesson || !hasTfQuestions(lesson)) return;

        let score = 0;
        for (let index = 0; index < lesson.tfQuestions.length; index += 1) {
            const question = lesson.tfQuestions[index];
            const selected = document.querySelector(`input[name="tf-${lessonId}-${index}"]:checked`);
            if (!selected) {
                setStatus(`tf-status-${lessonId}`, getTfStatusIncomplete(lesson), "warn");
                return;
            }

            const isCorrect = selected.value === getTfAnswerValue(question);
            if (isCorrect) score += 1;

            const card = document.getElementById(`tf-card-${lessonId}-${index}`);
            if (card) {
                card.classList.remove("correct", "incorrect");
                card.classList.add(isCorrect ? "correct" : "incorrect", "show-feedback");
            }
        }

        const state = getLessonTfState(lessonId);
        state.submitted = true;
        state.score = score;
        setStatus(
            `tf-status-${lessonId}`,
            getTfStatusResult(lesson, lesson.tfQuestions.length, score),
            score === lesson.tfQuestions.length ? "success" : "info"
        );
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
                if (field.id && field.id.startsWith("cloze-input-")) {
                    const match = field.id.match(/^cloze-input-(.+)-(\d+)$/);
                    const lessonId = match ? match[1] : "";
                    if (lessonId && lessonMap.has(lessonId)) {
                        const state = getLessonClozeState(lessonId);
                        state.submitted = false;
                        state.score = null;
                        updateClozeUI(lessonId);
                    }
                }
            });
        });
    }

    function attachQuickDockListeners() {
        document.addEventListener("input", (event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement) || target.dataset.action !== "seek-quick-progress") return;

            const lessonId = target.dataset.lessonId;
            const mode = target.dataset.progressMode;
            if (!lessonId || !lessonMap.has(lessonId)) return;

            if (mode === "audio") {
                const audio = document.getElementById(`audio-${lessonId}`);
                if (!audio) return;
                audio.currentTime = Number(target.value) || 0;
                setQuickDockLesson(lessonId, { save: false });
                refreshQuickDockProgress();
                return;
            }

            const lineIndex = Number(target.value) || 0;
            setQuickDockLesson(lessonId, { save: false });
            setDialogueStartLine(lessonId, lineIndex);

            if (playbackState.kind === "speech" && playbackState.lessonId === lessonId && playbackState.mode === "dialogue") {
                cancelSpeech();
                void playDialogue(lessonId, lineIndex);
            }
        });
    }

    function clearSequenceDragClasses() {
        document.querySelectorAll(".lw-sequence-item.is-dragging, .lw-sequence-item.is-drop-target").forEach((node) => {
            node.classList.remove("is-dragging", "is-drop-target");
        });
    }

    function attachSequenceTaskListeners() {
        document.addEventListener("dragstart", (event) => {
            if (!(event.target instanceof Element)) return;
            const item = event.target.closest(".lw-sequence-item");
            if (!item) return;

            sequenceDragState.lessonId = item.dataset.lessonId || null;
            sequenceDragState.itemId = item.dataset.sequenceItemId || null;
            item.classList.add("is-dragging");

            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", sequenceDragState.itemId || "");
            }
        });

        document.addEventListener("dragover", (event) => {
            if (!(event.target instanceof Element)) return;
            const item = event.target.closest(".lw-sequence-item");
            if (!item || !sequenceDragState.lessonId || item.dataset.lessonId !== sequenceDragState.lessonId) return;

            event.preventDefault();
            document.querySelectorAll(`.lw-sequence-item[data-lesson-id="${sequenceDragState.lessonId}"]`).forEach((node) => {
                node.classList.toggle("is-drop-target", node === item);
            });
        });

        document.addEventListener("drop", (event) => {
            if (!(event.target instanceof Element)) return;
            const item = event.target.closest(".lw-sequence-item");
            if (!item || !sequenceDragState.lessonId || !sequenceDragState.itemId) return;
            if (item.dataset.lessonId !== sequenceDragState.lessonId) return;

            event.preventDefault();
            insertSequenceItemBefore(sequenceDragState.lessonId, sequenceDragState.itemId, item.dataset.sequenceItemId);
            clearSequenceDragClasses();
            sequenceDragState.lessonId = null;
            sequenceDragState.itemId = null;
        });

        document.addEventListener("dragend", () => {
            clearSequenceDragClasses();
            sequenceDragState.lessonId = null;
            sequenceDragState.itemId = null;
        });
    }

    function attachAudioListeners() {
        lessonMap.forEach((lesson, lessonId) => {
            const audio = document.getElementById(`audio-${lessonId}`);
            if (!audio) return;
            audio.addEventListener("play", () => {
                cancelSpeech();
                setPlaybackState("audio", lessonId, { mode: "audio" });
                setStatus(`listen-status-${lessonId}`, getInstructionText().audioPlaying, "info");
                updateAudioSyncUI(lessonId, { force: true, scroll: false });
            });
            audio.addEventListener("loadedmetadata", () => {
                refreshQuickDockProgress();
                updateAudioSyncUI(lessonId, { force: true, scroll: false });
            });
            audio.addEventListener("timeupdate", () => {
                refreshQuickDockProgress();
                updateAudioSyncUI(lessonId);
            });
            audio.addEventListener("seeked", () => {
                refreshQuickDockProgress();
                updateAudioSyncUI(lessonId, { force: true, scroll: false });
            });
            audio.addEventListener("pause", () => {
                if (!audio.ended) {
                    clearPlaybackState("audio", lessonId);
                    refreshQuickDockProgress();
                    updateAudioSyncUI(lessonId, { force: true, scroll: false });
                }
            });
            audio.addEventListener("ended", () => {
                registerListen(lessonId, 1);
                clearPlaybackState("audio", lessonId);
                updateAudioSyncUI(lessonId, { force: true, scroll: false });
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
            <main class="lw-shell" id="lw-top">
                <div id="lw-quick-dock-mount">${buildQuickDock(config)}</div>
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
        config.lessons.forEach((lesson) => {
            updateClozeUI(lesson.id);
            updateSequenceTaskUI(lesson.id);
            updateTfUI(lesson.id);
            updateQuizUI(lesson.id);
            updateLessonProgressUI(lesson.id);
        });
        syncQuickDockToViewport();
        syncLessonProgressToViewport();
        refreshQuickDockProgress();
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

        if (lessonId && lessonMap.has(lessonId) && action !== "toggle-model-summary") {
            setQuickDockLesson(lessonId, { save: false });
        }

        if (action === "toggle-vocab") return void toggleVocab(lessonId, Number(button.dataset.vocabIndex));
        if (action === "check-prediction") return void checkPrediction(lessonId);
        if (action === "set-stage") return void setStage(lessonId, Number(button.dataset.stage));
        if (action === "set-speed") return void setSpeed(lessonId, Number(button.dataset.speed));
        if (action === "quick-play") return void playQuickLesson();
        if (action === "quick-stop") return void stopQuickLesson();
        if (action === "toggle-quick-dock") return void setQuickDockCollapsed(!quickDockCollapsed);
        if (action === "set-quick-lesson") return void setQuickDockLesson(lessonId);
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
        if (action === "move-sequence-item") return void moveSequenceItem(lessonId, button.dataset.sequenceItemId, Number(button.dataset.direction));
        if (action === "check-sequence-task") return void checkSequenceTask(lessonId);
        if (action === "reset-sequence-task") return void resetSequenceTask(lessonId);
        if (action === "set-instruction-language") return void setInstructionLanguage(button.dataset.instructionLanguage);
        if (action === "check-dictogloss") return void checkDictogloss(lessonId);
        if (action === "toggle-model-summary") return void toggleModelSummary(lessonId);
        if (action === "print-note-sheet") return void printNoteSheet(lessonId);
        if (action === "set-note-tab") return void setNoteTab(lessonId, button.dataset.noteTab);
        if (action === "set-quiz-language") return void setQuizLanguage(lessonId, button.dataset.quizLanguage);
        if (action === "append-expression") return void appendExpression(lessonId, button.dataset.expression || "");
        if (action === "speak-expression") return void speakExpression(lessonId, button.dataset.expression || "");
        if (action === "submit-cloze") return void submitCloze(lessonId);
        if (action === "reset-cloze") return void resetCloze(lessonId);
        if (action === "submit-tf") return void submitTf(lessonId);
        if (action === "reset-tf") return void resetTf(lessonId);
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
        quickDockLessonId = readQuickDockLesson(pageConfig);
        quickDockCollapsed = readQuickDockCollapsed();
        renderApp(pageConfig);
        initSpeechVoice();
        document.addEventListener("click", handleClick);
        attachQuickDockListeners();
        attachSequenceTaskListeners();
        window.addEventListener("scroll", scheduleQuickDockViewportSync, { passive: true });
        window.addEventListener("resize", scheduleQuickDockViewportSync);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
