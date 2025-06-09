const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;
const MONGO_URL = 'mongodb+srv://joao:afonso@joaoafonso.bq89eai.mongodb.net/?retryWrites=true&w=majority&appName=JoaoAfonso';
const DB_NAME = 'academicos';

let alunosCollection;
let cursosCollection;

// Função utilitária para validar ObjectId
function isValidObjectId(id) {
    return /^[a-fA-F0-9]{24}$/.test(id);
}

// Rota principal
app.get("/", (req, res) => {
    res.send('<h1>Olá TW ECGM</h1>');
});

// Conexão com MongoDB e inicialização do servidor
MongoClient.connect(MONGO_URL, { useNewUrlParser: true })
    .then(client => {
        const db = client.db(DB_NAME);
        alunosCollection = db.collection('alunos');
        cursosCollection = db.collection('cursos');

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(err => console.error('Failed to connect to MongoDB', err));

/* ==== ROTAS ALUNOS ==== */

// Listar todos os alunos
app.get("/alunos", async (req, res) => {
    const alunos = await alunosCollection.find().toArray();
    res.json(alunos);
});

// Buscar aluno por ID
app.get("/alunos/:id", async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const aluno = await alunosCollection.findOne({ _id: new ObjectId(id) });
    res.json(aluno);
});

// Buscar alunos por nome
app.get("/alunos/nome/:nome", async (req, res) => {
    const nome = req.params.nome;
    const alunos = await alunosCollection.find({ nome }).toArray();
    res.json(alunos);
});

// Adicionar novo aluno
app.post("/alunos", async (req, res) => {
    const novoAluno = req.body;
    const ultimo = await alunosCollection.find().sort({ cc: -1 }).limit(1).toArray();
    const novoCC = ultimo.length > 0 ? (parseInt(ultimo[0].cc, 10) + 1) : 1;

    novoAluno.cc = novoCC;
    const resultado = await alunosCollection.insertOne(novoAluno);
    res.status(201).json({ _id: resultado.insertedId, ...novoAluno });
});

// Atualizar aluno existente
app.put("/alunos/:id", async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    const dados = req.body;
    const resultado = await alunosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dados }
    );

    if (resultado.matchedCount === 0)
        return res.status(404).json({ error: "Aluno não encontrado" });

    res.json({ _id: id, ...dados });
});

// Apagar aluno
app.delete("/alunos/:id", async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    await alunosCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ msg: "Aluno removido" });
});

/* ==== ROTAS CURSOS ==== */

// Listar todos os cursos
app.get("/cursos", async (req, res) => {
    const cursos = await cursosCollection.find().toArray();
    res.json(cursos);
});

// Adicionar novo curso
app.post("/cursos", async (req, res) => {
    const novoCurso = req.body;
    const resultado = await cursosCollection.insertOne(novoCurso);
    res.status(201).json({ _id: resultado.insertedId, ...novoCurso });
});

// Atualizar curso existente
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

// Apagar curso
app.delete("/cursos/:id", async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido" });

    await cursosCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ msg: "Curso removido" });
});
