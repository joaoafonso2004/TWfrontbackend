// ==========================
// URLs da API (back-end)
// ==========================
const API_URL = 'https://twt1-backend.onrender.com/alunos';
const CURSOS_API_URL = 'https://twt1-backend.onrender.com/cursos';

// ==========================
// Elementos do formulário de alunos
// ==========================
const form = document.getElementById('aluno-form');
const idInput = document.getElementById('aluno-id');
const nomeInput = document.getElementById('nome');
const idadeInput = document.getElementById('idade');
const salvarBtn = document.getElementById('salvar-btn');
const cancelarBtn = document.getElementById('cancelar-btn');
const apagarBtn = document.getElementById('apagar-btn');
const tabela = document.getElementById('alunos-table').querySelector('tbody');

// ==========================
// Elementos do formulário de cursos
// ==========================
const cursoForm = document.getElementById('curso-form');
const cursoIdInput = document.getElementById('curso-id');
const cursoIdNumberInput = document.getElementById('curso_id'); // ID do curso
const nomeCursoInput = document.getElementById('nome-curso');
const salvarCursoBtn = document.getElementById('salvar-curso-btn');
const cancelarCursoBtn = document.getElementById('cancelar-curso-btn');
const apagarCursoBtn = document.getElementById('apagar-curso-btn');
const cursosTabela = document.getElementById('cursos-table').querySelector('tbody');


// Estado de edição
let editando = false;
let editandoCurso = false;
let cursosCache = []; // Guardar cursos localmente para vincular nome do curso ao aluno


// Preencher dropdown de cursos no formulário de aluno
function preencherSelectCursos(cursos) {
    const select = document.getElementById('curso');
    select.innerHTML = '<option value="">Selecione o curso</option>';

    cursos.forEach(curso => {
        const id = curso.curso_id || curso.id || '';
        const nome = curso.nomeDoCurso || curso.nome || '';
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${id} - ${nome}`;
        select.appendChild(option);
    });
}


// Carregar lista de cursos na tabela
async function carregarCursos() {
    cursosTabela.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';
    try {
        const resp = await fetch(CURSOS_API_URL);
        const cursos = await resp.json();

        cursosCache = cursos; // Guardar localmente

        cursosTabela.innerHTML = '';
        if (!Array.isArray(cursos) || cursos.length === 0) {
            cursosTabela.innerHTML = '<tr><td colspan="3">Nenhum curso cadastrado.</td></tr>';
            return;
        }

        // Criar uma linha para cada curso
        cursos.forEach(curso => {
            const id = curso.curso_id || curso.id || '';
            const nome = curso.nomeDoCurso || curso.nome || '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${id}</td>
                <td>${nome}</td>
                <td>
                    <button class="acao editar" data-id="${curso._id}" data-nome="${nome}">Editar</button>
                </td>
            `;
            cursosTabela.appendChild(tr);
        });

        preencherSelectCursos(cursos);
    } catch (e) {
        cursosTabela.innerHTML = '<tr><td colspan="3">Erro ao carregar cursos.</td></tr>';
    }
}


// Carregar lista de alunos na tabela
async function carregarAlunos() {
    tabela.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    try {
        const resp = await fetch(API_URL);
        const alunos = await resp.json();

        tabela.innerHTML = '';
        if (!Array.isArray(alunos) || alunos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6">Nenhum aluno cadastrado.</td></tr>';
            return;
        }

        // Percorre a lista de alunos e cria uma linha para cada um
        alunos.forEach(aluno => {
            const {
                cc = '',
                nome = '',
                apelido = '',
                idade = '',
                curso: curso_id = aluno.curso_id ?? '',
                _id: id = aluno.id ?? ''
            } = aluno;

            // Procurar nome do curso com base no curso_id
            const cursoObj = cursosCache.find(c => String(c.curso_id) === String(curso_id));
            const nomeCurso = cursoObj ? (cursoObj.nomeDoCurso || cursoObj.nome || curso_id) : curso_id;

            const tr = document.createElement('tr'); 
            tr.innerHTML = `
                <td>${cc}</td>
                <td>${nome}</td>
                <td>${apelido}</td>
                <td>${idade}</td>
                <td>${nomeCurso}</td>
                <td>
                    <button class="acao editar" 
                        data-id="${id}" 
                        data-cc="${cc}"
                        data-nome="${nome}" 
                        data-apelido="${apelido}"
                        data-idade="${idade}" 
                        data-curso="${curso_id}">Editar</button>
                </td>
            `;
            tabela.appendChild(tr); 
        });
    } catch (e) {
        tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar alunos.</td></tr>';
    }
}


