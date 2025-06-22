// Importa o módulo Express, que facilita a criação de servidores web em Node.js
const express = require('express');

// Importa o módulo CORS para permitir requisições de outras origens (Cross-Origin Resource Sharing)
const cors = require('cors');

// Importa o cliente MongoDB e a função ObjectId (para manipular IDs do banco de dados)
const { MongoClient, ObjectId } = require('mongodb');

// Cria uma instância do Express, que será usada para definir rotas e iniciar o servidor
const app = express();

// Ativa o uso de CORS em todas as rotas (necessário quando o front-end e back-end estão em domínios diferentes)
app.use(cors());

// Faz o Express entender requisições com corpo JSON (ex: POST com dados no corpo)
app.use(express.json());

// Define a porta na qual o servidor vai "escutar" (responder requisições)
const port = 3000;

// URL de conexão com o banco de dados MongoDB (contém credenciais e nome do cluster)
const MONGO_URL = 'mongodb+srv://joao:afonso@joaoafonso.bq89eai.mongodb.net/?retryWrites=true&w=majority&appName=JoaoAfonso';

// Nome do banco de dados dentro do cluster MongoDB
const DB_NAME = 'academicos';

// Variáveis que vão armazenar as referências para as coleções do banco
let alunosCollection;
let cursosCollection;

// Função que valida se uma string tem o formato correto de um ObjectId (24 caracteres hexadecimais)
function isValidObjectId(id) {
    return /^[a-fA-F0-9]{24}$/.test(id);
}

// Define a rota raiz ("/") que responde com HTML simples
app.get("/", (req, res) => {
    res.send('<h1>Olá TW ECGM</h1>');
});

// Conecta ao MongoDB usando a URL fornecida e inicia o servidor só depois de conectar com sucesso
MongoClient.connect(MONGO_URL, { useNewUrlParser: true })
    .then(client => {
        // Seleciona o banco de dados desejado
        const db = client.db(DB_NAME);

        // Armazena as coleções 'alunos' e 'cursos' para uso posterior
        alunosCollection = db.collection('alunos');
        cursosCollection = db.collection('cursos');

        // Inicia o servidor, escutando na porta definida
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(err => console.error('Failed to connect to MongoDB', err));

/* ==== ROTAS ALUNOS ==== */

// Rota GET que retorna todos os documentos da coleção 'alunos'
app.get("/alunos", async (req, res) => {
    const alunos = await alunosCollection.find().toArray(); // `.find()` retorna um cursor, `.toArray()` transforma em lista
    res.json(alunos); // Retorna a lista como resposta em formato JSON
});

// Rota GET que retorna um aluno específico pelo ID (se for válido)
app.get("/alunos/:id", async (req, res) => {
    const id = req.params.id; // Pega o parâmetro da URL
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" }); // Valida o formato do ID

    const aluno = await alunosCollection.findOne({ _id: new ObjectId(id) }); // Busca pelo ID convertido para ObjectId
    res.json(aluno); // Retorna o aluno encontrado
});

// Rota GET que busca alunos pelo nome exato
app.get("/alunos/nome/:nome", async (req, res) => {
    const nome = req.params.nome;
    const alunos = await alunosCollection.find({ nome }).toArray(); // Busca todos com o mesmo nome
    res.json(alunos);
});

// Rota POST para adicionar um novo aluno
app.post("/alunos", async (req, res) => {
    const novoAluno = req.body; // Dados do novo aluno vêm no corpo da requisição

    // Busca o aluno com o maior 'cc' (cartão de cidadão), ordenando de forma decrescente
    const ultimo = await alunosCollection.find().sort({ cc: -1 }).limit(1).toArray();

    // Gera um novo 'cc' automaticamente, somando 1 ao maior valor encontrado ou usando 1 se não houver nenhum aluno
    const novoCC = ultimo.length > 0 ? (parseInt(ultimo[0].cc, 10) + 1) : 1;

    novoAluno.cc = novoCC; // Define o campo 'cc' no novo aluno
    const resultado = await alunosCollection.insertOne(novoAluno); // Insere no banco
    res.status(201).json({ _id: resultado.insertedId, ...novoAluno }); // Retorna os dados incluindo o novo ID gerado
});

// Rota PUT para atualizar dados de um aluno existente
app.put("/alunos/:id", async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const dados = req.body; // Dados atualizados vêm no corpo da requisição
    const resultado = await alunosCollection.updateOne(
        { _id: new ObjectId(id) }, // Filtro por ID
        { $set: dados } // Define os campos a atualizar
    );

    if (resultado.matchedCount === 0)
        return res.status(404).json({ error: "Aluno não encontrado" });

    res.json({ _id: id, ...dados });
});

// Rota DELETE para remover um aluno pelo ID
app.delete("/alunos/:id", async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    await alunosCollection.deleteOne({ _id: new ObjectId(id) }); // Remove o documento
    res.json({ msg: "Aluno removido" });
});

/* ==== ROTAS CURSOS ==== */

// Rota GET que retorna todos os cursos cadastrados
app.get("/cursos", async (req, res) => {
    const cursos = await cursosCollection.find().toArray();
    res.json(cursos);
});

// Rota POST para adicionar um novo curso
app.post("/cursos", async (req, res) => {
    const novoCurso = req.body;
    const resultado = await cursosCollection.insertOne(novoCurso);
    res.status(201).json({ _id: resultado.insertedId, ...novoCurso });
});

// Rota PUT para atualizar informações de um curso
app.put("/cursos/:id", async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const dados = req.body;
    const resultado = await cursosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dados }
    );

    if (resultado.matchedCount === 0)
        return res.status(404).json({ error: "Curso não encontrado" });

    res.json({ _id: id, ...dados });
});

// Rota DELETE para remover um curso pelo ID
app.delete("/cursos/:id", async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    await cursosCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ msg: "Curso removido" });
});
