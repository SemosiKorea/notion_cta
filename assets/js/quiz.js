/*
QUESTIONS 스키마
{
  id: 1, part: 1, standard: "국기법 §23", level: "A급", topic: "승계주체",
  text: "문장", answer: "O",
  explanation: "해설", correction: "올바른 문장", trap: "대표 함정",
  source: "국세기본법 제23조"
}
*/
const quizState = { selected:{}, graded:{}, wrongOnly:false, explanations:false };

function renderQuiz(questions, mountId='quiz'){
  const mount = document.getElementById(mountId);
  if(!mount) return;
  mount.innerHTML = questions.map(q => `
    <article class="card question-card" id="question-${q.id}" data-question-id="${q.id}">
      <div class="question-head">
        <span class="question-number">${q.id}</span>
        <div class="question-text">
          <span class="badge standard">${q.standard ?? ''}</span>
          <span class="badge level">${q.level ?? ''}</span>
          <span class="badge topic">${q.topic ?? ''}</span><br>
          ${q.text}
        </div>
      </div>
      <div class="answer-row">
        <button class="ox-button" data-answer="O" onclick="selectAnswer(${q.id},'O')">O</button>
        <button class="ox-button" data-answer="X" onclick="selectAnswer(${q.id},'X')">X</button>
      </div>
      <div class="grade-row">
        <button class="btn primary" onclick="gradeOne(${q.id})">채점</button>
        <span class="grade-result"></span>
      </div>
      <div class="explanation">
        <b>정답: ${q.answer}</b>
        <p>${q.explanation ?? ''}</p>
        ${q.correction ? `<div class="correction">${q.correction}</div>` : ''}
        ${q.trap ? `<p class="trap">함정: ${q.trap}</p>` : ''}
        ${q.source ? `<span class="badge standard">${q.source}</span>` : ''}
      </div>
    </article>`).join('');
  updateScore(questions);
}
function selectAnswer(id, answer){
  quizState.selected[id]=answer;
  const card=document.getElementById(`question-${id}`);
  card.querySelectorAll('.ox-button').forEach(b=>{
    b.classList.remove('selected-o','selected-x');
    if(b.dataset.answer===answer)b.classList.add(answer==='O'?'selected-o':'selected-x');
  });
}
function gradeOne(id){
  const q=QUESTIONS.find(x=>x.id===id), chosen=quizState.selected[id];
  if(!chosen){alert('O 또는 X를 먼저 선택하세요.');return;}
  const card=document.getElementById(`question-${id}`);
  const correct=chosen===q.answer;
  quizState.graded[id]=correct;
  card.dataset.correct=String(correct);
  const result=card.querySelector('.grade-result');
  result.className=`grade-result show ${correct?'ok':'ng'}`;
  result.textContent=correct?'정답':'오답';
  card.querySelector('.explanation').classList.add('show');
  updateScore(QUESTIONS);
}
function gradeAll(){QUESTIONS.filter(q=>quizState.selected[q.id]).forEach(q=>gradeOne(q.id));}
function toggleAllExplanations(){
  quizState.explanations=!quizState.explanations;
  document.querySelectorAll('.explanation').forEach(e=>e.classList.toggle('show',quizState.explanations));
}
function toggleWrongOnly(){
  quizState.wrongOnly=!quizState.wrongOnly;
  QUESTIONS.forEach(q=>{
    const card=document.getElementById(`question-${q.id}`);
    const wrong=quizState.graded[q.id]===false;
    card.classList.toggle('hidden',quizState.wrongOnly&&!wrong);
  });
}
function resetQuiz(){if(confirm('선택과 채점 결과를 초기화할까요?'))location.reload();}
function updateScore(questions){
  const graded=Object.keys(quizState.graded).length;
  const correct=Object.values(quizState.graded).filter(Boolean).length;
  const score=document.getElementById('score');
  if(score)score.textContent=`${correct}/${graded}`;
  const progress=document.getElementById('quiz-progress');
  if(progress)progress.style.width=`${questions.length?graded/questions.length*100:0}%`;
}