// Submissão do formulário de aluno
form.onsubmit = async (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const apelido = document.getElementById('apelido').value.trim();
    const idade = parseInt(idadeInput.value, 10);
    const curso = document.getElementById('curso').value;

    if (!nome || !apelido || isNaN(idade) || !curso) return; // Verifica se os campos estão preenchidos

    const alunoData = { nome, apelido, idade, curso }; // Cria o objeto com os dados do aluno
    const method = editando && idInput.value ? 'PUT' : 'POST'; // Define o método HTTP correto
    const url = editando && idInput.value ? `${API_URL}/${idInput.value}` : API_URL; // Define a URL correta para a requisição

    await fetch(url, { // Envia a requisição para o back-end
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alunoData)
    });

    cancelarEdicao();
    carregarAlunos(); 
};


// Submissão do formulário de curso
cursoForm.onsubmit = async (e) => {
    e.preventDefault();

    const curso_id = cursoIdNumberInput.value; 
    const nome = nomeCursoInput.value.trim(); 

    if (!curso_id || !nome) return; // Verifica se os campos estão preenchidos

    const cursoData = { curso_id, nomeDoCurso: nome }; 

    const method = editandoCurso && cursoIdInput.value ? 'PUT' : 'POST';
    const url = editandoCurso && cursoIdInput.value ? `${CURSOS_API_URL}/${cursoIdInput.value}` : CURSOS_API_URL;

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cursoData)
    });

    cancelarEdicaoCurso();
    carregarCursos();
};


// Eventos dos botões de editar/apagar alunos
tabela.onclick = async (e) => {
    const btn = e.target;
    if (!btn.classList.contains('editar')) return;

    editando = true;

    // Preencher o formulário com dados do botão
    idInput.value = btn.getAttribute('data-id');
    nomeInput.value = btn.getAttribute('data-nome');
    document.getElementById('apelido').value = btn.getAttribute('data-apelido');
    document.getElementById('curso').value = btn.getAttribute('data-curso');
    idadeInput.value = btn.getAttribute('data-idade');

    salvarBtn.textContent = 'Salvar';
    cancelarBtn.style.display = 'inline-block';
    apagarBtn.style.display = 'inline-block';
};


// Eventos dos botões de editar/apagar cursos
cursosTabela.onclick = async (e) => {
    const btn = e.target;
    if (!btn.classList.contains('editar')) return;

    editandoCurso = true;

    cursoIdInput.value = btn.getAttribute('data-id');
    cursoIdNumberInput.value = btn.parentElement.parentElement.children[0].textContent;
    nomeCursoInput.value = btn.getAttribute('data-nome');

    salvarCursoBtn.textContent = 'Salvar';
    cancelarCursoBtn.style.display = 'inline-block';
    apagarCursoBtn.style.display = 'inline-block';
};


// Cancelar edição (aluno)
cancelarBtn.onclick = cancelarEdicao;

function cancelarEdicao() {
    editando = false;
    idInput.value = '';
    form.reset();
    salvarBtn.textContent = 'Adicionar';
    cancelarBtn.style.display = 'none';
    apagarBtn.style.display = 'none';
}


// Cancelar edição (curso)
cancelarCursoBtn.onclick = cancelarEdicaoCurso;

function cancelarEdicaoCurso() {
    editandoCurso = false;
    cursoIdInput.value = '';
    cursoForm.reset();
    salvarCursoBtn.textContent = 'Adicionar';
    cancelarCursoBtn.style.display = 'none';
    apagarCursoBtn.style.display = 'none';
}

// Apagar aluno atual
apagarBtn.onclick = async () => {
    if (!idInput.value) return;
    if (confirm('Deseja realmente apagar este aluno?')) {
        await fetch(`${API_URL}/${idInput.value}`, { method: 'DELETE' });
        cancelarEdicao();
        carregarAlunos();
    }
};


// Apagar curso atual (formulário)
apagarCursoBtn.onclick = async () => {
    if (!cursoIdInput.value) return;
    if (confirm('Deseja realmente apagar este curso?')) {
        await fetch(`${CURSOS_API_URL}/${cursoIdInput.value}`, { method: 'DELETE' });
        cancelarEdicaoCurso();
        carregarCursos();
    }
};


// Carregar cursos antes de alunos
(async () => { // garante que os cursos carregam primeiro
    await carregarCursos();
    await carregarAlunos();
})();
