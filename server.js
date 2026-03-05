const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const SERP_API_KEY = "SUA_CHAVE_SERPAPI_AQUI";

function extrairTelefones(html) {
    const regex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/g;
    const encontrados = html.match(regex);
    if (!encontrados) return [];

    // remove telefones repetidos
    return [...new Set(encontrados)];
}

app.post("/buscar", async (req, res) => {
    const { query } = req.body;

    try {
        const serp = await axios.get("https://serpapi.com/search", {
            params: {
                q: query,
                api_key: SERP_API_KEY,
                engine: "google",
                google_domain: "google.com.br",
                hl: "pt-br"
            }
        });

        const resultados = serp.data.organic_results || [];

        const enriquecidos = await Promise.all(
            resultados.slice(0, 5).map(async (item) => {
                let telefone = null;
                let endereco = null;

                try {
                    const pagina = await axios.get(item.link, { timeout: 5000 });
                    const $ = cheerio.load(pagina.data);

                    const html = $.html();

                    const telefones = extrairTelefones(html);
                    telefone = telefones[0] || null;

                    // tenta extrair endereço
                    const textoPagina = $("body").text();
                    const regexEndereco = /(rua|avenida|av\.|travessa|alameda)\s+[^\n,]{5,}/i;
                    const matchEnd = textoPagina.match(regexEndereco);
                    endereco = matchEnd ? matchEnd[0] : null;

                } catch (e) {}

                return {
                    title: item.title,
                    snippet: item.snippet,
                    link: item.link,
                    thumbnail: item.thumbnail,
                    telefone,
                    endereco
                };
            })
        );

        res.json({ organic: enriquecidos });

    } catch (error) {
        res.status(500).json({ error: "Erro na busca" });
    }
});

app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
