const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "fcb3fbbfb2a65c37999a9c9ef00b1b39d6b06757";

app.post("/buscar", async (req, res) => {
  const { query } = req.body;

  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      { q: query },
      {
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Erro na busca" });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});